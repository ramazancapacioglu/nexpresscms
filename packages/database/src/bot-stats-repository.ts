import { and, gte, lte, eq, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type BotTrust = "verified" | "claimed";

export interface BotHitInput {
  botId: string;
  kind: string;
  trust: BotTrust;
  /** Taranan sayfa veya uç nokta yolu (örn. `/wolvox-erp`, `/llms.txt`). */
  path?: string;
  at?: Date;
}

export interface BotStatRow {
  day?: string;
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

export interface BotPageRow {
  day: string;
  botId: string;
  kind: string;
  path: string;
  hits: number;
  lastSeenAt: Date;
}

export interface BotPageSummaryDto {
  path: string;
  total: number;
  byBot: Record<string, number>;
  byKind: Record<string, number>;
  lastSeenAt: Date;
}

export interface BotDailyPoint {
  day: string;
  total: number;
  byBot: Record<string, number>;
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

/** Sayfa bazlı bot satırlarını yola göre toplar; saf işlev. */
export function summarizeBotPageRows(
  rows: BotPageRow[],
  options?: { botId?: string; kind?: string; limit?: number }
): BotPageSummaryDto[] {
  const map = new Map<string, BotPageSummaryDto>();
  for (const r of rows) {
    if (options?.botId && r.botId !== options.botId) continue;
    if (options?.kind && r.kind !== options.kind) continue;
    const cur = map.get(r.path) ?? { path: r.path, total: 0, byBot: {}, byKind: {}, lastSeenAt: r.lastSeenAt };
    cur.total += r.hits;
    cur.byBot[r.botId] = (cur.byBot[r.botId] ?? 0) + r.hits;
    cur.byKind[r.kind] = (cur.byKind[r.kind] ?? 0) + r.hits;
    if (r.lastSeenAt > cur.lastSeenAt) cur.lastSeenAt = r.lastSeenAt;
    map.set(r.path, cur);
  }
  const sorted = [...map.values()].sort((a, b) => b.total - a.total || b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
  return options?.limit ? sorted.slice(0, options.limit) : sorted;
}

/** Günlük tarama trendi üretir (eksik günler 0 ile doldurulur). */
export function buildBotDailySeries(rows: BotStatRow[], fromDay: string, toDay: string): BotDailyPoint[] {
  const byDay = new Map<string, BotDailyPoint>();
  const start = new Date(`${fromDay}T00:00:00Z`);
  const end = new Date(`${toDay}T00:00:00Z`);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
    for (let t = start.getTime(); t <= end.getTime() && byDay.size < 366; t += 86_400_000) {
      const d = utcDay(new Date(t));
      byDay.set(d, { day: d, total: 0, byBot: {} });
    }
  }
  for (const r of rows) {
    const d = r.day ?? utcDay(r.lastSeenAt);
    const cur = byDay.get(d) ?? { day: d, total: 0, byBot: {} };
    cur.total += r.hits;
    cur.byBot[r.botId] = (cur.byBot[r.botId] ?? 0) + r.hits;
    byDay.set(d, cur);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export class BotStatsRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /** Günlük sayaç artırır (isteğe bağlı sayfa yoluyla birlikte); ham ziyaretçi verisi (IP, UA) saklanmaz. */
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

    if (input.path) {
      const cleanPath = input.path.slice(0, 240);
      const pageRow = {
        id: `${this.siteId}|${day}|${input.botId}|${input.kind}|${cleanPath}`,
        siteId: this.siteId,
        day,
        botId: input.botId,
        kind: input.kind,
        path: cleanPath,
        hits: 1,
        lastSeenAt: at,
      };
      await db
        .insert(t.botPageDaily)
        .values(pageRow)
        .onConflictDoUpdate({
          target: t.botPageDaily.id,
          set: { hits: sql`${t.botPageDaily.hits} + 1`, lastSeenAt: at },
        });
    }
  }

  /** Tarih aralığındaki (iki uç dahil, YYYY-MM-DD) satırlar. */
  public async rowsInRange(fromDay: string, toDay: string): Promise<BotStatRow[]> {
    const { db, t } = this.backend;
    return db
      .select({
        day: t.botDailyStats.day,
        botId: t.botDailyStats.botId,
        kind: t.botDailyStats.kind,
        trust: t.botDailyStats.trust,
        hits: t.botDailyStats.hits,
        lastSeenAt: t.botDailyStats.lastSeenAt,
      })
      .from(t.botDailyStats)
      .where(
        and(
          eq(t.botDailyStats.siteId, this.siteId),
          gte(t.botDailyStats.day, fromDay),
          lte(t.botDailyStats.day, toDay)
        )
      );
  }

  /** Son `days` günün (bugün dahil) satırları. */
  public async rows(days: number, now = new Date()): Promise<BotStatRow[]> {
    const fromDay = utcDay(new Date(now.getTime() - (days - 1) * 86_400_000));
    const toDay = utcDay(now);
    return this.rowsInRange(fromDay, toDay);
  }

  public async summary(days = 30): Promise<BotSummaryDto[]> {
    return summarizeBotRows(await this.rows(days));
  }

  public async summaryInRange(fromDay: string, toDay: string): Promise<BotSummaryDto[]> {
    return summarizeBotRows(await this.rowsInRange(fromDay, toDay));
  }

  public async dailySeriesInRange(fromDay: string, toDay: string): Promise<BotDailyPoint[]> {
    return buildBotDailySeries(await this.rowsInRange(fromDay, toDay), fromDay, toDay);
  }

  /** Tarih aralığındaki sayfa bazlı bot taramaları. */
  public async pageHitsInRange(
    fromDay: string,
    toDay: string,
    options?: { botId?: string; kind?: string; limit?: number }
  ): Promise<BotPageSummaryDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select({
        day: t.botPageDaily.day,
        botId: t.botPageDaily.botId,
        kind: t.botPageDaily.kind,
        path: t.botPageDaily.path,
        hits: t.botPageDaily.hits,
        lastSeenAt: t.botPageDaily.lastSeenAt,
      })
      .from(t.botPageDaily)
      .where(
        and(
          eq(t.botPageDaily.siteId, this.siteId),
          gte(t.botPageDaily.day, fromDay),
          lte(t.botPageDaily.day, toDay)
        )
      );
    return summarizeBotPageRows(rows, options);
  }
}

export function getBotStatsRepository(siteIdOverride?: string): BotStatsRepository {
  return new BotStatsRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
