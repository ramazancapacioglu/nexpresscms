import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE } from "@nexpress/core/member-token";
import { getMemberRepository } from "@nexpress/database";
import { siteLocaleBase } from "@/lib/locale-url";
import { resolveMemberCookie, sameOriginPost } from "@/lib/members";

export const runtime = "nodejs";

/** Üye kendi adını günceller (yalnızca kendi oturumuyla). E-posta değişmez: kimlik e-posta sahipliğidir. */
export async function POST(request: NextRequest) {
  if (!sameOriginPost(request)) return new NextResponse("Geçersiz köken.", { status: 403 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const lb = await siteLocaleBase(siteId, String(form.get("locale") ?? "tr").trim().slice(0, 12) || "tr");
  const member = await resolveMemberCookie(siteId, request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  if (!member) return NextResponse.redirect(new URL(`${lb}/uye/giris`, request.url), 303);
  await getMemberRepository(siteId).setName(member.id, String(form.get("name") ?? "").replace(/\s+/g, " "));
  const url = new URL(`${lb}/uye`, request.url);
  url.searchParams.set("saved", "1");
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
