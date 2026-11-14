import { SA_BRAND, SA_FOOTER, SA_HEADER, SA_MENUS, SA_SIDEBAR, SA_THEME_ID } from "@nexpress/themes";
import { getScopedRepository } from "@nexpress/database";

export function isSeraAjansTheme(themeId: string): boolean {
  return themeId === SA_THEME_ID;
}

/** Demo aktarımında şerit, menü ve altlığı yazar. Sayfa içerikleri silinmez. */
export async function applySeraAjansChrome(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const headerMenu = SA_MENUS.find((menu) => menu.header)?.items ?? [];
  await repo.saveNavigationLayout({
    locale,
    headerConfig: SA_HEADER,
    menuItems: headerMenu,
    menus: SA_MENUS,
    footerConfig: SA_FOOTER,
    sidebarConfig: SA_SIDEBAR,
  });
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "pill" },
      header: {
        logoText: SA_BRAND,
        height: 72,
        sticky: true,
        glass: false,
        showTagline: false,
        menuAlign: "center",
        showCta: true,
        ctaLabel: "Teklif al",
        ctaHref: `/${locale}/sera-iletisim`,
      },
      footer: { background: "#161616", textColor: "#f6d5de", columns: 4 },
      layout: {
        contentLayout: "boxed",
        sidebarOnPage: false,
        sidebarOnBlog: true,
        sidebarPosition: "right",
        sidebarWidth: "300px",
        blogSidebarId: "blog",
        articleWidth: "720px",
      },
    },
  });
}
