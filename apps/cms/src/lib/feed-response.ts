import { NextResponse, type NextRequest } from "next/server";
import { resolvePublishing } from "@nexpress/core";
import { buildAtomFeed, buildRssFeed, type FeedItem } from "@nexpress/seo-core";
import { getPublicSite, listPublishedContents } from "@/lib/public-data";

/** RSS/Atom yanıtı: yalnızca herkese açık, dizine açık blog yazıları. */
export async function feedResponse(request: NextRequest, format: "rss" | "atom"): Promise<NextResponse> {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const [site, contents] = await Promise.all([getPublicSite(siteId), listPublishedContents(siteId, "tr")]);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const items: FeedItem[] = contents
    .filter((c) => c.type === "post" && !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public")
    .map((c) => ({
      title: c.title,
      url: `${base}/tr/${c.slug}`,
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
    homeUrl: `${base}/tr`,
    selfUrl: `${base}/${format === "rss" ? "feed.xml" : "atom.xml"}`,
    language: "tr",
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
