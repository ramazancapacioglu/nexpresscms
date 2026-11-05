import { headers } from "next/headers";
import { emptySidebarConfig, menuLibraryFrom, type FooterConfig, type HeaderConfig } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";

export const fallbackHeader: HeaderConfig = {
  topBar: {
    enabled: false,
    leftWidgets: [],
    centerWidgets: [],
    rightWidgets: [],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: false,
    leftWidgets: ["logo"],
    centerWidgets: ["menu"],
    rightWidgets: ["cta"],
    ctaLabel: "Yönetim",
    ctaHref: "/admin",
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

export const fallbackFooter: FooterConfig = {
  columns: [],
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: "© 2026 NexPress",
  bottomLinks: [],
};

export async function loadChrome(locale?: string) {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const wanted = locale && site?.supportedLocales.includes(locale) ? locale : defaultLocale;
  const own = await repo.getNavigationLayout(wanted);
  const nav = own ?? (await repo.getNavigationLayout(defaultLocale));
  return {
    locale: wanted,
    locales: site?.supportedLocales ?? [defaultLocale],
    defaultLocale,
    /** Seçilen dilin kendi menü kaydı var mı (yoksa varsayılan dilinki gösterilir) */
    hasOwn: Boolean(own),
    header: nav?.headerConfig ?? fallbackHeader,
    menu: nav?.menuItems ?? [],
    menus: menuLibraryFrom(nav?.menuItems ?? [], nav?.footerConfig?.menus),
    footer: nav?.footerConfig ?? fallbackFooter,
    sidebar: nav?.sidebarConfig ?? emptySidebarConfig(),
  };
}
