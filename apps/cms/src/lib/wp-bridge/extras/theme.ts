import "server-only";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import { readPageOptions, writePageOptions } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getThemeChromePreset, getThemeManifest } from "@nexpress/themes";
import { headingRepeatsTitle } from "@nexpress/wp-importer";
import { switchThemeChrome } from "@/lib/theme-chrome-switch";

const THEME_ID = "yazilim-bayi";

/**
 * Yazılım Bayi temasını yayına alır: renk jetonları, başlık (üst şerit, ana menü, hızlı bağlantılar), altlık (5 çözüm sütunu,
 * iletişim, sosyal, alt çubuk) ve menü temanın hazır düzeninden yazılır. Önceki temanın şeridi `general.themeChrome` altında saklanır.
 * Site genişliği 1280 px'tir (kaynak site 1290 px). Logo temanın kendi logosudur (kitaplıktaki yatay logo koyu zemin içindir).
 */
export async function applyDealerTheme(siteId: string, containerMaxWidth = "1280px"): Promise<{ theme: string; menuItems: number; footerColumns: number; logo: string }> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";
  const previous = site?.activeThemeId ?? "";
  const manifest = getThemeManifest(THEME_ID);
  const tokens: DesignTokens = { ...manifest.tokens, geometry: { ...manifest.tokens.geometry, containerMaxWidth } };
  await repo.activateTheme(manifest.id, tokens, manifest.recommendedProfile);
  await switchThemeChrome(siteId, previous, manifest.id, locale);

  const preset = getThemeChromePreset(THEME_ID);
  const nav = await repo.getNavigationLayout(locale);
  if (!preset || !nav) return { theme: manifest.id, menuItems: 0, footerColumns: 0, logo: "" };
  const menuItems = preset.menuItems ?? nav.menuItems;
  await repo.saveNavigationLayout({
    locale,
    headerConfig: preset.header,
    menuItems,
    footerConfig: { ...preset.footer, menus: [{ id: "menu_wp_header", name: "Ana Menü", header: true, items: menuItems }] },
    sidebarConfig: nav.sidebarConfig,
  });
  await repo.saveSiteSettings({
    customizer: {
      ...preset.customizer,
      header: { ...preset.customizer.header },
      layout: { ...preset.customizer.layout, contentLayout: "boxed", articleWidth: "1290px" },
    },
  });
  return { theme: manifest.id, menuItems: menuItems.length, footerColumns: preset.footer.columns.length, logo: preset.customizer.header?.logoImage ?? "" };
}

function firstHeading(nodes: BlockNode[]): string {
  for (const node of nodes) {
    if (node.type === "heading" && typeof node.props?.text === "string") return node.props.text;
    if (node.children) {
      const found = firstHeading(node.children);
      if (found) return found;
    }
  }
  return "";
}

/**
 * Sayfa düzeni: içerik zaten kendi başlığıyla açılıyorsa yerleşik başlık satırı görsel olarak gizlenir
 * (h1 ekran okuyucu ve arama motoru için kalır). Sayfalar site genişliğinde çizilir (kod tarafında `page` türü için `max-w-4xl` yoktur).
 */
export async function tidyPageLayout(siteId: string): Promise<{ pages: number; titleHidden: number }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  let pages = 0;
  let titleHidden = 0;
  for (const row of await repo.listContents({ locale, type: "page" })) {
    pages += 1;
    const attrs = (row.schemaAttributes ?? {}) as Record<string, unknown>;
    const options = readPageOptions(attrs);
    if (options.hideTitle || !headingRepeatsTitle(row.title, firstHeading(row.blocks))) continue;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: writePageOptions(attrs, { ...options, hideTitle: true }),
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: row.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    titleHidden += 1;
  }
  return { pages, titleHidden };
}
