import "server-only";
import { getAiChatRepository, getScopedRepository, type AiPersona, type AiToolTrace } from "@nexpress/database";
import { resolveSiteAiConfig } from "@/lib/ai-config";
import { buildAssistantSystemPrompt } from "./prompts";
import { AI_TOOL_DEFINITIONS, executeAiTool, type ToolActor } from "./tools";

interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

export interface RunAssistantResult {
  ok: true;
  conversationId: string;
  reply: string;
  toolsUsed: AiToolTrace[];
}

export interface RunAssistantError {
  ok: false;
  error: string;
}

/**
 * Sıfır halüsinasyonlu, araç çağırmalı (tool-calling) ve kalıcı hafızalı NexPress AI Sohbet motoru.
 * Maksimum 5 araç turu çalıştırır, tüm mesajları ve araç izlerini veritabanına kaydeder.
 */
export async function runAssistantTurn(input: {
  siteId: string;
  actor: ToolActor;
  conversationId?: string;
  persona: AiPersona;
  message: string;
}): Promise<RunAssistantResult | RunAssistantError> {
  const userText = input.message.trim();
  if (!userText) return { ok: false, error: "Mesaj boş olamaz." };

  const ai = await resolveSiteAiConfig(input.siteId);
  if (!ai.apiKey) {
    return {
      ok: false,
      error: "AI API anahtarı tanımlı değil. Lütfen Entegrasyonlar (/admin/integrations) sayfasından OpenAI veya Gemini anahtarınızı kaydedin.",
    };
  }

  const chatRepo = getAiChatRepository(input.siteId);
  const site = await getScopedRepository(input.siteId).getSite();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  let conv = input.conversationId ? await chatRepo.getConversation(input.conversationId) : null;
  if (!conv) {
    const autoTitle = userText.replace(/\s+/g, " ").slice(0, 64);
    conv = await chatRepo.createConversation({ userId: input.actor.sub, title: autoTitle, persona: input.persona });
  } else if (conv.persona !== input.persona) {
    await chatRepo.updateConversation(conv.id, { persona: input.persona });
  }

  // Kullanıcının mesajını kalıcı kaydet
  await chatRepo.appendMessage({ conversationId: conv.id, role: "user", content: userText });

  // Önceki sohbetlerden kısa hafıza özetleri + mevcut sohbet geçmişi
  const [recentConvs, history] = await Promise.all([
    chatRepo.listConversations(8),
    chatRepo.listMessages(conv.id, 30),
  ]);
  const recentMemories = recentConvs
    .filter((c) => c.id !== conv!.id && c.summary.trim().length > 0)
    .slice(0, 5)
    .map((c) => ({
      title: c.title,
      summary: c.summary,
      updatedAt: c.updatedAt.toISOString().slice(0, 10),
    }));

  const systemPrompt = buildAssistantSystemPrompt({
    siteName: site?.name ?? "NexPress CMS",
    siteUrl: baseUrl,
    persona: input.persona,
    recentMemories,
  });

  const messages: OpenAiMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const toolsUsed: AiToolTrace[] = [];
  let finalReply = "";

  for (let step = 0; step < 5; step++) {
    const res = await fetch(`${ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
      body: JSON.stringify({
        model: ai.chatModel,
        temperature: input.persona === "content" ? 0.45 : 0.15,
        messages,
        tools: AI_TOOL_DEFINITIONS,
        tool_choice: "auto",
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        error: `AI sağlayıcı hatası (${res.status}): ${errText.slice(0, 200)}`,
      };
    }

    const body = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
        };
      }>;
    };

    const msg = body.choices?.[0]?.message;
    if (!msg) return { ok: false, error: "AI sağlayıcısı boş yanıt döndürdü." };

    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) {
      finalReply = (msg.content ?? "").trim() || "İşlem tamamlandı.";
      break;
    }

    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });

    for (const call of calls) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = call.function.arguments ? (JSON.parse(call.function.arguments) as Record<string, unknown>) : {};
      } catch {
        parsedArgs = {};
      }
      const result = await executeAiTool(input.siteId, input.actor, call.function.name, parsedArgs);
      toolsUsed.push({ name: call.function.name, ok: result.ok, summary: result.summary });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result.data).slice(0, 18_000),
      });
    }
  }

  if (!finalReply) {
    finalReply = "Araç analizleri tamamlandı ancak model son özet metnini üretmedi. Lütfen tekrar deneyin.";
  }

  // Yanıtı ve kullanılan araç izlerini kalıcı kaydet + sohbet özetini güncelle
  await chatRepo.appendMessage({
    conversationId: conv.id,
    role: "assistant",
    content: finalReply,
    toolsUsed,
  });

  const actionNote = toolsUsed.length > 0 ? `[Araçlar: ${toolsUsed.map((t) => t.name).join(", ")}] ` : "";
  const shortSummary = `${actionNote}${finalReply.replace(/\s+/g, " ").slice(0, 280)}`;
  await chatRepo.updateConversation(conv.id, { summary: shortSummary });

  return { ok: true, conversationId: conv.id, reply: finalReply, toolsUsed };
}
