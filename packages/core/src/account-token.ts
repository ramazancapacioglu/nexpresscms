import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Hesap bağlantısı belirteci (yalnızca Node): parola sıfırlama ve e-posta daveti.
 * Biçim: `<amaç>.<kullanıcıKimliği>.<parolaDeğişimMs>.<bitişSn>.<hmac>`.
 * Tek kullanımlıktır ve ek tablo gerektirmez: belirteç kullanıcının SON PAROLA DEĞİŞİM zamanına bağlıdır; parola
 * belirlenince (veya başka bir yoldan değişince) zaman damgası değiştiği için aynı belirteç bir daha doğrulanmaz.
 * İmza `AUTH_SECRET` ile atılır; amaç imzaya girer (sıfırlama belirteci davet olarak kullanılamaz).
 */
export type AccountTokenPurpose = "reset" | "invite";

export const ACCOUNT_TOKEN_TTL_SECONDS: Record<AccountTokenPurpose, number> = { reset: 60 * 60, invite: 7 * 24 * 60 * 60 };

/** SQLite zaman damgasını saniye tutar; karşılaştırma saniye çözünürlüğündedir. */
const stamp = (d: Date | null) => (d ? Math.floor(d.getTime() / 1000) * 1000 : 0);

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

const mac = (secret: string, siteId: string, purpose: string, userId: string, pwdMs: number, exp: number) =>
  createHmac("sha256", secret).update(`acct|${siteId}|${purpose}|${userId}|${pwdMs}|${exp}`).digest("base64url").slice(0, 43);

export function createAccountToken(secret: string, siteId: string, purpose: AccountTokenPurpose, user: { id: string; passwordChangedAt: Date | null }, now: number = Date.now()): string {
  if (!ID_RE.test(user.id)) throw new Error("Geçersiz kullanıcı kimliği.");
  const pwdMs = stamp(user.passwordChangedAt);
  const exp = Math.floor(now / 1000) + ACCOUNT_TOKEN_TTL_SECONDS[purpose];
  return `${purpose}.${user.id}.${pwdMs}.${exp}.${mac(secret, siteId, purpose, user.id, pwdMs, exp)}`;
}

export interface ParsedAccountToken {
  purpose: AccountTokenPurpose;
  userId: string;
  pwdMs: number;
}

/** İmza, süre ve biçimi doğrular. Parolanın hâlâ aynı olduğunu (tek kullanım) çağıran `isCurrent` ile denetler. */
export function verifyAccountToken(secret: string, siteId: string, token: string, now: number = Date.now()): ParsedAccountToken | null {
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [purpose, userId, pwdRaw, expRaw, given] = parts as [string, string, string, string, string];
  if (purpose !== "reset" && purpose !== "invite") return null;
  const pwdMs = Number(pwdRaw);
  const exp = Number(expRaw);
  if (!ID_RE.test(userId) || !Number.isInteger(pwdMs) || pwdMs < 0 || !Number.isInteger(exp) || !given) return null;
  const expected = Buffer.from(mac(secret, siteId, purpose, userId, pwdMs, exp));
  const got = Buffer.from(given);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const nowSec = Math.floor(now / 1000);
  if (exp < nowSec || exp > nowSec + ACCOUNT_TOKEN_TTL_SECONDS[purpose] + 60) return null;
  return { purpose, userId, pwdMs };
}

/** Belirteç hâlâ güncel mi: kullanıcının parola zaman damgası belirteçtekiyle aynı olmalı (parola değiştiyse bayat). */
export function isTokenCurrent(parsed: ParsedAccountToken, user: { passwordChangedAt: Date | null }): boolean {
  return stamp(user.passwordChangedAt) === parsed.pwdMs;
}
