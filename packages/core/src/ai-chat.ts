/** Minimal OpenAI uyumlu sohbet istemcisi (JSON çıktı modu, zaman aşımı, 429/5xx'te yeniden deneme). */
export interface ChatConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export interface ChatClient {
  model: string;
  /** Modelin döndürdüğü JSON metni (nesne) ya da hata fırlatır. */
  completeJson(input: { system: string; user: string; temperature?: number; maxTokens?: number }): Promise<string>;
  /** Görsel girdili (vision) JSON tamamlama: `imageDataUrl` bir `data:image/...;base64,` adresidir. */
  completeJsonWithImage(input: { system: string; user: string; imageDataUrl: string; temperature?: number; maxTokens?: number }): Promise<string>;
}

export class ChatError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export function createChatClient(config: ChatConfig): ChatClient {
  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = config.model || DEFAULT_CHAT_MODEL;
  const doFetch = config.fetchImpl ?? fetch;
  const retries = config.maxRetries ?? 2;

  async function send(messages: unknown[], temperature: number, maxTokens?: number): Promise<string> {
    let lastError: ChatError | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), config.timeoutMs ?? 30_000);
      try {
        const res = await doFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
          body: JSON.stringify({
            model,
            temperature,
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
            response_format: { type: "json_object" },
            messages,
          }),
          signal: ctl.signal,
        });
        if (res.status === 429 || res.status >= 500) {
          lastError = new ChatError(`OpenAI geçici hata (${res.status}).`, res.status);
          await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
          continue;
        }
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const msg = res.status === 401 ? "OpenAI anahtarı geçersiz." : `OpenAI isteği reddedildi (${res.status}). ${detail.slice(0, 120)}`;
          throw new ChatError(msg, res.status);
        }
        const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = body.choices?.[0]?.message?.content;
        if (!content) throw new ChatError("OpenAI boş yanıt döndürdü.");
        return content;
      } catch (error) {
        if (error instanceof ChatError) {
          if (error.status && error.status < 500 && error.status !== 429) throw error;
          lastError = error;
        } else {
          lastError = new ChatError((error as Error)?.name === "AbortError" ? "OpenAI zaman aşımı." : "OpenAI'ye ulaşılamadı.");
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new ChatError("OpenAI isteği başarısız.");
  }

  return {
    model,
    completeJson: ({ system, user, temperature = 0.4, maxTokens }) =>
      send([{ role: "system", content: system }, { role: "user", content: user }], temperature, maxTokens),
    completeJsonWithImage: ({ system, user, imageDataUrl, temperature = 0.3, maxTokens }) =>
      send(
        [
          { role: "system", content: system },
          { role: "user", content: [{ type: "text", text: user }, { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } }] },
        ],
        temperature,
        maxTokens,
      ),
  };
}
