import "server-only";
import { getCmsMode, resolveSiteOrigin } from "@nexpress/core";
import { getPublicSite } from "./public-data";

export interface SiteOriginRecord {
  siteId?: string | null;
  domain?: string | null;
  subdomain?: string | null;
}

/**
 * Veritabanından okunan doğrulanmış kiracı kaydına göre mutlak yayın kökenini (`https://...`) döndürür.
 * Tüm ziyaretçi canonical, hreflang, JSON-LD, sitemap, RSS/Atom, llms.txt ve Markdown yanıtları bunu kullanır.
 */
export function siteOriginFor(site: SiteOriginRecord | null | undefined): string {
  return resolveSiteOrigin({
    siteId: site?.siteId,
    domain: site?.domain,
    subdomain: site?.subdomain,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    cmsMode: getCmsMode(),
  });
}

export async function resolvePublicSiteOrigin(siteId: string): Promise<string> {
  return siteOriginFor(await getPublicSite(siteId));
}
