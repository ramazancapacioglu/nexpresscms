import { NextResponse, type NextRequest } from "next/server";
import { buildUrlset, parseSitemapFileName } from "@nexpress/seo-core";
import { SITEMAP_CACHE_CONTROL, loadSitemap, sitemapBaseUrl } from "@/lib/sitemap-source";
import { trackBotVisit } from "@/lib/bot-log";

const notFound = () =>
  new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  await trackBotVisit("sitemap");
  const parsed = parseSitemapFileName((await params).file);
  if (!parsed) return notFound();

  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const { files, entries, defaultLocale, prefixless } = await loadSitemap(siteId);
  const file = files.find((f) => f.type === parsed.type && f.page === parsed.page);
  if (!file) return notFound();

  return new NextResponse(buildUrlset(sitemapBaseUrl(), file, entries, defaultLocale, prefixless), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
      "X-NexPress-Site-Id": siteId,
    },
  });
}
