/**
 * Mesaj kataloğu: sunucu bileşenlerinde kullanılır; katalog istemci JS'ine taşınmaz (0 KB kuralı).
 * Anahtarlar `tr` kataloğundan türetilir: bilinmeyen anahtar derleme hatasıdır.
 */
import { en } from "./messages/en";
import { tr, type Messages } from "./messages/tr";

export type { Messages } from "./messages/tr";

/** "a.b.c" biçiminde tüm yaprak anahtarlar */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<typeof tr>;

const CATALOGS: Record<string, Messages> = { tr, en };
export const DEFAULT_MESSAGE_LOCALE = "tr";

/** Dil kataloğu yoksa (ör. `de`) Türkçeye düşer; `pt-br` önce `pt`'ye bakar. */
export function getMessages(locale: string): Messages {
  const l = locale.toLowerCase();
  return CATALOGS[l] ?? CATALOGS[l.split("-")[0] ?? ""] ?? tr;
}

const PLURAL = /\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g;

/** `{ad}` değişkenleri ve `{n, plural, one {…} other {…}}` (Intl.PluralRules; `#` sayıyı yazar). */
export function format(template: string, vars: Record<string, string | number> = {}, locale = "tr"): string {
  const rules = new Intl.PluralRules(locale);
  return template
    .replace(PLURAL, (_m, name: string, one: string, other: string) => {
      const n = Number(vars[name] ?? 0);
      return (rules.select(n) === "one" ? one : other).replace(/#/g, String(n));
    })
    .replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export interface Translator {
  (key: MessageKey, vars?: Record<string, string | number>): string;
  locale: string;
}

/** Bir dil için çevirici: `t("shop.title")`. Bilinmeyen anahtar tür sistemince reddedilir. */
export function createTranslator(locale: string): Translator {
  const messages = getMessages(locale);
  const t = ((key: MessageKey, vars?: Record<string, string | number>) => {
    const value = key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages);
    return format(typeof value === "string" ? value : key, vars, locale);
  }) as Translator;
  t.locale = locale;
  return t;
}
