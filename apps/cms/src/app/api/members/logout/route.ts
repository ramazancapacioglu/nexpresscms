import { NextResponse, type NextRequest } from "next/server";
import { resolveSiteIdFromHost } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE } from "@nexpress/core/member-token";
import { siteLocaleBase } from "@/lib/locale-url";
import { sameOriginPost } from "@/lib/members";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!sameOriginPost(request)) return new NextResponse("Geçersiz köken.", { status: 403 });
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const lb = await siteLocaleBase(siteId, String(form.get("locale") ?? "tr").trim().slice(0, 12) || "tr");
  const response = NextResponse.redirect(new URL(lb || "/", request.url), 303);
  response.cookies.set(MEMBER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
