/**
 * Oturum belirteci: `base64url(payload).base64url(hmac)`.
 * Yalnızca Web Crypto kullanır; middleware (edge) ve Node'da aynı kodla çalışır.
 */
export type UserRole = "admin" | "editor";

export interface SessionPayload {
  sub: string;
  siteId: string;
  role: UserRole;
  /** Kullanıcının oturum sürümü: parola değişimi / "tüm oturumları kapat" sürümü artırır, eski belirteçler düşer. */
  sv: number;
  /** Unix saniye */
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/** İmza ve süre doğrulanırsa yükü, aksi halde `null` döner. */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(sig) as BufferSource,
      encoder.encode(body)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) return null;
    if (payload.role !== "admin" && payload.role !== "editor") return null;
    if (!Number.isInteger(payload.sv)) return null;
    return payload;
  } catch {
    return null;
  }
}
