import "server-only";
import { createChatClient, createRateLimiter, groundedAnswerRequest, parseGroundedAnswer, synthesizeSearchAnswer, type DirectAnswerSource, type SynthesizedSearchAnswer } from "@nexpress/core";
import { resolveSiteAiConfig } from "./ai-config";

/** Site başına saatte 20 model çağrısı. Dolunca özete düşülür; ziyaretçi hata görmez. */
const groundedLimit = createRateLimiter(20, 60 * 60 * 1000);

/**
 * Site içi yanıt. Siteye özel şifreli AI anahtarı veya `OPENAI_API_KEY` varsa model yalnızca bulunan sayfalardan yazar.
 * Anahtar yoksa, süre dolarsa veya çıktı kaynaklara bağlanamazsa mevcut özete düşer.
 * Ziyaretçiye betik eklemez.
 */
export async function answerFromSite(siteId: string, query: string, docs: DirectAnswerSource[]): Promise<SynthesizedSearchAnswer | null> {
  const fallback = synthesizeSearchAnswer(docs, query);
  const ai = await resolveSiteAiConfig(siteId);
  const request = groundedAnswerRequest(query, docs);
  if (!ai.apiKey || !request || !groundedLimit.take(siteId)) return fallback;
  try {
    const client = createChatClient({
      apiKey: ai.apiKey,
      baseUrl: ai.baseUrl,
      model: ai.chatModel,
      timeoutMs: 4_000,
      maxRetries: 0,
    });
    const raw = await client.completeJson({ system: request.system, user: request.user, temperature: 0.1, maxTokens: 280 });
    return parseGroundedAnswer(raw, docs) ?? fallback;
  } catch {
    return fallback;
  }
}
