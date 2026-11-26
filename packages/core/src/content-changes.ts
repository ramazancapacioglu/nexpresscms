/**
 * "Gerçekten değişti mi?" kararı: `updatedAt` (şemada `dateModified`, site haritasında `lastmod`) yalnızca içerik
 * ya da onu etkileyen alanlar değiştiğinde ilerlemelidir. Toplu yeniden kayıt, içe aktarma ya da hiçbir şeyi değiştirmeyen
 * "Kaydet" tıklaması tüm site için aynı saniyeyi yazarsa arama motorları `lastmod` değerine güvenmeyi bırakır.
 */

/** Karşılaştırılan, düzenleme sonucu değişebilen alanlar. Hesaplanan sütunlar (skor, markdown önbelleği) dahil değildir. */
export interface EditorialSnapshot {
  status: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  tldr?: string | null;
  blocks: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
  schemaType?: string | null;
  schemaAttributes?: unknown;
  featuredImage?: string | null;
  authorName?: string | null;
}

/** Anahtar sırasından bağımsız, `undefined`/`null`/boş dizeyi eşit sayan kararlı serileştirme. */
function stable(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (v === undefined || v === null || v === "") return null;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(norm);
    if (typeof v === "object") {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([, x]) => x !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, x]) => [k, norm(x)])
      );
    }
    return v;
  };
  return JSON.stringify(norm(value));
}

function pick(s: EditorialSnapshot): unknown[] {
  return [
    s.status,
    s.slug,
    s.title,
    s.excerpt,
    s.tldr,
    s.blocks,
    s.metaTitle,
    s.metaDescription,
    s.canonicalUrl,
    Boolean(s.noIndex),
    s.schemaType,
    s.schemaAttributes,
    s.featuredImage,
    s.authorName,
  ];
}

/** `true`: iki anlık görüntü arasında ziyaretçinin ya da arama motorunun göreceği bir fark var. */
export function editorialChanged(previous: EditorialSnapshot, next: EditorialSnapshot): boolean {
  return stable(pick(previous)) !== stable(pick(next));
}
