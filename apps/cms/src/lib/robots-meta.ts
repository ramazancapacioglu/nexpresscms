import type { Metadata } from "next";
import { truncateSmart } from "@nexpress/seo-core";

/**
 * Liste ve merkez sayfalarının (kategori, yazar, kampanyalar, sorular, tür arşivi) ortak meta sözleşmesi.
 * İçerik sayfalarıyla aynı robots yönergesi yayılır (`resolveSeoMeta`): büyük görsel önizlemesi ve sınırsız özet.
 */
export const INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 };
export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = { index: false, follow: true };

export const robotsMeta = (indexable: boolean): NonNullable<Metadata["robots"]> => (indexable ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS);

/** Arama sonucunda kesilmesin: kelime sınırında, en çok `max` karakter (varsayılan 160). */
export const metaDescription = (text: string, max = 160): string => truncateSmart(text, max);

/**
 * Çok kısa başlığa ("Makaleler") site adı eklenir; başlık zaten site adını taşıyorsa ya da ekleyince `max`'ı aşıyorsa olduğu gibi kalır.
 * Elle yazılmış uzun başlığa dokunulmaz.
 */
export function titleWithSite(title: string, siteName: string | null | undefined, opts: { min?: number; max?: number } = {}): string {
  const { min = 30, max = 65 } = opts;
  const t = title.trim();
  const site = (siteName ?? "").trim();
  if (!site || t.length >= min || t.toLocaleLowerCase("tr").includes(site.toLocaleLowerCase("tr"))) return t;
  const joined = `${t} | ${site}`;
  return joined.length <= max ? joined : t;
}
