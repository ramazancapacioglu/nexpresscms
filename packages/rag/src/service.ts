import { bm25Rank, chunkMarkdown, embeddingInputOf, resolvePublishing, rrfFuse, type SearchDoc } from "@nexpress/core";
import { getChunkRepository, getScopedRepository, type ChunkHit, type SimilarContent } from "@nexpress/database";
import type { ContentType } from "@nexpress/core";
import type { EmbeddingProvider } from "./providers";

export type IndexResult =
  | { status: "indexed"; chunks: number }
  | { status: "unchanged"; chunks: number }
  | { status: "skipped"; reason: "not_found" | "not_published" | "empty" };

/**
 * İçeriği parçalar, gömer ve değiştirir. Parça özetleri ve model aynıysa hiç gömme çağrısı yapmaz.
 * Yalnızca yayınlanmış içerik dizinlenir; yayından kalkanlar aramada zaten süzülür.
 */
export async function indexContent(siteId: string, contentId: string, locale: string, provider: EmbeddingProvider): Promise<IndexResult> {
  const content = await getScopedRepository(siteId).getContentById(contentId, locale);
  if (!content) return { status: "skipped", reason: "not_found" };
  if (content.status !== "published") return { status: "skipped", reason: "not_published" };

  const chunks = chunkMarkdown(content.markdownCache ?? "", { title: content.title, tldr: content.tldr });
  if (chunks.length === 0) return { status: "skipped", reason: "empty" };

  const repo = getChunkRepository(siteId);
  const state = await repo.getState(contentId, locale);
  const same =
    state.length === chunks.length &&
    state.every((s) => s.model === provider.model) &&
    chunks.every((c) => state.find((s) => s.index === c.index)?.hash === c.hash);
  if (same) return { status: "unchanged", chunks: chunks.length };

  const vectors = await provider.embed(chunks.map((c) => embeddingInputOf(c, content.title)));
  await repo.replaceForContent(
    contentId,
    locale,
    provider.model,
    chunks.map((c, i) => ({ index: c.index, headingPath: c.headingPath, text: c.text, hash: c.hash, wordCount: c.wordCount, embedding: vectors[i]! }))
  );
  return { status: "indexed", chunks: chunks.length };
}

export interface ReindexSummary {
  indexed: number;
  unchanged: number;
  skipped: number;
  failed: Array<{ contentId: string; error: string }>;
  chunks: number;
}

/** Sitenin yayınlanmış tüm içeriğini sırayla dizinler; hata tek içeriği düşürür, işlemi durdurmaz. */
export async function reindexSite(siteId: string, locale: string, provider: EmbeddingProvider): Promise<ReindexSummary> {
  const contents = await getScopedRepository(siteId).listContents({ locale, status: "published" });
  const summary: ReindexSummary = { indexed: 0, unchanged: 0, skipped: 0, failed: [], chunks: 0 };
  for (const content of contents) {
    try {
      const result = await indexContent(siteId, content.contentId, locale, provider);
      if (result.status === "indexed") {
        summary.indexed++;
        summary.chunks += result.chunks;
      } else if (result.status === "unchanged") {
        summary.unchanged++;
        summary.chunks += result.chunks;
      } else summary.skipped++;
    } catch (error) {
      summary.failed.push({ contentId: content.contentId, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return summary;
}

export interface CorpusSearchOptions {
  limit?: number;
  locale?: string;
  types?: ContentType[];
  /** Vektör sonuçlarını BM25 anahtar kelime sıralamasıyla RRF ile birleştir (varsayılan açık). */
  hybrid?: boolean;
}

export interface CorpusSearchResult {
  /** Dizinde bu model için hiç parça yoksa false: çağıran anahtar kelime aramasına düşebilir. */
  indexed: boolean;
  model: string;
  semantic: boolean;
  passages: ChunkHit[];
  /** Aynı içeriğin parçaları birleştirilmiş, en iyi eşleşmeye göre sıralı içerik listesi */
  contents: Array<{ contentId: string; title: string; slug: string; type: ContentType; similarity: number; fusedScore?: number }>;
  /** Sıralamada kullanılan kaynaklar: yalnızca vektör veya vektör + anahtar kelime */
  ranking: "vector" | "hybrid";
}

const queryCache = new Map<string, Float32Array>();

async function embedQuery(provider: EmbeddingProvider, query: string): Promise<Float32Array> {
  const key = `${provider.model}|${query}`;
  const hit = queryCache.get(key);
  if (hit) return hit;
  const [vec] = await provider.embed([query]);
  if (queryCache.size >= 200) queryCache.delete(queryCache.keys().next().value as string);
  queryCache.set(key, vec!);
  return vec!;
}

export async function searchCorpus(siteId: string, query: string, provider: EmbeddingProvider, options: CorpusSearchOptions = {}): Promise<CorpusSearchResult> {
  const repo = getChunkRepository(siteId);
  const base = { model: provider.model, semantic: provider.semantic };
  const stats = await repo.stats();
  if (!stats.models.some((m) => m.model === provider.model && m.chunks > 0)) {
    return { indexed: false, ...base, passages: [], contents: [], ranking: "vector" };
  }
  const limit = options.limit ?? 5;
  const passages = await repo.search(await embedQuery(provider, query), provider.model, { limit: limit * 3, locale: options.locale, types: options.types });
  const best = new Map<string, CorpusSearchResult["contents"][number]>();
  for (const p of passages) {
    const cur = best.get(p.contentId);
    if (!cur || p.similarity > cur.similarity) best.set(p.contentId, { contentId: p.contentId, title: p.title, slug: p.slug, type: p.type, similarity: p.similarity });
  }
  const vectorContents = [...best.values()].sort((a, b) => b.similarity - a.similarity);
  let contents: CorpusSearchResult["contents"] = vectorContents.slice(0, limit);
  let ranking: CorpusSearchResult["ranking"] = "vector";
  if (options.hybrid !== false) {
    const corpus = await keywordCorpus(siteId, options.locale ?? "tr", options.types);
    const keyword = bm25Rank(corpus.docs, query, limit * 3);
    if (keyword.length > 0) {
      const byId = new Map(vectorContents.map((c) => [c.contentId, c]));
      const fused = rrfFuse([vectorContents.map((c) => ({ id: c.contentId })), keyword], limit);
      contents = fused.flatMap((f) => {
        const known = byId.get(f.id) ?? corpus.meta.get(f.id);
        return known ? [{ ...known, similarity: byId.get(f.id)?.similarity ?? 0, fusedScore: f.score }] : [];
      });
      ranking = "hybrid";
    }
  }
  return { indexed: true, ...base, passages: passages.slice(0, limit), contents, ranking };
}

interface KeywordCorpus {
  docs: SearchDoc[];
  meta: Map<string, { contentId: string; title: string; slug: string; type: ContentType; similarity: number }>;
}

/** Yayındaki içeriklerin düz metni (BM25 için); önbellek yok (yayından kaldırılan/noindex içerik anında düşmeli). */
async function keywordCorpus(siteId: string, locale: string, types?: ContentType[]): Promise<KeywordCorpus> {
  const rows = await getScopedRepository(siteId).listContents({ locale, status: "published" });
  const wanted = rows.filter(
    (c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public" && (!types?.length || types.includes(c.type as ContentType))
  );
  return {
    docs: wanted.map((c) => ({ id: c.contentId, title: c.title, body: c.markdownCache })),
    meta: new Map(wanted.map((c) => [c.contentId, { contentId: c.contentId, title: c.title, slug: c.slug, type: c.type as ContentType, similarity: 0 }])),
  };
}

export interface SimilarityReport {
  indexed: boolean;
  semantic: boolean;
  threshold: number;
  similar: Array<SimilarContent & { cannibalizing: boolean }>;
}

/** Kanibalizasyon / iç bağlantı raporu; yalnızca kayıtlı vektörleri kullanır. */
export async function similarityReport(siteId: string, contentId: string, locale: string, provider: EmbeddingProvider, limit = 5): Promise<SimilarityReport> {
  const repo = getChunkRepository(siteId);
  const own = await repo.getState(contentId, locale);
  const base = { semantic: provider.semantic, threshold: provider.cannibalThreshold };
  if (!own.some((s) => s.model === provider.model)) return { indexed: false, ...base, similar: [] };
  const similar = await repo.similarContents(contentId, locale, provider.model, limit);
  return { indexed: true, ...base, similar: similar.map((s) => ({ ...s, cannibalizing: s.similarity >= provider.cannibalThreshold })) };
}
