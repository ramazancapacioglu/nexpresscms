import { and, eq, gte, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";
import { utcDay } from "./bot-stats-repository";

export interface AiReferralSummary {
  total: number;
  bySource: Array<{ source: string; hits: number }>;
  topPaths: Array<{ path: string; hits: number }>;
}

export interface ReferralRow {
  source: string;
  path: string;
  hits: number;
}

/** Ham satırları toplar (saf işlev). */
export function summarizeReferrals(rows: ReferralRow[], topN = 5): AiReferralSummary {
  const bySource = new Map<string, number>();
  const byPath = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    total += r.hits;
    bySource.set(r.source, (bySource.get(r.source) ?? 0) + r.hits);
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.hits);
  }
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return {
    total,
    bySource: sorted(bySource).map(([source, hits]) => ({ source, hits })),
    topPaths: sorted(byPath).slice(0, topN).map(([path, hits]) => ({ path, hits })),
  };
}

/** Günlük AI yönlendirme sayacı; IP ve UA saklanmaz. */
export class AiReferralRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async recordHit(input: { source: string; path: string; at?: Date }): Promise<void> {
    const at = input.at ?? new Date();
    const day = utcDay(at);
    const { db, t } = this.backend;
    await db
      .insert(t.aiReferralDaily)
      .values({ id: `${this.siteId}|${day}|${input.source}|${input.path}`, siteId: this.siteId, day, source: input.source, path: input.path, hits: 1, lastSeenAt: at })
      .onConflictDoUpdate({ target: t.aiReferralDaily.id, set: { hits: sql`${t.aiReferralDaily.hits} + 1`, lastSeenAt: at } });
  }

  public async summary(days = 30, now = new Date()): Promise<AiReferralSummary> {
    const since = utcDay(new Date(now.getTime() - (days - 1) * 86_400_000));
    const { db, t } = this.backend;
    const rows = await db
      .select({ source: t.aiReferralDaily.source, path: t.aiReferralDaily.path, hits: t.aiReferralDaily.hits })
      .from(t.aiReferralDaily)
      .where(and(eq(t.aiReferralDaily.siteId, this.siteId), gte(t.aiReferralDaily.day, since)));
    return summarizeReferrals(rows);
  }
}

export function getAiReferralRepository(siteIdOverride?: string): AiReferralRepository {
  return new AiReferralRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
