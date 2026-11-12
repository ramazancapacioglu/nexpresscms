import "server-only";
import {
  CRUX_FORM_FACTORS,
  buildCruxRequest,
  classifyCruxError,
  maskSecret,
  parseCruxResponse,
  sanitizeCruxOrigin,
  type CruxFormFactor,
  type CruxSnapshot,
} from "@nexpress/core";
import { decryptSecret, encryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";

/**
 * Sabit uç nokta: anahtar yalnızca bu adrese gider; arayüzden değiştirilemez. Yalnızca sunucu ortamı `CRUX_API_URL`
 * ile (https ya da yerel http) vekil/test sunucusuna yönlendirebilir.
 */
const DEFAULT_ENDPOINT = "https://chromeuxreport.googleapis.com/v1/records:queryRecord";
function endpoint(): string {
  const custom = (process.env.CRUX_API_URL ?? "").trim();
  if (!custom) return DEFAULT_ENDPOINT;
  try {
    const u = new URL(custom);
    return u.protocol === "https:" || (u.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(u.hostname)) ? u.toString() : DEFAULT_ENDPOINT;
  } catch {
    return DEFAULT_ENDPOINT;
  }
}
const TIMEOUT_MS = 10_000;

export interface CruxError {
  kind: string;
  message: string;
}

export interface CruxState {
  /** Anahtar kayıtlı mı (panelden ya da `CRUX_API_KEY` ortam değişkeninden). */
  hasKey: boolean;
  keySource: "panel" | "env" | null;
  keyMask: string | null;
  origin: string | null;
  snapshots: Partial<Record<CruxFormFactor, CruxSnapshot>>;
  errors: Partial<Record<CruxFormFactor, CruxError>>;
}

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Anahtar: önce panel (şifreli), yoksa ortam değişkeni. Düz metin yalnızca bu işlevde bellekte açılır. */
function resolveKey(settings: Record<string, unknown>): { key: string; source: "panel" | "env" } | null {
  const stored = typeof settings.cruxApiKey === "string" ? settings.cruxApiKey : "";
  if (stored) {
    try {
      const key = decryptSecret(stored);
      if (key) return { key, source: "panel" };
    } catch {
      /* bozuk/eski anahtar: ortam değişkenine düş */
    }
  }
  const env = (process.env.CRUX_API_KEY ?? "").trim();
  return env ? { key: env, source: "env" } : null;
}

const defaultOrigin = (settings: Record<string, unknown>): string | null =>
  sanitizeCruxOrigin(settings.cruxOrigin) ?? sanitizeCruxOrigin(process.env.NEXT_PUBLIC_APP_URL);

export async function loadCruxState(siteId: string): Promise<CruxState> {
  const settings = asRecord((await getScopedRepository(siteId).getSitePlugin(PERFORNEXT_PLUGIN_ID))?.settings);
  const resolved = resolveKey(settings);
  return {
    hasKey: resolved !== null,
    keySource: resolved?.source ?? null,
    keyMask: resolved ? maskSecret(resolved.key) : null,
    origin: defaultOrigin(settings),
    snapshots: asRecord(settings.cruxSnapshots) as CruxState["snapshots"],
    errors: asRecord(settings.cruxErrors) as CruxState["errors"],
  };
}

/** Yanıt/hata iletisinden anahtarı siler (günlüğe ya da arayüze sızmasın). */
const scrub = (text: string, key: string): string => text.split(key).join("•••");

async function queryOne(key: string, origin: string, formFactor: CruxFormFactor): Promise<{ snapshot: CruxSnapshot } | { error: CruxError }> {
  try {
    const res = await fetch(`${endpoint()}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCruxRequest(origin, formFactor)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { error: classifyCruxError(res.status) };
    const snapshot = parseCruxResponse(await res.json(), { origin, formFactor });
    return snapshot ? { snapshot } : { error: classifyCruxError(404) };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    return { error: { kind: "error", message: name === "TimeoutError" ? "CrUX API zaman aşımına uğradı." : scrub(`CrUX API'ye ulaşılamadı${e instanceof Error ? `: ${e.message}` : "."}`, key).slice(0, 200) } };
  }
}

/** Üç cihaz türü için veriyi çeker ve kaydeder. Veri yoksa önceki başarılı ölçüm korunur, hata ayrıca tutulur. */
export async function refreshCrux(siteId: string): Promise<{ ok: boolean; message: string }> {
  const repo = getScopedRepository(siteId);
  const settings = asRecord((await repo.getSitePlugin(PERFORNEXT_PLUGIN_ID))?.settings);
  const resolved = resolveKey(settings);
  if (!resolved) return { ok: false, message: "Önce bir CrUX API anahtarı kaydedin." };
  const origin = defaultOrigin(settings);
  if (!origin) return { ok: false, message: "Geçerli bir site adresi (https://…) yok; `NEXT_PUBLIC_APP_URL` ya da aşağıdaki adres alanını doldurun." };

  const results = await Promise.all(CRUX_FORM_FACTORS.map(async (f) => [f, await queryOne(resolved.key, origin, f)] as const));
  const snapshots = { ...asRecord(settings.cruxSnapshots) } as Record<string, unknown>;
  const errors: Record<string, CruxError> = {};
  for (const [f, r] of results) {
    if ("snapshot" in r) snapshots[f] = r.snapshot;
    else errors[f] = r.error;
  }
  await repo.saveSitePlugin(PERFORNEXT_PLUGIN_ID, { settings: { cruxSnapshots: snapshots, cruxErrors: errors } });
  const got = results.filter(([, r]) => "snapshot" in r).length;
  if (got > 0) return { ok: true, message: `${got} cihaz türü için ölçüm güncellendi.` };
  const first = results.map(([, r]) => ("error" in r ? r.error : null)).find(Boolean);
  return { ok: false, message: first?.message ?? "Veri alınamadı." };
}

export async function saveCruxSettings(siteId: string, input: { apiKey?: string; origin?: string; clearKey?: boolean }): Promise<{ ok: boolean; message: string }> {
  const repo = getScopedRepository(siteId);
  const patch: Record<string, unknown> = {};
  if (input.clearKey) patch.cruxApiKey = "";
  else if (input.apiKey?.trim()) {
    const key = input.apiKey.trim();
    // Google API anahtarları `AIza…` ile başlar, boşluksuz ve kısa metindir; başka bir şey büyük olasılıkla yanlış yapıştırmadır
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(key)) return { ok: false, message: "Anahtar biçimi geçersiz (boşluksuz, 20–80 karakter)." };
    patch.cruxApiKey = encryptSecret(key);
  }
  if (input.origin !== undefined) {
    if (input.origin.trim() === "") patch.cruxOrigin = "";
    else {
      const origin = sanitizeCruxOrigin(input.origin);
      if (!origin) return { ok: false, message: "Site adresi https:// ile başlayan bir alan adı olmalı." };
      patch.cruxOrigin = origin;
    }
  }
  await repo.saveSitePlugin(PERFORNEXT_PLUGIN_ID, { settings: patch });
  return { ok: true, message: "Kaydedildi." };
}
