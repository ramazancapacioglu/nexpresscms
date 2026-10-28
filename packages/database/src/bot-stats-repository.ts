import { and, gte, eq, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type BotTrust = "verified" | "claimed";

export interface BotHitInput {
  botId: string;
  kind: string;
  trust: BotTrust;
  at?: Date;
}

export interface BotStatRow {
  botId: string;
  kind: string;
  trust: BotTrust;
  hits: number;
  lastSeenAt: Date;
}

export interface BotSummaryDto {
  botId: string;
  total: number;
  verified: number;
  lastSeenAt: Date;
  byKind: Record<string, number>;
}

/** Gün anahtarı UTC'dir; raporlar da UTC gün sınırıyla çalışır. */
export const utcDay = (d: Date) => d.toISOString().slice(0, 10);

/** Ham satırları bota göre toplar; saf işlev (veritabanı gerektirmez). */
export function summarizeBotRows(rows: BotStatRow[]): BotSummaryDto[] {
  const map = new Map<string, BotSummaryDto>();
  for (const r of rows) {
    const cur = map.get(r.botId) ?? { botId: r.botId, total: 0, verified: 0, lastSeenAt: r.lastSeenAt, byKind: {} };
    cur.total += r.hits;
    if (r.trust === "verified") cur.verified += r.hits;
    cur.byKind[r.kind] = (cur.byKind[r.kind] ?? 0) + r.hits;
    if (r.lastSeenAt > cur.lastSeenAt) cur.lastSeenAt = r.lastSeenAt;
    map.set(r.botId, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export class BotStatsRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /** Günlük sayaç artırır; ham ziyaretçi verisi (IP, UA) saklanmaz. */
  public async recordHit(input: BotHitInput): Promise<void> {
    const at = input.at ?? new Date();
    const day = utcDay(at);
    const row = {
      id: `${this.siteId}|${day}|${input.botId}|${input.kind}|${input.trust}`,
      siteId: this.siteId,
      day,
      botId: input.botId,
      kind: input.kind,
      trust: input.trust,
      hits: 1,
      lastSeenAt: at,
    };
    const { db, t } = this.backend;
    await db
      .insert(t.botDailyStats)
      .values(row)
      .onConflictDoUpdate({
        target: t.botDailyStats.id,
        set: { hits: sql`${t.botDailyStats.hits} + 1`, lastSeenAt: at },
      });
  }

  /** Son `days` günün (bugün dahil) satırları. */
  public async rows(days: number, now = new Date()): Promise<BotStatRow[]> {
    const since = utcDay(new Date(now.getTime() - (days - 1) * 86_400_000));
    const { db, t } = this.backend;
    return db
      .select({
        botId: t.botDailyStats.botId,
        kind: t.botDailyStats.kind,
        trust: t.botDailyStats.trust,
        hits: t.botDailyStats.hits,
        lastSeenAt: t.botDailyStats.lastSeenAt,
      })
      .from(t.botDailyStats)
      .where(and(eq(t.botDailyStats.siteId, this.siteId), gte(t.botDailyStats.day, since)));
  }

  public async summary(days = 30): Promise<BotSummaryDto[]> {
    return summarizeBotRows(await this.rows(days));
  }
}

export function getBotStatsRepository(siteIdOverride?: string): BotStatsRepository {
  return new BotStatsRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
