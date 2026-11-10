import type { FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord } from "./types-chrome";
import type { SiteCustomizerSettings } from "./site-settings";

/** Sayfa adresi: boş ya da `ana-sayfa` gibi bir slug. */
export function sanitizeReadingSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  const slug = value.trim().toLowerCase();
  if (!slug || slug.length > 120) return "";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : "";
}

/** Seçilmiş öne çıkan sayfa varsa o, yoksa temanın yedek adresi. */
export function pickFrontSlug(chosen: unknown, themeFallback: string): string {
  return sanitizeReadingSlug(chosen) || themeFallback;
}

/** Tema kabuğunu ezmeden önceki menü, şerit ve yerleşim. */
export interface ChromeSnapshot {
  capturedFromThemeId: string;
  headerConfig: HeaderConfig;
  menuItems: NavigationMenuItem[];
  menus: SiteMenuRecord[];
  footerConfig: FooterConfig;
  sidebarConfig: SidebarConfig;
  customizer: {
    buttons: SiteCustomizerSettings["buttons"];
    header: SiteCustomizerSettings["header"];
    footer: SiteCustomizerSettings["footer"];
    layout: SiteCustomizerSettings["layout"];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Bozuk anlık görüntü yok sayılır; tema değişimi düz şeride düşer. */
export function sanitizeChromeSnapshot(value: unknown): ChromeSnapshot | null {
  if (!isRecord(value)) return null;
  const header = value.headerConfig;
  const footer = value.footerConfig;
  const sidebar = value.sidebarConfig;
  const customizer = value.customizer;
  if (!isRecord(header) || !isRecord(header.mainBar)) return null;
  if (!isRecord(footer) || !isRecord(sidebar) || !Array.isArray(value.menuItems)) return null;
  if (!isRecord(customizer) || !isRecord(customizer.header) || !isRecord(customizer.layout)) return null;
  const themeId = typeof value.capturedFromThemeId === "string" ? value.capturedFromThemeId.slice(0, 80) : "";
  if (!themeId) return null;
  return value as unknown as ChromeSnapshot;
}
