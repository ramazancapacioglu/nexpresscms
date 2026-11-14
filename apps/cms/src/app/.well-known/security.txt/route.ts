import { NextResponse, type NextRequest } from "next/server";
import { buildSecurityTxt, resolveSiteSettings } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";

/**
 * RFC 9116 güvenlik iletişim belgesi. `SECURITY_CONTACT` yoksa sitenin iletişim e-postası kullanılır.
 * İkisi de yoksa 404: uydurma adres yayınlanmaz.
 */
export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const contact = process.env.SECURITY_CONTACT?.trim() || resolveSiteSettings(site?.settings).general.contactEmail;
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const body = buildSecurityTxt({
    contact,
    canonical: `${origin}/.well-known/security.txt`,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
  if (!body) return new NextResponse("Not found\n", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
