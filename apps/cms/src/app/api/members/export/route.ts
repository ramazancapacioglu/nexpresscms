import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE } from "@nexpress/core/member-token";
import { resolveMemberCookie } from "@/lib/members";

export const runtime = "nodejs";

/** Üyenin kendisine ait tüm kayıtlı veri (KVKK erişim/taşınabilirlik). Yalnızca kendi oturumuyla; önbelleğe girmez. */
export async function GET(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const member = await resolveMemberCookie(siteId, request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  if (!member) return new NextResponse("Oturum gerekli.", { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const body = JSON.stringify({ email: member.email, name: member.name, status: member.status, createdAt: member.createdAt, emailVerifiedAt: member.emailVerifiedAt, consentAt: member.consentAt, lastLoginAt: member.lastLoginAt }, null, 2);
  return new NextResponse(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="uyelik-verilerim.json"', "Cache-Control": "private, no-store" } });
}
