import { NextResponse, type NextRequest } from "next/server";
import { isPrefixless } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

/** Ara katmanın dil kipini sorduğu iç uç: tek dilli sitede ziyaretçi adresleri dil ön eki taşımaz. */
export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const locale = site?.defaultLocale ?? "tr";
  return NextResponse.json({ single: isPrefixless(site, locale), locale }, { headers: { "Cache-Control": "no-store" } });
}
