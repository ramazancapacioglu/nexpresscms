"use server";

import { createChatClient, type AiProviderKind } from "@nexpress/core";
import { encryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { createOpenAiProvider } from "@nexpress/rag";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { resolveSiteAiConfig } from "@/lib/ai-config";

type AiActionResult = { ok: true; message: string } | { ok: false; error: string };

const PROVIDERS: AiProviderKind[] = ["openai", "gemini", "custom"];

const BASE_PRESETS: Record<AiProviderKind, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  custom: "https://api.openai.com/v1",
};

const EMBED_PRESETS: Record<AiProviderKind, string> = {
  openai: "text-embedding-3-small",
  gemini: "gemini-embedding-001",
  custom: "text-embedding-3-small",
};

export async function saveAiSettingsAction(input: {
  enabled: boolean;
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  deepChatModel?: string;
  embeddingModel: string;
  separateEmbedding?: boolean;
  embeddingProvider?: AiProviderKind;
  embeddingApiKey?: string;
  embeddingBaseUrl?: string;
}): Promise<AiActionResult> {
  const me = await requireAdmin("integrations.ai.save");
  const provider: AiProviderKind = PROVIDERS.includes(input.provider) ? input.provider : "openai";
  const embeddingProvider: AiProviderKind =
    input.embeddingProvider && PROVIDERS.includes(input.embeddingProvider) ? input.embeddingProvider : "gemini";
  const baseUrl = input.baseUrl.trim();
  const embeddingBaseUrl = (input.embeddingBaseUrl ?? "").trim();
  if (baseUrl && !/^https:\/\/[a-z0-9.-]+/i.test(baseUrl)) {
    return { ok: false, error: "Sohbet API taban adresi https:// ile başlamalıdır." };
  }
  if (embeddingBaseUrl && !/^https:\/\/[a-z0-9.-]+/i.test(embeddingBaseUrl)) {
    return { ok: false, error: "Embedding API taban adresi https:// ile başlamalıdır." };
  }

  const repo = getScopedRepository(me.siteId);
  const current = (await repo.getSite())?.settings.ai;
  const rawKey = input.apiKey.trim();
  const rawEmbKey = (input.embeddingApiKey ?? "").trim();
  // Boş bırakılan anahtarlar mevcut şifreli anahtarı korur
  const encryptedKey = rawKey ? encryptSecret(rawKey) : (current?.apiKey ?? "");
  const encryptedEmbKey = rawEmbKey ? encryptSecret(rawEmbKey) : (current?.embeddingApiKey ?? "");
  const separateEmbedding = Boolean(input.separateEmbedding);

  if (input.enabled && !encryptedKey && !encryptedEmbKey && !process.env.OPENAI_API_KEY?.trim()) {
    return { ok: false, error: "AI sağlayıcısını açmak için en az bir API anahtarı girin." };
  }

  await repo.saveSiteSettings({
    ai: {
      enabled: input.enabled,
      provider,
      apiKey: encryptedKey,
      baseUrl: baseUrl.slice(0, 200),
      chatModel: input.chatModel.trim().slice(0, 80),
      deepChatModel: (input.deepChatModel ?? "").trim().slice(0, 80),
      embeddingModel: input.embeddingModel.trim().slice(0, 80),
      separateEmbedding,
      embeddingProvider,
      embeddingApiKey: encryptedEmbKey,
      embeddingBaseUrl: embeddingBaseUrl.slice(0, 200),
    },
  });
  await recordAudit({ id: me.sub, email: me.email }, "integrations.ai.save", {
    detail: input.enabled
      ? `${provider}${separateEmbedding ? ` + RAG:${embeddingProvider}` : ""} etkin`
      : "AI devre dışı",
  });
  await revalidatePath("/admin/integrations");
  await revalidatePath("/admin/ai");
  await revalidatePath("/admin/seo");
  await revalidatePath("/admin/seo/audit");
  return { ok: true, message: "AI ve RAG sağlayıcı ayarları şifreli olarak kaydedildi." };
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
  const presetBase = BASE_PRESETS[provider] ?? BASE_PRESETS.openai;
  const presetModel = provider === "gemini" ? "gemini-flash-latest" : "gpt-4.1-mini";

  const apiKey = draft?.apiKey?.trim() || saved.apiKey;
  const baseUrl = (draft?.baseUrl?.trim() || (draft?.provider ? presetBase : saved.baseUrl) || presetBase).replace(/\/$/, "");
  const chatModel = draft?.chatModel?.trim() || (draft?.provider ? presetModel : saved.chatModel) || presetModel;

  if (!apiKey) {
    return { ok: false, error: "Sohbet testi için bir API anahtarı girin veya önce kaydedin." };
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
      message: `Sohbet bağlantısı başarılı (${provider} / ${chatModel}) — yanıt: ${out.slice(0, 40)}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Sohbet bağlantısı başarısız (${provider} / ${chatModel}): ${err instanceof Error ? err.message.slice(0, 180) : String(err)}`,
    };
  }
}

export async function testEmbeddingConnectionAction(draft?: {
  separateEmbedding?: boolean;
  provider?: AiProviderKind;
  apiKey?: string;
  baseUrl?: string;
  embeddingModel?: string;
}): Promise<AiActionResult> {
  const me = await requireAdmin("integrations.ai.testEmbedding");
  const saved = await resolveSiteAiConfig(me.siteId);
  const provider: AiProviderKind =
    draft?.provider && PROVIDERS.includes(draft.provider) ? draft.provider : saved.embeddingProvider;
  const presetBase = BASE_PRESETS[provider] ?? BASE_PRESETS.gemini;
  const presetModel = EMBED_PRESETS[provider] ?? EMBED_PRESETS.gemini;

  const apiKey =
    draft?.apiKey?.trim() ||
    (draft?.separateEmbedding ? saved.embeddingApiKey : saved.apiKey) ||
    saved.embeddingApiKey;
  const baseUrl = (draft?.baseUrl?.trim() || (draft?.provider ? presetBase : saved.embeddingBaseUrl) || presetBase).replace(/\/$/, "");
  const model = draft?.embeddingModel?.trim() || (draft?.provider ? presetModel : saved.embeddingModel) || presetModel;

  if (!apiKey) {
    return { ok: false, error: "Embedding testi için bir API anahtarı girin veya önce kaydedin." };
  }
  try {
    const emb = createOpenAiProvider({ apiKey, baseUrl, model });
    const vectors = await emb.embed(["NexPress RAG anlamsal arama testi"]);
    const dims = vectors[0]?.length ?? 0;
    return {
      ok: true,
      message: `Embedding bağlantısı başarılı (${provider} / ${model}) — ${dims} boyutlu vektör doğrulandı.`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Embedding bağlantısı başarısız (${provider} / ${model}): ${err instanceof Error ? err.message.slice(0, 180) : String(err)}`,
    };
  }
}
