import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Üye belirteçleri (yalnızca Node). İki ayrı amaç, imzada alan ayrımı (`memlink` / `memsess`) ile karıştırılamaz:
 *  - giriş bağlantısı: `<üyeKimliği>.<bağSırası>.<bitişSn>.<hmac>` — 15 dk; üyenin `linkSeq` değerine bağlıdır. Yeni bağlantı
 *    istemek ya da bağlantıyı kullanmak sırayı artırır; yalnızca EN SON bağlantı geçerli ve tek kullanımlıktır.
 *  - oturum çerezi: `<üyeKimliği>.<oturumSürümü>.<bitişSn>.<hmac>` — 30 gün; sürüm artınca (çıkış-tümü, devre dışı) düşer.
 * İmza `AUTH_SECRET` ile atılır; kiracı kimliği imzaya girer (başka kiracının belirteci geçmez).
 */
export const MEMBER_LINK_TTL_SECONDS = 15 * 60;
export const MEMBER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MEMBER_SESSION_COOKIE = "nx_member";

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
type Kind = "memlink" | "memsess";

const mac = (secret: string, kind: Kind, siteId: string, id: string, n: number, exp: number) =>
  createHmac("sha256", secret).update(`${kind}|${siteId}|${id}|${n}|${exp}`).digest("base64url").slice(0, 43);

function create(kind: Kind, ttl: number, secret: string, siteId: string, id: string, n: number, now: number): string {
  if (!ID_RE.test(id)) throw new Error("Geçersiz üye kimliği.");
  const exp = Math.floor(now / 1000) + ttl;
  return `${id}.${n}.${exp}.${mac(secret, kind, siteId, id, n, exp)}`;
}

function verify(kind: Kind, ttl: number, secret: string, siteId: string, token: unknown, now: number): { id: string; n: number } | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, nRaw, expRaw, given] = parts as [string, string, string, string];
  const n = Number(nRaw);
  const exp = Number(expRaw);
  if (!ID_RE.test(id) || !Number.isInteger(n) || n < 0 || !Number.isInteger(exp) || !given) return null;
  const expected = Buffer.from(mac(secret, kind, siteId, id, n, exp));
  const got = Buffer.from(given);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const nowSec = Math.floor(now / 1000);
  if (exp < nowSec || exp > nowSec + ttl + 60) return null;
  return { id, n };
}

export const createMemberLinkToken = (secret: string, siteId: string, member: { id: string; linkSeq: number }, now = Date.now()) =>
  create("memlink", MEMBER_LINK_TTL_SECONDS, secret, siteId, member.id, member.linkSeq, now);
export const verifyMemberLinkToken = (secret: string, siteId: string, token: unknown, now = Date.now()) => {
  const r = verify("memlink", MEMBER_LINK_TTL_SECONDS, secret, siteId, token, now);
  return r ? { memberId: r.id, linkSeq: r.n } : null;
};
export const createMemberSessionToken = (secret: string, siteId: string, member: { id: string; sessionVersion: number }, now = Date.now()) =>
  create("memsess", MEMBER_SESSION_TTL_SECONDS, secret, siteId, member.id, member.sessionVersion, now);
export const verifyMemberSessionToken = (secret: string, siteId: string, token: unknown, now = Date.now()) => {
  const r = verify("memsess", MEMBER_SESSION_TTL_SECONDS, secret, siteId, token, now);
  return r ? { memberId: r.id, sessionVersion: r.n } : null;
};

/** Üye kimliği: tahmin edilemez, URL'de güvenli. */
export const newMemberId = (): string => `mem_${randomBytes(12).toString("hex")}`;
