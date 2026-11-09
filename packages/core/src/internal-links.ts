import { extractLinks } from "./link-audit";
import { foldTr } from "./search";

/**
 * Vektörsüz İç Bağlantı Önericisi (Başlık ve Odak Anahtar Kelime / Varlık Eşleşmesi).
 * Yayındaki içeriklerin düz Markdown gövdelerini tarar; başka bir yayının başlığı veya
 * odak anahtar kelimesi metinde geçiyor ancak o sayfaya henüz bağlantı verilmemişse öneri üretir.
 */
export interface InternalLinkCandidateDoc {
  id: string;
  title: string;
  slug: string;
  locale: string;
  markdown: string;
  focusKeyword?: string;
}

export interface InternalLinkSuggestion {
  fromId: string;
  fromTitle: string;
  fromSlug: string;
  toId: string;
  toTitle: string;
  toSlug: string;
  matchedPhrase: string;
  matchKind: "title" | "focus_keyword";
}

function normalizePhrase(raw: string): string {
  return foldTr(raw).replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

export function suggestInternalLinks(
  docs: InternalLinkCandidateDoc[],
  options: { maxSuggestions?: number; maxPerSource?: number } = {}
): InternalLinkSuggestion[] {
  const maxSuggestions = options.maxSuggestions ?? 25;
  const maxPerSource = options.maxPerSource ?? 3;
  const suggestions: InternalLinkSuggestion[] = [];

  // Hedef adayları: en az 4 karakterlik anlamlı başlık veya odak anahtar kelime
  const targets = docs
    .filter((d) => d.slug !== "ana-sayfa")
    .map((d) => ({
      doc: d,
      normTitle: normalizePhrase(d.title),
      normKeyword: d.focusKeyword ? normalizePhrase(d.focusKeyword) : "",
    }))
    .filter((t) => t.normTitle.length >= 4 || t.normKeyword.length >= 4);

  for (const source of docs) {
    if (suggestions.length >= maxSuggestions) break;
    const existingLinks = new Set(
      extractLinks(source.markdown).map((u) => u.replace(/\/+$/, "").toLowerCase())
    );
    const normBody = ` ${normalizePhrase(source.markdown)} `;
    let sourceCount = 0;

    for (const target of targets) {
      if (sourceCount >= maxPerSource || suggestions.length >= maxSuggestions) break;
      if (target.doc.id === source.id || target.doc.locale !== source.locale) continue;

      const targetSlug = target.doc.slug.toLowerCase();
      // Zaten bağlantı verilmişse atla
      const alreadyLinked = [...existingLinks].some(
        (href) =>
          href === `/${targetSlug}` ||
          href === `/${source.locale}/${targetSlug}` ||
          href.endsWith(`/${targetSlug}`)
      );
      if (alreadyLinked) continue;

      if (target.normTitle.length >= 5 && normBody.includes(` ${target.normTitle} `)) {
        suggestions.push({
          fromId: source.id,
          fromTitle: source.title,
          fromSlug: source.slug,
          toId: target.doc.id,
          toTitle: target.doc.title,
          toSlug: target.doc.slug,
          matchedPhrase: target.doc.title.trim(),
          matchKind: "title",
        });
        sourceCount++;
        continue;
      }

      if (target.normKeyword.length >= 4 && normBody.includes(` ${target.normKeyword} `)) {
        suggestions.push({
          fromId: source.id,
          fromTitle: source.title,
          fromSlug: source.slug,
          toId: target.doc.id,
          toTitle: target.doc.title,
          toSlug: target.doc.slug,
          matchedPhrase: target.doc.focusKeyword!.trim(),
          matchKind: "focus_keyword",
        });
        sourceCount++;
      }
    }
  }

  return suggestions;
}

