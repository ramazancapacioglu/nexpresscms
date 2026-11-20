import "server-only";
import { contentPrefix, friendlyImagePath, isPrefixless, resolveSiteSettings, sitemapArchiveTypes, termSlug } from "@nexpress/core";
import { splitIntoFiles, type SitemapEntry } from "@nexpress/seo-core";
import { getScopedRepository } from "@nexpress/database";
import { getDynamicCandidates } from "./dynamic-content";
import { getPublicMediaMeta, getPublicSite, listSitemapEntries } from "./public-data";

export function sitemapBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Site haritası dosyalarının ortak kaynağı: indeks ve parça rotaları aynı bölmeyi kullanır. */
export async function loadSitemap(siteId: string) {
  const [site, contentEntries] = await Promise.all([getPublicSite(siteId), listSitemapEntries(siteId)]);
  const settings = resolveSiteSettings(site?.settings);
  if (settings.seo.searchIndexing === false) {
    return { entries: [], files: [], defaultLocale: site?.defaultLocale ?? "tr", prefixless: isPrefixless(site, site?.defaultLocale ?? "tr") };
  }
  const archives = await archiveEntries(siteId, site?.defaultLocale ?? "tr");
  // Önekli özel türlerin kayıtları `/{önek}/{slug}` adresiyle haritaya girer (öneksiz adres yönlendirdiği için listelenmez)
  const types = settings.general.contentTypes ?? [];
  // Kampanya yerleşik türdür: adresi `/kampanya/{slug}` (öneksiz adres oraya yönlendirir)
  const prefixOf = (type: string) => contentPrefix(types, type) ?? (type === "campaign" ? "kampanya" : null);
  // Görsel adresleri anlamlı dosya adı taşır (`/media/<kimlik>/<ad>.webp`): görsel aramasında dosya adı sinyal olur
  const media = await getPublicMediaMeta(siteId);
  const named = (e: SitemapEntry): SitemapEntry =>
    e.images?.length
      ? { ...e, images: e.images.map((img) => { const id = /^\/media\/(med_[A-Za-z0-9_-]+)\/1280\.webp$/.exec(img.loc)?.[1]; return id ? { ...img, loc: friendlyImagePath(id, media[id]?.filename) } : img; }) }
      : e;
  const entries = [...contentEntries.map((e) => named(prefixOf(e.type) ? { ...e, pathPrefix: prefixOf(e.type) as string } : e)), ...archives];
  return {
    entries,
    files: splitIntoFiles(entries, [...settings.seo.sitemapTypes, ...(settings.general.contentTypes ?? []).filter((t) => t.inSitemap).map((t) => t.id), ...sitemapArchiveTypes(settings.seo)]),
    defaultLocale: site?.defaultLocale ?? "tr",
    prefixless: isPrefixless(site, site?.defaultLocale ?? "tr"),
  };
}

/**
 * Kategori/etiket arşivleri (`/{dil}/kategori/{slug}`, `/{dil}/etiket/{slug}`): yalnızca en az bir herkese açık yayını olanlar
 * (boş arşiv `noindex` olduğundan haritaya girmez). Yalnızca varsayılan dil.
 */
async function archiveEntries(siteId: string, locale: string): Promise<SitemapEntry[]> {
  const site = await getPublicSite(siteId);
  const seo = resolveSiteSettings(site?.settings).seo;
  const [terms, candidates] = await Promise.all([getScopedRepository(siteId).listTaxonomies(), getDynamicCandidates(siteId, locale)]);
  const out: SitemapEntry[] = [];
  for (const t of terms) {
    if (t.taxonomyType !== "category" && t.taxonomyType !== "tag") continue;
    if (t.taxonomyType === "category" && seo.sitemapIncludeCategories === false) continue;
    if (t.taxonomyType === "tag" && (seo.sitemapIncludeTags === false || seo.noIndexTagArchives === true)) continue;
    const key = t.taxonomyType === "category" ? "categories" : "tags";
    const items = candidates.filter((c) => (c.kind === "posts" || c.kind === "pages") && c[key].some((x) => termSlug(x) === termSlug(t.slug) || termSlug(x) === termSlug(t.name)));
    if (items.length === 0) continue;
    const latest = items.reduce((a, c) => (c.date && c.date > a ? c.date : a), "");
    out.push({ contentId: `archive:${t.taxonomyType}:${t.slug}`, type: t.taxonomyType === "category" ? "kategori" : "etiket", locale, region: "", slug: t.slug, pathPrefix: t.taxonomyType === "category" ? "kategori" : "etiket", updatedAt: latest ? new Date(latest) : new Date(0) });
  }
  // Özel tür arşivleri (`/{arşiv-adresi}`): açık ve haritaya girmesi istenen, en az bir yayını olan türler
  const types = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
  for (const def of types) {
    if (!def.archive || !def.archiveSlug || !def.inSitemap) continue;
    const items = candidates.filter((c) => c.kind === `type:${def.id}`);
    if (items.length === 0) continue;
    const latest = items.reduce((a, c) => (c.date && c.date > a ? c.date : a), "");
    out.push({ contentId: `archive:type:${def.id}`, type: "archive", locale, region: "", slug: def.archiveSlug, updatedAt: latest ? new Date(latest) : new Date(0) });
  }
  return out;
}
