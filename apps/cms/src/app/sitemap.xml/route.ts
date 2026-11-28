import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteSettings } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";
import { buildSitemapIndex, buildSitemapIndexPage } from "@nexpress/seo-core";
import { loadSitemap, sitemapBaseUrl } from "@/lib/sitemap-source";
import { sitemapHttpResponse, sitemapWantsHtmlFrom } from "@/lib/sitemap-response";
import { trackBotVisit } from "@/lib/bot-log";

/** Site haritası indeksi; adresler `/sitemaps/{tür}-{sayfa}.xml` dosyalarındadır. */
export async function GET(request: NextRequest) {
  await trackBotVisit("sitemap");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  if (resolveSiteSettings(site?.settings).general.maintenanceEnabled) {
    return new NextResponse("Bakım", { status: 503, headers: { "Retry-After": "3600", "X-Robots-Tag": "noindex" } });
  }
  const { files } = await loadSitemap(siteId);
  const base = sitemapBaseUrl(site);
  const html = sitemapWantsHtmlFrom(request);
  return sitemapHttpResponse(html ? buildSitemapIndexPage(base, files) : buildSitemapIndex(base, files), html, siteId);
}
