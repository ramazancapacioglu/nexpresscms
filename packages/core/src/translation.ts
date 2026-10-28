/**
 * Çeviri yaşam döngüsü (saf mantık): kaynak özeti, durum çıkarımı, yön ve dil etiketi doğrulama.
 */
import { fnv1a64 } from "./chunker";

/** Çevirinin dayandığı kaynak metnin özeti; kaynak değişince çeviri "gözden geçirilmeli" olur. */
export function translationSourceHash(src: { title: string; tldr?: string | null; blocks: unknown[] }): string {
  return fnv1a64(JSON.stringify([src.title, src.tldr ?? "", src.blocks]));
}

export type TranslationState = "none" | "draft" | "published" | "stale";

export interface TranslationRowLike {
  translationStatus: string;
  sourceHash?: string | null;
}

/**
 * Dil şeridi durumu: kayıt yoksa `none`; kaynaktan türetilmiş ve kaynak sonradan değişmişse `stale`
 * (yayında olsa bile gözden geçirme gerekir); aksi halde taslak/yayında.
 */
export function translationStateOf(row: TranslationRowLike | undefined | null, sourceCurrentHash?: string): TranslationState {
  if (!row) return "none";
  if (row.sourceHash && sourceCurrentHash && row.sourceHash !== sourceCurrentHash) return "stale";
  return row.translationStatus === "draft" ? "draft" : "published";
}

/** Ziyaretçiye görünürlük: içerik yayında VE çeviri yayında. */
export function effectiveStatus<S extends string>(contentStatus: S, translationStatus: string): S | "draft" {
  return translationStatus === "draft" ? "draft" : contentStatus;
}

const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "dv", "ku"]);

export function localeDirection(locale: string): "ltr" | "rtl" {
  return RTL_LANGS.has(locale.toLowerCase().split("-")[0] ?? "") ? "rtl" : "ltr";
}

/** BCP 47'nin sadeleştirilmiş hâli: `tr`, `en`, `pt-br`, `zh-hans`. */
export function isValidLocaleTag(tag: string): boolean {
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(tag);
}

export interface TranslationLink {
  locale: string;
  slug: string;
}

/**
 * hreflang bağlantı kümesi: yalnızca yayındaki çeviriler, kendisi dahil; `x-default` varsayılan dile işaret eder.
 * Tek dilli içerikte boş döner (gereksiz etiket basılmaz).
 */
export function buildHreflang(
  links: TranslationLink[],
  defaultLocale: string,
  urlOf: (l: TranslationLink) => string
): Array<{ hreflang: string; href: string }> {
  if (links.length < 2) return [];
  const out = links.map((l) => ({ hreflang: l.locale, href: urlOf(l) }));
  const def = links.find((l) => l.locale === defaultLocale) ?? links[0]!;
  out.push({ hreflang: "x-default", href: urlOf(def) });
  return out;
}

/** İstenen dil etkin diller içindeyse o, değilse varsayılan dil (geçersiz girdiye karşı güvenli). */
export function pickLocale(requested: string | null | undefined, supported: string[], defaultLocale: string): string {
  const r = (requested ?? "").trim().toLowerCase();
  return r && supported.includes(r) ? r : defaultLocale;
}

/** Çeviriye özgü saklanan yayın öznitelikleri. `_localized: true` bu satırın içerik satırının yerine geçtiğini işaretler. */
export interface LocalizedAttributes {
  _localized: true;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  focusKeyword?: string;
  slugHistory: string[];
}

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Kayıt girdisindeki yayın özniteliklerinden dile özgü alt kümeyi seçer. */
export function pickLocalizedAttributes(schemaAttributes: Record<string, unknown> | undefined, slugHistory: string[]): LocalizedAttributes {
  const pub = asObj(schemaAttributes?._publishing);
  const meta = asObj(pub.featuredImageMeta);
  return {
    _localized: true,
    featuredImageAlt: str(pub.featuredImageAlt) ?? str(meta.altText),
    featuredImageCaption: str(pub.featuredImageCaption) ?? str(meta.caption),
    focusKeyword: str(pub.focusKeyword),
    slugHistory: slugHistory.filter((s) => typeof s === "string" && s),
  };
}

/**
 * İçerik satırının öznitelikleriyle çeviriye özgü olanları birleştirir (çeviri kazanır; `slugHistory` tamamen çeviriden gelir).
 * `_localized` değilse (varsayılan dil satırı) paylaşılan öznitelikler olduğu gibi döner.
 */
export function mergeLocalizedAttributes(shared: Record<string, unknown>, localized: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!localized || localized._localized !== true) return shared;
  const pub = { ...asObj(shared._publishing) };
  const meta = { ...asObj(pub.featuredImageMeta) };
  const alt = str(localized.featuredImageAlt);
  const caption = str(localized.featuredImageCaption);
  const kw = str(localized.focusKeyword);
  // Çeviri satırı kendi değerini taşır: boşsa paylaşılan (kaynak dil) değer sızmasın
  if (alt !== undefined) {
    pub.featuredImageAlt = alt;
    meta.altText = alt;
    meta.titleText = alt;
  } else {
    delete pub.featuredImageAlt;
    meta.altText = "";
    meta.titleText = "";
  }
  if (caption !== undefined) {
    pub.featuredImageCaption = caption;
    meta.caption = caption;
  } else {
    delete pub.featuredImageCaption;
    meta.caption = "";
  }
  if (kw !== undefined) pub.focusKeyword = kw;
  else delete pub.focusKeyword;
  if (Object.keys(meta).length) pub.featuredImageMeta = meta;
  const out: Record<string, unknown> = { ...shared, _publishing: pub };
  const history = Array.isArray(localized.slugHistory) ? localized.slugHistory.filter((s): s is string => typeof s === "string") : [];
  if (history.length) out.slugHistory = history;
  else delete out.slugHistory;
  return out;
}
