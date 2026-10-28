import "server-only";
import { resolveSiteSettings } from "@nexpress/core";
import { splitIntoFiles } from "@nexpress/seo-core";
import { getPublicSite, listSitemapEntries } from "./public-data";

export const SITEMAP_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

export function sitemapBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Site haritası dosyalarının ortak kaynağı: indeks ve parça rotaları aynı bölmeyi kullanır. */
export async function loadSitemap(siteId: string) {
  const [site, entries] = await Promise.all([getPublicSite(siteId), listSitemapEntries(siteId)]);
  const settings = resolveSiteSettings(site?.settings);
  return {
    entries,
    files: splitIntoFiles(entries, settings.seo.sitemapTypes),
    defaultLocale: site?.defaultLocale ?? "tr",
  };
}
