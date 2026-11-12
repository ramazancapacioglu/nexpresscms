import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE } from "@nexpress/core/member-token";
import { getMemberRepository } from "@nexpress/database";
import { siteLocaleBase } from "@/lib/locale-url";
import { resolveMemberCookie, sameOriginPost } from "@/lib/members";

export const runtime = "nodejs";

/** Üye kendi hesabını kalıcı siler (KVKK silme hakkı). Açık onay alanı (`confirm=1`) ve geçerli oturum şart. */
export async function POST(request: NextRequest) {
  if (!sameOriginPost(request)) return new NextResponse("Geçersiz köken.", { status: 403 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const lb = await siteLocaleBase(siteId, String(form.get("locale") ?? "tr").trim().slice(0, 12) || "tr");
  const member = await resolveMemberCookie(siteId, request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  if (!member || form.get("confirm") !== "1") return NextResponse.redirect(new URL(`${lb}/uye/giris`, request.url), 303);
  await getMemberRepository(siteId).delete(member.id);
  const url = new URL(`${lb}/uye/giris`, request.url);
  url.searchParams.set("deleted", "1");
  const response = NextResponse.redirect(url, 303);
  response.cookies.set(MEMBER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
