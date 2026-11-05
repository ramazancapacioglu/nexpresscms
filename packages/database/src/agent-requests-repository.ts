import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export type AgentRequestKind = "lead" | "ticket" | "demo";
export type AgentRequestStatus = "new" | "handled";

export interface AgentRequestInput {
  kind: AgentRequestKind;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  productSlug?: string;
  agent?: string;
}

export interface AgentRequestDto extends Required<AgentRequestInput> {
  id: string;
  status: AgentRequestStatus;
  createdAt: Date;
}

/** Yapay zeka ajanlarından gelen talepler; her sorgu `siteId` ile kapsanır. */
export class AgentRequestRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async create(input: AgentRequestInput): Promise<string> {
    const { db, t } = this.backend;
    const id = `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();
    await db.insert(t.agentRequests).values({
      id,
      siteId: this.siteId,
      kind: input.kind,
      status: "new",
      name: input.name ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      company: input.company ?? "",
      message: input.message ?? "",
      productSlug: input.productSlug ?? "",
      agent: input.agent ?? "",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  public async list(options: { status?: AgentRequestStatus; limit?: number } = {}): Promise<AgentRequestDto[]> {
    const { db, t } = this.backend;
    const where = options.status
      ? and(eq(t.agentRequests.siteId, this.siteId), eq(t.agentRequests.status, options.status))
      : eq(t.agentRequests.siteId, this.siteId);
    const rows = await db.select().from(t.agentRequests).where(where).orderBy(desc(t.agentRequests.createdAt)).limit(options.limit ?? 200);
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind as AgentRequestKind,
      status: r.status as AgentRequestStatus,
      name: r.name,
      email: r.email,
      phone: r.phone,
      company: r.company,
      message: r.message,
      productSlug: r.productSlug,
      agent: r.agent,
      createdAt: new Date(r.createdAt),
    }));
  }

  public async setStatus(id: string, status: AgentRequestStatus): Promise<boolean> {
    const { db, t } = this.backend;
    await db.update(t.agentRequests).set({ status, updatedAt: new Date() }).where(and(eq(t.agentRequests.id, id), eq(t.agentRequests.siteId, this.siteId)));
    const rows = await db.select({ status: t.agentRequests.status }).from(t.agentRequests).where(and(eq(t.agentRequests.id, id), eq(t.agentRequests.siteId, this.siteId))).limit(1);
    return rows[0]?.status === status;
  }

  public async purgeOlderThan(days: number): Promise<number> {
    const { db, t } = this.backend;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const where = and(eq(t.agentRequests.siteId, this.siteId), lt(t.agentRequests.createdAt, cutoff));
    const rows = await db.select({ id: t.agentRequests.id }).from(t.agentRequests).where(where);
    if (rows.length === 0) return 0;
    await db.delete(t.agentRequests).where(where);
    return rows.length;
  }

  public async countNew(): Promise<number> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(t.agentRequests)
      .where(and(eq(t.agentRequests.siteId, this.siteId), eq(t.agentRequests.status, "new")));
    return Number(rows[0]?.n ?? 0);
  }
}

export function getAgentRequestRepository(siteIdOverride?: string): AgentRequestRepository {
  return new AgentRequestRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
