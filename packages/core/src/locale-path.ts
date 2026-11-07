/**
 * Tek dilli sitede herkese açık adreslerde dil ön eki yoktur (`/hakkimizda`, `/` ana sayfa).
 * İkinci bir dil eklenince tüm adresler `/{dil}/...` biçimine geçer. Rota ağacı hep `/{dil}/...` kalır;
 * ara katman tek dilde dışarıdaki adresi içeri yazar (rewrite), bu modül dışarı verilen adresleri üretir.
 */
export interface LocaleSiteInfo {
  supportedLocales: string[];
  defaultLocale: string;
}

/** Ön eksiz mod: sitede tek dil var ve istenen dil o dil. Site bilinmiyorsa (null) ön ek korunur. */
export function isPrefixless(site: Partial<LocaleSiteInfo> | null | undefined, locale: string): boolean {
  return Boolean(site && site.supportedLocales?.length === 1 && site.defaultLocale === locale);
}

/** Dilin kök adresi: ön eksiz modda boş, aksi halde `/{dil}`. Sonuna `/yol` eklenir. */
export function localeBase(site: Partial<LocaleSiteInfo> | null | undefined, locale: string): string {
  return isPrefixless(site, locale) ? "" : `/${locale}`;
}

/** `base` + yol; kök adres boşsa `/` döner. */
export function joinBase(base: string, path = ""): string {
  const p = path === "" || path.startsWith("/") || path.startsWith("?") || path.startsWith("#") ? path : `/${path}`;
  return `${base}${p}` || "/";
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `/tr/x` → `/x`, `/tr` → `/`. Başka dilin ya da dışarıya giden adresler değişmez. */
export function stripLocalePath(href: string, locale: string): string {
  const m = href.match(new RegExp(`^/${escapeRe(locale)}(?=/|$|\\?|#)(.*)$`));
  if (!m) return href;
  const rest = m[1]!;
  return rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
}

/**
 * Kayıtlı içerik, menü ve şablon verisindeki `/{dil}/...` adreslerini ön eksize çevirir (derin; yeni nesne döner).
 * Yalnızca değeri tümüyle adres olan alanlar, HTML içindeki `href="/{dil}/..."` ve Markdown `](/{dil}/...)` bağlantıları değişir; düz metin değişmez.
 */
export function stripLocaleDeep<T>(value: T, locale: string): T {
  const htmlRe = new RegExp(`(href=["'])/${escapeRe(locale)}(?:/|(?=["'?#]))`, "g");
  const mdRe = new RegExp(`(\\]\\()/${escapeRe(locale)}(?:/|(?=[)?#]))`, "g");
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      if (v.startsWith(`/${locale}`)) return stripLocalePath(v, locale);
      let out = v;
      if (out.includes("href=")) out = out.replace(htmlRe, "$1/");
      if (out.includes("](/")) out = out.replace(mdRe, "$1/"); // Markdown bağlantıları (markdownCache)
      return out;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && !(v instanceof Date)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}
