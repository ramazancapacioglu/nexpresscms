import { NextResponse, type NextRequest } from "next/server";
import {
  contentAccessCookieName,
  evaluateContentAccess,
  findTypeByArchiveSlug,
  memberMeetsTier,
  readPageOptions,
  resolveCampaignData,
  resolveSiteSettings,
  resolvePublishing,
  verifyContentAccessToken,
  verifySessionToken,
} from "@nexpress/core";
import { SESSION_COOKIE, getAuthSecret } from "@/lib/auth/config";
import { MEMBER_SESSION_COOKIE, getMembership, resolveMemberCookie } from "@/lib/members";

/**
 * ?format=md ve Accept: text/markdown isteklerine veritabanındaki
 * önceden derlenmiş `markdownCache` sütununu 0ms CPU maliyetiyle döndürür.
 */
import { getPublicContentBySlug, getPublicSite } from "@/lib/public-data";
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
  // `/{dil}/{slug}` ya da önekli `/{dil}/{önek}/{slug}` (önek, kayıtları önekli açık bir türün arşiv adresidir veya yerleşik `kampanya`)
  const prefix = segments.length >= 3 ? segments[1] : undefined;
  const slug = segments[prefix ? 2 : 1] ?? "ana-sayfa";
  const isCampaign = prefix === "kampanya";
  const prefixType = prefix && !isCampaign ? findTypeByArchiveSlug(resolveSiteSettings((await getPublicSite(siteId))?.settings).general.contentTypes, prefix) : undefined;
  const content = prefix && !isCampaign && !prefixType?.prefixed ? null : await getPublicContentBySlug(siteId, slug, locale, isCampaign ? "campaign" : (prefixType?.id ?? ""));

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
  const mdMember = await resolveMemberCookie(siteId, request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  const hasMemberSession = Boolean(mdMember) && memberMeetsTier((await getMembership(siteId)).tiers, mdMember?.tier, readPageOptions(content.schemaAttributes).memberTier);
  const access = evaluateContentAccess({
    status: content.status,
    visibility: pub.visibility,
    accessPassword: pub.accessPassword,
    hasSession,
    hasMemberSession,
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

  const camp = content.type === "campaign" ? resolveCampaignData(content) : null;
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
    ...(camp
      ? [
          `campaign_status: "${camp.isExpired ? "expired" : "active"}"`,
          ...(camp.startDate ? [`valid_from: "${camp.startDate}"`] : []),
          ...(camp.endDate ? [`valid_through: "${camp.endDate}"`] : []),
          ...(camp.discount ? [`discount: "${camp.discount.replace(/"/g, '\\"')}"`] : []),
          ...(camp.targetAudience ? [`target_audience: "${camp.targetAudience.replace(/"/g, '\\"')}"`] : []),
        ]
      : []),
    "---",
    "",
    ...(camp
      ? [
          `> **Kampanya Durumu:** ${camp.isExpired ? "Süresi Doldu (Arşiv)" : "Aktif"} · **Geçerlilik:** ${camp.formattedValidity}${camp.discount ? ` · **İndirim:** ${camp.discount}` : ""}${camp.targetAudience ? ` · **Kimler Yararlanabilir:** ${camp.targetAudience}` : ""}`,
          ...(camp.isExpired
            ? [
                "",
                `> **Not:** Bu kampanya ${camp.endDate || camp.formattedValidity} tarihinde sona ermiştir. Aşağıdaki içerik yalnızca tarihsel arşiv amaçlıdır; güncel kampanyalar için \`/kampanyalar\` sayfasını inceleyin.`,
              ]
            : []),
          "",
        ]
      : []),
  ].join("\n");

  return new NextResponse(headerMeta + content.markdownCache, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "X-NexPress-Site-Id": siteId,
      "X-NexPress-Engine": "Zero-CPU-MarkdownCache",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
