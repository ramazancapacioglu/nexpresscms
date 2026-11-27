import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { backendFor } from "./dialect";
import { getDbDialect } from "./client";

export type AiPersona = "general" | "seo" | "design" | "content";

export interface AiToolTrace {
  name: string;
  ok: boolean;
  summary: string;
}

export interface AiConversationDto {
  id: string;
  userId: string;
  title: string;
  persona: AiPersona;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiMessageDto {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed: AiToolTrace[];
  createdAt: Date;
}

export class AiChatRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get b() {
    return backendFor(this.dialect);
  }

  public async listConversations(limit = 40): Promise<AiConversationDto[]> {
    const { db, t } = this.b;
    const rows = await db
      .select()
      .from(t.aiConversations)
      .where(eq(t.aiConversations.siteId, this.siteId))
      .orderBy(desc(t.aiConversations.updatedAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      persona: (r.persona as AiPersona) || "general",
      summary: r.summary ?? "",
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }));
  }

  public async getConversation(id: string): Promise<AiConversationDto | null> {
    const { db, t } = this.b;
    const rows = await db
      .select()
      .from(t.aiConversations)
      .where(and(eq(t.aiConversations.siteId, this.siteId), eq(t.aiConversations.id, id)))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      persona: (r.persona as AiPersona) || "general",
      summary: r.summary ?? "",
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  }

  public async createConversation(input: { userId: string; title?: string; persona?: AiPersona }): Promise<AiConversationDto> {
    const { db, t } = this.b;
    const now = new Date();
    const id = `aic_${randomUUID().slice(0, 12)}`;
    const record = {
      id,
      siteId: this.siteId,
      userId: input.userId,
      title: (input.title?.trim() || "Yeni Sohbet").slice(0, 100),
      persona: input.persona ?? "general",
      summary: "",
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(t.aiConversations).values(record);
    return { ...record, persona: record.persona as AiPersona };
  }

  public async updateConversation(id: string, patch: { title?: string; persona?: AiPersona; summary?: string }): Promise<void> {
    const { db, t } = this.b;
    await db
      .update(t.aiConversations)
      .set({
        ...(patch.title !== undefined ? { title: patch.title.trim().slice(0, 100) } : {}),
        ...(patch.persona !== undefined ? { persona: patch.persona } : {}),
        ...(patch.summary !== undefined ? { summary: patch.summary.slice(0, 600) } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(t.aiConversations.siteId, this.siteId), eq(t.aiConversations.id, id)));
  }

  public async deleteConversation(id: string): Promise<void> {
    const { db, t } = this.b;
    await db
      .delete(t.aiConversations)
      .where(and(eq(t.aiConversations.siteId, this.siteId), eq(t.aiConversations.id, id)));
  }

  public async listMessages(conversationId: string, limit = 80): Promise<AiMessageDto[]> {
    const { db, t } = this.b;
    const rows = await db
      .select()
      .from(t.aiMessages)
      .where(and(eq(t.aiMessages.siteId, this.siteId), eq(t.aiMessages.conversationId, conversationId)))
      .orderBy(asc(t.aiMessages.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role === "assistant" ? "assistant" : "user",
      content: r.content,
      toolsUsed: Array.isArray(r.toolsUsed) ? (r.toolsUsed as AiToolTrace[]) : [],
      createdAt: new Date(r.createdAt),
    }));
  }

  public async appendMessage(input: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    toolsUsed?: AiToolTrace[];
  }): Promise<AiMessageDto> {
    const { db, t } = this.b;
    const now = new Date();
    const id = `aim_${randomUUID().slice(0, 12)}`;
    const record = {
      id,
      siteId: this.siteId,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      toolsUsed: input.toolsUsed ?? [],
      createdAt: now,
    };
    await db.insert(t.aiMessages).values(record);
    await db
      .update(t.aiConversations)
      .set({ updatedAt: now })
      .where(and(eq(t.aiConversations.siteId, this.siteId), eq(t.aiConversations.id, input.conversationId)));
    return record;
  }
}

export function getAiChatRepository(siteIdOverride?: string): AiChatRepository {
  return new AiChatRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
