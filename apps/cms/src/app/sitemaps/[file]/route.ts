import { NextResponse, type NextRequest } from "next/server";
import { buildUrlset, buildUrlsetPage, parseSitemapFileName } from "@nexpress/seo-core";
import { loadSitemap, sitemapBaseUrl } from "@/lib/sitemap-source";
import { sitemapHttpResponse, sitemapWantsHtmlFrom } from "@/lib/sitemap-response";
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

  const base = sitemapBaseUrl();
  const html = sitemapWantsHtmlFrom(request);
  const body = html ? buildUrlsetPage(base, file, prefixless) : buildUrlset(base, file, entries, defaultLocale, prefixless);
  return sitemapHttpResponse(body, html, siteId);
}
