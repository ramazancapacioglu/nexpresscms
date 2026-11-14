import { CR_BRAND, CR_FOOTER, CR_HEADER, CR_MENUS, CR_SIDEBAR, CR_THEME_ID } from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";

export function isCrimsonErpTheme(themeId: string): boolean {
  return themeId === CR_THEME_ID;
}

/** Demo aktarımında şerit, menü ve altlığı yazar. Sayfa içerikleri silinmez. */
export async function applyCrimsonErpChrome(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const headerMenu = CR_MENUS.find((menu) => menu.header)?.items ?? [];
  await repo.saveNavigationLayout({
    locale,
    headerConfig: CR_HEADER,
    menuItems: headerMenu,
    menus: CR_MENUS,
    footerConfig: CR_FOOTER,
    sidebarConfig: CR_SIDEBAR,
  });
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "pill" },
      header: {
        logoText: CR_BRAND.toLowerCase(),
        height: 72,
        sticky: true,
        glass: false,
        showTagline: false,
        menuAlign: "center",
        showCta: true,
        ctaLabel: "Fiyat alın",
        ctaHref: `/${locale}/crimson-iletisim`,
      },
      footer: { background: "#f7f7f8", textColor: "#1a1a1a", columns: 4 },
      layout: {
        contentLayout: "boxed",
        sidebarOnPage: false,
        sidebarOnBlog: true,
        sidebarPosition: "right",
        sidebarWidth: "300px",
        blogSidebarId: "blog",
        articleWidth: "760px",
      },
    },
  });
}
