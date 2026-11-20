import "server-only";
import { createHash } from "node:crypto";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import {
  fetchBingReport,
  fetchBingSites,
  fetchGa4Report,
  fetchGscProperties,
  fetchGscReport,
  fetchYandexReport,
  googleAccessToken,
  inspectUrl,
  WebmasterApiError,
  type BingSection,
  type Ga4Section,
  type GscPropertyEntry,
  type GscSection,
  type UrlInspection,
  type WebmasterReport,
  type WebmasterSource,
  type YandexSection,
} from "@nexpress/seo-core";

export const SECTIONS: Record<WebmasterSource, readonly string[]> = {
  gsc: ["overview", "queries", "pages", "countries", "devices", "appearance", "sitemaps"],
  ga4: ["overview", "channels", "pages", "sources", "geo", "devices", "organic", "ai", "realtime"],
  bing: ["overview", "queries", "pages", "crawl", "sitemaps", "links"],
  yandex: ["overview", "sources", "pages", "search", "geo", "devices"],
};

export interface ConnectionStatus {
  configured: boolean;
  /** Eksik alanların insan okunur adları */
  missing: string[];
}

interface Config {
  gsc: { clientId: string; clientSecret: string; refreshToken: string; siteUrl: string };
  ga4: { propertyId: string };
  bing: { apiKey: string; siteUrl: string };
  yandex: { token: string; counterId: string };
}

async function readConfig(siteId: string): Promise<Config> {
  const site = await getScopedRepository(siteId).getSite();
  const i = resolveSiteSettings(site?.settings).seo.integrations;
  return {
    gsc: { clientId: i?.gsc?.clientId?.trim() ?? "", clientSecret: i?.gsc?.clientSecret?.trim() ?? "", refreshToken: i?.gsc?.refreshToken?.trim() ?? "", siteUrl: i?.gsc?.siteUrl?.trim() ?? "" },
    ga4: { propertyId: i?.ga4?.propertyId?.trim() ?? "" },
    bing: { apiKey: i?.bing?.apiKey?.trim() ?? "", siteUrl: i?.bing?.siteUrl?.trim() ?? "" },
    yandex: { token: i?.yandex?.token?.trim() ?? "", counterId: i?.yandex?.counterId?.trim() ?? "" },
  };
}

/** Rapor çekmeden, kayıtlı bilgilere göre her kaynağın hazır olup olmadığı. */
export async function connectionStatus(siteId: string): Promise<Record<WebmasterSource, ConnectionStatus>> {
  const c = await readConfig(siteId);
  const google = [!c.gsc.clientId && "istemci kimliği", !c.gsc.clientSecret && "istemci sırrı", !c.gsc.refreshToken && "Google bağlantısı"].filter(Boolean) as string[];
  const status = (missing: string[]): ConnectionStatus => ({ configured: missing.length === 0, missing });
  return {
    gsc: status([...google, ...(c.gsc.siteUrl ? [] : ["mülk adresi"])]),
    ga4: status([...google, ...(c.ga4.propertyId ? [] : ["sayısal mülk kimliği"])]),
    bing: status([...(c.bing.apiKey ? [] : ["API anahtarı"]), ...(c.bing.siteUrl ? [] : ["site adresi"])]),
    yandex: status([...(c.yandex.token ? [] : ["OAuth jetonu"]), ...(c.yandex.counterId ? [] : ["sayaç numarası"])]),
  };
}

// ─────────── Önbellekler (kota korumak için; süreç belleği) ───────────
const tokenCache = new Map<string, { token: string; exp: number }>();
const reportCache = new Map<string, { at: number; report: WebmasterReport }>();
const REPORT_TTL_MS = 10 * 60_000;
const TOKEN_TTL_MS = 50 * 60_000;

export function clearWebmasterCaches(siteId: string): void {
  for (const key of [...tokenCache.keys()]) if (key.startsWith(`${siteId}|`)) tokenCache.delete(key);
  for (const key of [...reportCache.keys()]) if (key.startsWith(`${siteId}|`)) reportCache.delete(key);
}

async function googleToken(siteId: string, c: Config): Promise<string> {
  const key = `${siteId}|${createHash("sha256").update(c.gsc.refreshToken).digest("hex").slice(0, 16)}`;
  const hit = tokenCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.token;
  const token = await googleAccessToken({ clientId: c.gsc.clientId, clientSecret: c.gsc.clientSecret, refreshToken: c.gsc.refreshToken });
  tokenCache.set(key, { token, exp: Date.now() + TOKEN_TTL_MS });
  return token;
}

export type ReportResult = { ok: true; report: WebmasterReport; cached: boolean } | { ok: false; kind: string; error: string; hint?: string };

const fail = (error: unknown): { ok: false; kind: string; error: string; hint?: string } =>
  error instanceof WebmasterApiError
    ? { ok: false, kind: error.kind, error: error.message, ...(error.hint ? { hint: error.hint } : {}) }
    : { ok: false, kind: "unknown", error: error instanceof Error ? error.message.slice(0, 240) : "Rapor alınamadı." };

/** Tek rapor bölümünü çeker. Bilgiler eksikse "bağlı değil", API hatasında nedeni ve çözümü döner; örnek veri üretmez. */
export async function loadReport(siteId: string, source: WebmasterSource, section: string, days: number, fresh = false): Promise<ReportResult> {
  if (!SECTIONS[source].includes(section)) return { ok: false, kind: "bad_request", error: "Bilinmeyen rapor." };
  const range = [7, 28, 90].includes(days) ? days : 28;
  const cacheKey = `${siteId}|${source}|${section}|${range}`;
  const hit = reportCache.get(cacheKey);
  if (!fresh && hit && Date.now() - hit.at < REPORT_TTL_MS) return { ok: true, report: hit.report, cached: true };
  const status = (await connectionStatus(siteId))[source];
  if (!status.configured) return { ok: false, kind: "not_connected", error: `Bağlantı tamamlanmadı: ${status.missing.join(", ")} eksik.`, hint: "Sağ üstteki Bağlantı bilgileri düğmesinden tamamlayın." };
  try {
    const c = await readConfig(siteId);
    let report: WebmasterReport;
    if (source === "gsc") report = await fetchGscReport({ accessToken: await googleToken(siteId, c), siteUrl: c.gsc.siteUrl, section: section as GscSection, days: range });
    else if (source === "ga4") report = await fetchGa4Report({ accessToken: await googleToken(siteId, c), propertyId: c.ga4.propertyId, section: section as Ga4Section, days: range });
    else if (source === "bing") report = await fetchBingReport({ apiKey: c.bing.apiKey, siteUrl: c.bing.siteUrl, section: section as BingSection, days: range });
    else report = await fetchYandexReport({ token: c.yandex.token, counterId: c.yandex.counterId, section: section as YandexSection, days: range });
    if (reportCache.size > 300) reportCache.clear();
    reportCache.set(cacheKey, { at: Date.now(), report });
    return { ok: true, report, cached: false };
  } catch (error) {
    // Jeton sorunu sonrası eski jeton kullanılmasın
    if (error instanceof WebmasterApiError && error.kind === "auth") clearWebmasterCaches(siteId);
    return fail(error);
  }
}

export interface TestStep {
  label: string;
  ok: boolean;
  detail: string;
}

/** Bağlantı testi: kaynağa küçük gerçek çağrılar yapar ve adım adım sonucu (neden + çözüm) döner. */
export async function testConnection(siteId: string, source: WebmasterSource): Promise<{ ok: boolean; steps: TestStep[]; hint?: string }> {
  const steps: TestStep[] = [];
  const status = (await connectionStatus(siteId))[source];
  if (!status.configured) return { ok: false, steps: [{ label: "Bilgiler", ok: false, detail: `Eksik: ${status.missing.join(", ")}.` }], hint: "Alanları doldurup kaydedin, sonra yeniden test edin." };
  steps.push({ label: "Bilgiler", ok: true, detail: "Gerekli alanlar kayıtlı." });
  try {
    const c = await readConfig(siteId);
    if (source === "gsc" || source === "ga4") {
      const token = await googleToken(siteId, c);
      steps.push({ label: "Google kimlik doğrulama", ok: true, detail: "Yenileme jetonu geçerli, erişim jetonu alındı." });
      if (source === "gsc") {
        const props = await fetchGscProperties(token);
        steps.push({ label: "Hesaptaki mülkler", ok: props.length > 0, detail: props.length ? `${props.length} mülk: ${props.slice(0, 4).map((p) => p.siteUrl).join(", ")}` : "Bu Google hesabında Search Console mülkü yok." });
        const match = props.find((p) => p.siteUrl === c.gsc.siteUrl);
        steps.push({ label: "Kayıtlı mülk", ok: Boolean(match), detail: match ? `${c.gsc.siteUrl} (${match.permissionLevel})` : `"${c.gsc.siteUrl}" listede yok; mülkü listeden seçin.` });
        if (!match) return { ok: false, steps, hint: "Mülk adresi Search Console'daki ile birebir aynı olmalı." };
        const report = await fetchGscReport({ accessToken: token, siteUrl: c.gsc.siteUrl, section: "overview", days: 7 });
        steps.push({ label: "Performans verisi", ok: true, detail: `Son 7 gün: ${report.kpis[0]?.value ?? 0} tıklama, ${report.kpis[1]?.value ?? 0} gösterim.` });
      } else {
        const report = await fetchGa4Report({ accessToken: token, propertyId: c.ga4.propertyId, section: "overview", days: 7 });
        steps.push({ label: "Analytics verisi", ok: true, detail: `Son 7 gün: ${report.kpis[0]?.value ?? 0} oturum, ${report.kpis[1]?.value ?? 0} kullanıcı.` });
      }
    } else if (source === "bing") {
      const sites = await fetchBingSites(c.bing.apiKey);
      steps.push({ label: "API anahtarı", ok: true, detail: `${sites.length} site: ${sites.slice(0, 3).map((s) => `${s.url}${s.verified ? " ✓" : " (doğrulanmamış)"}`).join(", ")}` });
      const report = await fetchBingReport({ apiKey: c.bing.apiKey, siteUrl: c.bing.siteUrl, section: "overview", days: 28 });
      steps.push({ label: "Trafik verisi", ok: true, detail: `Son 28 gün: ${report.kpis[0]?.value ?? 0} tıklama, ${report.kpis[1]?.value ?? 0} gösterim.` });
    } else {
      const report = await fetchYandexReport({ token: c.yandex.token, counterId: c.yandex.counterId, section: "overview", days: 7 });
      steps.push({ label: "Metrika sayacı", ok: true, detail: `Son 7 gün: ${report.kpis[0]?.value ?? 0} ziyaret.` });
    }
    return { ok: true, steps };
  } catch (error) {
    const f = fail(error);
    steps.push({ label: "Sonuç", ok: false, detail: f.error });
    return { ok: false, steps, ...(f.hint ? { hint: f.hint } : {}) };
  }
}

export async function listProperties(siteId: string): Promise<{ ok: true; properties: GscPropertyEntry[] } | { ok: false; error: string; hint?: string }> {
  const c = await readConfig(siteId);
  try {
    return { ok: true, properties: await fetchGscProperties(await googleToken(siteId, c)) };
  } catch (error) {
    const f = fail(error);
    return { ok: false, error: f.error, ...(f.hint ? { hint: f.hint } : {}) };
  }
}

export async function inspect(siteId: string, url: string): Promise<{ ok: true; result: UrlInspection } | { ok: false; error: string; hint?: string }> {
  const c = await readConfig(siteId);
  if (!c.gsc.siteUrl || !c.gsc.refreshToken) return { ok: false, error: "Search Console bağlı değil.", hint: "Bağlantı bilgilerinden Google hesabını bağlayın." };
  // Yalnızca bu mülke ait adresler denetlenir
  const prefix = c.gsc.siteUrl.startsWith("sc-domain:") ? c.gsc.siteUrl.slice(10) : new URL(c.gsc.siteUrl).hostname;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, error: "Geçerli bir adres girin (https://…)." };
  }
  if (!(host === prefix || host.endsWith(`.${prefix}`) || host === prefix.replace(/^www\./, "") || `www.${host}` === prefix)) return { ok: false, error: `Adres "${prefix}" mülküne ait olmalı.` };
  try {
    return { ok: true, result: await inspectUrl({ accessToken: await googleToken(siteId, c), siteUrl: c.gsc.siteUrl, url }) };
  } catch (error) {
    const f = fail(error);
    return { ok: false, error: f.error, ...(f.hint ? { hint: f.hint } : {}) };
  }
}
