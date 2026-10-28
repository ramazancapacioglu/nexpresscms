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
