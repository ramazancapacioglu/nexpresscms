/**
 * Ziyaretçi HTML'i için paylaşımlı (CDN / ters vekil) önbellek kararı (saf mantık, uç ortamda da çalışır).
 * Karar çalışma zamanında verilir (`PUBLIC_CACHE_SECONDS`), derleme zamanında değil. Yalnızca "herkese aynı" çıktı veren
 * istekler önbelleğe uygundur: oturum, onay, parola, önizleme çerezi taşıyan ya da çıktıyı değiştiren sorgu parametresi
 * içeren istekler asla herkese açık işaretlenmez. Mağaza (sepet/ödeme) ve dosya uç noktaları kapsam dışıdır.
 */

export interface HtmlCacheInput {
  method: string;
  /** Dahili yol (dil öneki dahil), örn. `/tr/hakkimizda`. */
  path: string;
  searchParams: URLSearchParams;
  /** İstekteki çerez adları. */
  cookieNames: readonly string[];
  /** `PUBLIC_CACHE_SECONDS` (saniye). 0 / geçersiz = kapalı. */
  ttlSeconds: number;
  /** Önizleme/taslak gibi özel durumlar çağıran tarafından zaten `no-store` yapılmışsa true. */
  alreadyPrivate?: boolean;
}

/** Çıktıyı değiştirmeyen (yalnızca izleme/sayfalama/biçim) sorgu parametreleri. */
const NEUTRAL_PARAMS = new Set(["sayfa", "gclid", "fbclid", "msclkid", "ref"]);
const isNeutralParam = (key: string): boolean => NEUTRAL_PARAMS.has(key) || key.startsWith("utm_");

/** Önbelleğe girmeyecek yollar: mağaza, arama, dosya benzeri uç noktalar. */
const SKIP_PATH = /^\/(?:api|og)(?:\/|$)|^\/[a-z]{2,3}(?:-[a-z0-9]{2,8})?\/(?:magaza|ara|kampanya|uye)(?:\/|$)|\.[a-z0-9]{2,5}$/i;
const PAGE_PATH = /^\/[a-z]{2,3}(?:-[a-z0-9]{2,8})?(?:\/|$)/;

export const MAX_HTML_CACHE_SECONDS = 86_400;

export function normalizeCacheTtl(value: unknown): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : 0;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), MAX_HTML_CACHE_SECONDS) : 0;
}

/**
 * Paylaşımlı önbelleğe uygunsa `Cache-Control` değerini döndürür; değilse `null` (Next'in varsayılanı kalır).
 * `stale-while-revalidate` TTL'nin 5 katıdır (en çok 1 gün): önbellek arka planda yenilenirken eski kopya anında sunulur.
 */
export function htmlCacheControl(input: HtmlCacheInput): string | null {
  const ttl = normalizeCacheTtl(input.ttlSeconds);
  if (ttl === 0 || input.alreadyPrivate) return null;
  if (input.method !== "GET" && input.method !== "HEAD") return null;
  if (!PAGE_PATH.test(input.path) || SKIP_PATH.test(input.path)) return null;
  for (const key of input.searchParams.keys()) if (!isNeutralParam(key)) return null;
  // Yapay zeka yönlendirmesi izlemesi (utm_source) kaynak sunucuda sayılır: bu istekler önbelleğe girmez
  if (input.searchParams.has("utm_source")) return null;
  if (input.cookieNames.some((name) => name.startsWith("nx_"))) return null;
  return `public, s-maxage=${ttl}, stale-while-revalidate=${Math.min(ttl * 5, MAX_HTML_CACHE_SECONDS)}`;
}
