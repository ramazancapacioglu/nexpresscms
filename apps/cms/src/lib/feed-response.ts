import { NextResponse, type NextRequest } from "next/server";
import { resolvePublishing } from "@nexpress/core";
import { buildAtomFeed, buildRssFeed, type FeedItem } from "@nexpress/seo-core";
import { listPublishedContents } from "@/lib/public-data";
import { requestLocale } from "@/lib/request-locale";

/** RSS/Atom yanıtı: yalnızca herkese açık, dizine açık blog yazıları. */
export async function feedResponse(request: NextRequest, format: "rss" | "atom"): Promise<NextResponse> {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const { site, locale } = await requestLocale(request, siteId);
  const contents = await listPublishedContents(siteId, locale);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const items: FeedItem[] = contents
    .filter((c) => c.type === "post" && !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public")
    .map((c) => ({
      title: c.title,
      url: `${base}/${locale}/${c.slug}`,
      summary: c.tldr || c.excerpt || c.metaDescription || "",
      publishedAt: new Date(c.publishedAt ?? c.createdAt),
      updatedAt: new Date(c.updatedAt),
      author: c.authorName || undefined,
      imageUrl: c.featuredImage ? new URL(c.featuredImage, base).toString() : null,
    }));
  const build = format === "rss" ? buildRssFeed : buildAtomFeed;
  const xml = build({
    siteName: site?.name ?? "NexPress CMS",
    description: site?.tagline || site?.name || "",
    homeUrl: `${base}/${locale}`,
    selfUrl: `${base}/${format === "rss" ? "feed.xml" : "atom.xml"}`,
    language: locale,
    items,
  });
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": `application/${format === "rss" ? "rss" : "atom"}+xml; charset=utf-8`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-NexPress-Site-Id": siteId,
    },
  });
}
