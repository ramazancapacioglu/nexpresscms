import { randomInt, randomUUID } from "node:crypto";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export interface McpLogEntry {
  tool: string;
  agent?: string;
  ok: boolean;
  durationMs: number;
  at?: Date;
}

export interface McpLogSummary {
  total: number;
  errors: number;
  avgMs: number;
  byTool: Array<{ tool: string; count: number; errors: number }>;
  byAgent: Array<{ agent: string; count: number }>;
  /** Gün (YYYY-MM-DD, UTC) -> istek sayısı; boş günler dahildir */
  byDay: Array<{ day: string; count: number }>;
}

/** Günlükler bu süreden eskiyse kendiliğinden silinir (yeterince küçük kalsın). */
export const MCP_LOG_RETENTION_DAYS = 90;
const DAY = 86_400_000;

/** MCP istek günlüğü: yalnızca araç adı, kısaltılmış ajan adı, sonuç ve süre. Kiracıya kapalıdır. */
export class McpLogRepository {
  constructor(private readonly siteId: string, private readonly dialect: DbDialect) {}

  public async record(entry: McpLogEntry): Promise<void> {
    const { db, t } = backendFor(this.dialect);
    await db.insert(t.mcpRequestLog).values({
      id: randomUUID(),
      siteId: this.siteId,
      at: entry.at ?? new Date(),
      tool: entry.tool.slice(0, 80) || "?",
      agent: (entry.agent ?? "").replace(/[\r\n]+/g, " ").slice(0, 80),
      ok: entry.ok,
      durationMs: Math.max(0, Math.round(entry.durationMs)),
    });
    // Her ~100 kayıtta bir eski satırları temizle (ayrı zamanlayıcı gerekmesin)
    if (randomInt(100) === 0) await this.prune();
  }

  public async prune(now: Date = new Date()): Promise<void> {
    const { db, t } = backendFor(this.dialect);
    await db.delete(t.mcpRequestLog).where(and(eq(t.mcpRequestLog.siteId, this.siteId), lt(t.mcpRequestLog.at, new Date(now.getTime() - MCP_LOG_RETENTION_DAYS * DAY))));
  }

  public async summary(days = 30, now: Date = new Date()): Promise<McpLogSummary> {
    const { db, t } = backendFor(this.dialect);
    const since = new Date(now.getTime() - days * DAY);
    const rows = await db
      .select({ at: t.mcpRequestLog.at, tool: t.mcpRequestLog.tool, agent: t.mcpRequestLog.agent, ok: t.mcpRequestLog.ok, durationMs: t.mcpRequestLog.durationMs })
      .from(t.mcpRequestLog)
      .where(and(eq(t.mcpRequestLog.siteId, this.siteId), gte(t.mcpRequestLog.at, since)))
      .orderBy(desc(t.mcpRequestLog.at))
      .limit(50_000);
    const tools = new Map<string, { count: number; errors: number }>();
    const agents = new Map<string, number>();
    const perDay = new Map<string, number>();
    let errors = 0;
    let ms = 0;
    for (const r of rows) {
      const tool = tools.get(r.tool) ?? { count: 0, errors: 0 };
      tool.count++;
      if (!r.ok) {
        tool.errors++;
        errors++;
      }
      tools.set(r.tool, tool);
      const agent = r.agent || "(bilinmiyor)";
      agents.set(agent, (agents.get(agent) ?? 0) + 1);
      const day = new Date(r.at).toISOString().slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
      ms += r.durationMs;
    }
    const byDay: McpLogSummary["byDay"] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getTime() - i * DAY).toISOString().slice(0, 10);
      byDay.push({ day, count: perDay.get(day) ?? 0 });
    }
    return {
      total: rows.length,
      errors,
      avgMs: rows.length ? Math.round(ms / rows.length) : 0,
      byTool: [...tools].map(([tool, v]) => ({ tool, ...v })).sort((a, b) => b.count - a.count),
      byAgent: [...agents].map(([agent, count]) => ({ agent, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      byDay,
    };
  }
}

export function getMcpLogRepository(siteIdOverride?: string): McpLogRepository {
  return new McpLogRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}


