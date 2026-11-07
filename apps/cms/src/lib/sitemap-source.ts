import "server-only";
import { isPrefixless, resolveSiteSettings, termSlug } from "@nexpress/core";
import { splitIntoFiles, type SitemapEntry } from "@nexpress/seo-core";
import { getScopedRepository } from "@nexpress/database";
import { getDynamicCandidates } from "./dynamic-content";
import { getPublicSite, listSitemapEntries } from "./public-data";

export const SITEMAP_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

export function sitemapBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Site haritası dosyalarının ortak kaynağı: indeks ve parça rotaları aynı bölmeyi kullanır. */
export async function loadSitemap(siteId: string) {
  const [site, contentEntries] = await Promise.all([getPublicSite(siteId), listSitemapEntries(siteId)]);
  const settings = resolveSiteSettings(site?.settings);
  const archives = await archiveEntries(siteId, site?.defaultLocale ?? "tr");
  const entries = [...contentEntries, ...archives];
  return {
    entries,
    files: splitIntoFiles(entries, [...settings.seo.sitemapTypes, "archive"]),
    defaultLocale: site?.defaultLocale ?? "tr",
    prefixless: isPrefixless(site, site?.defaultLocale ?? "tr"),
  };
}

/**
 * Kategori/etiket arşivleri (`/{dil}/kategori/{slug}`, `/{dil}/etiket/{slug}`): yalnızca en az bir herkese açık yayını olanlar
 * (boş arşiv `noindex` olduğundan haritaya girmez). Yalnızca varsayılan dil.
 */
async function archiveEntries(siteId: string, locale: string): Promise<SitemapEntry[]> {
  const [terms, candidates] = await Promise.all([getScopedRepository(siteId).listTaxonomies(), getDynamicCandidates(siteId, locale)]);
  const out: SitemapEntry[] = [];
  for (const t of terms) {
    if (t.taxonomyType !== "category" && t.taxonomyType !== "tag") continue;
    const key = t.taxonomyType === "category" ? "categories" : "tags";
    const items = candidates.filter((c) => (c.kind === "posts" || c.kind === "pages") && c[key].some((x) => termSlug(x) === termSlug(t.slug) || termSlug(x) === termSlug(t.name)));
    if (items.length === 0) continue;
    const latest = items.reduce((a, c) => (c.date && c.date > a ? c.date : a), "");
    out.push({ contentId: `archive:${t.taxonomyType}:${t.slug}`, type: "archive", locale, region: "", slug: t.slug, pathPrefix: t.taxonomyType === "category" ? "kategori" : "etiket", updatedAt: latest ? new Date(latest) : new Date(0) });
  }
  return out;
}
