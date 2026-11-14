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

const GROUNDED_SYSTEM = [
  "Yalnızca verilen site sayfalarındaki bilgiyle yanıt ver.",
  "Sayfada olmayan olgu, fiyat, tarih veya ad uydurma.",
  "Her cümlenin sonuna kullandığın kaynak numarasını [1] biçiminde yaz.",
  "Kaynaklar yanıtı taşımıyorsa summary boş dizi olsun.",
  "JSON: {\"summary\":\"...\",\"used\":[1]}",
].join(" ");

/** Modele gidecek güvenli istek. Kaynak gövdesi kısaltılır; anahtar veya gizli metin eklenmez. */
export function groundedAnswerRequest(query: string, sources: DirectAnswerSource[]): { system: string; user: string } | null {
  const q = query.trim().slice(0, 120);
  const picked = sources.slice(0, 4).filter((doc) => doc.title.trim() && (doc.body.trim() || doc.tldr?.trim()));
  if (!q || picked.length === 0) return null;
  const blocks = picked.map((doc, index) => {
    const text = (doc.tldr?.trim() || doc.body).replace(/\s+/g, " ").trim().slice(0, 900);
    return `[${index + 1}] ${doc.title.trim().slice(0, 140)}\n${text}`;
  });
  return { system: GROUNDED_SYSTEM, user: `Soru: ${q}\n\nSayfalar:\n${blocks.join("\n\n")}` };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Model JSON'unu kaynak listesine bağlar. Var olmayan kaynak numarası ve boş yanıt elenir.
 * Geçersiz çıktı `null` döner; çağıran özete düşer.
 */
export function parseGroundedAnswer(raw: string, sources: DirectAnswerSource[]): SynthesizedSearchAnswer | null {
  let parsed: { summary?: unknown; used?: unknown };
  try {
    parsed = JSON.parse(raw) as { summary?: unknown; used?: unknown };
  } catch {
    return null;
  }
  const summary = typeof parsed.summary === "string" ? stripTags(parsed.summary).slice(0, 600) : "";
  if (!summary) return null;
  const allowed = new Set<number>();
  if (Array.isArray(parsed.used)) {
    for (const item of parsed.used) {
      const n = typeof item === "number" ? item : Number(item);
      if (Number.isInteger(n) && n >= 1 && n <= Math.min(sources.length, 4)) allowed.add(n);
    }
  }
  for (const match of summary.matchAll(/\[(\d+)\]/g)) {
    const n = Number(match[1]);
    if (n < 1 || n > Math.min(sources.length, 4)) return null;
    allowed.add(n);
  }
  if (allowed.size === 0) return null;
  const citations = [...allowed]
    .sort((a, b) => a - b)
    .map((index) => {
      const doc = sources[index - 1];
      return doc ? { index, title: doc.title.trim().slice(0, 140), slug: doc.slug } : null;
    })
    .filter((item): item is { index: number; title: string; slug: string } => Boolean(item?.title && item.slug));
  if (citations.length === 0) return null;
  return { summary, citations };
}
