import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";
import { likeEscape } from "./media-admin-repository";

export interface AuditEntryInput {
  actorId?: string | null;
  actorEmail?: string;
  action: string;
  target?: string | null;
  detail?: string;
  ip?: string;
  at?: Date;
}

export interface AuditEntryDto {
  id: string;
  at: Date;
  actorId: string | null;
  actorEmail: string;
  action: string;
  target: string | null;
  detail: string;
  ip: string;
}

export interface AuditQuery {
  limit?: number;
  offset?: number;
  actorEmail?: string;
  /** `content.` gibi ön ek veya tam eylem adı */
  actionPrefix?: string;
  since?: Date;
}

const MAX_DETAIL = 500;

/** Denetim günlüğü: yalnızca eklenir (güncelleme/silme API'si yoktur). Sır ve parola yazılmaz. */
export class AuditRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  public async record(entry: AuditEntryInput): Promise<void> {
    const { db, audit } = backendFor(this.dialect);
    await db.insert(audit).values({
      id: randomUUID(),
      siteId: this.siteId,
      at: entry.at ?? new Date(),
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? "",
      action: entry.action,
      target: entry.target ?? null,
      detail: (entry.detail ?? "").slice(0, MAX_DETAIL),
      ip: entry.ip ?? "",
    });
  }

  public async list(query: AuditQuery = {}): Promise<AuditEntryDto[]> {
    const { db, audit } = backendFor(this.dialect);
    const rows = await db
      .select()
      .from(audit)
      .where(
        and(
          eq(audit.siteId, this.siteId),
          query.actorEmail ? eq(audit.actorEmail, query.actorEmail.toLowerCase()) : undefined,
          query.actionPrefix ? sql`${audit.action} LIKE ${`${likeEscape(query.actionPrefix)}%`} ESCAPE '!'` : undefined,
          query.since ? gte(audit.at, query.since) : undefined
        )
      )
      .orderBy(desc(audit.at))
      .limit(Math.min(query.limit ?? 50, 200))
      .offset(query.offset ?? 0);
    return rows;
  }

  public async count(query: Pick<AuditQuery, "actorEmail" | "actionPrefix" | "since"> = {}): Promise<number> {
    const { db, audit } = backendFor(this.dialect);
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(audit)
      .where(
        and(
          eq(audit.siteId, this.siteId),
          query.actorEmail ? eq(audit.actorEmail, query.actorEmail.toLowerCase()) : undefined,
          query.actionPrefix ? sql`${audit.action} LIKE ${`${likeEscape(query.actionPrefix)}%`} ESCAPE '!'` : undefined,
          query.since ? gte(audit.at, query.since) : undefined
        )
      );
    return Number(rows[0]?.n ?? 0);
  }
}

export function getAuditRepository(siteIdOverride?: string): AuditRepository {
  return new AuditRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
