/**
 * Tarama temizliği (saf mantık, uç ortamda da çalışır): spam ya da artık var olmayan adresler (ör. bilgisayar korsanlığı sonrası
 * enjekte edilen sahte ürün/yol kalıpları, rastgele sorgu parametreli adresler) arama motorlarında dizinlenebilir ve tarama bütçesini yer.
 * Bu adresler `410 Gone` ile hemen "kalıcı silindi" cevabı alır; bilinmeyen sorgu parametreli sayfalar dizinlenmez (`noindex`).
 */
export interface CrawlHygiene {
  /** Yol kalıpları: `/ajax/*`, `/products/detail/*`, `/pc/index.php` (`*` = herhangi bir devam) */
  goneRules: string[];
  /** Taşıyan her isteğin 410 aldığı sorgu parametresi adları (ör. `j`); `*` joker kabul eder, örn. yıldız-eğik çizgi-yıldız adında eğik çizgi geçen parametreleri yakalar (`/?kelime/12345`) */
  goneParams: string[];
  /** Bilinmeyen sorgu parametresi taşıyan sayfalara `X-Robots-Tag: noindex, follow` ver */
  noindexUnknownParams: boolean;
}

export const DEFAULT_CRAWL_HYGIENE: CrawlHygiene = { goneRules: [], goneParams: [], noindexUnknownParams: true };

export const CRAWL_HYGIENE_LIMITS = { rules: 100, params: 30, rule: 120 } as const;

/** Çıktıyı değiştirmeyen ya da site özelliklerinin kullandığı sorgu parametreleri (bunlar "bilinmeyen" sayılmaz). */
const KNOWN_PARAMS = new Set([
  "sayfa", "format", "embed", "form", "fb", "qa", "yorum", "c_sort", "nx_draft", "nx_preview", "q", "s", "next", "pwd", "e", "t", "sent", "bad", "locale", "_rsc",
  "gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ysclid", "yclid", "ttclid", "dclid", "gad_source", "gad_campaignid", "mc_cid", "mc_eid", "_ga", "_gl", "ref",
]);
const DYNAMIC_PARAM = /^q[A-Za-z0-9]{1,8}_(q|cat|sort|page|min|max)$/;

export const isKnownQueryParam = (key: string): boolean => KNOWN_PARAMS.has(key) || key.startsWith("utm_") || DYNAMIC_PARAM.test(key);

const RULE_CHARS = /^\/[A-Za-z0-9/_\-.*%~]*$/;
const PARAM_NAME = /^[A-Za-z0-9_\-[\]*/]{1,40}$/;

const unique = (list: string[]): string[] => [...new Set(list)];

/** Serbest girdiyi güvenli yapılandırmaya çevirir (listeler tekilleşir, sınırlanır, geçersiz satırlar atılır). */
export function sanitizeCrawlHygiene(input: unknown): CrawlHygiene {
  const raw = (input && typeof input === "object" ? input : {}) as { goneRules?: unknown; goneParams?: unknown; noindexUnknownParams?: unknown };
  const lines = (value: unknown): string[] => (Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]/) : []).map((v) => String(v).trim()).filter(Boolean);
  const goneRules = unique(lines(raw.goneRules).map((r) => r.replace(/\/{2,}/g, "/")).filter((r) => r.length <= CRAWL_HYGIENE_LIMITS.rule && RULE_CHARS.test(r) && r !== "/" && r !== "/*")).slice(0, CRAWL_HYGIENE_LIMITS.rules);
  const goneParams = unique(lines(raw.goneParams).map((p) => p.replace(/^\?/, "").replace(/=.*$/, "")).filter((p) => PARAM_NAME.test(p))).slice(0, CRAWL_HYGIENE_LIMITS.params);
  return { goneRules, goneParams, noindexUnknownParams: raw.noindexUnknownParams !== false };
}

const compiled = new Map<string, RegExp>();
function ruleRegex(rule: string): RegExp {
  let re = compiled.get(rule);
  if (!re) {
    // `/ajax/*` ayrıca `/ajax` ve `/ajax/` ile eşleşir; yalnızca yol (sorgu dizesi dışarıda), sondaki eğik çizgi isteğe bağlı
    const body = rule.replace(/\/\*$/, "").replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    re = new RegExp(rule.endsWith("/*") ? `^${body}(?:/.*)?$` : `^${body}/?$`, "i");
    if (compiled.size > 500) compiled.clear();
    compiled.set(rule, re);
  }
  return re;
}

/** Yol, kurallardan biriyle eşleşiyor mu? Dil önekli biçim (`/tr/ajax/x`) de denenir. */
export function matchesGoneRule(pathname: string, rules: readonly string[]): boolean {
  if (rules.length === 0) return false;
  const path = pathname.split(/[?#]/)[0] ?? pathname;
  const withoutLocale = path.replace(/^\/[a-z]{2,3}(?:-[a-z0-9]{2,8})?(?=\/)/, "");
  return rules.some((rule) => ruleRegex(rule).test(path) || (withoutLocale !== path && ruleRegex(rule).test(withoutLocale)));
}

const paramRegexes = new Map<string, RegExp>();
function paramMatches(pattern: string, key: string): boolean {
  if (!pattern.includes("*")) return pattern === key;
  let re = paramRegexes.get(pattern);
  if (!re) {
    re = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    if (paramRegexes.size > 100) paramRegexes.clear();
    paramRegexes.set(pattern, re);
  }
  return re.test(key);
}

export function hasGoneParam(searchParams: URLSearchParams, params: readonly string[]): boolean {
  if (params.length === 0) return false;
  for (const key of searchParams.keys()) if (params.some((p) => paramMatches(p, key))) return true;
  return false;
}

export const hasUnknownQueryParams = (searchParams: URLSearchParams): boolean => {
  for (const key of searchParams.keys()) if (!isKnownQueryParam(key)) return true;
  return false;
};

/** `not_found_log` satırlarını yol kalıbına göre gruplar: `/ajax/productstorestocklist` → `/ajax/*`; kök düzeyinde tek yol aynen kalır. */
export function groupNotFoundPaths(rows: ReadonlyArray<{ path: string; hits: number }>): Array<{ pattern: string; hits: number; paths: number; sample: string }> {
  const groups = new Map<string, { hits: number; paths: number; sample: string; top: number }>();
  for (const row of rows) {
    const path = (row.path.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/";
    const segments = path.split("/").filter(Boolean);
    const pattern = segments.length >= 2 ? `/${segments[0]}/*` : path;
    const g = groups.get(pattern) ?? { hits: 0, paths: 0, sample: path, top: 0 };
    g.hits += row.hits;
    g.paths += 1;
    if (row.hits > g.top) {
      g.top = row.hits;
      g.sample = path;
    }
    groups.set(pattern, g);
  }
  return [...groups.entries()].map(([pattern, g]) => ({ pattern, hits: g.hits, paths: g.paths, sample: g.sample })).sort((a, b) => b.hits - a.hits);
}
