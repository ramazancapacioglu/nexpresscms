import fs from "node:fs";
import path from "node:path";
import { and, count, desc, eq, inArray, type AnyColumn } from "drizzle-orm";
import { compileBlocksToMarkdown, fieldsMarkdown, findContentType, resolveSiteSettings } from "@nexpress/core";
import { getDbDialect, getPgClient, getSqliteClient } from "./client";
import { backendFor, type CommonDb } from "./dialect";

export interface TableCount {
  label: string;
  rows: number;
}

export interface MediaPerformanceStats {
  totalAssets: number;
  imageAssets: number;
  totalBytes: number;
  oversizedCount: number;
  missingAltCount: number;
}

const COUNTS: Array<{ key: string; label: string }> = [
  { key: "contents", label: "İçerik" },
  { key: "contentTranslations", label: "Çeviri" },
  { key: "mediaAssets", label: "Medya" },
  { key: "commentsReviews", label: "Yorum" },
  { key: "redirects", label: "Yönlendirme" },
  { key: "commerceProducts", label: "Ürün" },
  { key: "commerceOrders", label: "Sipariş" },
];

const BLOAT_COUNTS: Array<{ key: string; label: string }> = [
  { key: "contentRevisions", label: "Revizyon geçmişi" },
  { key: "notFoundLog", label: "404 izleyici kaydı" },
  { key: "contentChunks", label: "RAG vektör parçası" },
  { key: "auditLog", label: "Denetim günlüğü" },
  { key: "mcpRequestLog", label: "MCP istek günlüğü" },
  { key: "formSubmissions", label: "Form gönderimi" },
  { key: "botDailyStats", label: "Bot istatistiği" },
];

const OVERSIZE_MEDIA_BYTES = 1_500_000;

/** Kiracı satır sayıları, şişkinlik temizliği ve motorun istatistik güncellemesi. Ham SQL yalnızca bu dosyada. */
export class PerformanceRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect = getDbDialect()
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /** Bu kiracının ana tablo satır sayıları. */
  public async tableCounts(): Promise<TableCount[]> {
    const { db, t } = this.backend;
    const tables = t as unknown as Record<string, { siteId: AnyColumn }>;
    const out: TableCount[] = [];
    for (const item of COUNTS) {
      const table = tables[item.key];
      if (!table) continue;
      out.push({ label: item.label, rows: await countScoped(db, table, this.siteId) });
    }
    return out;
  }

  /** Bu kiracının geçmiş, günlük ve geçici (şişkinlik) tablo satır sayıları. */
  public async bloatCounts(): Promise<TableCount[]> {
    const { db, t } = this.backend;
    const tables = t as unknown as Record<string, { siteId: AnyColumn }>;
    const out: TableCount[] = [];
    for (const item of BLOAT_COUNTS) {
      const table = tables[item.key];
      if (!table) continue;
      out.push({ label: item.label, rows: await countScoped(db, table, this.siteId) });
    }
    return out;
  }

  /** Bu kiracının medya kütüphanesi boyut ve optimizasyon özeti. */
  public async mediaStats(): Promise<MediaPerformanceStats> {
    const { db, t } = this.backend;
    const rows = await db
      .select({
        kind: t.mediaAssets.kind,
        sizeBytes: t.mediaAssets.sizeBytes,
        altText: t.mediaAssets.altText,
      })
      .from(t.mediaAssets)
      .where(eq(t.mediaAssets.siteId, this.siteId));
    let totalBytes = 0;
    let imageAssets = 0;
    let oversizedCount = 0;
    let missingAltCount = 0;
    for (const row of rows) {
      const size = Number(row.sizeBytes ?? 0);
      totalBytes += size;
      if (size > OVERSIZE_MEDIA_BYTES) oversizedCount += 1;
      if (row.kind === "image") {
        imageAssets += 1;
        if (!row.altText?.trim()) missingAltCount += 1;
      }
    }
    return {
      totalAssets: rows.length,
      imageAssets,
      totalBytes,
      oversizedCount,
      missingAltCount,
    };
  }

  /**
   * İçerik ve dil başına en yeni `keepPerContent` revizyonu korur, daha eski revizyonları kiracı kapsamında siler.
   */
  public async pruneRevisions(keepPerContent = 10): Promise<number> {
    const keep = Math.max(1, Math.min(50, Math.round(keepPerContent)));
    const { db, t } = this.backend;
    const rows = await db
      .select({
        id: t.contentRevisions.id,
        contentId: t.contentRevisions.contentId,
        locale: t.contentRevisions.locale,
      })
      .from(t.contentRevisions)
      .where(eq(t.contentRevisions.siteId, this.siteId))
      .orderBy(desc(t.contentRevisions.createdAt));

    const seen = new Map<string, number>();
    const toDelete: string[] = [];
    for (const row of rows) {
      const key = `${row.contentId}:${row.locale}`;
      const current = (seen.get(key) ?? 0) + 1;
      seen.set(key, current);
      if (current > keep) toDelete.push(row.id);
    }
    for (let i = 0; i < toDelete.length; i += 200) {
      const batch = toDelete.slice(i, i + 200);
      await db
        .delete(t.contentRevisions)
        .where(and(eq(t.contentRevisions.siteId, this.siteId), inArray(t.contentRevisions.id, batch)));
    }
    return toDelete.length;
  }

  /** Kiracının birikmiş 404 izleyici kayıtlarını temizler. */
  public async clearNotFoundLogs(): Promise<number> {
    const { db, t } = this.backend;
    const existing = await countScoped(db, t.notFoundLog, this.siteId);
    if (existing === 0) return 0;
    await db.delete(t.notFoundLog).where(eq(t.notFoundLog.siteId, this.siteId));
    return existing;
  }

  /** Kiracının tüm çevirilerinde `markdownCache` sütununu blok AST'sinden yeniden derler. */
  public async recompileMarkdownCache(): Promise<number> {
    const { db, t } = this.backend;
    const rows = await db
      .select({
        id: t.contentTranslations.id,
        title: t.contentTranslations.title,
        tldr: t.contentTranslations.tldr,
        blocks: t.contentTranslations.blocks,
        markdownCache: t.contentTranslations.markdownCache,
      })
      .from(t.contentTranslations)
      .where(eq(t.contentTranslations.siteId, this.siteId));
    // Özel alan listesi Markdown'ın parçasıdır: içerik türü ve öznitelikleriyle birlikte yeniden derlenir
    const siteRow = (await db.select({ settings: t.sites.settings }).from(t.sites).where(eq(t.sites.siteId, this.siteId)).limit(1))[0];
    const types = resolveSiteSettings(siteRow?.settings).general.contentTypes;
    const meta = new Map<string, { type: string; attrs: unknown }>();
    if (types?.length) {
      const infos = await db
        .select({ id: t.contentTranslations.id, type: t.contents.type, attrs: t.contents.schemaAttributes })
        .from(t.contentTranslations)
        .innerJoin(t.contents, eq(t.contents.id, t.contentTranslations.contentId))
        .where(eq(t.contentTranslations.siteId, this.siteId));
      for (const i of infos) meta.set(i.id, { type: i.type, attrs: i.attrs });
    }
    let updated = 0;
    for (const row of rows) {
      const info = meta.get(row.id);
      const compiled = compileBlocksToMarkdown(row.blocks ?? [], {
        title: row.title,
        tldr: row.tldr,
        appendix: info ? fieldsMarkdown(findContentType(types, info.type), info.attrs) : "",
      });
      if (compiled !== row.markdownCache) {
        await db
          .update(t.contentTranslations)
          .set({ markdownCache: compiled })
          .where(and(eq(t.contentTranslations.siteId, this.siteId), eq(t.contentTranslations.id, row.id)));
        updated += 1;
      }
    }
    return updated;
  }

  /** Veritabanı dosyasının veya PostgreSQL kümesinin bayt boyu. */
  public async databaseBytes(): Promise<number | null> {
    if (this.dialect === "sqlite") {
      const raw = process.env.SQLITE_URL ?? "file:./data/nexpress.db";
      if (!raw.startsWith("file:")) return null;
      try {
        return fs.statSync(path.resolve(raw.slice("file:".length))).size;
      } catch {
        return null;
      }
    }
    const rows = await getPgClient().sql<{ bytes: string }[]>`select pg_database_size(current_database())::text as bytes`;
    const bytes = Number(rows[0]?.bytes ?? "");
    return Number.isFinite(bytes) ? bytes : null;
  }

  /**
   * Planlayıcı istatistiğini günceller ve SQLite'ta WAL kontrol noktası çalıştırır. Kilitli VACUUM FULL çalıştırılmaz.
   * PostgreSQL `ANALYZE`, SQLite `PRAGMA wal_checkpoint(PASSIVE)`, `ANALYZE` ve `PRAGMA optimize`.
   */
  public async analyze(): Promise<{ dialect: string; statement: string }> {
    if (this.dialect === "sqlite") {
      const client = getSqliteClient().client;
      await client.execute("PRAGMA wal_checkpoint(PASSIVE)");
      await client.execute("ANALYZE");
      await client.execute("PRAGMA optimize");
      return { dialect: "sqlite", statement: "PRAGMA wal_checkpoint(PASSIVE); ANALYZE; PRAGMA optimize" };
    }
    await getPgClient().sql.unsafe("ANALYZE");
    return { dialect: "postgresql", statement: "ANALYZE" };
  }
}

async function countScoped(db: CommonDb, table: { siteId: AnyColumn }, siteId: string): Promise<number> {
  const rows = await db.select({ n: count() }).from(table as never).where(eq(table.siteId, siteId));
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export function getPerformanceRepository(siteId: string): PerformanceRepository {
  return new PerformanceRepository(siteId);
}
