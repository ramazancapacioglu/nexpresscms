/**
 * GEO ROI Hunisi & Bing AI Performance CSV çözümleyici (saf mantık):
 * sayfa bazında AI bot taramaları, Bing AI atıfları, AI yönlendirme ziyaretleri
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

export interface BingAiPageCitation {
  path: string;
  url: string;
  citations: number;
  lastSeen?: string;
}

export interface BingAiGroundingQuery {
  query: string;
  citations: number;
  avgPosition?: number;
  topUrl?: string;
}

export interface BingAiPerformanceSnapshot {
  importedAt: string;
  sourceFileName?: string;
  totalCitations: number;
  citedPages: BingAiPageCitation[];
  groundingQueries: BingAiGroundingQuery[];
}

export interface GeoRoiRow {
  path: string;
  botHits: number;
  markdownHits: number;
  bingCitations: number;
  aiVisits: number;
  conversions: number;
  /** Dönüşüm / AI ziyareti oranı (%); AI ziyareti yoksa 0 */
  conversionRatePct: number;
}

export interface GeoRoiSummary {
  totalBotHits: number;
  totalMarkdownHits: number;
  totalBingCitations: number;
  totalAiVisits: number;
  totalConversions: number;
  activePages: number;
  rows: GeoRoiRow[];
}

export function normalizeRoiPath(raw: string, defaultLocale = "tr"): string {
  const trimmed = (raw ?? "").trim();
  let pathPart = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathPart = new URL(trimmed).pathname;
    } catch {
      pathPart = trimmed;
    }
  }
  const cleaned = pathPart.split("?")[0]?.split("#")[0]?.trim() ?? "";
  if (!cleaned || cleaned === "/") return "/";
  const withSlash = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const stripped = withSlash.replace(new RegExp(`^/${defaultLocale}(?=/|$)`), "") || "/";
  return stripped.length > 1 ? stripped.replace(/\/+$/, "") : "/";
}

export function buildGeoRoiFunnel(input: {
  botPages: readonly GeoRoiBotHit[];
  aiPaths: readonly GeoRoiReferralHit[];
  forms: readonly GeoRoiFormHit[];
  bingCitations?: readonly { path: string; citations: number }[];
  defaultLocale?: string;
  limit?: number;
}): GeoRoiSummary {
  const defaultLocale = input.defaultLocale ?? "tr";
  const map = new Map<string, GeoRoiRow>();
  const ensure = (rawPath: string): GeoRoiRow => {
    const path = normalizeRoiPath(rawPath, defaultLocale);
    let row = map.get(path);
    if (!row) {
      row = {
        path,
        botHits: 0,
        markdownHits: 0,
        bingCitations: 0,
        aiVisits: 0,
        conversions: 0,
        conversionRatePct: 0,
      };
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

  for (const c of input.bingCitations ?? []) {
    if (!c.path || c.citations <= 0) continue;
    ensure(c.path).bingCitations += c.citations;
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
      b.bingCitations - a.bingCitations ||
      b.botHits - a.botHits ||
      a.path.localeCompare(b.path)
  );

  return {
    totalBotHits: all.reduce((n, r) => n + r.botHits, 0),
    totalMarkdownHits: all.reduce((n, r) => n + r.markdownHits, 0),
    totalBingCitations: all.reduce((n, r) => n + r.bingCitations, 0),
    totalAiVisits: all.reduce((n, r) => n + r.aiVisits, 0),
    totalConversions: all.reduce((n, r) => n + r.conversions, 0),
    activePages: all.length,
    rows: all.slice(0, input.limit ?? 50),
  };
}

function detectDelimiter(headerLine: string): "," | ";" | "\t" {
  let commas = 0;
  let semis = 0;
  let tabs = 0;
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes) {
      if (ch === ",") commas++;
      else if (ch === ";") semis++;
      else if (ch === "\t") tabs++;
    }
  }
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstNewline = clean.indexOf("\n");
  const firstLine = firstNewline >= 0 ? clean.slice(0, firstNewline) : clean;
  const delim = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseMetricNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) return 0;
  // Hem "1,234" hem "1.234" hem "12,5" destekle
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/\./g, "")) || 0;
  if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/,/g, "")) || 0;
  const normalized = cleaned.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const URL_HEADERS = new Set(["url", "page", "page url", "cited url", "cited page", "pages", "sayfa", "adres", "link", "top url"]);
const QUERY_HEADERS = new Set([
  "query",
  "queries",
  "grounding query",
  "grounding queries",
  "search query",
  "prompt",
  "sorgu",
  "arama sorgusu",
]);
const CITATION_HEADERS = new Set([
  "citations",
  "citation",
  "citation count",
  "ai citations",
  "total citations",
  "count",
  "atif",
  "atiflar",
  "atif sayisi",
  "referans",
  "mentions",
  "impressions",
]);
const POSITION_HEADERS = new Set(["position", "avg position", "average position", "rank", "sira", "ort sira"]);
const DATE_HEADERS = new Set(["date", "last seen", "last cited", "tarih", "son gorulme"]);

/**
 * Bing Webmaster Tools → AI Performance (Cited Pages & Grounding Queries) CSV çıktısını çözümler.
 */
export function parseBingAiPerformanceCsv(
  csvText: string,
  options?: { defaultLocale?: string; fileName?: string; nowIso?: string }
): BingAiPerformanceSnapshot {
  const defaultLocale = options?.defaultLocale ?? "tr";
  const rows = parseCsvRows(csvText ?? "");
  const importedAt = options?.nowIso ?? new Date().toISOString();
  const sourceFileName = options?.fileName?.trim().slice(0, 120) || undefined;

  if (rows.length < 2) {
    return { importedAt, sourceFileName, totalCitations: 0, citedPages: [], groundingQueries: [] };
  }

  const headers = rows[0]!.map(normalizeHeader);
  const findCol = (set: Set<string>, fallbackSubstrings: string[]): number => {
    const exact = headers.findIndex((h) => set.has(h));
    if (exact >= 0) return exact;
    return headers.findIndex((h) => fallbackSubstrings.some((sub) => h.includes(sub)));
  };

  const urlCol = findCol(URL_HEADERS, ["url", "page", "sayfa"]);
  const queryCol = findCol(QUERY_HEADERS, ["query", "grounding", "sorgu"]);
  const citationCol = findCol(CITATION_HEADERS, ["citation", "atif", "count", "mention"]);
  const positionCol = findCol(POSITION_HEADERS, ["position", "sira", "rank"]);
  const dateCol = findCol(DATE_HEADERS, ["date", "tarih", "seen"]);

  const pageMap = new Map<string, BingAiPageCitation>();
  const queryMap = new Map<string, BingAiGroundingQuery>();

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i]!;
    const rawUrl = urlCol >= 0 ? (cols[urlCol] ?? "").trim() : "";
    const rawQuery = queryCol >= 0 ? (cols[queryCol] ?? "").trim() : "";
    const rawCount = citationCol >= 0 ? parseMetricNumber(cols[citationCol]) : 1;
    const citations = Math.round(rawCount);
    const avgPos = positionCol >= 0 ? parseMetricNumber(cols[positionCol]) : 0;
    const lastSeen = dateCol >= 0 ? (cols[dateCol] ?? "").trim().slice(0, 32) || undefined : undefined;

    if (citations <= 0) continue;

    if (rawUrl && (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("/"))) {
      const path = normalizeRoiPath(rawUrl, defaultLocale);
      const prev = pageMap.get(path);
      if (prev) {
        prev.citations += citations;
        if (lastSeen && (!prev.lastSeen || lastSeen > prev.lastSeen)) prev.lastSeen = lastSeen;
      } else {
        pageMap.set(path, {
          path,
          url: rawUrl.slice(0, 300),
          citations,
          ...(lastSeen ? { lastSeen } : {}),
        });
      }
    }

    if (rawQuery) {
      const key = rawQuery.toLocaleLowerCase("tr-TR");
      const prev = queryMap.get(key);
      if (prev) {
        prev.citations += citations;
        if (avgPos > 0 && !prev.avgPosition) prev.avgPosition = Math.round(avgPos * 10) / 10;
      } else {
        queryMap.set(key, {
          query: rawQuery.slice(0, 200),
          citations,
          ...(avgPos > 0 ? { avgPosition: Math.round(avgPos * 10) / 10 } : {}),
          ...(rawUrl ? { topUrl: normalizeRoiPath(rawUrl, defaultLocale) } : {}),
        });
      }
    }
  }

  const citedPages = [...pageMap.values()]
    .sort((a, b) => b.citations - a.citations || a.path.localeCompare(b.path))
    .slice(0, 200);
  const groundingQueries = [...queryMap.values()]
    .sort((a, b) => b.citations - a.citations || a.query.localeCompare(b.query))
    .slice(0, 200);

  const pageTotal = citedPages.reduce((n, p) => n + p.citations, 0);
  const queryTotal = groundingQueries.reduce((n, q) => n + q.citations, 0);

  return {
    importedAt,
    sourceFileName,
    totalCitations: pageTotal > 0 ? pageTotal : queryTotal,
    citedPages,
    groundingQueries,
  };
}

/**
 * Bing Webmaster Tools'dan ayrı ayrı indirilen Cited Pages ve Grounding Queries CSV'lerini
 * birbirini ezmeden tek anlık görüntüde birleştirir.
 */
export function mergeBingAiSnapshots(
  existing: BingAiPerformanceSnapshot | null | undefined,
  incoming: BingAiPerformanceSnapshot
): BingAiPerformanceSnapshot {
  const citedPages = incoming.citedPages.length > 0 ? incoming.citedPages : existing?.citedPages ?? [];
  const groundingQueries =
    incoming.groundingQueries.length > 0 ? incoming.groundingQueries : existing?.groundingQueries ?? [];
  const pageTotal = citedPages.reduce((n, p) => n + p.citations, 0);
  const queryTotal = groundingQueries.reduce((n, q) => n + q.citations, 0);
  return {
    importedAt: incoming.importedAt,
    sourceFileName: incoming.sourceFileName ?? existing?.sourceFileName,
    totalCitations: pageTotal > 0 ? pageTotal : queryTotal,
    citedPages,
    groundingQueries,
  };
}

export function sanitizeBingAiSnapshot(raw: unknown): BingAiPerformanceSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const importedAt = typeof o.importedAt === "string" && o.importedAt.trim() ? o.importedAt.trim() : "";
  if (!importedAt) return null;

  const citedPages: BingAiPageCitation[] = Array.isArray(o.citedPages)
    ? o.citedPages
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x) => ({
          path: typeof x.path === "string" ? x.path.slice(0, 300) : "/",
          url: typeof x.url === "string" ? x.url.slice(0, 300) : "",
          citations: typeof x.citations === "number" && Number.isFinite(x.citations) ? Math.max(0, Math.round(x.citations)) : 0,
          ...(typeof x.lastSeen === "string" && x.lastSeen ? { lastSeen: x.lastSeen.slice(0, 32) } : {}),
        }))
        .filter((x) => x.citations > 0)
        .slice(0, 200)
    : [];

  const groundingQueries: BingAiGroundingQuery[] = Array.isArray(o.groundingQueries)
    ? o.groundingQueries
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x) => ({
          query: typeof x.query === "string" ? x.query.trim().slice(0, 200) : "",
          citations: typeof x.citations === "number" && Number.isFinite(x.citations) ? Math.max(0, Math.round(x.citations)) : 0,
          ...(typeof x.avgPosition === "number" && Number.isFinite(x.avgPosition) ? { avgPosition: x.avgPosition } : {}),
          ...(typeof x.topUrl === "string" && x.topUrl ? { topUrl: x.topUrl.slice(0, 300) } : {}),
        }))
        .filter((x) => x.query.length > 0 && x.citations > 0)
        .slice(0, 200)
    : [];

  const pageTotal = citedPages.reduce((n, p) => n + p.citations, 0);
  const queryTotal = groundingQueries.reduce((n, q) => n + q.citations, 0);

  return {
    importedAt,
    ...(typeof o.sourceFileName === "string" && o.sourceFileName ? { sourceFileName: o.sourceFileName.slice(0, 120) } : {}),
    totalCitations: pageTotal > 0 ? pageTotal : queryTotal,
    citedPages,
    groundingQueries,
  };
}
