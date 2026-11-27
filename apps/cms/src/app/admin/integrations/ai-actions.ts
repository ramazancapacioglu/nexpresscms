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

export async function testAiConnectionAction(): Promise<AiActionResult> {
  const me = await requireAdmin("integrations.ai.test");
  const cfg = await resolveSiteAiConfig(me.siteId);
  if (!cfg.apiKey) {
    return { ok: false, error: "Kayıtlı bir AI API anahtarı bulunamadı. Önce anahtar girip kaydedin." };
  }
  try {
    const client = createChatClient({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.chatModel,
      timeoutMs: 12_000,
      maxRetries: 0,
    });
    const out = await client.completeJson({
      system: 'Return strictly {"ok":true}',
      user: "ping",
      temperature: 0,
      maxTokens: 20,
    });
    return {
      ok: true,
      message: `Bağlantı başarılı (${cfg.provider} / ${cfg.chatModel}) — yanıt alındı: ${out.slice(0, 40)}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Bağlantı başarısız: ${err instanceof Error ? err.message.slice(0, 160) : String(err)}`,
    };
  }
}
