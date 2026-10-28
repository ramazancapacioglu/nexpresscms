import { NextResponse, type NextRequest } from "next/server";
import { buildSitemapIndex } from "@nexpress/seo-core";
import { SITEMAP_CACHE_CONTROL, loadSitemap, sitemapBaseUrl } from "@/lib/sitemap-source";
import { trackBotVisit } from "@/lib/bot-log";

/** Site haritası indeksi; adresler `/sitemaps/{tür}-{sayfa}.xml` dosyalarındadır. */
export async function GET(request: NextRequest) {
  await trackBotVisit("sitemap");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const { files } = await loadSitemap(siteId);
  return new NextResponse(buildSitemapIndex(sitemapBaseUrl(), files), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
      "X-NexPress-Site-Id": siteId,
    },
  });
}
