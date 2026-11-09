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
  { href: "/admin/seo", label: "Gösterge" },
  { href: "/admin/seo/engine", label: "Motor & dizin" },
  { href: "/admin/seo/reports", label: "Raporlar" },
  { href: "/admin/seo/integrations", label: "Webmaster & Analitik" },
  { href: "/admin/seo/audit", label: "Site denetimi" },
  { href: "/admin/redirects", label: "Yönlendirmeler & 404" },
  { href: "/admin/seo/schemas", label: "Şemalar" },
  { href: "/admin/seo/settings", label: "Ayarlar" },
];

/** Tema derisi: galeri ve jetonlar. Yerleşim ve şablon burada yok. */
const THEME_TABS: SectionTab[] = [
  { href: "/admin/themes", label: "Tema galerisi", match: ["/admin/themes/packages"] },
  { href: "/admin/themes/customize", label: "Özelleştirici" },
];

/** İçerik tasarımı: üretim, kütüphane ve şablon ataması. Tema rengi burada yok. */
const STUDIO_TABS: SectionTab[] = [
  { href: "/admin/studio", label: "Tasarım stüdyosu", match: ["/admin/design-library"] },
  { href: "/admin/appearance/templates", label: "Şablonlar" },
];

/** Site iskeleti: header, menü, footer, kenar çubuğu. */
const CHROME_TABS: SectionTab[] = [
  { href: "/admin/appearance/header", label: "Header" },
  { href: "/admin/appearance/menus", label: "Menüler", match: ["/admin/appearance/navigation"] },
  { href: "/admin/appearance/footer", label: "Footer" },
  { href: "/admin/appearance/sidebar", label: "Kenar çubuğu" },
];

export const SeoTabs = () => <SectionTabs tabs={SEO_TABS} label="SEO bölümleri" />;

/** Bulunulan adresin ailesini gösterir. Tema, stüdyo ve yerleşim aynı çubukta durmaz. */
export function AppearanceNav() {
  const path = usePathname() ?? "";
  const studio = path.startsWith("/admin/studio") || path.startsWith("/admin/design-library") || path.startsWith("/admin/appearance/templates");
  const theme = path.startsWith("/admin/themes");
  const tabs = studio ? STUDIO_TABS : theme ? THEME_TABS : CHROME_TABS;
  const label = studio ? "Tasarım bölümleri" : theme ? "Tema bölümleri" : "Yerleşim bölümleri";
  return <SectionTabs tabs={tabs} label={label} />;
}
