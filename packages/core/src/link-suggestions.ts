import type { BlockNode } from "./types";

/**
 * Semantik iç bağlantı önerisi (saf mantık): editördeki metinde başka sayfaların başlığı/anahtar sözcüğü geçiyorsa
 * "şu ifadeyi şu sayfaya bağlayın" der. Türkçe çekim eklerini (`e-Fatura'yı`, `programını`) tanır, zaten bağlı ifadeyi ve
 * bağlantılı sayfayı önermez, çakışan önerileri tekilleştirir.
 */
export interface LinkCandidate {
  id: string;
  title: string;
  href: string;
  /** Ek hedef ifadeler (odak anahtar kelime gibi) */
  keywords?: readonly string[];
  /** 1–10 önem puanı: eşit eşleşmelerde öne çıkarır */
  importance?: number;
}

export interface LinkSuggestion {
  candidateId: string;
  title: string;
  href: string;
  /** Metinde geçen ifade (ek dahil, özgün yazımıyla) */
  matchedText: string;
  start: number;
  end: number;
  snippet: string;
  score: number;
}

const MAP: Record<string, string> = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u", é: "e" };

/** Türkçe duyarsız karşılaştırma için katlama: küçük harf + aksan düşürme. Uzunluk korunur (indeksler özgün metne uyar). */
export function foldStable(value: string): string {
  return value.toLocaleLowerCase("tr").replace(/[ışğüöçâîûé]/g, (c) => MAP[c] ?? c);
}

const GENERIC = new Set(["akinsoft", "program", "programi", "yazilim", "yazilimi", "yonetimi", "yonetim", "nedir", "nasil", "icin", "ile", "ve", "bir", "hakkinda", "cozumleri", "cozumu", "rehberi", "kilavuz", "ana", "bayi", "izmir"]);
const SEPARATORS = /\s[|–—:]\s|\s-\s/;

function wordsOf(value: string): string[] {
  return foldStable(value).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Bir hedef için aranacak ifadeler: tam başlık, ayırıcıdan önceki bölüm, baştaki marka ve sondaki genel sözcükler atılmış kısa biçim, ek anahtar sözcükler. */
export function phrasesFor(candidate: LinkCandidate): string[] {
  const raw = [candidate.title, candidate.title.split(SEPARATORS)[0] ?? "", ...(candidate.keywords ?? [])].map((p) => p.trim()).filter(Boolean);
  const out = new Set<string>();
  for (const base of raw) {
    out.add(base);
    const tokens = base.split(/\s+/);
    let head = 0;
    let tail = tokens.length;
    while (head < tail - 1 && GENERIC.has(foldStable(tokens[head]!))) head += 1;
    while (tail - 1 > head && GENERIC.has(foldStable(tokens[tail - 1]!))) tail -= 1;
    out.add(tokens.slice(head, tail).join(" "));
  }
  return [...out].filter((phrase) => {
    const words = wordsOf(phrase);
    const meaningful = words.filter((w) => !GENERIC.has(w));
    return meaningful.length > 0 && phrase.length >= 5 && (words.length >= 2 || phrase.length >= 9);
  });
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bağlantı, görsel, kod ve etiket gibi bağlanamayacak bölgeleri aynı uzunlukta boşlukla örter. */
function mask(text: string): string {
  return text
    .replace(/!?\[[^\]\n]*\]\([^)\n]*\)/g, (m) => " ".repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length))
    .replace(/<[^>\n]+>/g, (m) => " ".repeat(m.length))
    .replace(/https?:\/\/\S+/g, (m) => " ".repeat(m.length))
    .replace(/^#{1,6}\s.*$/gm, (m) => " ".repeat(m.length));
}

/** Markdown içindeki bağlantı hedefleri (yol olarak): zaten bağlı sayfa tekrar önerilmez. */
export function linkedHrefsOf(markdown: string): Set<string> {
  const out = new Set<string>();
  for (const m of markdown.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = (m[1] ?? "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (href) out.add(href);
  }
  return out;
}

export function suggestLinksForText(text: string, candidates: readonly LinkCandidate[], options: { linkedHrefs?: ReadonlySet<string>; limit?: number } = {}): LinkSuggestion[] {
  const masked = foldStable(mask(text));
  const linked = options.linkedHrefs ?? new Set<string>();
  const found: LinkSuggestion[] = [];
  for (const candidate of candidates) {
    const path = candidate.href.replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (linked.has(path)) continue;
    let best: LinkSuggestion | null = null;
    for (const phrase of phrasesFor(candidate)) {
      const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(foldStable(phrase)).replace(/\s+/g, "\\s+")}[a-z]{0,5}(?![a-z0-9])`);
      const hit = pattern.exec(masked);
      if (!hit) continue;
      const words = wordsOf(phrase).length;
      const score = words * 3 + Math.min(phrase.length, 40) / 10 + (candidate.importance ?? 5) / 10;
      if (!best || score > best.score) {
        const start = hit.index;
        const end = start + hit[0].length;
        best = { candidateId: candidate.id, title: candidate.title, href: candidate.href, matchedText: text.slice(start, end), start, end, snippet: text.slice(Math.max(0, start - 40), Math.min(text.length, end + 40)).replace(/\s+/g, " ").trim(), score };
      }
    }
    if (best) found.push(best);
  }
  found.sort((a, b) => b.score - a.score);
  const accepted: LinkSuggestion[] = [];
  for (const item of found) {
    if (accepted.some((a) => item.start < a.end && a.start < item.end)) continue;
    accepted.push(item);
    if (accepted.length >= (options.limit ?? 8)) break;
  }
  return accepted;
}

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Zengin metin (`props.html`) içindeki ilk uygun geçişi bağlantıya çevirir (var olan bağlantı içine girmez). Bulamazsa `changed=false`. */
function linkInHtml(html: string, matchedText: string, href: string): string | null {
  const parts = html.split(/(<[^>]+>)/);
  let insideLink = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!;
    if (part.startsWith("<")) {
      if (/^<a[\s>]/i.test(part)) insideLink += 1;
      else if (/^<\/a\s*>/i.test(part)) insideLink = Math.max(0, insideLink - 1);
      continue;
    }
    if (insideLink > 0) continue;
    const at = part.indexOf(matchedText);
    if (at < 0) continue;
    parts[i] = `${part.slice(0, at)}<a href="${escapeAttr(href)}">${matchedText}</a>${part.slice(at + matchedText.length)}`;
    return parts.join("");
  }
  return null;
}

/** Bloklarda (iç içe dahil) ifadeyi ilk geçtiği zengin metin bloğunda bağlantıya çevirir. Yeni ağaç döner, girdi değişmez. */
export function applyLinkToBlocks(blocks: readonly BlockNode[], matchedText: string, href: string): { blocks: BlockNode[]; changed: boolean } {
  let changed = false;
  const walk = (nodes: readonly BlockNode[]): BlockNode[] =>
    nodes.map((node) => {
      if (changed) return node;
      let next = node;
      const html = node.props?.html;
      if (typeof html === "string") {
        const updated = linkInHtml(html, matchedText, href);
        if (updated) {
          changed = true;
          next = { ...node, props: { ...node.props, html: updated } };
        }
      }
      if (!changed && node.children?.length) {
        const children = walk(node.children);
        if (changed) next = { ...next, children };
      }
      return next;
    });
  const result = walk(blocks);
  return { blocks: changed ? result : [...blocks], changed };
}
