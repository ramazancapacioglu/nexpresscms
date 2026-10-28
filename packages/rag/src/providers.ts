import { EMBEDDING_DIMENSIONS, LOCAL_EMBEDDING_MODEL, hashEmbed, normalizeVector } from "@nexpress/core";

/**
 * Gömme sağlayıcısı. Vektörler `model` kimliğiyle saklanır; arama yalnızca aynı modelin
 * vektörleriyle yapılır, modeller asla karıştırılmaz. Boyut şemada 1536'ya sabittir.
 */
export interface EmbeddingProvider {
  model: string;
  /** Anlamsal (sinir ağı) mı, yoksa yalnızca sözcüksel mi? Arayüzde dürüstçe gösterilir. */
  semantic: boolean;
  /** Bu modelde "aynı konuyu işliyor" kabul edilen kosinüs eşiği (kanibalizasyon uyarısı). */
  cannibalThreshold: number;
  embed(texts: string[]): Promise<Float32Array[]>;
}

export function createLocalProvider(): EmbeddingProvider {
  return {
    model: LOCAL_EMBEDDING_MODEL,
    semantic: false,
    cannibalThreshold: 0.5,
    async embed(texts) {
      return texts.map((t) => hashEmbed(t));
    },
  };
}

export interface OpenAiProviderConfig {
  apiKey: string;
  /** Varsayılan: https://api.openai.com/v1 (OpenAI uyumlu başka bir sunucu da olabilir) */
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const BATCH = 64;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createOpenAiProvider(config: OpenAiProviderConfig): EmbeddingProvider {
  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const modelName = config.model ?? "text-embedding-3-small";
  const doFetch = config.fetchImpl ?? fetch;

  async function embedBatch(input: string[]): Promise<Float32Array[]> {
    for (let attempt = 0; ; attempt++) {
      const res = await doFetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: modelName,
          input,
          encoding_format: "float",
          // text-embedding-3 modelleri boyut kısaltmayı destekler; şema 1536 bekler
          ...(modelName.startsWith("text-embedding-3") ? { dimensions: EMBEDDING_DIMENSIONS } : {}),
        }),
        signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
      if (!res.ok) throw new Error(`Gömme isteği başarısız (${res.status}): ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as { data?: Array<{ index: number; embedding: number[] }> };
      const rows = [...(json.data ?? [])].sort((a, b) => a.index - b.index);
      if (rows.length !== input.length) throw new Error("Gömme yanıtındaki vektör sayısı girdiyle eşleşmiyor.");
      return rows.map((r) => {
        if (r.embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(`Gömme boyutu ${r.embedding.length}, beklenen ${EMBEDDING_DIMENSIONS}.`);
        }
        return normalizeVector(Float32Array.from(r.embedding));
      });
    }
  }

  return {
    model: `openai:${modelName}:${EMBEDDING_DIMENSIONS}`,
    semantic: true,
    cannibalThreshold: 0.82,
    async embed(texts) {
      const out: Float32Array[] = [];
      for (let i = 0; i < texts.length; i += BATCH) out.push(...(await embedBatch(texts.slice(i, i + BATCH))));
      return out;
    },
  };
}

/** `EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `EMBEDDING_MODEL` okunur. */
export type ProviderEnv = Record<string, string | undefined>;

/** `EMBEDDING_PROVIDER=local|openai`; belirtilmezse OPENAI_API_KEY varsa openai, yoksa yerel. */
export function providerFromEnv(env: ProviderEnv = process.env): EmbeddingProvider {
  const wanted = env.EMBEDDING_PROVIDER?.trim().toLowerCase();
  const key = env.OPENAI_API_KEY?.trim();
  if ((wanted === "openai" || (!wanted && key)) && key) {
    return createOpenAiProvider({ apiKey: key, baseUrl: env.OPENAI_BASE_URL, model: env.EMBEDDING_MODEL });
  }
  if (wanted === "openai") throw new Error("EMBEDDING_PROVIDER=openai için OPENAI_API_KEY gerekli.");
  return createLocalProvider();
}
