import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost, safeMemberNext } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE, verifyMemberLinkToken } from "@nexpress/core/member-token";
import { getMemberRepository } from "@nexpress/database";
import { getAuthSecret } from "@/lib/auth/config";
import { siteLocaleBase } from "@/lib/locale-url";
import { memberCookieOptions, newSessionToken, sameOriginPost } from "@/lib/members";

export const runtime = "nodejs";

/**
 * Giriş bağlantısını tüketir. Bağlantı sayfası GET'te hiçbir şey yapmaz (e-posta tarayıcıları bağlantıyı önceden açabilir);
 * tüketme yalnızca bu POST'tadır. Tek kullanım veritabanında koşullu güncellemeyle sağlanır; oturum çerezi HttpOnly'dir.
 */
export async function POST(request: NextRequest) {
  if (!sameOriginPost(request)) return new NextResponse("Geçersiz köken.", { status: 403 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const locale = String(form.get("locale") ?? "tr").trim().slice(0, 12) || "tr";
  const lb = await siteLocaleBase(siteId, locale);
  const token = String(form.get("t") ?? "");
  const parsed = verifyMemberLinkToken(getAuthSecret(), siteId, token);
  const member = parsed ? await getMemberRepository(siteId).consumeLink(parsed.memberId, parsed.linkSeq) : null;
  if (!member) {
    const bad = new URL(`${lb}/uye/dogrula`, request.url);
    bad.searchParams.set("bad", "1");
    return NextResponse.redirect(bad, 303);
  }
  const response = NextResponse.redirect(new URL(safeMemberNext(form.get("next"), `${lb}/uye`), request.url), 303);
  response.cookies.set(MEMBER_SESSION_COOKIE, newSessionToken(siteId, member), memberCookieOptions());
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
