import {
  KA_BRAND,
  KA_FOOTER,
  KA_HEADER,
  KA_MENUS,
  KA_SIDEBAR,
  KA_THEME_ID,
} from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";

export function isKuzeyAtolyeTheme(themeId: string): boolean {
  return themeId === KA_THEME_ID;
}

/**
 * Demo aktarımında şerit, menü, altlık ve yazı kenarını yazar.
 * Sayfa içerikleri silinmez. Logo yazısı örnek markadır.
 */
export async function applyKuzeyAtolyeChrome(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const headerMenu = KA_MENUS.find((menu) => menu.header)?.items ?? [];
  await repo.saveNavigationLayout({
    locale,
    headerConfig: KA_HEADER,
    menuItems: headerMenu,
    menus: KA_MENUS,
    footerConfig: KA_FOOTER,
    sidebarConfig: KA_SIDEBAR,
  });
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "sharp" },
      header: {
        logoText: KA_BRAND,
        height: 72,
        sticky: true,
        glass: false,
        showTagline: false,
        menuAlign: "left",
        showCta: true,
        ctaLabel: "Yazın",
        ctaHref: `/${locale}/kuzey-iletisim`,
      },
      footer: { background: "#efe8db", textColor: "#1c1915", columns: 3 },
      layout: {
        contentLayout: "boxed",
        sidebarOnPage: false,
        sidebarOnBlog: true,
        sidebarPosition: "right",
        sidebarWidth: "300px",
        blogSidebarId: "blog",
        articleWidth: "680px",
      },
    },
  });
}
