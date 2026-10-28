export const SESSION_COOKIE = "nx_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const WEAK_SECRET = /change-in-production|^$/;

/** Üretimde zayıf veya eksik `AUTH_SECRET` ile açılmayı reddeder. */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && (secret.length < 32 || WEAK_SECRET.test(secret))) {
    throw new Error("AUTH_SECRET üretimde en az 32 karakterlik, varsayılan olmayan bir değer olmalı.");
  }
  return secret || "nexpress-dev-only-secret";
}
