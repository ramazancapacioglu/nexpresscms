import { and, desc, eq } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor, upsertScoped } from "./dialect";

export type IntelSource = "gsc" | "bing" | "yandex" | "serper" | "support";

export interface IntelSignalInput {
  id: string;
  source: IntelSource;
  keyword: string;
  clicks: number;
  impressions: number;
  ctr100: number;
  position10: number;
  prevPosition10?: number;
  detail?: string;
}

export interface IntelSignalDto extends IntelSignalInput {
  capturedAt: Date;
}

export interface IntelClusterInput {
  id: string;
  label: string;
  members: string[];
  status: "open" | "draft";
  contentId: string;
}

export interface IntelClusterDto extends IntelClusterInput {
  updatedAt: Date;
}

export interface ContentImportInput {
  kind: "url" | "paste";
  source: string;
  title: string;
  status: "draft" | "failed" | "changed";
  contentId: string;
  bodyHash?: string;
  error?: string;
}

export interface ContentImportDto extends ContentImportInput {
  id: string;
  fetchedAt: Date;
}

/** Kelime havuzu, küme taslağı ve link içe aktarma. Her sorgu siteId ile kapalıdır. */
export class IntelRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async saveSignals(rows: IntelSignalInput[]): Promise<number> {
    const { db, t } = this.backend;
    const now = new Date();
    const known = new Map((await this.listSignals(1000)).map((row) => [row.id, row]));
    let n = 0;
    for (const row of rows) {
      const prev = known.get(row.id);
      const moved = prev && prev.position10 > 0 && row.position10 > 0 && prev.position10 !== row.position10;
      const prevPosition10 = moved ? prev.position10 : (row.prevPosition10 ?? prev?.prevPosition10 ?? 0);
      const record = {
        id: row.id,
        siteId: this.siteId,
        source: row.source,
        keyword: row.keyword,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr100: row.ctr100,
        position10: row.position10,
        prevPosition10,
        detail: row.detail ?? "",
        capturedAt: now,
      };
      await upsertScoped(db, t.seoIntelSignals, this.siteId, record, {
        clicks: record.clicks,
        impressions: record.impressions,
        ctr100: record.ctr100,
        position10: record.position10,
        prevPosition10: record.prevPosition10,
        detail: record.detail,
        capturedAt: now,
      });
      n += 1;
    }
    return n;
  }

  public async listSignals(limit = 500): Promise<IntelSignalDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.seoIntelSignals)
      .where(eq(t.seoIntelSignals.siteId, this.siteId))
      .orderBy(desc(t.seoIntelSignals.capturedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      source: r.source as IntelSource,
      keyword: r.keyword,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr100: r.ctr100,
      position10: r.position10,
      prevPosition10: r.prevPosition10,
      detail: r.detail,
      capturedAt: new Date(r.capturedAt),
    }));
  }

  public async saveCluster(input: IntelClusterInput): Promise<void> {
    const { db, t } = this.backend;
    const now = new Date();
    await upsertScoped(
      db,
      t.seoIntelClusters,
      this.siteId,
      {
        id: input.id,
        siteId: this.siteId,
        label: input.label,
        members: input.members,
        status: input.status,
        contentId: input.contentId,
        updatedAt: now,
      },
      { label: input.label, members: input.members, status: input.status, contentId: input.contentId, updatedAt: now }
    );
  }

  public async listClusters(limit = 200): Promise<IntelClusterDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.seoIntelClusters)
      .where(eq(t.seoIntelClusters.siteId, this.siteId))
      .orderBy(desc(t.seoIntelClusters.updatedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      members: Array.isArray(r.members) ? r.members : [],
      status: r.status === "draft" ? "draft" : "open",
      contentId: r.contentId,
      updatedAt: new Date(r.updatedAt),
    }));
  }

  public async addImport(input: ContentImportInput): Promise<string> {
    const { db, t } = this.backend;
    const id = `imp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(t.contentImports).values({
      id,
      siteId: this.siteId,
      kind: input.kind,
      source: input.source,
      title: input.title,
      status: input.status,
      contentId: input.contentId,
      bodyHash: input.bodyHash ?? "",
      error: input.error ?? "",
      fetchedAt: new Date(),
    });
    return id;
  }

  public async markImport(id: string, patch: { status: "draft" | "failed" | "changed"; bodyHash: string; title?: string }): Promise<void> {
    const { db, t } = this.backend;
    await db
      .update(t.contentImports)
      .set({ status: patch.status, bodyHash: patch.bodyHash, title: patch.title, fetchedAt: new Date() })
      .where(and(eq(t.contentImports.id, id), eq(t.contentImports.siteId, this.siteId)));
  }

  public async listImports(limit = 30): Promise<ContentImportDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.contentImports)
      .where(eq(t.contentImports.siteId, this.siteId))
      .orderBy(desc(t.contentImports.fetchedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind === "url" ? "url" : "paste",
      source: r.source,
      title: r.title,
      status: r.status === "failed" ? "failed" : r.status === "changed" ? "changed" : "draft",
      contentId: r.contentId,
      bodyHash: r.bodyHash,
      error: r.error,
      fetchedAt: new Date(r.fetchedAt),
    }));
  }
}

export function getIntelRepository(siteIdOverride?: string): IntelRepository {
  return new IntelRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
