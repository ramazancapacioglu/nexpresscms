/**
 * GEO ROI Hunisi (saf mantık): sayfa bazında AI bot taramaları, AI yönlendirme ziyaretleri
 * (ChatGPT, Perplexity, Claude, Copilot vb.) ve iletişim/teklif formu dönüşümlerini birleştirir.
 */

export interface GeoRoiBotHit {
  path: string;
  hits: number;
  kind?: string;
}

export interface GeoRoiReferralHit {
  path: string;
  hits: number;
}

export interface GeoRoiFormHit {
  pagePath: string;
  status?: string;
}

export interface GeoRoiRow {
  path: string;
  botHits: number;
  markdownHits: number;
  aiVisits: number;
  conversions: number;
  /** Dönüşüm / AI ziyareti oranı (%); AI ziyareti yoksa 0 */
  conversionRatePct: number;
}

export interface GeoRoiSummary {
  totalBotHits: number;
  totalMarkdownHits: number;
  totalAiVisits: number;
  totalConversions: number;
  activePages: number;
  rows: GeoRoiRow[];
}

export function normalizeRoiPath(raw: string, defaultLocale = "tr"): string {
  const cleaned = (raw ?? "").split("?")[0]?.split("#")[0]?.trim() ?? "";
  if (!cleaned || cleaned === "/") return "/";
  const withSlash = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const stripped = withSlash.replace(new RegExp(`^/${defaultLocale}(?=/|$)`), "") || "/";
  return stripped.length > 1 ? stripped.replace(/\/+$/, "") : "/";
}

export function buildGeoRoiFunnel(input: {
  botPages: readonly GeoRoiBotHit[];
  aiPaths: readonly GeoRoiReferralHit[];
  forms: readonly GeoRoiFormHit[];
  defaultLocale?: string;
  limit?: number;
}): GeoRoiSummary {
  const defaultLocale = input.defaultLocale ?? "tr";
  const map = new Map<string, GeoRoiRow>();
  const ensure = (rawPath: string): GeoRoiRow => {
    const path = normalizeRoiPath(rawPath, defaultLocale);
    let row = map.get(path);
    if (!row) {
      row = { path, botHits: 0, markdownHits: 0, aiVisits: 0, conversions: 0, conversionRatePct: 0 };
      map.set(path, row);
    }
    return row;
  };

  for (const b of input.botPages) {
    if (!b.path || b.hits <= 0) continue;
    const row = ensure(b.path);
    row.botHits += b.hits;
    if (b.kind === "markdown" || b.kind === "llms") row.markdownHits += b.hits;
  }

  for (const a of input.aiPaths) {
    if (!a.path || a.hits <= 0) continue;
    ensure(a.path).aiVisits += a.hits;
  }

  for (const f of input.forms) {
    if (!f.pagePath || f.status === "spam") continue;
    ensure(f.pagePath).conversions += 1;
  }

  const all = [...map.values()].map((r) => ({
    ...r,
    conversionRatePct: r.aiVisits > 0 ? Math.round((r.conversions / r.aiVisits) * 1000) / 10 : 0,
  }));

  all.sort(
    (a, b) =>
      b.conversions - a.conversions ||
      b.aiVisits - a.aiVisits ||
      b.botHits - a.botHits ||
      a.path.localeCompare(b.path)
  );

  return {
    totalBotHits: all.reduce((n, r) => n + r.botHits, 0),
    totalMarkdownHits: all.reduce((n, r) => n + r.markdownHits, 0),
    totalAiVisits: all.reduce((n, r) => n + r.aiVisits, 0),
    totalConversions: all.reduce((n, r) => n + r.conversions, 0),
    activePages: all.length,
    rows: all.slice(0, input.limit ?? 50),
  };
}
