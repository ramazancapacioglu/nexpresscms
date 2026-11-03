/**
 * Arama Motoru Verisi (Search Console, Bing Webmaster, Yandex) Çözümleyici ve Analiz Motoru
 * CSV ve JSON raporlarını ayrıştırır, ortalama metrikleri ve fırsat anahtar kelimeleri hesaplar.
 */

export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  page?: string;
}

export interface SearchPerformanceReport {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  topQueries: SearchConsoleQuery[];
  strikingDistance: SearchConsoleQuery[]; // Pozisyon 4-15 arası (kolay ilk sayfa fırsatları)
  lowCtrOpportunities: SearchConsoleQuery[]; // Pozisyon 1-5 ama düşük TO (başlık/açıklama optimizasyonu gerekir)
}

/**
 * Google Search Console veya Bing Webmaster CSV çıktısını ayrıştırır.
 */
export function parseSearchConsoleCsv(csvContent: string): SearchConsoleQuery[] {
  if (!csvContent || typeof csvContent !== "string") return [];
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const results: SearchConsoleQuery[] = [];
  const header = lines[0]!.toLowerCase();
  const isBing = header.includes("avg position") || header.includes("avg. position");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    // Basit CSV split (tırnak toleranslı)
    const cols = line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
    if (cols.length < 4) continue;

    const query = cols[0] ?? "";
    if (!query || query.toLowerCase() === "top queries" || query.toLowerCase() === "query") continue;

    const clicks = Number.parseInt(cols[1] ?? "0", 10) || 0;
    const impressions = Number.parseInt(cols[2] ?? "0", 10) || 0;

    let ctr = 0;
    let position = 0;

    if (isBing) {
      position = Number.parseFloat(cols[3] ?? "0") || 0;
      ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    } else {
      // GSC: Query, Clicks, Impressions, CTR, Position
      const rawCtr = cols[3] ?? "0%";
      ctr = Number.parseFloat(rawCtr.replace("%", "").replace(",", ".")) || 0;
      position = Number.parseFloat((cols[4] ?? "0").replace(",", ".")) || 0;
    }

    results.push({
      query,
      clicks,
      impressions,
      ctr: Math.round(ctr * 100) / 100,
      position: Math.round(position * 10) / 10,
    });
  }

  return results;
}

/**
 * JSON formatında gelen Search Console sorgu verilerini doğrular.
 */
export function parseSearchConsoleJson(jsonContent: string): SearchConsoleQuery[] {
  try {
    const parsed = typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
    const items = Array.isArray(parsed)
      ? parsed
      : (parsed as Record<string, unknown>).rows || (parsed as Record<string, unknown>).queries || [];
    if (!Array.isArray(items)) return [];

    const result: SearchConsoleQuery[] = [];
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const keys = Array.isArray(item.keys) ? item.keys : [];
      const query = String(item.query || keys[0] || "").trim();
      if (!query) continue;

      const clicks = Number(item.clicks ?? 0) || 0;
      const impressions = Number(item.impressions ?? 0) || 0;
      const rawCtr = Number(item.ctr ?? 0) || 0;
      const ctr = rawCtr < 1 ? rawCtr * 100 : rawCtr;
      const position = Number(item.position ?? 0) || 0;

      result.push({
        query,
        clicks,
        impressions,
        ctr: Math.round(ctr * 100) / 100,
        position: Math.round(position * 10) / 10,
        page: typeof item.page === "string" ? item.page : undefined,
      });
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Arama sorguları kümesini analiz eder; toplam metrikleri ve fırsat terimlerini çıkartır.
 */
export function analyzeSearchPerformance(queries: SearchConsoleQuery[]): SearchPerformanceReport {
  if (!queries || queries.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      topQueries: [],
      strikingDistance: [],
      lowCtrOpportunities: [],
    };
  }

  let totalClicks = 0;
  let totalImpressions = 0;
  let weightedPositionSum = 0;

  for (const q of queries) {
    totalClicks += q.clicks;
    totalImpressions += q.impressions;
    weightedPositionSum += q.position * (q.impressions || 1);
  }

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;

  const sortedByClicks = [...queries].sort((a, b) => b.clicks - a.clicks);
  const topQueries = sortedByClicks.slice(0, 10);

  // Pozisyon 4.0 ile 15.0 arası ve en az 20 gösterim alan fırsat sorguları
  const strikingDistance = queries
    .filter((q) => q.position >= 4 && q.position <= 15 && q.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  // İlk 5 pozisyonda ama CTR %3'ün altında kalanlar (başlık/meta açıklaması zayıf)
  const lowCtrOpportunities = queries
    .filter((q) => q.position <= 5 && q.ctr < 3.0 && q.impressions >= 25)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  return {
    totalClicks,
    totalImpressions,
    avgCtr: Math.round(avgCtr * 100) / 100,
    avgPosition: Math.round(avgPosition * 10) / 10,
    topQueries,
    strikingDistance,
    lowCtrOpportunities,
  };
}
