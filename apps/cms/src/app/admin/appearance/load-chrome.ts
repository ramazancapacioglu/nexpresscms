import { headers } from "next/headers";
import { emptySidebarConfig, type FooterConfig, type HeaderConfig } from "@nexpress/core";
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

export async function loadChrome() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const nav = await getScopedRepository(siteId).getNavigationLayout("tr");
  return {
    header: nav?.headerConfig ?? fallbackHeader,
    menu: nav?.menuItems ?? [],
    footer: nav?.footerConfig ?? fallbackFooter,
    sidebar: nav?.sidebarConfig ?? emptySidebarConfig(),
  };
}
