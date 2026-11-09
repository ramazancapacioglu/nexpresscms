import type { ContentStatus, ContentVisibility } from "./types";

/**
 * Parola ve üye korumalı içerik erişim denetimi (Web Crypto + sabit süreli karşılaştırma).
 * Ön yüzde 0-KB RSC form + HttpOnly çerez ile çalışır; istemci JS'i gerektirmez.
 */
export const CONTENT_ACCESS_COOKIE_PREFIX = "nx_pwd_";

const encoder = new TextEncoder();

export function contentAccessCookieName(contentId: string): string {
  return `${CONTENT_ACCESS_COOKIE_PREFIX}${contentId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

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

/**
 * İçerik parolası doğrulandığında tarayıcıya verilecek HttpOnly çerez imzası.
 * Parola değiştiğinde imza kendiliğinden geçersiz olur.
 */
export async function signContentAccessToken(
  secret: string,
  siteId: string,
  contentId: string,
  accessPassword: string
): Promise<string> {
  const message = `pwd|${siteId}|${contentId}|${accessPassword}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export async function verifyContentAccessToken(
  secret: string,
  siteId: string,
  contentId: string,
  accessPassword: string,
  token: string | undefined | null
): Promise<boolean> {
  if (!token || !accessPassword) return false;
  try {
    const message = `pwd|${siteId}|${contentId}|${accessPassword}`;
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(token) as BufferSource,
      encoder.encode(message)
    );
  } catch {
    return false;
  }
}

/** Sabit süreli parola karşılaştırması (zamanlama saldırısına dayanıklı). */
export function verifyContentPasswordInput(expectedPassword: string, submittedPassword: string): boolean {
  if (!expectedPassword) return false;
  const a = encoder.encode(expectedPassword);
  const b = encoder.encode(submittedPassword);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export interface ContentAccessCheckInput {
  status: ContentStatus;
  visibility: ContentVisibility;
  accessPassword?: string;
  hasSession: boolean;
  hasValidPasswordToken: boolean;
  isDraftPreview?: boolean;
}

export interface ContentAccessDecision {
  allowed: boolean;
  gate: "none" | "password" | "members_only";
}

/**
 * Ziyaretçinin içeriğin gövdesini ve Markdown çıktısını görüp göremeyeceğini belirler.
 */
export function evaluateContentAccess(input: ContentAccessCheckInput): ContentAccessDecision {
  if (input.isDraftPreview || input.hasSession) {
    return { allowed: true, gate: "none" };
  }
  if (input.visibility === "members_only") {
    return { allowed: false, gate: "members_only" };
  }
  const password = (input.accessPassword ?? "").trim();
  if (input.visibility === "password" || (input.status === "restricted" && password.length > 0)) {
    if (!password || input.hasValidPasswordToken) {
      return { allowed: true, gate: "none" };
    }
    return { allowed: false, gate: "password" };
  }
  if (input.status === "restricted") {
    return { allowed: false, gate: "members_only" };
  }
  return { allowed: true, gate: "none" };
}

