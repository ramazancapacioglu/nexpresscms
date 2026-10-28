import "server-only";
import { buildHreflang, type TranslationLink } from "@nexpress/core";
import { getPublicSite, getPublicTranslations } from "./public-data";

export interface LocaleAlternate {
  locale: string;
  href: string;
  /** Kendi adıyla dil adı (ör. "English", "Türkçe") */
  label: string;
  current: boolean;
}

const nativeName = (code: string) => {
  try {
    const n = new Intl.DisplayNames([code], { type: "language" }).of(code);
    return n ? n.charAt(0).toLocaleUpperCase(code) + n.slice(1) : code;
  } catch {
    return code;
  }
};

/**
 * Bir içeriğin ziyaretçiye açık dil karşılıkları: etkin diller içinde, yayındaki çeviriler.
 * Çevirisi olmayan dile bağlantı verilmez; tek dil varsa boş döner.
 */
export async function publicLocaleLinks(siteId: string, contentId: string): Promise<{ links: TranslationLink[]; defaultLocale: string }> {
  const [site, rows] = await Promise.all([getPublicSite(siteId), getPublicTranslations(siteId, contentId)]);
  const supported = site?.supportedLocales ?? ["tr"];
  const defaultLocale = site?.defaultLocale ?? "tr";
  const links = rows
    .filter((r) => r.translationStatus === "published" && supported.includes(r.locale))
    .sort((a, b) => supported.indexOf(a.locale) - supported.indexOf(b.locale))
    .map((r) => ({ locale: r.locale, slug: r.slug }));
  return { links, defaultLocale };
}

const pathOf = (l: TranslationLink, homeSlug = "ana-sayfa") => (l.slug === homeSlug ? `/${l.locale}` : `/${l.locale}/${l.slug}`);

/** Next `alternates.languages` (hreflang + x-default); tek dilli içerikte `undefined`. */
export async function hreflangAlternates(siteId: string, contentId: string, baseUrl: string) {
  const { links, defaultLocale } = await publicLocaleLinks(siteId, contentId);
  const entries = buildHreflang(links, defaultLocale, (l) => `${baseUrl.replace(/\/$/, "")}${pathOf(l)}`);
  return entries.length ? Object.fromEntries(entries.map((e) => [e.hreflang, e.href])) : undefined;
}

/** Dil değiştirici bağlantıları (JS'siz `<a>`). */
export async function localeSwitcherLinks(siteId: string, contentId: string, current: string): Promise<LocaleAlternate[]> {
  const { links } = await publicLocaleLinks(siteId, contentId);
  if (links.length < 2) return [];
  return links.map((l) => ({ locale: l.locale, href: pathOf(l), label: nativeName(l.locale), current: l.locale === current }));
}
