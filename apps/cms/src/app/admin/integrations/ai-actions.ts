"use server";

import { createChatClient, type AiProviderKind } from "@nexpress/core";
import { encryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { resolveSiteAiConfig } from "@/lib/ai-config";

type AiActionResult = { ok: true; message: string } | { ok: false; error: string };

const PROVIDERS: AiProviderKind[] = ["openai", "gemini", "custom"];

export async function saveAiSettingsAction(input: {
  enabled: boolean;
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}): Promise<AiActionResult> {
  const me = await requireAdmin("integrations.ai.save");
  const provider: AiProviderKind = PROVIDERS.includes(input.provider) ? input.provider : "openai";
  const baseUrl = input.baseUrl.trim();
  if (baseUrl && !/^https:\/\/[a-z0-9.-]+/i.test(baseUrl)) {
    return { ok: false, error: "Özel API adresi https:// ile başlamalıdır." };
  }

  const repo = getScopedRepository(me.siteId);
  const current = (await repo.getSite())?.settings.ai;
  const rawKey = input.apiKey.trim();
  // Boş bırakılan anahtar mevcut şifreli anahtarı korur
  const encryptedKey = rawKey ? encryptSecret(rawKey) : (current?.apiKey ?? "");
  if (input.enabled && !encryptedKey && !process.env.OPENAI_API_KEY?.trim()) {
    return { ok: false, error: "AI sağlayıcısını açmak için bir API anahtarı girin." };
  }

  await repo.saveSiteSettings({
    ai: {
      enabled: input.enabled,
      provider,
      apiKey: encryptedKey,
      baseUrl: baseUrl.slice(0, 200),
      chatModel: input.chatModel.trim().slice(0, 80),
      embeddingModel: input.embeddingModel.trim().slice(0, 80),
    },
  });
  await recordAudit({ id: me.sub, email: me.email }, "integrations.ai.save", {
    detail: input.enabled ? `${provider} etkin` : "AI devre dışı",
  });
  await revalidatePath("/admin/integrations");
  await revalidatePath("/admin/seo");
  await revalidatePath("/admin/seo/audit");
  return { ok: true, message: "AI sağlayıcı ayarları şifreli olarak kaydedildi." };
}

export async function testAiConnectionAction(draft?: {
  provider?: AiProviderKind;
  apiKey?: string;
  baseUrl?: string;
  chatModel?: string;
}): Promise<AiActionResult> {
  const me = await requireAdmin("integrations.ai.test");
  const saved = await resolveSiteAiConfig(me.siteId);
  const provider: AiProviderKind = draft?.provider && PROVIDERS.includes(draft.provider) ? draft.provider : saved.provider;
  const presetBase =
    provider === "gemini"
      ? "https://generativelanguage.googleapis.com/v1beta/openai"
      : "https://api.openai.com/v1";
  const presetModel = provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini";

  const apiKey = draft?.apiKey?.trim() || saved.apiKey;
  const baseUrl = (draft?.baseUrl?.trim() || (draft?.provider ? presetBase : saved.baseUrl) || presetBase).replace(/\/$/, "");
  const chatModel = draft?.chatModel?.trim() || (draft?.provider ? presetModel : saved.chatModel) || presetModel;

  if (!apiKey) {
    return { ok: false, error: "Test için bir API anahtarı girin veya önce kaydedin." };
  }
  try {
    const client = createChatClient({
      apiKey,
      baseUrl,
      model: chatModel,
      timeoutMs: 15_000,
      maxRetries: 0,
    });
    const out = await client.completeJson({
      system: 'Return a valid JSON object strictly as {"ok":true}',
      user: "Respond with JSON ping ok.",
      temperature: 0,
      maxTokens: 32,
    });
    return {
      ok: true,
      message: `Bağlantı başarılı (${provider} / ${chatModel}) — yanıt: ${out.slice(0, 40)}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Bağlantı başarısız (${provider} / ${chatModel}): ${err instanceof Error ? err.message.slice(0, 180) : String(err)}`,
    };
  }
}
