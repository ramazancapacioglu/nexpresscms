/**
 * Arama Motoru ve Analitik Entegrasyon İstemcileri
 * Kaynak: agentic-content-ops (gsc.ts, ga4.ts, bing.ts, yandex.ts)
 * Google Search Console, Google Analytics 4, Bing Webmaster ve Yandex Metrika API istemcileri.
 */

export interface GscCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  siteUrl: string;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

export interface Ga4LandingRow {
  path: string;
  sessions: number;
}

export interface Ga4AiReferrerRow {
  source: string;
  label: string;
  sessions: number;
}

export interface BingQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface YandexOrganicLandingRow {
  path: string;
  visits: number;
}

// -------------------------------------------------------------
// 1. GOOGLE SEARCH CONSOLE (GSC) API İSTEMCİSİ
// -------------------------------------------------------------

/**
 * GSC refresh_token ile yeni access_token alır.
 */
export async function refreshGscAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token yenileme hatası: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google access_token boş döndü.");
  return data.access_token;
}

/**
 * OAuth token ile kullanıcının doğrulanmış GSC site/mülk listesini getirir.
 */
export async function fetchGscSiteList(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<GscSiteEntry[]> {
  const accessToken = await refreshGscAccessToken(clientId, clientSecret, refreshToken);

  const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GSC site listesi hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { siteEntry?: GscSiteEntry[] };
  return data.siteEntry ?? [];
}

/**
 * GSC Search Analytics API: Son N günün en çok aranan sorguları.
 */
export async function fetchGscSearchQueries(
  credentials: GscCredentials,
  days = 28,
  rowLimit = 500
): Promise<GscQueryRow[]> {
  const accessToken = await refreshGscAccessToken(
    credentials.clientId,
    credentials.clientSecret,
    credentials.refreshToken
  );

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const format = (d: Date) => d.toISOString().slice(0, 10);
  const siteEnc = encodeURIComponent(credentials.siteUrl);

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: format(start),
        endDate: format(end),
        dimensions: ["query"],
        rowLimit,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GSC Search Analytics hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    rows?: Array<{
      keys?: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }>;
  };

  return (data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: Math.round((row.ctr ?? 0) * 10000) / 100, // yüzde
    position: Math.round((row.position ?? 0) * 10) / 10,
  }));
}

// -------------------------------------------------------------
// 2. GOOGLE ANALYTICS 4 (GA4) DATA API İSTEMCİSİ
// -------------------------------------------------------------

const AI_REFERRER_LABEL_RULES: Array<{ test: (s: string) => boolean; label: string }> = [
  { test: (s) => s.includes("chatgpt") || s.includes("openai"), label: "ChatGPT" },
  { test: (s) => s.includes("perplexity"), label: "Perplexity" },
  { test: (s) => s.includes("copilot") || s.includes("bing.com/chat"), label: "Copilot" },
  { test: (s) => s.includes("claude") || s.includes("anthropic"), label: "Claude" },
  { test: (s) => s.includes("gemini") || s.includes("bard"), label: "Gemini" },
  { test: (s) => s.includes("you.com"), label: "You.com" },
  { test: (s) => s.includes("phind"), label: "Phind" },
  { test: (s) => s.includes("poe.com"), label: "Poe" },
];

/**
 * GA4 Data API: Organik trafik giriş sayfalarını getirir.
 */
export async function fetchGa4LandingPages(
  propertyId: string,
  accessToken: string,
  days = 28
): Promise<Ga4LandingRow[]> {
  const cleanId = propertyId.replace(/^properties\//, "").trim();
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${cleanId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionMedium",
            stringFilter: { value: "organic", matchType: "EXACT" },
          },
        },
        limit: 100,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 API hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
  };

  return (data.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "/",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}

/**
 * GA4 Data API: ChatGPT, Perplexity, Gemini, Claude kaynaklı AI yönlendirmelerini tespit eder.
 */
export async function fetchGa4AiReferrals(
  propertyId: string,
  accessToken: string,
  days = 28
): Promise<Ga4AiReferrerRow[]> {
  const cleanId = propertyId.replace(/^properties\//, "").trim();
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${cleanId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        limit: 250,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 AI Referral API hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
  };

  const results: Ga4AiReferrerRow[] = [];
  for (const row of data.rows ?? []) {
    const source = (row.dimensionValues?.[0]?.value ?? "").toLowerCase();
    const sessions = Number(row.metricValues?.[0]?.value ?? 0);
    const rule = AI_REFERRER_LABEL_RULES.find((r) => r.test(source));
    if (rule && sessions > 0) {
      results.push({
        source,
        label: rule.label,
        sessions,
      });
    }
  }

  return results;
}

// -------------------------------------------------------------
// 3. BING WEBMASTER TOOLS API İSTEMCİSİ
// -------------------------------------------------------------

/**
 * Bing Webmaster Tools API: Arama sorgu istatistikleri.
 */
export async function fetchBingQueryStats(
  apiKey: string,
  siteUrl: string
): Promise<BingQueryRow[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    siteUrl,
  });

  const response = await fetch(
    `https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?${params}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bing Webmaster API hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    d?: Array<{
      Query?: string;
      Clicks?: number;
      Impressions?: number;
      AvgImpressionPosition?: number;
    }>;
  };

  return (data.d ?? []).map((row) => ({
    query: row.Query ?? "",
    clicks: row.Clicks ?? 0,
    impressions: row.Impressions ?? 0,
    position: Math.round((row.AvgImpressionPosition ?? 0) * 10) / 10,
  }));
}

/**
 * Bing satırlarını sorgu bazında toplulaştırır.
 */
export function aggregateBingQueryStats(rows: BingQueryRow[]): BingQueryRow[] {
  const map = new Map<
    string,
    { clicks: number; impressions: number; positionSum: number; positionCount: number }
  >();

  for (const row of rows) {
    const key = row.query.trim();
    if (!key) continue;
    const cur = map.get(key) ?? { clicks: 0, impressions: 0, positionSum: 0, positionCount: 0 };
    cur.clicks += row.clicks;
    cur.impressions += row.impressions;
    if (row.position > 0) {
      cur.positionSum += row.position;
      cur.positionCount += 1;
    }
    map.set(key, cur);
  }

  return Array.from(map.entries()).map(([query, val]) => ({
    query,
    clicks: val.clicks,
    impressions: val.impressions,
    position:
      val.positionCount > 0 ? Math.round((val.positionSum / val.positionCount) * 10) / 10 : 0,
  }));
}

// -------------------------------------------------------------
// 4. YANDEX METRIKA & WEBMASTER API İSTEMCİSİ
// -------------------------------------------------------------

/**
 * Yandex Metrika API: Organik arama giriş sayfalarını getirir.
 */
export async function fetchYandexOrganicLandings(
  token: string,
  counterId: string,
  days = 28
): Promise<YandexOrganicLandingRow[]> {
  const params = new URLSearchParams({
    ids: counterId,
    metrics: "ym:s:visits",
    dimensions: "ym:s:startURL",
    filters: "ym:s:trafficSource=='organic'",
    sort: "-ym:s:visits",
    limit: "100",
    date1: `${days}daysAgo`,
    date2: "today",
  });

  const response = await fetch(`https://api-metrika.yandex.net/stat/v1/data?${params}`, {
    headers: { Authorization: `OAuth ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Yandex Metrika API hatası: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    data?: Array<{
      dimensions?: Array<{ name?: string }>;
      metrics?: number[];
    }>;
  };

  return (data.data ?? []).map((row) => {
    let path = row.dimensions?.[0]?.name ?? "/";
    try {
      path = new URL(path).pathname;
    } catch {
      // ham path kalır
    }
    return {
      path,
      visits: row.metrics?.[0] ?? 0,
    };
  });
}

