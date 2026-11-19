import { cookies, headers } from "next/headers";

const STATE_COOKIE = "nx_google_oauth";

export const GOOGLE_CALLBACK_PATH = "/admin/seo/integrations/google/callback";

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

/** Panelin gördüğü kök adres. Yönlendirme adresi Google Cloud kaydıyla aynı olmalı. */
export async function googleRedirectOrigin(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]?.trim() ?? "";
  const forwarded = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwarded || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

export async function rememberGoogleOauthState(state: string, secure: boolean): Promise<void> {
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/admin/seo/integrations",
    maxAge: 600,
  });
}

export async function readGoogleOauthState(): Promise<string> {
  return (await cookies()).get(STATE_COOKIE)?.value ?? "";
}

export async function clearGoogleOauthState(): Promise<void> {
  (await cookies()).set(STATE_COOKIE, "", { httpOnly: true, path: "/admin/seo/integrations", maxAge: 0 });
}
