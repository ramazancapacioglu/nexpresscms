/**
 * Webmaster rapor istemcileri (Google Search Console, Google Analytics 4, Bing Webmaster, Yandex Metrika).
 * Ağ çağrısı `fetchImpl` ile verilir (testte sahte); çıktı her kaynakta aynı biçimdedir (`WebmasterReport`):
 * panel bu tek biçimi çizer. Örnek/sahte veri üretilmez; hata `WebmasterApiError` ile kaynağına göre açıklanır.
 */

// ───────────────────────── Ortak türler ─────────────────────────

export type WebmasterSource = "gsc" | "ga4" | "bing" | "yandex";
export type ColumnKind = "text" | "url" | "int" | "pct" | "pos" | "duration" | "date";
export type KpiFormat = "int" | "pct" | "pos" | "duration";

export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  /** Önceki dönem (aynı uzunlukta): fark gösterimi için */
  previous?: number;
  format: KpiFormat;
  /** Düşüş iyi mi? (konum, hata sayısı gibi) */
  lowerIsBetter?: boolean;
}

export interface ReportSeries {
  key: string;
  label: string;
  format: KpiFormat;
  values: number[];
}

export interface ReportTimeline {
  dates: string[];
  series: ReportSeries[];
}

export interface ReportColumn {
  key: string;
  label: string;
  kind: ColumnKind;
}

export interface ReportTable {
  id: string;
  title: string;
  hint?: string;
  columns: ReportColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface WebmasterReport {
  source: WebmasterSource;
  section: string;
  generatedAt: string;
  range: { start: string; end: string; days: number };
  kpis: ReportKpi[];
  timeline?: ReportTimeline;
  tables: ReportTable[];
  /** Bilgi notları (veri gecikmesi, kapsam sınırı gibi) */
  notes: string[];
}

export type Fetcher = typeof fetch;

export type WebmasterErrorKind = "not_connected" | "auth" | "permission" | "api_disabled" | "not_found" | "quota" | "network" | "bad_request" | "unknown";

export class WebmasterApiError extends Error {
  constructor(
    message: string,
    readonly kind: WebmasterErrorKind,
    readonly hint?: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

// ───────────────────────── Yardımcılar ─────────────────────────

const DAY = 86_400_000;
export const isoDay = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (date: Date, n: number): Date => new Date(date.getTime() + n * DAY);
const round = (value: number, digits = 2): number => Math.round(value * 10 ** digits) / 10 ** digits;

/** Rapor dönemi: `endLag` gün geriden biter (kaynak veri gecikmesi), `days` gün sürer; önceki dönem hemen öncesidir. */
export function reportRange(days: number, endLag = 0, now: Date = new Date()) {
  const end = addDays(new Date(`${isoDay(now)}T00:00:00Z`), -endLag);
  const start = addDays(end, -(days - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: isoDay(start), end: isoDay(end), prevStart: isoDay(prevStart), prevEnd: isoDay(prevEnd), days };
}

/** `start`..`end` (dahil) tüm günler. */
export function dayList(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = new Date(`${start}T00:00:00Z`); isoDay(d) <= end; d = addDays(d, 1)) out.push(isoDay(d));
  return out;
}

const ctrOf = (clicks: number, impressions: number): number => (impressions > 0 ? round((clicks / impressions) * 100, 2) : 0);

async function request(fetchImpl: Fetcher, url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), init.timeoutMs ?? 25_000);
  try {
    return await fetchImpl(url, { ...init, signal: ctl.signal });
  } catch (error) {
    throw new WebmasterApiError((error as Error)?.name === "AbortError" ? "Sunucu zaman aşımına uğradı." : "Sunucuya ulaşılamadı (ağ hatası).", "network");
  } finally {
    clearTimeout(timer);
  }
}

// ───────────────────────── Hata açıklama ─────────────────────────

interface GoogleErrorBody {
  error?: string | { code?: number; message?: string; status?: string; errors?: Array<{ reason?: string; message?: string }>; details?: Array<{ reason?: string; metadata?: Record<string, string> }> };
  error_description?: string;
}

/** Google yanıt gövdesinden anlaşılır Türkçe hata üretir (neden + ne yapmalı). */
export function googleError(status: number, raw: string, area: "token" | "gsc" | "ga4"): WebmasterApiError {
  let body: GoogleErrorBody = {};
  try {
    body = JSON.parse(raw) as GoogleErrorBody;
  } catch {
    body = {};
  }
  const err = typeof body.error === "object" ? body.error : undefined;
  const code = typeof body.error === "string" ? body.error : (err?.status ?? "");
  const reason = err?.errors?.[0]?.reason ?? err?.details?.find((d) => d.reason)?.reason ?? "";
  const message = (err?.message ?? body.error_description ?? raw).replace(/\s+/g, " ").slice(0, 220);

  if (area === "token") {
    if (code === "invalid_grant") return new WebmasterApiError("Google yenileme jetonu geçersiz ya da iptal edilmiş.", "auth", "Bağlantı bilgilerinde Google hesabını yeniden bağlayın.", status);
    if (code === "invalid_client" || code === "unauthorized_client") return new WebmasterApiError("OAuth istemci kimliği veya sırrı hatalı.", "auth", "Google Cloud'daki istemci kimliği ve sırrı bağlantı bilgilerinde yeniden kaydedin.", status);
    return new WebmasterApiError(`Google kimlik doğrulaması başarısız: ${message}`, "auth", undefined, status);
  }
  if (reason === "SERVICE_DISABLED" || reason === "accessNotConfigured" || /has not been used|is disabled|API has not been enabled/i.test(message)) {
    const api = area === "ga4" ? "Google Analytics Data API" : "Google Search Console API";
    return new WebmasterApiError(`${api} Google Cloud projenizde etkin değil.`, "api_disabled", `Google Cloud → API'ler ve Hizmetler → Kitaplık'tan "${api}"yi etkinleştirin, birkaç dakika bekleyin.`, status);
  }
  if (status === 403) {
    const what = area === "ga4" ? "bu Analytics mülküne" : "bu Search Console mülküne";
    return new WebmasterApiError(`Bağlı Google hesabının ${what} erişim izni yok.`, "permission", area === "ga4" ? "Analytics → Yönetici → Mülk erişim yönetimi'nde bu hesabı ekleyin (Görüntüleyici yeter)." : "Search Console → Ayarlar → Kullanıcılar ve izinler'de bu hesabı ekleyin ya da mülk adresini doğru yazdığınızdan emin olun.", status);
  }
  if (status === 404 || code === "NOT_FOUND") {
    return new WebmasterApiError(area === "ga4" ? "Analytics mülkü bulunamadı." : "Search Console mülkü bulunamadı.", "not_found", area === "ga4" ? "Sayısal Mülk Kimliği'ni (G- ile başlayan ölçüm kimliği değil) Analytics → Yönetici → Mülk ayrıntıları'ndan kopyalayın." : "Mülk adresi Search Console'daki ile birebir aynı olmalı (örn. sc-domain:alanadi.com veya https://www.alanadi.com/). Mülkleri listeleyip seçebilirsiniz.", status);
  }
  if (status === 429) return new WebmasterApiError("Google istek kotası doldu.", "quota", "Birkaç dakika sonra yeniden deneyin.", status);
  if (status === 400) return new WebmasterApiError(`Google isteği reddetti: ${message}`, "bad_request", undefined, status);
  return new WebmasterApiError(`Google hatası (${status}): ${message}`, "unknown", undefined, status);
}

// ───────────────────────── Google: erişim jetonu ─────────────────────────

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function googleAccessToken(credentials: GoogleCredentials, fetchImpl: Fetcher = fetch): Promise<string> {
  if (!credentials.clientId || !credentials.clientSecret) throw new WebmasterApiError("OAuth istemci kimliği ve sırrı kayıtlı değil.", "not_connected", "Bağlantı bilgilerine istemci kimliği ve sırrını girin.");
  if (!credentials.refreshToken) throw new WebmasterApiError("Google hesabı henüz bağlanmadı (yenileme jetonu yok).", "not_connected", 'Bağlantı bilgilerinde "Google ile bağlan"a basıp izin verin.');
  const res = await request(fetchImpl, "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: credentials.clientId, client_secret: credentials.clientSecret, refresh_token: credentials.refreshToken, grant_type: "refresh_token" }),
  });
  const text = await res.text();
  if (!res.ok) throw googleError(res.status, text, "token");
  const data = JSON.parse(text) as { access_token?: string };
  if (!data.access_token) throw new WebmasterApiError("Google erişim jetonu boş döndü.", "auth");
  return data.access_token;
}

async function googleJson<T>(fetchImpl: Fetcher, area: "gsc" | "ga4", token: string, url: string, body?: unknown): Promise<T> {
  const res = await request(fetchImpl, url, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await res.text();
  if (!res.ok) throw googleError(res.status, text, area);
  return JSON.parse(text) as T;
}

// ───────────────────────── Google Search Console ─────────────────────────

interface GscApiRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export type GscSection = "overview" | "queries" | "pages" | "countries" | "devices" | "appearance" | "sitemaps";

const GSC_BASE = "https://www.googleapis.com/webmasters/v3/sites";

async function gscQuery(fetchImpl: Fetcher, token: string, siteUrl: string, body: Record<string, unknown>): Promise<GscApiRow[]> {
  const data = await googleJson<{ rows?: GscApiRow[] }>(fetchImpl, "gsc", token, `${GSC_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, body);
  return data.rows ?? [];
}

const perfColumns = (first: ReportColumn): ReportColumn[] => [
  first,
  { key: "clicks", label: "Tıklama", kind: "int" },
  { key: "impressions", label: "Gösterim", kind: "int" },
  { key: "ctr", label: "TO", kind: "pct" },
  { key: "position", label: "Konum", kind: "pos" },
];

const perfRow = (label: string, row: GscApiRow): Record<string, string | number> => ({
  label,
  clicks: row.clicks ?? 0,
  impressions: row.impressions ?? 0,
  ctr: round((row.ctr ?? 0) * 100, 2),
  position: round(row.position ?? 0, 1),
});

const DEVICE_LABEL: Record<string, string> = { DESKTOP: "Masaüstü", MOBILE: "Mobil", TABLET: "Tablet" };
const APPEARANCE_LABEL: Record<string, string> = {
  AMP_BLUE_LINK: "AMP",
  RICH_RESULT: "Zengin sonuç",
  FAQ_RICH_RESULT: "SSS zengin sonucu",
  PRODUCT_SNIPPETS: "Ürün snippet'i",
  REVIEW_SNIPPET: "Yorum snippet'i",
  VIDEO: "Video",
  WEB_STORY: "Web hikâyesi",
  TRANSLATED_RESULT: "Çevrilmiş sonuç",
  ORGANIC_SHOPPING: "Alışveriş",
  MERCHANT_LISTINGS: "Satıcı listesi",
  SITELINKS: "Site bağlantıları",
};

/** Search Console'un en çok `days` gün geriden veri verdiği kabul edilir (son ~2 gün eksiktir). */
export const GSC_LAG_DAYS = 2;

export async function fetchGscReport(input: { fetchImpl?: Fetcher; accessToken: string; siteUrl: string; section: GscSection; days: number; now?: Date }): Promise<WebmasterReport> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { accessToken: token, siteUrl, section, days } = input;
  const range = reportRange(days, GSC_LAG_DAYS, input.now);
  const base = { source: "gsc" as const, section, generatedAt: (input.now ?? new Date()).toISOString(), range: { start: range.start, end: range.end, days }, notes: [`Search Console verisi yaklaşık ${GSC_LAG_DAYS} gün gecikmelidir; ${range.start} – ${range.end} aralığı gösteriliyor.`] };

  if (section === "overview") {
    const rows = await gscQuery(fetchImpl, token, siteUrl, { startDate: range.prevStart, endDate: range.end, dimensions: ["date"], rowLimit: 25_000 });
    const byDate = new Map(rows.map((r) => [r.keys?.[0] ?? "", r]));
    const dates = dayList(range.start, range.end);
    const sum = (list: string[]) => {
      let clicks = 0;
      let impressions = 0;
      let weighted = 0;
      for (const d of list) {
        const r = byDate.get(d);
        if (!r) continue;
        clicks += r.clicks ?? 0;
        impressions += r.impressions ?? 0;
        weighted += (r.position ?? 0) * (r.impressions ?? 0);
      }
      return { clicks, impressions, ctr: ctrOf(clicks, impressions), position: impressions > 0 ? round(weighted / impressions, 1) : 0 };
    };
    const cur = sum(dates);
    const prev = sum(dayList(range.prevStart, range.prevEnd));
    return {
      ...base,
      kpis: [
        { key: "clicks", label: "Tıklama", value: cur.clicks, previous: prev.clicks, format: "int" },
        { key: "impressions", label: "Gösterim", value: cur.impressions, previous: prev.impressions, format: "int" },
        { key: "ctr", label: "Ortalama TO", value: cur.ctr, previous: prev.ctr, format: "pct" },
        { key: "position", label: "Ortalama konum", value: cur.position, previous: prev.position, format: "pos", lowerIsBetter: true },
      ],
      timeline: {
        dates,
        series: [
          { key: "clicks", label: "Tıklama", format: "int", values: dates.map((d) => byDate.get(d)?.clicks ?? 0) },
          { key: "impressions", label: "Gösterim", format: "int", values: dates.map((d) => byDate.get(d)?.impressions ?? 0) },
        ],
      },
      tables: [],
    };
  }

  if (section === "sitemaps") {
    const data = await googleJson<{ sitemap?: Array<{ path?: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; isSitemapsIndex?: boolean; warnings?: string | number; errors?: string | number; contents?: Array<{ type?: string; submitted?: string | number; indexed?: string | number }> }> }>(fetchImpl, "gsc", token, `${GSC_BASE}/${encodeURIComponent(siteUrl)}/sitemaps`);
    const rows = (data.sitemap ?? []).map((s) => {
      const web = (s.contents ?? []).find((c) => c.type === "web") ?? s.contents?.[0];
      return {
        path: s.path ?? "",
        type: s.isSitemapsIndex ? "Dizin" : "Site haritası",
        submitted: Number(web?.submitted ?? 0),
        indexed: Number(web?.indexed ?? 0),
        warnings: Number(s.warnings ?? 0),
        errors: Number(s.errors ?? 0),
        lastDownloaded: (s.lastDownloaded ?? "").slice(0, 10),
        status: s.isPending ? "Bekliyor" : Number(s.errors ?? 0) > 0 ? "Hatalı" : "Tamam",
      };
    });
    return {
      ...base,
      range: { ...base.range },
      notes: ["Google, 2023'ten beri site haritasındaki \"dizinlenen\" sayısını çoğu mülkte 0 gösterir; asıl dizin durumu için Sayfa denetimi'ni kullanın."],
      kpis: [
        { key: "count", label: "Site haritası", value: rows.length, format: "int" },
        { key: "submitted", label: "Gönderilen URL", value: rows.reduce((a, r) => a + r.submitted, 0), format: "int" },
        { key: "errors", label: "Hata", value: rows.reduce((a, r) => a + r.errors, 0), format: "int", lowerIsBetter: true },
        { key: "warnings", label: "Uyarı", value: rows.reduce((a, r) => a + r.warnings, 0), format: "int", lowerIsBetter: true },
      ],
      tables: [
        {
          id: "sitemaps",
          title: "Gönderilen site haritaları",
          columns: [
            { key: "path", label: "Adres", kind: "url" },
            { key: "type", label: "Tür", kind: "text" },
            { key: "submitted", label: "Gönderilen", kind: "int" },
            { key: "indexed", label: "Dizinlenen", kind: "int" },
            { key: "errors", label: "Hata", kind: "int" },
            { key: "warnings", label: "Uyarı", kind: "int" },
            { key: "lastDownloaded", label: "Son okuma", kind: "date" },
            { key: "status", label: "Durum", kind: "text" },
          ],
          rows,
        },
      ],
    };
  }

  const dimension = section === "queries" ? "query" : section === "pages" ? "page" : section === "countries" ? "country" : section === "devices" ? "device" : "searchAppearance";
  const rows = await gscQuery(fetchImpl, token, siteUrl, { startDate: range.start, endDate: range.end, dimensions: [dimension], rowLimit: dimension === "query" || dimension === "page" ? 250 : 100 });
  const label = (key: string) => (dimension === "device" ? (DEVICE_LABEL[key] ?? key) : dimension === "searchAppearance" ? (APPEARANCE_LABEL[key] ?? key) : dimension === "country" ? key.toUpperCase() : key);
  const titles = { query: "Arama sorguları", page: "Sayfalar", country: "Ülkeler", device: "Cihazlar", searchAppearance: "Arama görünümü" } as const;
  const firstLabel = { query: "Sorgu", page: "Sayfa", country: "Ülke", device: "Cihaz", searchAppearance: "Görünüm" } as const;
  return {
    ...base,
    kpis: [],
    tables: [
      {
        id: dimension,
        title: titles[dimension],
        hint: dimension === "searchAppearance" ? "Sonuçların nasıl göründüğü (zengin sonuç, SSS, video…). Boşsa siteniz bu görünümlerde çıkmamıştır." : undefined,
        columns: perfColumns({ key: "label", label: firstLabel[dimension], kind: dimension === "page" ? "url" : "text" }),
        rows: rows.map((r) => perfRow(label(r.keys?.[0] ?? ""), r)),
      },
    ],
  };
}

export interface GscPropertyEntry {
  siteUrl: string;
  permissionLevel: string;
}

/** Hesabın erişebildiği Search Console mülkleri (mülk adresini seçtirmek için). */
export async function fetchGscProperties(accessToken: string, fetchImpl: Fetcher = fetch): Promise<GscPropertyEntry[]> {
  const data = await googleJson<{ siteEntry?: GscPropertyEntry[] }>(fetchImpl, "gsc", accessToken, GSC_BASE);
  return data.siteEntry ?? [];
}

export interface UrlInspection {
  url: string;
  verdict: string;
  coverage: string;
  indexingState: string;
  robots: string;
  lastCrawl: string;
  crawledAs: string;
  googleCanonical: string;
  userCanonical: string;
  mobile: string;
  richResults: string;
  inspectionLink: string;
}

const VERDICT: Record<string, string> = { PASS: "Geçti", PARTIAL: "Kısmi", FAIL: "Başarısız", NEUTRAL: "Nötr", VERDICT_UNSPECIFIED: "Belirsiz" };

/** URL Inspection API: sayfanın Google dizin durumu. */
export async function inspectUrl(input: { fetchImpl?: Fetcher; accessToken: string; siteUrl: string; url: string }): Promise<UrlInspection> {
  const data = await googleJson<{ inspectionResult?: { inspectionResultLink?: string; indexStatusResult?: { verdict?: string; coverageState?: string; indexingState?: string; robotsTxtState?: string; lastCrawlTime?: string; crawledAs?: string; googleCanonical?: string; userCanonical?: string }; mobileUsabilityResult?: { verdict?: string }; richResultsResult?: { verdict?: string } } }>(
    input.fetchImpl ?? fetch,
    "gsc",
    input.accessToken,
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    { inspectionUrl: input.url, siteUrl: input.siteUrl, languageCode: "tr" },
  );
  const result = data.inspectionResult ?? {};
  const index = result.indexStatusResult ?? {};
  return {
    url: input.url,
    verdict: VERDICT[index.verdict ?? ""] ?? index.verdict ?? "—",
    coverage: index.coverageState ?? "—",
    indexingState: index.indexingState ?? "—",
    robots: index.robotsTxtState ?? "—",
    lastCrawl: (index.lastCrawlTime ?? "").slice(0, 16).replace("T", " "),
    crawledAs: index.crawledAs ?? "—",
    googleCanonical: index.googleCanonical ?? "",
    userCanonical: index.userCanonical ?? "",
    mobile: VERDICT[result.mobileUsabilityResult?.verdict ?? ""] ?? "—",
    richResults: VERDICT[result.richResultsResult?.verdict ?? ""] ?? "—",
    inspectionLink: result.inspectionResultLink ?? "",
  };
}

// ───────────────────────── Google Analytics 4 ─────────────────────────

export type Ga4Section = "overview" | "channels" | "pages" | "sources" | "geo" | "devices" | "organic" | "ai" | "realtime";

interface Ga4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

async function ga4Run(fetchImpl: Fetcher, token: string, propertyId: string, body: Record<string, unknown>, realtime = false): Promise<Ga4Row[]> {
  const id = propertyId.replace(/^properties\//, "").trim();
  const data = await googleJson<{ rows?: Ga4Row[] }>(fetchImpl, "ga4", token, `https://analyticsdata.googleapis.com/v1beta/properties/${id}:${realtime ? "runRealtimeReport" : "runReport"}`, body);
  return data.rows ?? [];
}

const num = (row: Ga4Row, i: number): number => Number(row.metricValues?.[i]?.value ?? 0);
const dim = (row: Ga4Row, i: number): string => row.dimensionValues?.[i]?.value ?? "";

/** Yapay zekâ asistanı/arama kaynakları (sessionSource ile eşleşir). */
export const AI_REFERRER_RULES: Array<{ test: RegExp; label: string }> = [
  { test: /chatgpt|openai/i, label: "ChatGPT" },
  { test: /perplexity/i, label: "Perplexity" },
  { test: /copilot|bing\.com\/chat/i, label: "Copilot" },
  { test: /claude|anthropic/i, label: "Claude" },
  { test: /gemini|bard\.google/i, label: "Gemini" },
  { test: /you\.com/i, label: "You.com" },
  { test: /phind/i, label: "Phind" },
  { test: /poe\.com/i, label: "Poe" },
  { test: /grok|x\.ai/i, label: "Grok" },
  { test: /deepseek/i, label: "DeepSeek" },
  { test: /meta\.ai/i, label: "Meta AI" },
  { test: /mistral/i, label: "Mistral" },
];

const ga4Tables: Record<Exclude<Ga4Section, "overview" | "ai" | "realtime">, { dims: string[]; metrics: string[]; title: string; columns: ReportColumn[]; filter?: unknown }> = {
  channels: { dims: ["sessionDefaultChannelGroup"], metrics: ["sessions", "totalUsers", "engagementRate"], title: "Kanallar", columns: [{ key: "d0", label: "Kanal", kind: "text" }] },
  pages: { dims: ["pagePath"], metrics: ["screenPageViews", "totalUsers", "engagementRate"], title: "En çok görüntülenen sayfalar", columns: [{ key: "d0", label: "Sayfa", kind: "url" }] },
  sources: { dims: ["sessionSource", "sessionMedium"], metrics: ["sessions", "totalUsers", "engagementRate"], title: "Kaynak / ortam", columns: [{ key: "d0", label: "Kaynak", kind: "text" }, { key: "d1", label: "Ortam", kind: "text" }] },
  geo: { dims: ["country", "city"], metrics: ["sessions", "totalUsers", "engagementRate"], title: "Konum", columns: [{ key: "d0", label: "Ülke", kind: "text" }, { key: "d1", label: "Şehir", kind: "text" }] },
  devices: { dims: ["deviceCategory", "operatingSystem"], metrics: ["sessions", "totalUsers", "engagementRate"], title: "Cihaz ve işletim sistemi", columns: [{ key: "d0", label: "Cihaz", kind: "text" }, { key: "d1", label: "İşletim sistemi", kind: "text" }] },
  organic: { dims: ["landingPage"], metrics: ["sessions", "totalUsers", "engagementRate"], title: "Organik arama açılış sayfaları", columns: [{ key: "d0", label: "Açılış sayfası", kind: "url" }], filter: { filter: { fieldName: "sessionMedium", stringFilter: { value: "organic", matchType: "EXACT" } } } },
};

const metricColumns = (first: string): ReportColumn[] => (first === "screenPageViews"
  ? [{ key: "m0", label: "Görüntüleme", kind: "int" }, { key: "m1", label: "Kullanıcı", kind: "int" }, { key: "m2", label: "Etkileşim oranı", kind: "pct" }]
  : [{ key: "m0", label: "Oturum", kind: "int" }, { key: "m1", label: "Kullanıcı", kind: "int" }, { key: "m2", label: "Etkileşim oranı", kind: "pct" }]);

export async function fetchGa4Report(input: { fetchImpl?: Fetcher; accessToken: string; propertyId: string; section: Ga4Section; days: number; now?: Date }): Promise<WebmasterReport> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { accessToken: token, propertyId, section, days } = input;
  const range = reportRange(days, 0, input.now);
  const base = { source: "ga4" as const, section, generatedAt: (input.now ?? new Date()).toISOString(), range: { start: range.start, end: range.end, days }, notes: [] as string[] };

  if (section === "overview") {
    const metrics = ["sessions", "totalUsers", "newUsers", "screenPageViews", "engagementRate", "averageSessionDuration"].map((name) => ({ name }));
    const [series, previous] = await Promise.all([
      ga4Run(fetchImpl, token, propertyId, { dateRanges: [{ startDate: range.start, endDate: range.end }], dimensions: [{ name: "date" }], metrics, orderBys: [{ dimension: { dimensionName: "date" } }], limit: 400 }),
      ga4Run(fetchImpl, token, propertyId, { dateRanges: [{ startDate: range.prevStart, endDate: range.prevEnd }], metrics }),
    ]);
    const byDate = new Map(series.map((r) => [`${dim(r, 0).slice(0, 4)}-${dim(r, 0).slice(4, 6)}-${dim(r, 0).slice(6, 8)}`, r]));
    const dates = dayList(range.start, range.end);
    const at = (i: number) => dates.map((d) => num(byDate.get(d) ?? {}, i));
    const total = (i: number) => at(i).reduce((a, b) => a + b, 0);
    const sessions = at(0);
    const weighted = (i: number) => {
      const w = sessions.reduce((a, b) => a + b, 0);
      return w > 0 ? round(dates.reduce((acc, _d, k) => acc + at(i)[k]! * sessions[k]!, 0) / w, 4) : 0;
    };
    const prev = previous[0] ?? {};
    return {
      ...base,
      kpis: [
        { key: "sessions", label: "Oturum", value: total(0), previous: num(prev, 0), format: "int" },
        { key: "users", label: "Kullanıcı", value: total(1), previous: num(prev, 1), format: "int" },
        { key: "newUsers", label: "Yeni kullanıcı", value: total(2), previous: num(prev, 2), format: "int" },
        { key: "views", label: "Sayfa görüntüleme", value: total(3), previous: num(prev, 3), format: "int" },
        { key: "engagement", label: "Etkileşim oranı", value: round(weighted(4) * 100, 1), previous: round(num(prev, 4) * 100, 1), format: "pct" },
        { key: "duration", label: "Ort. oturum süresi", value: round(weighted(5), 0), previous: round(num(prev, 5), 0), format: "duration" },
      ],
      timeline: {
        dates,
        series: [
          { key: "sessions", label: "Oturum", format: "int", values: sessions },
          { key: "users", label: "Kullanıcı", format: "int", values: at(1) },
          { key: "views", label: "Sayfa görüntüleme", format: "int", values: at(3) },
        ],
      },
      tables: [],
    };
  }

  if (section === "realtime") {
    const [byCountry, byPage] = await Promise.all([
      ga4Run(fetchImpl, token, propertyId, { dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], limit: 25 }, true),
      ga4Run(fetchImpl, token, propertyId, { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "activeUsers" }], limit: 25 }, true),
    ]);
    return {
      ...base,
      notes: ["Son 30 dakika içinde sitede etkin kullanıcılar."],
      kpis: [{ key: "active", label: "Şu an etkin kullanıcı", value: byCountry.reduce((a, r) => a + num(r, 0), 0), format: "int" }],
      tables: [
        { id: "rt-country", title: "Ülkeye göre", columns: [{ key: "d0", label: "Ülke", kind: "text" }, { key: "m0", label: "Kullanıcı", kind: "int" }], rows: byCountry.map((r) => ({ d0: dim(r, 0), m0: num(r, 0) })) },
        { id: "rt-page", title: "Sayfaya göre", columns: [{ key: "d0", label: "Sayfa", kind: "text" }, { key: "m0", label: "Kullanıcı", kind: "int" }], rows: byPage.map((r) => ({ d0: dim(r, 0), m0: num(r, 0) })) },
      ],
    };
  }

  if (section === "ai") {
    const rows = await ga4Run(fetchImpl, token, propertyId, { dateRanges: [{ startDate: range.start, endDate: range.end }], dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagementRate" }], limit: 1000 });
    const byLabel = new Map<string, { sessions: number; users: number; sources: string[]; engaged: number }>();
    for (const r of rows) {
      const source = dim(r, 0);
      const rule = AI_REFERRER_RULES.find((x) => x.test.test(source));
      if (!rule) continue;
      const cur = byLabel.get(rule.label) ?? { sessions: 0, users: 0, sources: [], engaged: 0 };
      cur.sessions += num(r, 0);
      cur.users += num(r, 1);
      cur.engaged += num(r, 0) * num(r, 2);
      if (!cur.sources.includes(source)) cur.sources.push(source);
      byLabel.set(rule.label, cur);
    }
    const table = [...byLabel.entries()].sort((a, b) => b[1].sessions - a[1].sessions).map(([label, v]) => ({ d0: label, d1: v.sources.join(", "), m0: v.sessions, m1: v.users, m2: v.sessions > 0 ? round((v.engaged / v.sessions) * 100, 1) : 0 }));
    return {
      ...base,
      notes: ["Yapay zekâ asistanlarından (ChatGPT, Perplexity, Gemini, Claude, Copilot…) gelen oturumlar kaynak adından ayıklanır; asistanların çoğu kaynak göndermez, gerçek sayı daha yüksek olabilir."],
      kpis: [{ key: "ai", label: "Yapay zekâ kaynaklı oturum", value: table.reduce((a, r) => a + r.m0, 0), format: "int" }],
      tables: [{ id: "ai", title: "Yapay zekâ kaynakları", columns: [{ key: "d0", label: "Kaynak", kind: "text" }, { key: "d1", label: "Alan adları", kind: "text" }, { key: "m0", label: "Oturum", kind: "int" }, { key: "m1", label: "Kullanıcı", kind: "int" }, { key: "m2", label: "Etkileşim oranı", kind: "pct" }], rows: table }],
    };
  }

  const def = ga4Tables[section];
  const rows = await ga4Run(fetchImpl, token, propertyId, {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: def.dims.map((name) => ({ name })),
    metrics: def.metrics.map((name) => ({ name })),
    ...(def.filter ? { dimensionFilter: def.filter } : {}),
    orderBys: [{ metric: { metricName: def.metrics[0] }, desc: true }],
    limit: 100,
  });
  return {
    ...base,
    kpis: [],
    tables: [
      {
        id: section,
        title: def.title,
        columns: [...def.columns, ...metricColumns(def.metrics[0]!)],
        rows: rows.map((r) => ({ ...Object.fromEntries(def.dims.map((_n, i) => [`d${i}`, dim(r, i) || "(belirsiz)"])), m0: num(r, 0), m1: num(r, 1), m2: round(num(r, 2) * 100, 1) })),
      },
    ],
  };
}

// ───────────────────────── Bing Webmaster ─────────────────────────

export type BingSection = "overview" | "queries" | "pages" | "crawl" | "sitemaps" | "links";

/** `/Date(1752969600000)/` → `2025-07-20` (UTC). */
export function parseBingDate(value: unknown): string {
  const m = /\/Date\((-?\d+)/.exec(String(value ?? ""));
  return m ? isoDay(new Date(Number(m[1]))) : "";
}

async function bingGet<T>(fetchImpl: Fetcher, apiKey: string, siteUrl: string | null, method: string): Promise<T> {
  const params = new URLSearchParams({ apikey: apiKey, ...(siteUrl ? { siteUrl } : {}) });
  const res = await request(fetchImpl, `https://ssl.bing.com/webmaster/api.svc/json/${method}?${params}`);
  const text = await res.text();
  if (!res.ok) {
    let message = text.slice(0, 200);
    try {
      message = (JSON.parse(text) as { Message?: string }).Message ?? message;
    } catch {
      // ham metin
    }
    if (res.status === 401 || res.status === 403 || /apikey|not authorized|invalid/i.test(message)) throw new WebmasterApiError("Bing API anahtarı geçersiz ya da bu siteye yetkisiz.", "auth", "Bing Webmaster Tools → Ayarlar → API erişimi'nden anahtarı yeniden oluşturup kaydedin.", res.status);
    throw new WebmasterApiError(`Bing hatası (${res.status}): ${message}`, "unknown", undefined, res.status);
  }
  const body = JSON.parse(text) as { d?: T };
  return (body.d ?? (body as unknown as T)) as T;
}

interface BingStatRow {
  Query?: string;
  Clicks?: number;
  Impressions?: number;
  AvgImpressionPosition?: number;
  Date?: string;
}

/** Haftalık Bing satırlarını `start`..`end` içinde anahtara göre toplar (konum: gösterim ağırlıklı). */
export function aggregateBingRows(rows: BingStatRow[], start: string, end: string) {
  const map = new Map<string, { clicks: number; impressions: number; weighted: number; positioned: number }>();
  for (const r of rows) {
    const date = parseBingDate(r.Date);
    if (date && (date < start || date > end)) continue;
    const key = (r.Query ?? "").trim();
    if (!key) continue;
    const cur = map.get(key) ?? { clicks: 0, impressions: 0, weighted: 0, positioned: 0 };
    cur.clicks += r.Clicks ?? 0;
    cur.impressions += r.Impressions ?? 0;
    if ((r.AvgImpressionPosition ?? -1) > 0) {
      cur.weighted += (r.AvgImpressionPosition ?? 0) * (r.Impressions ?? 0);
      cur.positioned += r.Impressions ?? 0;
    }
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, clicks: v.clicks, impressions: v.impressions, ctr: ctrOf(v.clicks, v.impressions), position: v.positioned > 0 ? round(v.weighted / v.positioned, 1) : 0 }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

export async function fetchBingReport(input: { fetchImpl?: Fetcher; apiKey: string; siteUrl: string; section: BingSection; days: number; now?: Date }): Promise<WebmasterReport> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { apiKey, siteUrl, section, days } = input;
  const range = reportRange(days, 0, input.now);
  const base = { source: "bing" as const, section, generatedAt: (input.now ?? new Date()).toISOString(), range: { start: range.start, end: range.end, days }, notes: [] as string[] };

  if (section === "overview") {
    const [traffic, queries] = await Promise.all([
      bingGet<Array<{ Clicks?: number; Impressions?: number; Date?: string }>>(fetchImpl, apiKey, siteUrl, "GetRankAndTrafficStats"),
      bingGet<BingStatRow[]>(fetchImpl, apiKey, siteUrl, "GetQueryStats"),
    ]);
    const byDate = new Map(traffic.map((r) => [parseBingDate(r.Date), r]));
    const dates = dayList(range.start, range.end);
    const sumRange = (list: string[]) => list.reduce((acc, d) => { const r = byDate.get(d); return { clicks: acc.clicks + (r?.Clicks ?? 0), impressions: acc.impressions + (r?.Impressions ?? 0) }; }, { clicks: 0, impressions: 0 });
    const cur = sumRange(dates);
    const prev = sumRange(dayList(range.prevStart, range.prevEnd));
    const pos = (start: string, end: string) => { const a = aggregateBingRows(queries, start, end); const w = a.reduce((s, r) => s + r.impressions, 0); return w > 0 ? round(a.reduce((s, r) => s + r.position * r.impressions, 0) / w, 1) : 0; };
    const lastDate = traffic.map((r) => parseBingDate(r.Date)).sort().pop() ?? "";
    return {
      ...base,
      notes: lastDate && lastDate < range.end ? [`Bing verisi ${lastDate} tarihine kadar geliyor (birkaç gün gecikme olağandır).`] : [],
      kpis: [
        { key: "clicks", label: "Tıklama", value: cur.clicks, previous: prev.clicks, format: "int" },
        { key: "impressions", label: "Gösterim", value: cur.impressions, previous: prev.impressions, format: "int" },
        { key: "ctr", label: "Ortalama TO", value: ctrOf(cur.clicks, cur.impressions), previous: ctrOf(prev.clicks, prev.impressions), format: "pct" },
        { key: "position", label: "Ortalama konum", value: pos(range.start, range.end), previous: pos(range.prevStart, range.prevEnd), format: "pos", lowerIsBetter: true },
      ],
      timeline: {
        dates,
        series: [
          { key: "clicks", label: "Tıklama", format: "int", values: dates.map((d) => byDate.get(d)?.Clicks ?? 0) },
          { key: "impressions", label: "Gösterim", format: "int", values: dates.map((d) => byDate.get(d)?.Impressions ?? 0) },
        ],
      },
      tables: [],
    };
  }

  if (section === "queries" || section === "pages") {
    const rows = await bingGet<BingStatRow[]>(fetchImpl, apiKey, siteUrl, section === "queries" ? "GetQueryStats" : "GetPageStats");
    const agg = aggregateBingRows(rows, range.start, range.end).slice(0, 250);
    return {
      ...base,
      kpis: [],
      notes: ["Bing sorgu ve sayfa verisi haftalık gelir; seçilen aralıktaki haftalar toplanır."],
      tables: [{ id: section, title: section === "queries" ? "Arama sorguları" : "Sayfalar", columns: perfColumns({ key: "label", label: section === "queries" ? "Sorgu" : "Sayfa", kind: section === "pages" ? "url" : "text" }), rows: agg.map((r) => ({ label: r.key, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })) }],
    };
  }

  if (section === "crawl") {
    const rows = await bingGet<Array<Record<string, number | string>>>(fetchImpl, apiKey, siteUrl, "GetCrawlStats");
    const byDate = new Map(rows.map((r) => [parseBingDate(r.Date), r]));
    const dates = dayList(range.start, range.end);
    const sumOf = (key: string, list: string[]) => list.reduce((a, d) => a + Number(byDate.get(d)?.[key] ?? 0), 0);
    const latest = [...byDate.keys()].sort().pop() ?? "";
    const latestRow = byDate.get(latest) ?? {};
    const prevDates = dayList(range.prevStart, range.prevEnd);
    return {
      ...base,
      notes: latest ? [`Son tarama kaydı: ${latest}.`] : ["Bing henüz tarama kaydı vermedi."],
      kpis: [
        { key: "indexed", label: "Dizindeki sayfa", value: Number(latestRow.InIndex ?? 0), format: "int" },
        { key: "crawled", label: "Taranan sayfa", value: sumOf("CrawledPages", dates), previous: sumOf("CrawledPages", prevDates), format: "int" },
        { key: "errors", label: "Tarama hatası", value: sumOf("CrawlErrors", dates), previous: sumOf("CrawlErrors", prevDates), format: "int", lowerIsBetter: true },
        { key: "blocked", label: "robots.txt engeli", value: sumOf("BlockedByRobotsTxt", dates), previous: sumOf("BlockedByRobotsTxt", prevDates), format: "int", lowerIsBetter: true },
        { key: "e4", label: "4xx yanıt", value: sumOf("Code4xx", dates), previous: sumOf("Code4xx", prevDates), format: "int", lowerIsBetter: true },
        { key: "e5", label: "5xx yanıt", value: sumOf("Code5xx", dates), previous: sumOf("Code5xx", prevDates), format: "int", lowerIsBetter: true },
      ],
      timeline: {
        dates,
        series: [
          { key: "crawled", label: "Taranan sayfa", format: "int", values: dates.map((d) => Number(byDate.get(d)?.CrawledPages ?? 0)) },
          { key: "indexed", label: "Dizindeki sayfa", format: "int", values: dates.map((d) => Number(byDate.get(d)?.InIndex ?? 0)) },
          { key: "errors", label: "Tarama hatası", format: "int", values: dates.map((d) => Number(byDate.get(d)?.CrawlErrors ?? 0)) },
        ],
      },
      tables: [],
    };
  }

  if (section === "sitemaps") {
    const feeds = await bingGet<Array<{ Url?: string; Type?: string; Status?: string; UrlCount?: number; LastCrawled?: string; Submitted?: string; FileSize?: number }>>(fetchImpl, apiKey, siteUrl, "GetFeeds");
    const rows = feeds.map((f) => ({ url: f.Url ?? "", type: f.Type ?? "", status: f.Status ?? "", count: f.UrlCount ?? 0, crawled: parseBingDate(f.LastCrawled), submitted: parseBingDate(f.Submitted) }));
    return {
      ...base,
      kpis: [
        { key: "count", label: "Site haritası", value: rows.length, format: "int" },
        { key: "urls", label: "Toplam URL", value: rows.reduce((a, r) => a + r.count, 0), format: "int" },
        { key: "bad", label: "Sorunlu", value: rows.filter((r) => r.status && r.status !== "Success").length, format: "int", lowerIsBetter: true },
      ],
      tables: [{ id: "feeds", title: "Gönderilen site haritaları", columns: [{ key: "url", label: "Adres", kind: "url" }, { key: "type", label: "Tür", kind: "text" }, { key: "status", label: "Durum", kind: "text" }, { key: "count", label: "URL", kind: "int" }, { key: "crawled", label: "Son tarama", kind: "date" }, { key: "submitted", label: "Gönderim", kind: "date" }], rows }],
    };
  }

  const links = await bingGet<{ Links?: Array<{ Url?: string; Count?: number }>; TotalPages?: number }>(fetchImpl, apiKey, siteUrl, "GetLinkCounts");
  const list = links.Links ?? [];
  return {
    ...base,
    notes: list.length === 0 ? ["Bing bu site için henüz geri bağlantı sayısı vermedi."] : [],
    kpis: [{ key: "pages", label: "Geri bağlantı alan sayfa", value: links.TotalPages ?? list.length, format: "int" }],
    tables: [{ id: "links", title: "Geri bağlantılar", columns: [{ key: "url", label: "Sayfa", kind: "url" }, { key: "count", label: "Bağlantı", kind: "int" }], rows: list.map((l) => ({ url: l.Url ?? "", count: l.Count ?? 0 })) }],
  };
}

/** Bing: kullanıcının siteleri ve doğrulama durumu (bağlantı testi). */
export async function fetchBingSites(apiKey: string, fetchImpl: Fetcher = fetch): Promise<Array<{ url: string; verified: boolean }>> {
  const sites = await bingGet<Array<{ Url?: string; IsVerified?: boolean }>>(fetchImpl, apiKey, null, "GetUserSites");
  return sites.map((s) => ({ url: s.Url ?? "", verified: Boolean(s.IsVerified) }));
}

// ───────────────────────── Yandex Metrika ─────────────────────────

export type YandexSection = "overview" | "sources" | "pages" | "search" | "geo" | "devices";

async function ymGet<T>(fetchImpl: Fetcher, token: string, path: string, params: Record<string, string>): Promise<T> {
  const res = await request(fetchImpl, `https://api-metrika.yandex.net${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `OAuth ${token}` } });
  const text = await res.text();
  if (!res.ok) {
    let message = text.slice(0, 200);
    let type = "";
    try {
      const body = JSON.parse(text) as { errors?: Array<{ error_type?: string; message?: string }>; message?: string };
      type = body.errors?.[0]?.error_type ?? "";
      message = body.errors?.[0]?.message ?? body.message ?? message;
    } catch {
      // ham metin
    }
    if (type === "invalid_token" || res.status === 401) throw new WebmasterApiError("Yandex OAuth jetonu geçersiz.", "auth", "Metrika raporu için Yandex OAuth uygulamasında \"metrika:read\" yetkisiyle jeton üretip kaydedin (Metrika ayarlarındaki sayaç kodu jeton değildir).", res.status);
    if (res.status === 403) throw new WebmasterApiError("Bu jetonun bu sayaca erişimi yok.", "permission", "Sayaç numarasının doğru ve jeton sahibinin sayaca erişimi olduğundan emin olun.", res.status);
    if (res.status === 429) throw new WebmasterApiError("Yandex istek sınırı doldu.", "quota", "Biraz sonra yeniden deneyin.", res.status);
    throw new WebmasterApiError(`Yandex Metrika hatası (${res.status}): ${message}`, "unknown", undefined, res.status);
  }
  return JSON.parse(text) as T;
}

interface YmData { data?: Array<{ dimensions?: Array<{ name?: string }>; metrics?: number[] }>; totals?: number[] }

export async function fetchYandexReport(input: { fetchImpl?: Fetcher; token: string; counterId: string; section: YandexSection; days: number; now?: Date }): Promise<WebmasterReport> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const { token, counterId, section, days } = input;
  const range = reportRange(days, 0, input.now);
  const base = { source: "yandex" as const, section, generatedAt: (input.now ?? new Date()).toISOString(), range: { start: range.start, end: range.end, days }, notes: [] as string[] };
  const common = { ids: counterId, date1: range.start, date2: range.end };

  if (section === "overview") {
    const metrics = "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds";
    const [totals, prevTotals, series] = await Promise.all([
      ymGet<YmData>(fetchImpl, token, "/stat/v1/data", { ...common, metrics }),
      ymGet<YmData>(fetchImpl, token, "/stat/v1/data", { ids: counterId, date1: range.prevStart, date2: range.prevEnd, metrics }),
      ymGet<{ data?: Array<{ metrics?: number[][] }> }>(fetchImpl, token, "/stat/v1/data/bytime", { ...common, metrics: "ym:s:visits,ym:s:users,ym:s:pageviews", group: "day" }),
    ]);
    const t = totals.totals ?? totals.data?.[0]?.metrics ?? [];
    const p = prevTotals.totals ?? prevTotals.data?.[0]?.metrics ?? [];
    const dates = dayList(range.start, range.end);
    const m = series.data?.[0]?.metrics ?? [];
    const col = (i: number) => dates.map((_d, k) => Number(m[i]?.[k] ?? 0));
    return {
      ...base,
      kpis: [
        { key: "visits", label: "Ziyaret", value: t[0] ?? 0, previous: p[0], format: "int" },
        { key: "users", label: "Ziyaretçi", value: t[1] ?? 0, previous: p[1], format: "int" },
        { key: "views", label: "Sayfa görüntüleme", value: t[2] ?? 0, previous: p[2], format: "int" },
        { key: "bounce", label: "Hemen çıkma", value: round(t[3] ?? 0, 1), previous: p[3] === undefined ? undefined : round(p[3], 1), format: "pct", lowerIsBetter: true },
        { key: "duration", label: "Ort. ziyaret süresi", value: round(t[4] ?? 0, 0), previous: p[4] === undefined ? undefined : round(p[4], 0), format: "duration" },
      ],
      timeline: { dates, series: [{ key: "visits", label: "Ziyaret", format: "int", values: col(0) }, { key: "users", label: "Ziyaretçi", format: "int", values: col(1) }, { key: "views", label: "Sayfa görüntüleme", format: "int", values: col(2) }] },
      tables: [],
    };
  }

  const dimension = { sources: "ym:s:trafficSource", pages: "ym:s:startURL", search: "ym:s:searchEngine", geo: "ym:s:regionCountry", devices: "ym:s:deviceCategory" }[section];
  const titles = { sources: "Trafik kaynakları", pages: "Giriş sayfaları", search: "Arama motorları", geo: "Ülkeler", devices: "Cihazlar" } as const;
  const firsts = { sources: "Kaynak", pages: "Sayfa", search: "Arama motoru", geo: "Ülke", devices: "Cihaz" } as const;
  const data = await ymGet<YmData>(fetchImpl, token, "/stat/v1/data", { ...common, metrics: "ym:s:visits,ym:s:users,ym:s:bounceRate", dimensions: dimension, sort: "-ym:s:visits", limit: "100", ...(section === "pages" ? { filters: "ym:s:trafficSource=='organic'" } : {}) });
  return {
    ...base,
    kpis: [],
    notes: section === "pages" ? ["Yalnızca organik arama kaynaklı girişler."] : [],
    tables: [
      {
        id: section,
        title: titles[section],
        columns: [{ key: "label", label: firsts[section], kind: section === "pages" ? "url" : "text" }, { key: "visits", label: "Ziyaret", kind: "int" }, { key: "users", label: "Ziyaretçi", kind: "int" }, { key: "bounce", label: "Hemen çıkma", kind: "pct" }],
        rows: (data.data ?? []).map((r) => {
          let label = r.dimensions?.[0]?.name ?? "(belirsiz)";
          if (section === "pages") {
            try {
              label = new URL(label).pathname;
            } catch {
              // ham değer
            }
          }
          return { label, visits: r.metrics?.[0] ?? 0, users: r.metrics?.[1] ?? 0, bounce: round(r.metrics?.[2] ?? 0, 1) };
        }),
      },
    ],
  };
}
