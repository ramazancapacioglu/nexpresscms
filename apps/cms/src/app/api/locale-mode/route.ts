import { NextResponse, type NextRequest } from "next/server";
import { isPrefixless, resolveSiteSettings } from "@nexpress/core";
import { sanitizePermalinkStructure } from "@nexpress/core/permalinks";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

/** Ara katmanın dil kipini sorduğu iç uç: tek dilli sitede ziyaretçi adresleri dil ön eki taşımaz. */
export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const locale = site?.defaultLocale ?? "tr";
  const seo = resolveSiteSettings(site?.settings).seo;
  const index = seo.searchIndexing !== false;
  const permalink = sanitizePermalinkStructure(seo.permalinkStructure);
  return NextResponse.json({ single: isPrefixless(site, locale), locale, index, permalink }, { headers: { "Cache-Control": "no-store" } });
}
