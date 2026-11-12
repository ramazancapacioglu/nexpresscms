/**
 * Veri eklentisi (`.nxplugin`) sözleşmesi (saf mantık, Web Crypto). Paket **kod çalıştırmaz**: manifest, özel içerik türü
 * tanımları, başlangıç sayfaları ve giden webhook bildirimleri içerir; her biri doğrulanır, istenen izinler yöneticiye
 * gösterilir ve eklenti ancak açık onayla etkinleşir. Zip okuma ve sayfa şeması `apps/cms/src/lib/data-plugin.ts`'tedir.
 *
 * Güven modeli: paket bütünlüğü `checksum` ile, yayıncı kimliği isteğe bağlı Ed25519 imzayla bağlanır. İmza yalnızca
 * "bu paket bu anahtar sahibinden geldi ve değişmedi" der; güvenilen yayıncı listesi (`PLUGIN_TRUSTED_KEYS`) sunucuda tutulur.
 */
import { sanitizeContentTypes, type CustomContentType } from "./content-types";

export const DATA_PLUGIN_LIMITS = {
  zipBytes: 2 * 1024 * 1024,
  files: 20,
  totalBytes: 8 * 1024 * 1024,
  jsonBytes: 256 * 1024,
  webhooks: 5,
  pages: 20,
  contentTypes: 6,
} as const;

export const WEBHOOK_EVENTS = ["content.published", "content.updated"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export const WEBHOOK_EVENT_LABEL: Record<WebhookEvent, string> = {
  "content.published": "İçerik yayınlandığında",
  "content.updated": "Yayındaki içerik güncellendiğinde",
};

const ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.-]{1,20})?$/;
const KEY_B64URL_RE = /^[A-Za-z0-9_-]{43}$/;

export interface DataPluginManifest {
  id: string;
  name: string;
  version: string;
  vendor: string;
  description: string;
  homepage?: string;
  /** Ed25519 açık anahtar (32 bayt, base64url). İmza varsa bununla doğrulanır; manifest imzaya dahildir. */
  publisherKey?: string;
}

const text = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export type Checked<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function sanitizeManifest(raw: unknown): Checked<DataPluginManifest> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const id = typeof r.id === "string" ? r.id.trim() : "";
  if (!ID_RE.test(id) || id.length < 3 || id.length > 40) errors.push("plugin.json › id: 3–40 karakter, küçük harf/rakam ve tire (örn. acme-referanslar).");
  const name = text(r.name, 60);
  if (!name) errors.push("plugin.json › name zorunlu.");
  const version = typeof r.version === "string" ? r.version.trim() : "";
  if (!SEMVER_RE.test(version)) errors.push("plugin.json › version: 1.2.3 biçiminde olmalı.");
  const vendor = text(r.vendor, 60);
  if (!vendor) errors.push("plugin.json › vendor zorunlu.");
  const homepage = typeof r.homepage === "string" && r.homepage.trim() ? r.homepage.trim() : undefined;
  if (homepage) {
    try {
      const u = new URL(homepage);
      if (u.protocol !== "https:") errors.push("plugin.json › homepage https olmalı.");
    } catch {
      errors.push("plugin.json › homepage geçerli bir adres değil.");
    }
  }
  const publisherKey = typeof r.publisherKey === "string" && r.publisherKey.trim() ? r.publisherKey.trim() : undefined;
  if (publisherKey && !KEY_B64URL_RE.test(publisherKey)) errors.push("plugin.json › publisherKey: 32 baytlık Ed25519 anahtarı (base64url, 43 karakter).");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { id, name, version, vendor, description: text(r.description, 300), ...(homepage ? { homepage } : {}), ...(publisherKey ? { publisherKey } : {}) } };
}

export interface DataPluginWebhook {
  id: string;
  event: WebhookEvent;
  url: string;
  description?: string;
}

/** Webhook adresi: yalnızca `https`, kullanıcı bilgisi yok, IP değil alan adı, yerel/iç ad yok. Asıl ağ koruması gönderimde (`isPublicIp`). */
export function validateWebhookUrl(input: unknown): { ok: true; url: string; host: string } | { ok: false; error: string } {
  if (typeof input !== "string" || !input.trim() || input.length > 300) return { ok: false, error: "adres boş ya da çok uzun" };
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return { ok: false, error: "geçerli bir adres değil" };
  }
  if (u.protocol !== "https:") return { ok: false, error: "yalnızca https" };
  if (u.username || u.password) return { ok: false, error: "adreste kullanıcı bilgisi olamaz" };
  if (u.port && u.port !== "443") return { ok: false, error: "yalnızca varsayılan bağlantı noktası (443)" };
  const host = u.hostname.toLowerCase();
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return { ok: false, error: "IP adresi yerine alan adı kullanın" };
  if (!host.includes(".") || host === "localhost" || /\.(local|localhost|internal|lan|home|corp)$/.test(host)) return { ok: false, error: "yerel/iç ağ adı olamaz" };
  u.hash = "";
  return { ok: true, url: u.toString(), host };
}

export function sanitizeWebhooks(raw: unknown): Checked<DataPluginWebhook[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ["webhooks.json bir dizi olmalı."] };
  if (raw.length > DATA_PLUGIN_LIMITS.webhooks) return { ok: false, errors: [`webhooks.json: en çok ${DATA_PLUGIN_LIMITS.webhooks} webhook.`] };
  const errors: string[] = [];
  const out: DataPluginWebhook[] = [];
  const seen = new Set<string>();
  raw.forEach((item, i) => {
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    if (!ID_RE.test(id) || id.length > 40 || seen.has(id)) return void errors.push(`webhooks.json › [${i}].id: küçük harf/rakam/tire, tekil.`);
    seen.add(id);
    const event = WEBHOOK_EVENTS.find((e) => e === r.event);
    if (!event) return void errors.push(`webhooks.json › [${i}].event: ${WEBHOOK_EVENTS.join(" | ")} olmalı.`);
    const url = validateWebhookUrl(r.url);
    if (!url.ok) return void errors.push(`webhooks.json › [${i}].url: ${url.error}.`);
    out.push({ id, event, url: url.url, ...(text(r.description, 120) ? { description: text(r.description, 120) } : {}) });
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: out };
}

/** `content-types.json`: geçersiz tür/alan atılırsa paket reddedilir (sessizce eksik kurulmaz). */
export function sanitizePluginContentTypes(raw: unknown): Checked<CustomContentType[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ["content-types.json bir dizi olmalı."] };
  if (raw.length > DATA_PLUGIN_LIMITS.contentTypes) return { ok: false, errors: [`content-types.json: en çok ${DATA_PLUGIN_LIMITS.contentTypes} tür.`] };
  if (new Set(raw.map((r) => (r as { id?: unknown })?.id)).size !== raw.length) return { ok: false, errors: ["content-types.json: aynı tür kimliği birden fazla kez geçiyor."] };
  const value = sanitizeContentTypes(raw);
  const bad = raw.filter((r) => {
    const kept = value.find((t) => t.id === (r as { id?: unknown })?.id);
    const rawFields = Array.isArray((r as { fields?: unknown })?.fields) ? (r as { fields: unknown[] }).fields.length : 0;
    return !kept || kept.fields.length !== rawFields;
  });
  if (bad.length > 0) return { ok: false, errors: ["content-types.json: bir tür ya da alan geçersiz (kimlik/anahtar biçimi, yerleşik tür adı, boş etiket, boş seçenek listesi veya çakışan kimlik)."] };
  // Arşiv adresi çakışması (sistem rotası) sessizce kapatılmışsa da reddet
  const archiveLost = raw.some((r) => (r as { archive?: unknown })?.archive === true && !value.find((t) => t.id === (r as { id?: unknown }).id)?.archive);
  if (archiveLost) return { ok: false, errors: ["content-types.json: bir türün arşiv adresi kullanılamıyor (sistem rotası ya da çakışma)."] };
  return { ok: true, value };
}

export type SignatureStatus = "verified" | "signed-untrusted" | "unsigned" | "invalid";

export const signatureMessage = (checksum: string): string => `nxplugin-v1:${checksum}`;

const encoder = new TextEncoder();
const fromB64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};
const toB64Url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** `PLUGIN_TRUSTED_KEYS`: virgülle ayrılmış Ed25519 açık anahtarlar (base64url). Geçersiz girişler atılır. */
export const parseTrustedKeys = (value: string | undefined): string[] => (value ?? "").split(/[\s,]+/).filter((k) => KEY_B64URL_RE.test(k));

/**
 * İmza durumu: imza yok → `unsigned`; imza var ama doğrulanamıyor/anahtar yok → `invalid` (paket reddedilir);
 * geçerli imza ama anahtar güvenilen listede değil → `signed-untrusted`; geçerli ve güvenilen → `verified`.
 */
export async function verifyPackageSignature(input: { checksum: string; signature: string | undefined; publisherKey: string | undefined; trustedKeys: readonly string[] }): Promise<SignatureStatus> {
  if (!input.signature) return "unsigned";
  if (!input.publisherKey || !KEY_B64URL_RE.test(input.publisherKey)) return "invalid";
  try {
    const key = await crypto.subtle.importKey("raw", fromB64Url(input.publisherKey) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, fromB64Url(input.signature) as BufferSource, encoder.encode(signatureMessage(input.checksum)) as BufferSource);
    if (!ok) return "invalid";
    return input.trustedKeys.includes(input.publisherKey) ? "verified" : "signed-untrusted";
  } catch {
    return "invalid";
  }
}

/** Paket imzalama aracı ve testler için: Ed25519 anahtar çifti + imza. */
export async function signPackageChecksum(checksum: string): Promise<{ publicKey: string; signature: string }> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = toB64Url(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, pair.privateKey, encoder.encode(signatureMessage(checksum)) as BufferSource));
  return { publicKey, signature: toB64Url(sig) };
}

/** Webhook imzası: HMAC-SHA256(sır, `${zaman}.${gövde}`) onaltılık. Alıcı zaman damgasını da denetleyip tekrarı reddetmelidir. */
export async function signWebhook(secret: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`) as BufferSource));
  return Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PermissionLine {
  id: "content-types" | "pages" | "webhooks";
  label: string;
  /** Ayrıntı satırları (ör. webhook adresleri). */
  details: string[];
}

/** Yöneticiye etkinleştirmeden önce gösterilecek izin özeti (paketin gerçekte yapacağı her şey). */
export function describePermissions(pkg: { contentTypes: readonly CustomContentType[]; pages: readonly { slug: string; title: string }[]; webhooks: readonly DataPluginWebhook[] }): PermissionLine[] {
  const out: PermissionLine[] = [];
  if (pkg.contentTypes.length > 0) out.push({ id: "content-types", label: `${pkg.contentTypes.length} özel içerik türü ekler`, details: pkg.contentTypes.map((t) => `${t.labelPlural} (${t.fields.length} alan${t.archive ? `, /${t.archiveSlug}` : ""})`) });
  if (pkg.pages.length > 0) out.push({ id: "pages", label: `${pkg.pages.length} taslak sayfa ekler (yayınlamaz; aynı adresli içerik ezilmez)`, details: pkg.pages.map((p) => `/${p.slug} — ${p.title}`) });
  if (pkg.webhooks.length > 0) {
    out.push({ id: "webhooks", label: `Dışarıya veri gönderir: ${[...new Set(pkg.webhooks.map((w) => new URL(w.url).host))].join(", ")}`, details: pkg.webhooks.map((w) => `${WEBHOOK_EVENT_LABEL[w.event]} → ${w.url} (içerik başlığı, adresi ve durumu; gövde metni gönderilmez)`) });
  }
  return out;
}

/** Webhook yeniden deneme: en çok 6 deneme; beklemeler 1 dk, 5 dk, 30 dk, 2 sa, 6 sa. */
export const WEBHOOK_MAX_ATTEMPTS = 6;
export const WEBHOOK_BACKOFF_MINUTES = [1, 5, 30, 120, 360] as const;

/** Geçici hatalar yeniden denenir (ağ hatası, 408/425/429, 5xx); kalıcı istemci hataları (400, 401, 403, 404, 410…) denenmez. */
export const isRetryableStatus = (status: number | null): boolean => status === null || status === 408 || status === 425 || status === 429 || status >= 500;

/**
 * Başarısız bir denemeden sonra ne olacağı. `attemptsDone` = bu deneme dahil yapılan deneme sayısı (1, 2, …).
 * Vazgeçilirse `giveUp`; yoksa bir sonraki deneme zamanı.
 */
export function nextWebhookAttempt(attemptsDone: number, status: number | null, now: Date): { giveUp: true } | { giveUp: false; at: Date } {
  if (!isRetryableStatus(status) || attemptsDone >= WEBHOOK_MAX_ATTEMPTS) return { giveUp: true };
  const minutes = WEBHOOK_BACKOFF_MINUTES[Math.min(attemptsDone - 1, WEBHOOK_BACKOFF_MINUTES.length - 1)]!;
  return { giveUp: false, at: new Date(now.getTime() + minutes * 60_000) };
}
