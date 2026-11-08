import "server-only";
import { randomBytes } from "node:crypto";
import { safeEqual } from "@nexpress/core/password";
import { decryptSecret, encryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { invalidateSite } from "@/lib/cache";
import { WP_BRIDGE_PLUGIN_ID } from "@/plugins/wp-bridge";

const CODE_TTL_MS = 30 * 60 * 1000;
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface BridgeReport {
  at: string;
  created: number;
  updated: number;
  failed: number;
  links: number;
  images: number;
  forms: number;
  redirects: number;
  unknown: number;
  menus: number;
}

const emptyReport = (): BridgeReport => ({
  at: new Date().toISOString(),
  created: 0,
  updated: 0,
  failed: 0,
  links: 0,
  images: 0,
  forms: 0,
  redirects: 0,
  unknown: 0,
  menus: 0,
});

async function settings(siteId: string): Promise<Record<string, unknown>> {
  return (await getScopedRepository(siteId).getSitePlugin(WP_BRIDGE_PLUGIN_ID))?.settings ?? {};
}

async function patch(siteId: string, next: Record<string, unknown>): Promise<void> {
  await getScopedRepository(siteId).saveSitePlugin(WP_BRIDGE_PLUGIN_ID, { enabled: true, settings: next });
  await invalidateSite(siteId);
}

function openBox(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = JSON.parse(decryptSecret(value)) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function codeOf(size = 8): string {
  const bytes = randomBytes(size);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/** Paneline bir kez gösterilen kod. Önceki kod ve oturum düşer. */
export async function issueBridgeCode(siteId: string): Promise<{ code: string; expiresAt: string }> {
  const code = codeOf();
  const exp = Date.now() + CODE_TTL_MS;
  await patch(siteId, {
    pairBox: encryptSecret(JSON.stringify({ code, exp })),
    tokenBox: "",
  });
  return { code, expiresAt: new Date(exp).toISOString() };
}

/** Kodu doğrular, bir kez kullanır ve saatlik oturum verir. */
export async function pairBridge(siteId: string, code: string, origin: string): Promise<{ token: string; expiresAt: string } | { error: string }> {
  const box = openBox((await settings(siteId)).pairBox);
  const stored = typeof box?.code === "string" ? box.code : "";
  const exp = typeof box?.exp === "number" ? box.exp : 0;
  const given = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
  if (!stored || exp < Date.now() || given.length < 8 || !safeEqual(stored, given)) return { error: "Kod geçersiz veya süresi dolmuş." };
  let host: URL;
  try {
    host = new URL(origin);
  } catch {
    return { error: "Site adresi https olmalı." };
  }
  if (host.protocol !== "https:") return { error: "Site adresi https olmalı." };
  const token = randomBytes(24).toString("base64url");
  const tokenExp = Date.now() + TOKEN_TTL_MS;
  await patch(siteId, {
    pairBox: "",
    tokenBox: encryptSecret(JSON.stringify({ token, exp: tokenExp, origin: host.origin })),
    origin: host.origin,
    report: emptyReport(),
  });
  return { token, expiresAt: new Date(tokenExp).toISOString() };
}

/** Kaynak sitenin adresi. Eşleşme sırasında düz yazılır; sır değildir. */
export async function bridgeDrawn(siteId: string): Promise<string[]> {
  const ids = (await settings(siteId)).aiDone;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export async function rememberBridgeDrawn(siteId: string, ids: string[]): Promise<void> {
  const prev = await bridgeDrawn(siteId);
  await patch(siteId, { aiDone: [...new Set([...prev, ...ids])].slice(-200) });
}

export async function bridgeOrigin(siteId: string): Promise<string> {
  const current = await settings(siteId);
  if (typeof current.origin === "string" && current.origin.startsWith("https://")) return current.origin;
  const box = openBox(current.tokenBox);
  return typeof box?.origin === "string" ? box.origin : "";
}

export async function bridgeSession(siteId: string, token: string): Promise<{ origin: string } | null> {
  const box = openBox((await settings(siteId)).tokenBox);
  const stored = typeof box?.token === "string" ? box.token : "";
  const exp = typeof box?.exp === "number" ? box.exp : 0;
  const origin = typeof box?.origin === "string" ? box.origin : "";
  if (!stored || !origin || exp < Date.now() || !safeEqual(stored, token)) return null;
  return { origin };
}

export async function bridgeReport(siteId: string): Promise<BridgeReport | null> {
  const report = (await settings(siteId)).report;
  if (!report || typeof report !== "object") return null;
  return { ...emptyReport(), ...(report as BridgeReport) };
}

export async function addBridgeReport(siteId: string, delta: Partial<BridgeReport>): Promise<void> {
  const current = (await bridgeReport(siteId)) ?? emptyReport();
  const next: BridgeReport = { ...current, at: new Date().toISOString() };
  for (const key of ["created", "updated", "failed", "links", "images", "forms", "redirects", "unknown", "menus"] as const) {
    next[key] += delta[key] ?? 0;
  }
  await patch(siteId, { report: next });
}

export function mediaMapOf(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 800)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function readMediaMap(siteId: string): Promise<Record<string, string>> {
  return mediaMapOf((await settings(siteId)).mediaMap);
}

export async function writeMediaMap(siteId: string, map: Record<string, string>): Promise<void> {
  const entries = Object.entries(map).slice(-800);
  await patch(siteId, { mediaMap: Object.fromEntries(entries) });
}
