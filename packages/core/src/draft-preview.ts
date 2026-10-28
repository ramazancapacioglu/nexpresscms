import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paylaşılabilir taslak önizleme belirteci (yalnızca Node): `<contentId>.<bitişSn>.<hmac>`.
 * Oturumsuz kişi bağlantıyla yalnızca BU içeriğin (siteId + contentId) taslağını, süre dolana kadar görür.
 * Tek bağlantı iptali yoktur; en uzun süre 30 gündür, tüm bağlantıları iptal etmek için `AUTH_SECRET` döndürülür.
 */
export const DRAFT_PREVIEW_MAX_DAYS = 30;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

const mac = (secret: string, siteId: string, contentId: string, exp: number) =>
  createHmac("sha256", secret).update(`draft|${siteId}|${contentId}|${exp}`).digest("hex").slice(0, 32);

export function createDraftPreviewToken(secret: string, siteId: string, contentId: string, days: number, now: number = Date.now()): string {
  if (!ID_RE.test(contentId)) throw new Error("Geçersiz içerik kimliği.");
  const ttl = Math.min(DRAFT_PREVIEW_MAX_DAYS, Math.max(1, Math.trunc(days)));
  const exp = Math.floor(now / 1000) + ttl * 86_400;
  return `${contentId}.${exp}.${mac(secret, siteId, contentId, exp)}`;
}

/** Geçerliyse içerik kimliğini döner; imza, süre veya site uyuşmazsa null. */
export function verifyDraftPreviewToken(secret: string, siteId: string, token: string, now: number = Date.now()): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [contentId, expRaw, given] = parts as [string, string, string];
  const exp = Number(expRaw);
  if (!ID_RE.test(contentId) || !Number.isInteger(exp) || !given) return null;
  const expected = Buffer.from(mac(secret, siteId, contentId, exp));
  const got = Buffer.from(given);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const nowSec = Math.floor(now / 1000);
  if (exp < nowSec || exp > nowSec + DRAFT_PREVIEW_MAX_DAYS * 86_400 + 60) return null;
  return contentId;
}
