/**
 * Çevrimdışı doğrulanabilir eklenti lisans belirteci (Ed25519, Web Crypto).
 * Biçim: `nxlic_v1.<base64url(payload)>.<base64url(signature)>`
 * Yük: `{ plugin, siteDomain, exp, holder? }`.
 * Süresi dolan belirteç veriyi silmez; yalnızca çalışma zamanı kapısını kapatır ve panelde uyarı gösterir.
 */

export interface PluginLicensePayload {
  /** Eklenti kimliği (ör. "@nexpress-pro/agentic-seo") veya "*" */
  plugin: string;
  /** İzin verilen alan adı (ör. "ornek.com", "*.ornek.com") veya "*" */
  siteDomain: string;
  /** Bitiş zamanı (Unix saniye) */
  exp: number;
  /** Lisans sahibi (isteğe bağlı) */
  holder?: string;
}

export type PluginLicenseStatus = "unlicensed" | "valid" | "expired" | "invalid";

export interface PluginLicenseVerification {
  status: PluginLicenseStatus;
  payload: PluginLicensePayload | null;
  daysRemaining: number | null;
  error?: string;
}

export const LICENSE_TOKEN_PREFIX = "nxlic_v1";

/**
 * Varsayılan yerleşik Ed25519 açık anahtarı (32 bayt raw base64url).
 * Kurumsal dağıtımlarda `NEXPRESS_LICENSE_PUBLIC_KEY` ortam değişkeniyle ezilebilir.
 */
export const DEFAULT_LICENSE_PUBLIC_KEY = "7M6k9yH3vQ8wP1zR4tY6uI9oP2aS5dF8gH1jK4lZ7xC";

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

export function domainMatchesLicense(licenseDomain: string, currentDomain?: string): boolean {
  if (!licenseDomain || licenseDomain === "*") return true;
  if (!currentDomain) return true;
  const cleanCurrent = currentDomain.toLowerCase().replace(/:\d+$/, "");
  const cleanTarget = licenseDomain.toLowerCase().replace(/:\d+$/, "");
  if (cleanCurrent === cleanTarget || cleanCurrent === "localhost" || cleanCurrent === "127.0.0.1") {
    return true;
  }
  if (cleanTarget.startsWith("*.")) {
    const suffix = cleanTarget.slice(1); // ".ornek.com"
    return cleanCurrent.endsWith(suffix) || cleanCurrent === cleanTarget.slice(2);
  }
  return false;
}

/**
 * Belirtecin JSON yükünü imza doğrulamadan çözümler (hızlı senkron süre/durum kontrolü için).
 */
export function decodeLicensePayloadUnverified(
  licenseKey: string | null | undefined
): PluginLicensePayload | null {
  if (!licenseKey || typeof licenseKey !== "string") return null;
  const parts = licenseKey.trim().split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_TOKEN_PREFIX || !parts[1] || !parts[2]) return null;
  try {
    const raw = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1]))) as Record<string, unknown>;
    if (
      typeof raw.plugin !== "string" ||
      !raw.plugin ||
      typeof raw.siteDomain !== "string" ||
      !raw.siteDomain ||
      typeof raw.exp !== "number" ||
      !Number.isFinite(raw.exp)
    ) {
      return null;
    }
    return {
      plugin: raw.plugin,
      siteDomain: raw.siteDomain,
      exp: Math.trunc(raw.exp),
      ...(typeof raw.holder === "string" ? { holder: raw.holder } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Senkron süre kontrolü (`resolvePluginState` içinde kullanılır).
 * Anahtar girilmişse ve biçimi bozuksa veya süresi geçmişse `true` döner.
 */
export function isLicenseKeyExpiredOrInvalid(
  licenseKey: string | null | undefined,
  pluginId: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (!licenseKey || !licenseKey.trim()) return false;
  const payload = decodeLicensePayloadUnverified(licenseKey);
  if (!payload) return true;
  if (payload.plugin !== "*" && payload.plugin !== pluginId) return true;
  return payload.exp <= nowSeconds;
}

/**
 * Testler ve lisans üretim aracı için Ed25519 anahtar çifti üretir.
 */
export async function generateLicenseKeyPair(): Promise<{
  publicKeyBase64Url: string;
  privateKeyPkcs8Base64Url: string;
}> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pubRaw = await crypto.subtle.exportKey("raw", pair.publicKey);
  const privPkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  return {
    publicKeyBase64Url: toBase64Url(new Uint8Array(pubRaw)),
    privateKeyPkcs8Base64Url: toBase64Url(new Uint8Array(privPkcs8)),
  };
}

/**
 * Ed25519 özel anahtarıyla (PKCS#8 base64url) çevrimdışı lisans belirteci imzalar.
 */
export async function signPluginLicenseKey(
  payload: PluginLicensePayload,
  privateKeyPkcs8Base64Url: string
): Promise<string> {
  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    fromBase64Url(privateKeyPkcs8Base64Url) as BufferSource,
    { name: "Ed25519" },
    false,
    ["sign"]
  );
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${LICENSE_TOKEN_PREFIX}.${body}`;
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privKey, encoder.encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * Ed25519 açık anahtarıyla lisans belirtecini çevrimdışı doğrular.
 */
export async function verifyPluginLicenseKey(
  licenseKey: string | null | undefined,
  options: {
    pluginId: string;
    siteDomain?: string;
    nowSeconds?: number;
    publicKeyBase64Url?: string;
  }
): Promise<PluginLicenseVerification> {
  if (!licenseKey || !licenseKey.trim()) {
    return { status: "unlicensed", payload: null, daysRemaining: null };
  }
  const trimmed = licenseKey.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_TOKEN_PREFIX || !parts[1] || !parts[2]) {
    return { status: "invalid", payload: null, daysRemaining: null, error: "Lisans anahtarı biçimi geçersiz." };
  }

  const pubKeyRaw = options.publicKeyBase64Url ?? process.env.NEXPRESS_LICENSE_PUBLIC_KEY ?? DEFAULT_LICENSE_PUBLIC_KEY;
  try {
    const pubKey = await crypto.subtle.importKey(
      "raw",
      fromBase64Url(pubKeyRaw) as BufferSource,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const signingInput = `${parts[0]}.${parts[1]}`;
    const validSig = await crypto.subtle.verify(
      { name: "Ed25519" },
      pubKey,
      fromBase64Url(parts[2]) as BufferSource,
      encoder.encode(signingInput)
    );
    if (!validSig) {
      return { status: "invalid", payload: null, daysRemaining: null, error: "Lisans imzası doğrulanamadı." };
    }
  } catch {
    return { status: "invalid", payload: null, daysRemaining: null, error: "Lisans imzası doğrulanamadı." };
  }

  const payload = decodeLicensePayloadUnverified(trimmed);
  if (!payload) {
    return { status: "invalid", payload: null, daysRemaining: null, error: "Lisans verisi okunamadı." };
  }
  if (payload.plugin !== "*" && payload.plugin !== options.pluginId) {
    return { status: "invalid", payload, daysRemaining: null, error: "Lisans bu eklenti için geçerli değil." };
  }
  if (!domainMatchesLicense(payload.siteDomain, options.siteDomain)) {
    return { status: "invalid", payload, daysRemaining: null, error: "Lisans bu alan adı için geçerli değil." };
  }

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { status: "expired", payload, daysRemaining: 0, error: "Lisans süresi dolmuş." };
  }
  const daysRemaining = Math.ceil((payload.exp - now) / 86_400);
  return { status: "valid", payload, daysRemaining };
}

