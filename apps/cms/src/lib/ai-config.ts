import "server-only";
import { decryptSecret } from "@nexpress/core/secret-box";
import { resolveSiteSettings, type AiProviderKind } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { createOpenAiProvider, providerFromEnv, type EmbeddingProvider } from "@nexpress/rag";

export interface ResolvedAiConfig {
  source: "site" | "env" | "none";
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

const PRESETS: Record<AiProviderKind, { baseUrl: string; chatModel: string; embeddingModel: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    chatModel: "gemini-flash-latest",
    embeddingModel: "gemini-embedding-001",
  },
  custom: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  },
};

/**
 * Siteye özel şifreli AI ayarını (`sites.settings.ai`) çözer; yoksa `.env` (`OPENAI_API_KEY`) değerine düşer.
 * Anahtar yalnızca sunucuda çözülür, istemciye asla gönderilmez.
 */
export async function resolveSiteAiConfig(siteId: string): Promise<ResolvedAiConfig> {
  try {
    const site = await getScopedRepository(siteId).getSite();
    const ai = resolveSiteSettings(site?.settings).ai;
    if (ai.enabled && ai.apiKey) {
      const apiKey = decryptSecret(ai.apiKey).trim();
      if (apiKey) {
        const preset = PRESETS[ai.provider] ?? PRESETS.openai;
        return {
          source: "site",
          provider: ai.provider,
          apiKey,
          baseUrl: (ai.baseUrl || preset.baseUrl).replace(/\/$/, ""),
          chatModel: ai.chatModel || preset.chatModel,
          embeddingModel: ai.embeddingModel || preset.embeddingModel,
        };
      }
    }
  } catch {
    // Şifre çözülemezse ortam değişkenine düşülür
  }

  const envKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (envKey) {
    return {
      source: "env",
      provider: "openai",
      apiKey: envKey,
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || PRESETS.openai.baseUrl).replace(/\/$/, ""),
      chatModel: process.env.OPENAI_CHAT_MODEL?.trim() || PRESETS.openai.chatModel,
      embeddingModel: process.env.EMBEDDING_MODEL?.trim() || PRESETS.openai.embeddingModel,
    };
  }

  return {
    source: "none",
    provider: "openai",
    apiKey: "",
    baseUrl: PRESETS.openai.baseUrl,
    chatModel: PRESETS.openai.chatModel,
    embeddingModel: PRESETS.openai.embeddingModel,
  };
}

/** Siteye özel şifreli AI anahtarı varsa onunla, yoksa ortam/yerel sağlayıcıyla gömme motoru döndürür. */
export async function resolveSiteEmbeddingProvider(siteId: string): Promise<EmbeddingProvider> {
  const cfg = await resolveSiteAiConfig(siteId);
  if (cfg.source === "site" && cfg.apiKey) {
    return createOpenAiProvider({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.embeddingModel,
    });
  }
  return providerFromEnv();
}
