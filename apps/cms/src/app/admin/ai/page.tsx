import React from "react";
import { getAiChatRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { resolveSiteAiConfig } from "@/lib/ai-config";
import { AiChatWorkspace } from "./ai-chat-workspace";

export const dynamic = "force-dynamic";

export default async function AdminAiAssistantPage() {
  const me = await requireUser();
  const repo = getAiChatRepository(me.siteId);
  const [conversations, ai] = await Promise.all([
    repo.listConversations(40),
    resolveSiteAiConfig(me.siteId),
  ]);
  const active = conversations[0] ?? null;
  const messages = active ? await repo.listMessages(active.id, 80) : [];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
          AI Uzman Sohbet &amp; Site Denetçisi
        </h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          NexPress mimarisini bilen, canlı veritabanı ve SEO raporlarını okuyarak halüsinasyonsuz analiz ve düzeltme yapan kalıcı hafızalı uzman asistan.
        </p>
      </div>

      <AiChatWorkspace
        initialConversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          persona: c.persona,
          summary: c.summary,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        initialMessages={messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          role: m.role,
          content: m.content,
          toolsUsed: m.toolsUsed,
          createdAt: m.createdAt.toISOString(),
        }))}
        initialConvId={active?.id ?? null}
        aiStatus={{
          configured: Boolean(ai.apiKey),
          provider: ai.provider,
          model: ai.chatModel,
        }}
      />
    </div>
  );
}
