import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/lib/auth/config";

/** Form zaman belirteci: `<ts>.<hmac(yol|ts)>`. Sayfa çizildiği an üretilir; çok erken/geç gönderimler bot sayılır. */
const sign = (path: string, ts: number) => createHmac("sha256", getAuthSecret()).update(`form|${path}|${ts}`).digest("hex").slice(0, 32);

export function createFormToken(path: string, now: number = Date.now()): string {
  return `${now}.${sign(path, now)}`;
}

export const MIN_FILL_MS = 3_000;
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function verifyFormToken(path: string, token: string, now: number = Date.now()): "ok" | "too_fast" | "expired" | "invalid" {
  const [tsRaw, mac] = token.split(".");
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || !mac) return "invalid";
  const expected = Buffer.from(sign(path, ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  const age = now - ts;
  if (age < MIN_FILL_MS) return "too_fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}

/** Günlük tuzlu IP özeti (HMAC): gönderimde ham IP saklanmaz, gün değişince eşleşme kopar. */
export function ipDigest(ip: string, now: Date = new Date()): string {
  if (!ip) return "";
  return createHmac("sha256", getAuthSecret()).update(`ip|${now.toISOString().slice(0, 10)}|${ip}`).digest("hex").slice(0, 24);
}
