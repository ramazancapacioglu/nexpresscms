import { NextResponse, type NextRequest } from "next/server";

/**
 * ?format=md ve Accept: text/markdown isteklerine veritabanındaki
 * önceden derlenmiş `markdownCache` sütununu 0ms CPU maliyetiyle döndürür.
 */
import { getPublicContentBySlug } from "@/lib/public-data";
import { trackBotVisit } from "@/lib/bot-log";

export async function GET(request: NextRequest) {
  await trackBotVisit("markdown");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const targetPath =
    request.headers.get("x-nexpress-target-path") ??
    request.nextUrl.searchParams.get("targetPath") ??
    "/tr";
  const segments = targetPath.split("/").filter(Boolean);
  const locale = segments[0] ?? "tr";
  const slug = segments[1] ?? "ana-sayfa";

  const content = await getPublicContentBySlug(siteId, slug, locale);

  if (!content) {
    return new NextResponse(`# 404 — İçerik Bulunamadı (${slug})\n`, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-NexPress-Site-Id": siteId,
        "X-NexPress-Engine": "Zero-CPU-MarkdownCache",
      },
    });
  }

  const headerMeta = [
    "---",
    `title: "${content.title.replace(/"/g, '\\"')}"`,
    `slug: "${content.slug}"`,
    `locale: "${content.locale}-${content.region}"`,
    `type: "${content.type}"`,
    `schema_type: "${content.schemaType}"`,
    `importance_score: ${content.importanceScore}`,
    `seo_score: ${content.seoScore}`,
    `site_id: "${content.siteId}"`,
    "---",
    "",
  ].join("\n");

  return new NextResponse(headerMeta + content.markdownCache, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-NexPress-Site-Id": siteId,
      "X-NexPress-Engine": "Zero-CPU-MarkdownCache",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
