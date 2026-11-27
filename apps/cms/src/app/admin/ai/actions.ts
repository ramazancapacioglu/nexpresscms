"use server";

import { getAiChatRepository, type AiMessageDto, type AiPersona } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { runAssistantTurn } from "@/lib/ai-assistant/engine";

const PERSONAS: AiPersona[] = ["general", "seo", "design", "content"];

export async function sendAssistantMessageAction(input: {
  conversationId?: string;
  persona: AiPersona;
  message: string;
}) {
  const me = await requireUser({ audit: "ai.chat" });
  const persona: AiPersona = PERSONAS.includes(input.persona) ? input.persona : "general";
  const res = await runAssistantTurn({
    siteId: me.siteId,
    actor: { sub: me.sub, email: me.email, role: me.role },
    conversationId: input.conversationId,
    persona,
    message: input.message,
  });
  if (!res.ok) return res;
  const repo = getAiChatRepository(me.siteId);
  const [conversations, messages] = await Promise.all([
    repo.listConversations(40),
    repo.listMessages(res.conversationId, 80),
  ]);
  return {
    ok: true as const,
    conversationId: res.conversationId,
    conversations: conversations.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    messages: messages.map(serializeMsg),
  };
}

export async function loadConversationAction(conversationId: string) {
  const me = await requireUser({ audit: "ai.chat.read" });
  const repo = getAiChatRepository(me.siteId);
  const conv = await repo.getConversation(conversationId);
  if (!conv) return { ok: false as const, error: "Sohbet bulunamadı." };
  const messages = await repo.listMessages(conversationId, 80);
  return {
    ok: true as const,
    persona: conv.persona,
    messages: messages.map(serializeMsg),
  };
}

export async function deleteConversationAction(conversationId: string) {
  const me = await requireUser({ audit: "ai.chat.delete" });
  await getAiChatRepository(me.siteId).deleteConversation(conversationId);
  return { ok: true as const };
}

function serializeMsg(m: AiMessageDto) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role,
    content: m.content,
    toolsUsed: m.toolsUsed,
    createdAt: m.createdAt.toISOString(),
  };
}
