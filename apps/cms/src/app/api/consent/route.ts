import { NextResponse } from "next/server";
import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, safeBackPath } from "@nexpress/core";

/**
 * Çerez onayı seçimi (JS'siz form). `choice`: `all` | `necessary` | `reset`. Yalnızca `nx_consent` çerezini yazar/siler,
 * ardından aynı sitedeki önceki sayfaya yönlendirir (Referer; farklı site ise ana sayfa). Oturum gerekmez, veri saklanmaz.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const choice = String(form?.get("choice") ?? "");
  const back = safeBackPath(request.headers.get("referer"), request.headers.get("host"));
  const res = NextResponse.redirect(new URL(back, request.url), 303);
  const base = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  if (choice === "all" || choice === "necessary") res.cookies.set(CONSENT_COOKIE, choice, { ...base, maxAge: CONSENT_MAX_AGE_SECONDS });
  else if (choice === "reset") res.cookies.set(CONSENT_COOKIE, "", { ...base, maxAge: 0 });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
