import { and, eq, sql } from "drizzle-orm";
import { decodeVector, dot, encodeVector, getCmsContext, resolvePublishing, type ContentType, type DbDialect } from "@nexpress/core";
import { getDbDialect, getPgClient, getSqliteClient } from "./client";
import { pgContentChunks, pgContents, pgContentTranslations } from "./schema/pg";
import { sqliteContentChunks, sqliteContents, sqliteContentTranslations } from "./schema/sqlite";

export interface ChunkWrite {
  index: number;
  headingPath: string;
  text: string;
  hash: string;
  wordCount: number;
  embedding: Float32Array;
}

export interface ChunkState {
  index: number;
  hash: string | null;
  model: string | null;
}

export interface ChunkHit {
  chunkId: string;
  contentId: string;
  locale: string;
  chunkIndex: number;
  headingPath: string;
  text: string;
  similarity: number;
  title: string;
  slug: string;
  type: ContentType;
}

export interface ChunkSearchOptions {
  limit?: number;
  locale?: string;
  types?: ContentType[];
  excludeContentId?: string;
}

export interface RagStats {
  chunks: number;
  contents: number;
  models: Array<{ model: string; chunks: number }>;
}

export interface SimilarContent {
  contentId: string;
  title: string;
  slug: string;
  type: ContentType;
  /** Bu içeriğin parçalarıyla en benzer parça çiftinin kosinüs benzerliği */
  similarity: number;
  matchedHeading: string;
}

const OVERFETCH = 4;

/**
 * Vektör arama arka ucu. PostgreSQL'de pgvector (`<=>` kosinüs, HNSW), SQLite'ta sütundaki
 * `f32:<base64>` vektörler üzerinde süreç içi iç çarpım. Vektörler birim uzunluktadır.
 * Yalnızca yayınlanmış, `noindex` olmayan ve herkese açık içeriğin parçaları döner.
 */
export class ChunkRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  public async getState(contentId: string, locale: string): Promise<ChunkState[]> {
    if (this.dialect === "sqlite") {
      const { db } = getSqliteClient();
      const t = sqliteContentChunks;
      const rows = await db
        .select({ index: t.chunkIndex, hash: t.chunkHash, model: t.embeddingModel })
        .from(t)
        .where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale)));
      return rows;
    }
    const { db } = getPgClient();
    const t = pgContentChunks;
    return db
      .select({ index: t.chunkIndex, hash: t.chunkHash, model: t.embeddingModel })
      .from(t)
      .where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale)));
  }

  /** İçeriğin (dil bazında) tüm parçalarını tek işlemde değiştirir. */
  public async replaceForContent(contentId: string, locale: string, model: string, rows: ChunkWrite[]): Promise<void> {
    const now = new Date();
    const base = (r: ChunkWrite) => ({
      id: `${this.siteId}|${contentId}|${locale}|${r.index}`,
      siteId: this.siteId,
      contentId,
      locale,
      chunkIndex: r.index,
      headingPath: r.headingPath,
      chunkText: r.text,
      chunkHash: r.hash,
      embeddingModel: model,
      wordCount: r.wordCount,
      createdAt: now,
    });
    if (this.dialect === "sqlite") {
      const { db } = getSqliteClient();
      const t = sqliteContentChunks;
      await db.transaction(async (tx) => {
        await tx.delete(t).where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale)));
        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50).map((r) => ({ ...base(r), embeddingJson: encodeVector(r.embedding) }));
          if (batch.length > 0) await tx.insert(t).values(batch);
        }
      });
      return;
    }
    const { db } = getPgClient();
    const t = pgContentChunks;
    await db.transaction(async (tx) => {
      await tx.delete(t).where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale)));
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50).map((r) => ({ ...base(r), embedding: Array.from(r.embedding) }));
        if (batch.length > 0) await tx.insert(t).values(batch);
      }
    });
  }

  public async search(embedding: Float32Array, model: string, options: ChunkSearchOptions = {}): Promise<ChunkHit[]> {
    const limit = options.limit ?? 5;
    const hits = this.dialect === "sqlite" ? await this.searchSqlite(embedding, model, limit * OVERFETCH, options) : await this.searchPg(embedding, model, limit * OVERFETCH, options);
    return hits.filter((h) => h.visible).slice(0, limit).map(({ visible: _v, ...hit }) => hit);
  }

  private async searchPg(embedding: Float32Array, model: string, fetch: number, o: ChunkSearchOptions) {
    const { db } = getPgClient();
    const c = pgContentChunks;
    const vec = `[${Array.from(embedding).join(",")}]`;
    const distance = sql<number>`${c.embedding} <=> ${vec}::vector`;
    const rows = await db
      .select({
        chunkId: c.id,
        contentId: c.contentId,
        locale: c.locale,
        chunkIndex: c.chunkIndex,
        headingPath: c.headingPath,
        text: c.chunkText,
        distance,
        title: pgContentTranslations.title,
        slug: pgContentTranslations.slug,
        type: pgContents.type,
        schemaAttributes: pgContents.schemaAttributes,
      })
      .from(c)
      .innerJoin(pgContents, eq(pgContents.id, c.contentId))
      .innerJoin(
        pgContentTranslations,
        and(eq(pgContentTranslations.contentId, c.contentId), eq(pgContentTranslations.locale, c.locale), eq(pgContentTranslations.siteId, this.siteId))
      )
      .where(
        and(
          eq(c.siteId, this.siteId),
          eq(c.embeddingModel, model),
          eq(pgContents.status, "published"),
          eq(pgContentTranslations.noIndex, false),
          eq(pgContentTranslations.translationStatus, "published"),
          o.locale ? eq(c.locale, o.locale) : undefined,
          o.excludeContentId ? sql`${c.contentId} <> ${o.excludeContentId}` : undefined,
          o.types?.length ? sql`${pgContents.type} IN ${o.types}` : undefined
        )
      )
      .orderBy(distance)
      .limit(fetch);
    return rows.map((r) => ({
      chunkId: r.chunkId,
      contentId: r.contentId,
      locale: r.locale,
      chunkIndex: r.chunkIndex,
      headingPath: r.headingPath ?? "",
      text: r.text,
      similarity: 1 - Number(r.distance),
      title: r.title,
      slug: r.slug,
      type: r.type,
      visible: resolvePublishing(r.schemaAttributes).visibility === "public",
    }));
  }

  private async searchSqlite(embedding: Float32Array, model: string, fetch: number, o: ChunkSearchOptions) {
    const { db } = getSqliteClient();
    const c = sqliteContentChunks;
    const rows = await db
      .select({
        chunkId: c.id,
        contentId: c.contentId,
        locale: c.locale,
        chunkIndex: c.chunkIndex,
        headingPath: c.headingPath,
        text: c.chunkText,
        vector: c.embeddingJson,
        title: sqliteContentTranslations.title,
        slug: sqliteContentTranslations.slug,
        type: sqliteContents.type,
        schemaAttributes: sqliteContents.schemaAttributes,
      })
      .from(c)
      .innerJoin(sqliteContents, eq(sqliteContents.id, c.contentId))
      .innerJoin(
        sqliteContentTranslations,
        and(eq(sqliteContentTranslations.contentId, c.contentId), eq(sqliteContentTranslations.locale, c.locale), eq(sqliteContentTranslations.siteId, this.siteId))
      )
      .where(
        and(
          eq(c.siteId, this.siteId),
          eq(c.embeddingModel, model),
          eq(sqliteContents.status, "published"),
          eq(sqliteContentTranslations.noIndex, false),
          eq(sqliteContentTranslations.translationStatus, "published"),
          o.locale ? eq(c.locale, o.locale) : undefined,
          o.excludeContentId ? sql`${c.contentId} <> ${o.excludeContentId}` : undefined,
          o.types?.length ? sql`${sqliteContents.type} IN ${o.types}` : undefined
        )
      );
    return rows
      .filter((r) => r.vector)
      .map((r) => ({
        chunkId: r.chunkId,
        contentId: r.contentId,
        locale: r.locale,
        chunkIndex: r.chunkIndex,
        headingPath: r.headingPath ?? "",
        text: r.text,
        similarity: dot(embedding, decodeVector(r.vector!)),
        title: r.title,
        slug: r.slug,
        type: r.type,
        visible: resolvePublishing(r.schemaAttributes).visibility === "public",
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, fetch);
  }

  /** Bir içeriğin kayıtlı parça vektörleri (başka içeriklerle benzerlik için). */
  public async vectorsOf(contentId: string, locale: string, model: string): Promise<Array<{ headingPath: string; embedding: Float32Array }>> {
    if (this.dialect === "sqlite") {
      const { db } = getSqliteClient();
      const t = sqliteContentChunks;
      const rows = await db
        .select({ h: t.headingPath, v: t.embeddingJson })
        .from(t)
        .where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale), eq(t.embeddingModel, model)));
      return rows.filter((r) => r.v).map((r) => ({ headingPath: r.h ?? "", embedding: decodeVector(r.v!) }));
    }
    const { db } = getPgClient();
    const t = pgContentChunks;
    const rows = await db
      .select({ h: t.headingPath, e: t.embedding })
      .from(t)
      .where(and(eq(t.siteId, this.siteId), eq(t.contentId, contentId), eq(t.locale, locale), eq(t.embeddingModel, model)));
    return rows.filter((r) => r.e).map((r) => ({ headingPath: r.h ?? "", embedding: Float32Array.from(r.e!) }));
  }

  /**
   * Kanibalizasyon / iç bağlantı adayları: bu içeriğin parçalarına en yakın diğer içerikler,
   * içerik başına en iyi eşleşmeyle özetlenir. Yalnızca kayıtlı vektörleri kullanır (gömme çağrısı yok).
   */
  public async similarContents(contentId: string, locale: string, model: string, limit = 5): Promise<SimilarContent[]> {
    const mine = await this.vectorsOf(contentId, locale, model);
    const best = new Map<string, SimilarContent>();
    for (const v of mine) {
      const hits = await this.search(v.embedding, model, { limit: 8, locale, excludeContentId: contentId });
      for (const h of hits) {
        const cur = best.get(h.contentId);
        if (!cur || h.similarity > cur.similarity) {
          best.set(h.contentId, { contentId: h.contentId, title: h.title, slug: h.slug, type: h.type, similarity: h.similarity, matchedHeading: h.headingPath });
        }
      }
    }
    return [...best.values()].sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  public async stats(): Promise<RagStats> {
    if (this.dialect === "sqlite") {
      const { db } = getSqliteClient();
      const t = sqliteContentChunks;
      const rows = await db
        .select({ model: t.embeddingModel, chunks: sql<number>`count(*)`, contents: sql<number>`count(distinct ${t.contentId})` })
        .from(t)
        .where(eq(t.siteId, this.siteId))
        .groupBy(t.embeddingModel);
      return summarize(rows);
    }
    const { db } = getPgClient();
    const t = pgContentChunks;
    const rows = await db
      .select({ model: t.embeddingModel, chunks: sql<number>`count(*)::int`, contents: sql<number>`count(distinct ${t.contentId})::int` })
      .from(t)
      .where(eq(t.siteId, this.siteId))
      .groupBy(t.embeddingModel);
    return summarize(rows);
  }
}

function summarize(rows: Array<{ model: string | null; chunks: number; contents: number }>): RagStats {
  return {
    chunks: rows.reduce((n, r) => n + Number(r.chunks), 0),
    contents: rows.reduce((n, r) => Math.max(n, Number(r.contents)), 0),
    models: rows.map((r) => ({ model: r.model ?? "(modelsiz)", chunks: Number(r.chunks) })),
  };
}

export function getChunkRepository(siteIdOverride?: string): ChunkRepository {
  return new ChunkRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
