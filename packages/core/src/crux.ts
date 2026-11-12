/**
 * Chrome UX Report (CrUX) alan verisi (saf mantık). Gerçek Chrome kullanıcılarından 28 günlük toplanan ölçümdür;
 * Lighthouse/içerik tahmininden farklı olarak "ölçülen"dir. Yalnızca yeterli trafiği olan siteler için veri vardır.
 * Ağ çağrısı ve anahtar saklama `apps/cms/src/lib/perfornext/crux.ts` içindedir; burada istek gövdesi, yanıt çözümü,
 * eşikler ve değerlendirme (Core Web Vitals geçti/kaldı) bulunur.
 */

export const CRUX_FORM_FACTORS = ["ALL", "PHONE", "DESKTOP"] as const;
export type CruxFormFactor = (typeof CRUX_FORM_FACTORS)[number];

export type CruxMetricKey = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export type CruxRating = "good" | "needs-improvement" | "poor";

/** API'deki metrik adı → kısa anahtar. */
const API_METRICS: Record<string, CruxMetricKey> = {
  largest_contentful_paint: "lcp",
  interaction_to_next_paint: "inp",
  cumulative_layout_shift: "cls",
  first_contentful_paint: "fcp",
  experimental_time_to_first_byte: "ttfb",
};

/** Google'ın yayımladığı eşikler: p75 `good` altındaysa iyi, `poor` üstündeyse kötü. LCP/INP/FCP/TTFB ms, CLS birimsiz. */
export const CRUX_THRESHOLDS: Record<CruxMetricKey, { good: number; poor: number; label: string; unit: "ms" | "" }> = {
  lcp: { good: 2500, poor: 4000, label: "LCP (en büyük içerik)", unit: "ms" },
  inp: { good: 200, poor: 500, label: "INP (etkileşim)", unit: "ms" },
  cls: { good: 0.1, poor: 0.25, label: "CLS (düzen kayması)", unit: "" },
  fcp: { good: 1800, poor: 3000, label: "FCP (ilk içerik)", unit: "ms" },
  ttfb: { good: 800, poor: 1800, label: "TTFB (ilk bayt)", unit: "ms" },
};

/** Core Web Vitals sayılan üç metrik. */
export const CORE_WEB_VITALS: readonly CruxMetricKey[] = ["lcp", "inp", "cls"];

export const rateMetric = (key: CruxMetricKey, p75: number): CruxRating => {
  const t = CRUX_THRESHOLDS[key];
  return p75 <= t.good ? "good" : p75 <= t.poor ? "needs-improvement" : "poor";
};

export interface CruxMetric {
  key: CruxMetricKey;
  /** 75. yüzdelik (ms ya da CLS). */
  p75: number;
  rating: CruxRating;
  /** Ziyaretlerin yüzdesi (0–100): iyi / geliştirilmeli / kötü. Toplam ≈ 100. */
  good: number;
  needsImprovement: number;
  poor: number;
}

export interface CruxSnapshot {
  origin: string;
  formFactor: CruxFormFactor;
  /** ISO zaman: veri ne zaman çekildi. */
  fetchedAt: string;
  /** Toplama dönemi (YYYY-AA-GG). */
  period: { first: string; last: string } | null;
  metrics: CruxMetric[];
  /** Üç Core Web Vitals metriğinin üçü de iyiyse `true`; biri eksikse `null`. */
  cwvPass: boolean | null;
}

/** Yalnızca `https://alan-adi[:port]` kabul edilir (sabit uç noktaya gidecek isteğe yol/sorgu sızmaz). */
export function sanitizeCruxOrigin(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" && !(u.protocol === "http:" && /^(localhost|127\.0\.0\.1)(:|$)/.test(u.host))) return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** `records:queryRecord` istek gövdesi. `ALL` için `formFactor` gönderilmez. */
export function buildCruxRequest(origin: string, formFactor: CruxFormFactor): Record<string, unknown> {
  return { origin, ...(formFactor === "ALL" ? {} : { formFactor }), metrics: Object.keys(API_METRICS) };
}

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateOf = (d: unknown): string | null => {
  const o = d as { year?: unknown; month?: unknown; day?: unknown } | null | undefined;
  const y = num(o?.year), m = num(o?.month), day = num(o?.day);
  return y && m && day ? `${y}-${pad(m)}-${pad(day)}` : null;
};

/** CrUX yanıtını çözer; kayıt yoksa ya da hiçbir metrik okunamazsa `null`. Bozuk alanlar atlanır, kırılmaz. */
export function parseCruxResponse(json: unknown, meta: { origin: string; formFactor: CruxFormFactor; now?: Date }): CruxSnapshot | null {
  const record = (json as { record?: { metrics?: Record<string, unknown>; collectionPeriod?: { firstDate?: unknown; lastDate?: unknown } } } | null)?.record;
  if (!record || typeof record.metrics !== "object" || record.metrics === null) return null;
  const metrics: CruxMetric[] = [];
  for (const [apiName, key] of Object.entries(API_METRICS)) {
    const m = record.metrics[apiName] as { histogram?: Array<{ density?: unknown }>; percentiles?: { p75?: unknown } } | undefined;
    const p75 = num(m?.percentiles?.p75);
    const hist = Array.isArray(m?.histogram) ? m.histogram : [];
    const d = [num(hist[0]?.density), num(hist[1]?.density), num(hist[2]?.density)];
    if (p75 === null || d.some((x) => x === null)) continue;
    const pct = (x: number | null) => Math.round(((x ?? 0) * 100) * 10) / 10;
    metrics.push({ key, p75, rating: rateMetric(key, p75), good: pct(d[0]!), needsImprovement: pct(d[1]!), poor: pct(d[2]!) });
  }
  if (metrics.length === 0) return null;
  const first = dateOf(record.collectionPeriod?.firstDate);
  const last = dateOf(record.collectionPeriod?.lastDate);
  const cwv = CORE_WEB_VITALS.map((k) => metrics.find((x) => x.key === k));
  return {
    origin: meta.origin,
    formFactor: meta.formFactor,
    fetchedAt: (meta.now ?? new Date()).toISOString(),
    period: first && last ? { first, last } : null,
    metrics,
    cwvPass: cwv.every(Boolean) ? cwv.every((x) => x?.rating === "good") : null,
  };
}

export type CruxErrorKind = "no_data" | "bad_key" | "quota" | "error";

/** HTTP durumundan kullanıcıya gösterilecek sonuç; anahtar ya da gövde metni asla geri yazılmaz. */
export function classifyCruxError(status: number): { kind: CruxErrorKind; message: string } {
  if (status === 404) return { kind: "no_data", message: "Bu adres için CrUX verisi yok: site yeterli Chrome trafiği almıyor ya da henüz listelenmedi (genelde ayda birkaç bin ziyaret gerekir)." };
  if (status === 400 || status === 401 || status === 403) return { kind: "bad_key", message: "CrUX API anahtarı geçersiz ya da bu API için etkin değil (Google Cloud'da \"Chrome UX Report API\" açık olmalı)." };
  if (status === 429) return { kind: "quota", message: "CrUX API kotası doldu; biraz sonra tekrar deneyin." };
  return { kind: "error", message: `CrUX API beklenmeyen bir yanıt verdi (HTTP ${status}).` };
}

/** Anahtarı gösterim için maskeler: `AIza…x9Zq`. */
export const maskSecret = (value: string): string => (value.length <= 8 ? "••••" : `${value.slice(0, 4)}…${value.slice(-4)}`);

/** Ölçüm değerini okunur yazar: ms → `2,1 sn` / `340 ms`, CLS → `0,05`. */
export function formatCruxValue(key: CruxMetricKey, value: number, locale = "tr"): string {
  if (key === "cls") return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  return value >= 1000 ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1000)} sn` : `${Math.round(value)} ms`;
}
