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
  deepChatModel: string;
  embeddingModel: string;
  separateEmbedding: boolean;
  embeddingProvider: AiProviderKind;
  embeddingApiKey: string;
  embeddingBaseUrl: string;
}

const PRESETS: Record<AiProviderKind, { baseUrl: string; chatModel: string; deepChatModel: string; embeddingModel: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4.1-mini",
    deepChatModel: "gpt-4.1",
    embeddingModel: "text-embedding-3-small",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    chatModel: "gemini-flash-latest",
    deepChatModel: "gemini-2.5-pro",
    embeddingModel: "gemini-embedding-001",
  },
  custom: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    deepChatModel: "gpt-4o",
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
    if (ai.enabled) {
      const apiKey = ai.apiKey ? decryptSecret(ai.apiKey).trim() : "";
      const embPreset = PRESETS[ai.embeddingProvider ?? "gemini"] ?? PRESETS.gemini;
      const separateEmbedding = Boolean(ai.separateEmbedding);
      const embeddingApiKey = separateEmbedding && ai.embeddingApiKey ? decryptSecret(ai.embeddingApiKey).trim() : "";
      const embeddingProvider: AiProviderKind = separateEmbedding ? (ai.embeddingProvider ?? "gemini") : ai.provider;
      const embeddingBaseUrl = (
        separateEmbedding
          ? ai.embeddingBaseUrl || embPreset.baseUrl
          : ai.baseUrl || (PRESETS[ai.provider] ?? PRESETS.openai).baseUrl
      ).replace(/\/$/, "");
      const embeddingModel =
        ai.embeddingModel || (separateEmbedding ? embPreset.embeddingModel : (PRESETS[ai.provider] ?? PRESETS.openai).embeddingModel);

      if (apiKey || embeddingApiKey) {
        const preset = PRESETS[ai.provider] ?? PRESETS.openai;
        return {
          source: "site",
          provider: ai.provider,
          apiKey,
          baseUrl: (ai.baseUrl || preset.baseUrl).replace(/\/$/, ""),
          chatModel: ai.chatModel || preset.chatModel,
          deepChatModel: ai.deepChatModel || ai.chatModel || preset.deepChatModel,
          embeddingModel,
          separateEmbedding,
          embeddingProvider,
          embeddingApiKey: separateEmbedding ? embeddingApiKey : apiKey,
          embeddingBaseUrl,
        };
      }
    }
  } catch {
    // Şifre çözülemezse ortam değişkenine düşülür
  }

  const envKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (envKey) {
    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || PRESETS.openai.baseUrl).replace(/\/$/, "");
    const chatModel = process.env.OPENAI_CHAT_MODEL?.trim() || PRESETS.openai.chatModel;
    return {
      source: "env",
      provider: "openai",
      apiKey: envKey,
      baseUrl,
      chatModel,
      deepChatModel: process.env.OPENAI_DEEP_MODEL?.trim() || chatModel,
      embeddingModel: process.env.EMBEDDING_MODEL?.trim() || PRESETS.openai.embeddingModel,
      separateEmbedding: false,
      embeddingProvider: "openai",
      embeddingApiKey: envKey,
      embeddingBaseUrl: baseUrl,
    };
  }

  return {
    source: "none",
    provider: "openai",
    apiKey: "",
    baseUrl: PRESETS.openai.baseUrl,
    chatModel: PRESETS.openai.chatModel,
    deepChatModel: PRESETS.openai.deepChatModel,
    embeddingModel: PRESETS.openai.embeddingModel,
    separateEmbedding: false,
    embeddingProvider: "gemini",
    embeddingApiKey: "",
    embeddingBaseUrl: PRESETS.gemini.baseUrl,
  };
}

/** Siteye özel şifreli embedding (ayrı veya ortak) anahtarı varsa onunla, yoksa ortam/yerel sağlayıcıyla gömme motoru döndürür. */
export async function resolveSiteEmbeddingProvider(siteId: string): Promise<EmbeddingProvider> {
  const cfg = await resolveSiteAiConfig(siteId);
  if (cfg.source === "site" && cfg.embeddingApiKey) {
    return createOpenAiProvider({
      apiKey: cfg.embeddingApiKey,
      baseUrl: cfg.embeddingBaseUrl,
      model: cfg.embeddingModel,
    });
  }
  return providerFromEnv();
}
