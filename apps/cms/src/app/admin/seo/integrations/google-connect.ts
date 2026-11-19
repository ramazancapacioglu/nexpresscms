"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getScopedRepository } from "@nexpress/database";
import { resolveSiteSettings } from "@nexpress/core";
import { GOOGLE_CALLBACK_PATH, GOOGLE_OAUTH_SCOPES, googleRedirectOrigin, rememberGoogleOauthState } from "./google-oauth";

/**
 * Kayıtlı istemci kimliğiyle Google izin ekranını açar.
 * Dönüş jetonu Search Console ve Analytics okuması için saklanır.
 */
export async function beginGoogleConnectAction(): Promise<{ ok: false; error: string }> {
  const admin = await requireAdmin("seo.google.connect");
  const repo = getScopedRepository(admin.siteId);
  const seo = resolveSiteSettings((await repo.getSite())?.settings).seo;
  const clientId = seo.integrations?.gsc?.clientId?.trim() ?? "";
  const clientSecret = seo.integrations?.gsc?.clientSecret?.trim() ?? "";
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Önce istemci kimliğini ve sırrını kaydedin. Google, kayıtlı uygulamaya döner." };
  }
  const origin = await googleRedirectOrigin();
  if (!origin) return { ok: false, error: "Site adresi okunamadı." };

  const state = randomBytes(24).toString("hex");
  await rememberGoogleOauthState(state, origin.startsWith("https://"));

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}${GOOGLE_CALLBACK_PATH}`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  redirect(url.toString());
}
