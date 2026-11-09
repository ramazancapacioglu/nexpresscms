/**
 * Anahtar kelime (BM25) ve sıralama birleştirme (RRF): saf mantık, veritabanına dokunmaz.
 * Türkçe için küçük harf + aksan katlama uygulanır ("Sıcak" ile "sicak" eşleşir).
 */
const FOLD: Record<string, string> = { ı: "i", İ: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u" };

export function foldTr(text: string): string {
  return text
    .replace(/[ıİşğüöçâîû]/g, (c) => FOLD[c] ?? c)
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİşğüöçâîû]/g, (c) => FOLD[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const STOP = new Set(["ve", "ile", "bir", "bu", "su", "o", "da", "de", "mi", "mu", "icin", "gibi", "ama", "veya", "the", "a", "an", "of", "and", "or", "to", "in"]);

export function searchTokens(text: string): string[] {
  return foldTr(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export interface SearchDoc {
  id: string;
  title: string;
  /** Düz metin gövde (ör. markdownCache) */
  body: string;
}

export interface RankedHit {
  id: string;
  score: number;
}

const TITLE_WEIGHT = 3;

/** BM25 (k1=1.5, b=0.75). Başlık terimleri 3 kat sayılır. Tüm terimleri içermeyen belgeler de puan alır (OR), ama daha düşük. */
export function bm25Rank(docs: SearchDoc[], query: string, limit = 20): RankedHit[] {
  const terms = [...new Set(searchTokens(query))];
  if (terms.length === 0 || docs.length === 0) return [];
  const tf = docs.map((d) => {
    const counts = new Map<string, number>();
    for (const t of searchTokens(d.body)) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const t of searchTokens(d.title)) counts.set(t, (counts.get(t) ?? 0) + TITLE_WEIGHT);
    let len = 0;
    for (const n of counts.values()) len += n;
    return { counts, len };
  });
  const avg = tf.reduce((s, d) => s + d.len, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const t of terms) df.set(t, tf.filter((d) => d.counts.has(t)).length);
  const k1 = 1.5;
  const b = 0.75;
  const hits: RankedHit[] = [];
  docs.forEach((d, i) => {
    const { counts, len } = tf[i]!;
    let score = 0;
    for (const t of terms) {
      const f = counts.get(t);
      if (!f) continue;
      const n = df.get(t)!;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * len) / avg)));
    }
    if (score > 0) hits.push({ id: d.id, score });
  });
  return hits.sort((a, b2) => b2.score - a.score).slice(0, limit);
}

/** Reciprocal Rank Fusion: sıralı listeleri puan ölçeğinden bağımsız birleştirir (k=60). */
export function rrfFuse(lists: Array<Array<{ id: string }>>, limit = 10, k = 60): RankedHit[] {
  const score = new Map<string, number>();
  for (const list of lists) list.forEach((hit, rank) => score.set(hit.id, (score.get(hit.id) ?? 0) + 1 / (k + rank + 1)));
  return [...score.entries()]
    .map(([id, s]) => ({ id, score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Sonuç özeti: gövdede ilk eşleşen terimin çevresinden en çok `radius*2` karakterlik düz kesit. */
export function makeSnippet(body: string, query: string, radius = 110): string {
  const clean = body.replace(/[#>*_`|\[\]]+/g, " ").replace(/\s+/g, " ").trim();
  const terms = searchTokens(query);
  const folded = foldTr(clean);
  let at = -1;
  for (const t of terms) {
    const i = folded.indexOf(t);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return clean.slice(0, radius * 2) + (clean.length > radius * 2 ? "…" : "");
  const start = Math.max(0, at - radius);
  const end = Math.min(clean.length, at + radius);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

export interface DirectAnswerSource {
  id: string;
  title: string;
  slug: string;
  tldr?: string | null;
  body: string;
}

export interface SynthesizedSearchAnswer {
  summary: string;
  citations: Array<{ index: number; title: string; slug: string }>;
}

/**
 * "Bu Siteye Sor" — en yüksek puanlı arama eşleşmelerinin TL;DR ve ilgili kesitlerinden
 * kaynak numaralı (`[1]`, `[2]`) doğrudan yanıt sentezler (0-KB RSC, harici LLM anahtarı gerektirmez).
 */
export function synthesizeSearchAnswer(
  topDocs: DirectAnswerSource[],
  query: string
): SynthesizedSearchAnswer | null {
  if (!query.trim() || topDocs.length === 0) return null;
  const picked = topDocs.slice(0, 3);
  const sentences: string[] = [];
  const citations: Array<{ index: number; title: string; slug: string }> = [];

  picked.forEach((doc, idx) => {
    const raw = (doc.tldr && doc.tldr.trim().length > 20 ? doc.tldr.trim() : makeSnippet(doc.body, query, 95)).trim();
    if (!raw) return;
    const refIndex = citations.length + 1;
    citations.push({ index: refIndex, title: doc.title, slug: doc.slug });
    sentences.push(`${raw} [${refIndex}]`);
  });

  if (sentences.length === 0) return null;
  return {
    summary: sentences.join(" "),
    citations,
  };
}
