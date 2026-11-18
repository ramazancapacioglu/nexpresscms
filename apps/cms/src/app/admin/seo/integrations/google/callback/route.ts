import { NextResponse } from "next/server";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { GOOGLE_CALLBACK_PATH, clearGoogleOauthState, googleRedirectOrigin, readGoogleOauthState } from "../../google-oauth";

function back(origin: string, code: string): NextResponse {
  const url = new URL("/admin/seo/integrations", origin || "http://localhost");
  url.searchParams.set("google", code === "ok" ? "ok" : "hata");
  if (code !== "ok") url.searchParams.set("neden", code);
  return NextResponse.redirect(url);
}

/** Google izin ekranından dönen kodu yenileme jetonuna çevirir. */
export async function GET(request: Request) {
  const origin = await googleRedirectOrigin();
  const admin = await requireAdmin("seo.google.callback");
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const saved = await readGoogleOauthState();
  await clearGoogleOauthState();
  if (!state || state !== saved) return back(origin, "state");
  if (url.searchParams.get("error")) return back(origin, "reddedildi");
  const code = url.searchParams.get("code") ?? "";
  if (!code) return back(origin, "kod");

  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const seo = resolveSiteSettings(site?.settings).seo;
  const clientId = seo.integrations?.gsc?.clientId?.trim() ?? "";
  const clientSecret = seo.integrations?.gsc?.clientSecret?.trim() ?? "";
  if (!clientId || !clientSecret) return back(origin, "eksik");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${GOOGLE_CALLBACK_PATH}`,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return back(origin, "token");
  const data = (await response.json()) as { refresh_token?: string };
  if (!data.refresh_token) return back(origin, "jeton");

  await repo.saveSiteSettings({
    seo: {
      ...seo,
      integrations: {
        ...seo.integrations,
        gsc: { ...seo.integrations?.gsc, refreshToken: data.refresh_token, enabled: true },
      },
    },
  });
  await revalidatePath("/admin/seo/integrations");
  return back(origin, "ok");
}
