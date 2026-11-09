import { NextResponse, type NextRequest } from "next/server";
import {
  contentAccessCookieName,
  evaluateContentAccess,
  resolvePublishing,
  verifyContentAccessToken,
  verifySessionToken,
} from "@nexpress/core";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";

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

  const pub = resolvePublishing(content.schemaAttributes);
  const secret = getAuthSecret();
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, secret);
  const hasSession = Boolean(session && session.siteId === siteId);
  const hasValidPasswordToken = pub.accessPassword
    ? await verifyContentAccessToken(
        secret,
        siteId,
        content.id,
        pub.accessPassword,
        request.cookies.get(contentAccessCookieName(content.id))?.value
      )
    : false;
  const access = evaluateContentAccess({
    status: content.status,
    visibility: pub.visibility,
    accessPassword: pub.accessPassword,
    hasSession,
    hasValidPasswordToken,
  });

  if (!access.allowed) {
    return new NextResponse(`# 403 — Kısıtlı İçerik (${slug})\n`, {
      status: 403,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-NexPress-Site-Id": siteId,
        "Cache-Control": "private, no-store",
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
