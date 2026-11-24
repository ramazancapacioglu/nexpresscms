import "server-only";
import { decryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";

export type PsiStrategy = "mobile" | "desktop";

export interface PsiSnapshot {
  url: string;
  strategy: PsiStrategy;
  fetchedAt: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    lcpMs: number | null;
    cls: number | null;
    fcpMs: number | null;
    tbtMs: number | null;
    ttfbMs: number | null;
    speedIndexMs: number | null;
  };
}

export interface PsiState {
  mobile: PsiSnapshot | null;
  desktop: PsiSnapshot | null;
  history: PsiSnapshot[];
  lastError: string | null;
  defaultUrl: string;
}

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function roundScore(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v * 100)));
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function resolveDefaultOrigin(siteDomain?: string | null): string {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl;
  if (siteDomain && siteDomain.trim()) {
    const clean = siteDomain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    return `https://${clean}`;
  }
  return "http://localhost:3000";
}

function resolvePsiApiKey(settings: Record<string, unknown>): string {
  const fromEnv = (process.env.PAGESPEED_API_KEY ?? process.env.CRUX_API_KEY ?? "").trim();
  if (fromEnv) return fromEnv;
  const rawPsi = typeof settings.psiApiKey === "string" ? settings.psiApiKey : "";
  if (rawPsi) {
    try {
      return decryptSecret(rawPsi).trim();
    } catch {
      if (!rawPsi.startsWith("enc:")) return rawPsi.trim();
    }
  }
  const rawCrux = typeof settings.cruxApiKey === "string" ? settings.cruxApiKey : "";
  if (rawCrux) {
    try {
      return decryptSecret(rawCrux).trim();
    } catch {
      if (!rawCrux.startsWith("enc:")) return rawCrux.trim();
    }
  }
  return "";
}

export async function loadPageSpeedState(siteId: string): Promise<PsiState> {
  const repo = getScopedRepository(siteId);
  const [site, plugin] = await Promise.all([
    repo.getSite(),
    repo.getSitePlugin(PERFORNEXT_PLUGIN_ID),
  ]);
  const settings = (plugin?.settings ?? {}) as Record<string, unknown>;
  const raw = (settings.psi ?? {}) as Partial<PsiState>;
  return {
    mobile: raw.mobile ?? null,
    desktop: raw.desktop ?? null,
    history: Array.isArray(raw.history) ? raw.history.slice(0, 10) : [],
    lastError: typeof raw.lastError === "string" ? raw.lastError : null,
    defaultUrl: resolveDefaultOrigin(site?.domain),
  };
}

/**
 * Google PageSpeed Insights API v5 (Lighthouse) üzerinden Mobil veya Masaüstü
 * 4 kategori puanı + Lab Core Web Vitals değerlerini ölçer ve eklenti ayarına kaydeder.
 */
export async function runPageSpeedAudit(
  siteId: string,
  inputUrl: string,
  strategy: PsiStrategy
): Promise<{ ok: true; snapshot: PsiSnapshot } | { ok: false; error: string }> {
  const repo = getScopedRepository(siteId);
  const [site, plugin] = await Promise.all([
    repo.getSite(),
    repo.getSitePlugin(PERFORNEXT_PLUGIN_ID),
  ]);
  const settings = (plugin?.settings ?? {}) as Record<string, unknown>;
  const defaultOrigin = resolveDefaultOrigin(site?.domain);

  // Yalnızca geçerli http(s) URL (göreli yol girildiyse site köküne bağla)
  let targetUrl = inputUrl.trim();
  if (!targetUrl) targetUrl = defaultOrigin + "/";
  else if (targetUrl.startsWith("/")) targetUrl = `${defaultOrigin}${targetUrl}`;
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "Yalnızca http veya https adresi ölçülebilir." };
    }
  } catch {
    return { ok: false, error: "Geçerli bir URL girin (örn. / veya /wolvox-erp)." };
  }

  const apiKey = resolvePsiApiKey(settings);
  const qs = new URLSearchParams({
    url: parsed.toString(),
    strategy,
    locale: "tr",
  });
  for (const cat of ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]) {
    qs.append("category", cat);
  }
  if (apiKey) qs.set("key", apiKey);

  let payload: Record<string, unknown>;
  try {
    const res = await fetch(`${PSI_ENDPOINT}?${qs.toString()}`, {
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const errObj = payload.error as { message?: string } | undefined;
      const msg = errObj?.message
        ? `PageSpeed API hatası: ${errObj.message}`
        : `PageSpeed API yanıt vermedi (HTTP ${res.status}).`;
      const prev = (settings.psi ?? {}) as Partial<PsiState>;
      await repo.saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
        settings: { psi: { ...prev, lastError: msg } },
      });
      return { ok: false, error: msg };
    }
  } catch {
    const msg = "PageSpeed Insights çağrısı zaman aşımına uğradı veya tamamlanamadı.";
    const prev = (settings.psi ?? {}) as Partial<PsiState>;
    await repo.saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
      settings: { psi: { ...prev, lastError: msg } },
    });
    return { ok: false, error: msg };
  }

  const lh = (payload.lighthouseResult ?? {}) as {
    categories?: Record<string, { score?: number }>;
    audits?: Record<string, { numericValue?: number }>;
  };
  const cats = lh.categories ?? {};
  const audits = lh.audits ?? {};

  const snapshot: PsiSnapshot = {
    url: parsed.toString(),
    strategy,
    fetchedAt: new Date().toISOString(),
    scores: {
      performance: roundScore(cats.performance?.score),
      accessibility: roundScore(cats.accessibility?.score),
      bestPractices: roundScore(cats["best-practices"]?.score),
      seo: roundScore(cats.seo?.score),
    },
    metrics: {
      lcpMs: numOrNull(audits["largest-contentful-paint"]?.numericValue),
      cls: numOrNull(audits["cumulative-layout-shift"]?.numericValue),
      fcpMs: numOrNull(audits["first-contentful-paint"]?.numericValue),
      tbtMs: numOrNull(audits["total-blocking-time"]?.numericValue),
      ttfbMs: numOrNull(audits["server-response-time"]?.numericValue),
      speedIndexMs: numOrNull(audits["speed-index"]?.numericValue),
    },
  };

  const prev = (settings.psi ?? {}) as Partial<PsiState>;
  const prevHistory = Array.isArray(prev.history) ? prev.history : [];
  const nextPsi = {
    mobile: strategy === "mobile" ? snapshot : (prev.mobile ?? null),
    desktop: strategy === "desktop" ? snapshot : (prev.desktop ?? null),
    history: [snapshot, ...prevHistory].slice(0, 10),
    lastError: null,
  };

  await repo.saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: { psi: nextPsi },
  });

  return { ok: true, snapshot };
}
