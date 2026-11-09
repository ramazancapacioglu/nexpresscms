import { NextResponse, type NextRequest } from "next/server";
import {
  contentAccessCookieName,
  resolvePublishing,
  resolveSiteIdFromHost,
  signContentAccessToken,
  verifyContentPasswordInput,
} from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getAuthSecret } from "@/lib/auth/config";
import { siteLocaleBase } from "@/lib/locale-url";

/**
 * 0-KB RSC parola korumalı içerik kapısı: ziyaretçi formdan parola gönderdiğinde
 * doğrular, HttpOnly HMAC çerezi yazar ve sayfaya 303 ile geri yönlendirir.
 */
export async function POST(request: NextRequest) {
  const siteId = request.headers.get("x-nexpress-site-id") ?? resolveSiteIdFromHost(request.headers.get("host"));
  const form = await request.formData();
  const contentId = String(form.get("contentId") ?? "").trim();
  const locale = String(form.get("locale") ?? "tr").trim() || "tr";
  const slug = String(form.get("slug") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const lb = await siteLocaleBase(siteId, locale);
  const basePath = slug ? `${lb}/${slug}` : lb || "/";

  if (!contentId || !slug) {
    return NextResponse.redirect(new URL(basePath, request.url), 303);
  }

  const content = await getScopedRepository(siteId).getContentById(contentId, locale);
  if (!content) {
    return NextResponse.redirect(new URL(basePath, request.url), 303);
  }

  const pub = resolvePublishing(content.schemaAttributes);
  if (!verifyContentPasswordInput(pub.accessPassword, password)) {
    const errUrl = new URL(basePath, request.url);
    errUrl.searchParams.set("pwd", "error");
    return NextResponse.redirect(errUrl, 303);
  }

  const token = await signContentAccessToken(getAuthSecret(), siteId, content.id, pub.accessPassword);
  const okUrl = new URL(basePath, request.url);
  const response = NextResponse.redirect(okUrl, 303);
  response.cookies.set(contentAccessCookieName(content.id), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 saat
  });
  return response;
}

