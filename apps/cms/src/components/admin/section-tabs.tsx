"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SectionTab {
  href: string;
  label: string;
  /** Bu önekle başlayan yollar da bu sekmeyi etkin yapar (en uzun eşleşme kazanır) */
  match?: string[];
}

/**
 * 1. seviye bölüm sekme çubuğu (SEO, Tasarım).
 * Alt çizgili (underline) sade tasarım; sayfa içi ikincil filtre/düğmelerle çakışmaz.
 */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const path = usePathname() ?? "";
  const score = (t: SectionTab) =>
    Math.max(...[t.href, ...(t.match ?? [])].map((p) => (path === p || path.startsWith(`${p}/`) ? p.length : -1)));
  const best = tabs.reduce((acc, t) => (score(t) > score(acc) ? t : acc), tabs[0]!);

  return (
    <nav
      aria-label={label}
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E6E7EA] px-1 dark:border-[#23262E]"
    >
      {tabs.map((t) => {
        const active = score(t) >= 0 && t.href === best.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch={false}
            onClick={(e) => {
              if (path === t.href) e.preventDefault();
            }}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 px-3 py-2 text-[13px] transition ${
              active
                ? "font-semibold text-[#14151A] dark:text-[#F3F4F6] after:absolute after:inset-x-1 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#266DF0]"
                : "font-medium text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * 2. seviye kompakt segmentli alt gezinme (Site İskeleti: Header · Footer · Menüler · Kenar çubuğu).
 */
export function SubSectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const path = usePathname() ?? "";
  return (
    <nav
      aria-label={label}
      className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 dark:border-[#23262E] dark:bg-[#1C1E24]"
    >
      {tabs.map((t) => {
        const active = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              active
                ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]"
                : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const SEO_TABS: SectionTab[] = [
  { href: "/admin/seo", label: "Genel Bakış" },
  { href: "/admin/seo/audit", label: "Denetim" },
  { href: "/admin/seo/sitemap", label: "Site Haritası" },
  { href: "/admin/seo/schemas", label: "Şemalar & Dizin", match: ["/admin/seo/engine"] },
  { href: "/admin/redirects", label: "Yönlendirmeler" },
  { href: "/admin/seo/integrations", label: "Webmaster" },
  { href: "/admin/seo/reports", label: "Raporlar" },
  { href: "/admin/seo/settings", label: "Ayarlar" },
];

/**
 * Tasarımın tamamı 5 net durakta toplanır:
 * Temalar → Özelleştirici → Site İskeleti (Header/Footer/Menü/Kenar çubuğu) → Şablonlar & Modeller → Kütüphane & AI.
 */
const DESIGN_TABS: SectionTab[] = [
  { href: "/admin/themes", label: "Temalar", match: ["/admin/themes/packages"] },
  { href: "/admin/themes/customize", label: "Özelleştirici" },
  {
    href: "/admin/appearance/header",
    label: "Site İskeleti",
    match: [
      "/admin/appearance/footer",
      "/admin/appearance/menus",
      "/admin/appearance/sidebar",
      "/admin/appearance/navigation",
    ],
  },
  { href: "/admin/appearance/templates", label: "Şablonlar & Modeller" },
  { href: "/admin/studio", label: "Kütüphane & AI", match: ["/admin/design-library"] },
];

const CHROME_SUB_TABS: SectionTab[] = [
  { href: "/admin/appearance/header", label: "Header" },
  { href: "/admin/appearance/footer", label: "Footer" },
  { href: "/admin/appearance/menus", label: "Menüler" },
  { href: "/admin/appearance/sidebar", label: "Kenar çubuğu" },
];

export const SeoTabs = () => <SectionTabs tabs={SEO_TABS} label="SEO bölümleri" />;

/** Tasarım sayfalarının ortak üst sekme çubuğu (5 net durak). */
export function AppearanceNav() {
  return <SectionTabs tabs={DESIGN_TABS} label="Tasarım bölümleri" />;
}

/** Site İskeleti alt seçicisi (Header · Footer · Menüler · Kenar çubuğu). */
export function ChromeSubNav() {
  return <SubSectionTabs tabs={CHROME_SUB_TABS} label="Site iskeleti bölümleri" />;
}
