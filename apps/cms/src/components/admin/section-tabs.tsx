"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface SectionTab {
  href: string;
  label: string;
  /** Bu önekle başlayan yollar da bu sekmeyi etkin yapar (en uzun eşleşme kazanır) */
  match?: string[];
}

/** Bir çatı altındaki ilgili sayfaları (SEO, Görünüm) tek sekme çubuğunda toplar. Etkin sekme adresten bulunur. */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const path = usePathname() ?? "";
  const router = useRouter();
  const score = (t: SectionTab) => Math.max(...[t.href, ...(t.match ?? [])].map((p) => (path === p || path.startsWith(`${p}/`) ? p.length : -1)));
  const best = tabs.reduce((acc, t) => (score(t) > score(acc) ? t : acc), tabs[0]!);
  return (
    <nav aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#D5D8DE] px-1 pb-2 dark:border-[#2C303A]">
      {tabs.map((t) => {
        const active = score(t) >= 0 && t.href === best.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            prefetch={false}
            onClick={(e) => {
              if (path === t.href) {
                e.preventDefault();
              }
            }}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
              active ? "bg-[#266DF0] text-white shadow-sm" : "text-[#454B55] hover:bg-[#E9ECF1] dark:text-[#B4BAC5] dark:hover:bg-[#22252D]"
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
  { href: "/admin/seo", label: "SEO motoru & dizin" },
  { href: "/admin/seo/integrations", label: "Webmaster & Analitik (GSC, GA4, Bing, Yandex)" },
  { href: "/admin/seo/audit", label: "Site denetimi" },
  { href: "/admin/redirects", label: "Yönlendirmeler & 404" },
];

export const APPEARANCE_TABS: SectionTab[] = [
  { href: "/admin/studio", label: "✨ Tasarım Stüdyosu", match: [] },
  { href: "/admin/themes", label: "Temalar", match: [] },
  { href: "/admin/themes/customize", label: "Tema Özelleştirici", match: [] },
  { href: "/admin/appearance/templates", label: "Şablonlar & Modeller" },
  { href: "/admin/appearance/menus", label: "Menüler" },
  { href: "/admin/appearance/sidebar", label: "Kenar Çubuğu" },
  { href: "/admin/appearance/header", label: "Header" },
  { href: "/admin/appearance/footer", label: "Footer" },
];

export const SeoTabs = () => <SectionTabs tabs={SEO_TABS} label="SEO bölümleri" />;
export const AppearanceNav = () => <SectionTabs tabs={APPEARANCE_TABS} label="Görünüm bölümleri" />;
