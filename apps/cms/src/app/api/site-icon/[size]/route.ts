import { NextResponse } from "next/server";
import { SITE_ICON_SIZES, iconHeaders, renderSiteIcon, type SiteIconSize } from "@/lib/site-icon";

/** Manifest simgeleri: yalnızca 192 ve 512 (sınırlı küme; keyfi boyut üretilmez). */
export async function GET(request: Request, ctx: { params: Promise<{ size: string }> }) {
  const size = Number((await ctx.params).size);
  if (size !== 192 && size !== 512 && !SITE_ICON_SIZES.includes(size as SiteIconSize)) return new NextResponse(null, { status: 404 });
  const data = await renderSiteIcon(request.headers.get("x-nexpress-site-id") ?? "default", size as SiteIconSize);
  return data ? new NextResponse(new Uint8Array(data), { headers: iconHeaders }) : new NextResponse(null, { status: 404 });
}
