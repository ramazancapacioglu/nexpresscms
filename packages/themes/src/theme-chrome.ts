import type { FooterConfig, HeaderConfig, NavigationMenuItem, SiteCustomizerSettings } from "@nexpress/core";
import { FOOTER_LIBRARY, HEADER_LIBRARY } from "./chrome-library";
import { INK_GRID_FOOTER, INK_GRID_ID } from "./ink-grid";
import { KA_FOOTER, KA_HEADER, KA_THEME_ID } from "./kuzey-atolye";
import { SA_FOOTER, SA_HEADER, SA_THEME_ID } from "./sera-ajans";
import { CR_FOOTER, CR_HEADER, CR_THEME_ID } from "./crimson-erp";
import { YB_BRAND, YB_FOOTER, YB_HEADER, YB_HEADER_MENU, YB_LOGO, YB_THEME_ID } from "./yazilim-bayi";

/**
 * Resmi temanın kendi başlık/altlık düzeni ve düğme/başlık davranışı.
 * Tema ilk kez etkinleştirilince yazılır; kullanıcı düzenlerse değişiklik tema başına saklanır (`general.themeChrome`),
 * başka temaya geçip dönünce kullanıcının düzeni geri gelir. Menü ve iletişim bilgisi içeriktir: temayla değişmez.
 */
export interface ThemeChromePreset {
  header: HeaderConfig;
  footer: FooterConfig;
  /** Site menüsü boşken yazılan ana menü. Dolu menüye dokunulmaz. */
  menuItems?: NavigationMenuItem[];
  customizer: {
    buttons: Partial<SiteCustomizerSettings["buttons"]>;
    header: Partial<SiteCustomizerSettings["header"]>;
    layout: Partial<SiteCustomizerSettings["layout"]>;
  };
}

function headerById(id: string): HeaderConfig {
  const item = HEADER_LIBRARY.find((entry) => entry.id === id);
  if (!item) throw new Error(`Başlık şablonu yok: ${id}`);
  return structuredClone(item.value);
}

function footerById(id: string): FooterConfig {
  const item = FOOTER_LIBRARY.find((entry) => entry.id === id);
  if (!item) throw new Error(`Altlık şablonu yok: ${id}`);
  return structuredClone(item.value);
}

const PRESETS: Record<string, () => ThemeChromePreset> = {
  "corporate-aurora": () => ({
    header: headerById("header-announce"),
    footer: footerById("footer-corporate"),
    customizer: {
      buttons: { style: "solid" },
      header: { height: 68, sticky: true, glass: true, menuAlign: "center" },
      layout: { contentLayout: "boxed" },
    },
  }),
  "commerce-velocity": () => ({
    header: headerById("header-catalog"),
    footer: footerById("footer-letter"),
    customizer: {
      buttons: { style: "pill" },
      header: { height: 72, sticky: true, glass: false, menuAlign: "left" },
      layout: { contentLayout: "boxed" },
    },
  }),
  "editorial-pulse": () => ({
    header: headerById("header-plain"),
    footer: footerById("footer-plain"),
    customizer: {
      buttons: { style: "sharp" },
      header: { height: 60, sticky: false, glass: false, menuAlign: "left" },
      layout: { contentLayout: "boxed", articleWidth: "760px" },
    },
  }),
  [CR_THEME_ID]: () => ({
    header: structuredClone(CR_HEADER),
    footer: structuredClone(CR_FOOTER),
    customizer: {
      buttons: { style: "pill" },
      header: { height: 72, sticky: true, glass: false, menuAlign: "center" },
      layout: { contentLayout: "boxed", sidebarOnPage: false, articleWidth: "760px" },
    },
  }),
  [SA_THEME_ID]: () => ({
    header: structuredClone(SA_HEADER),
    footer: structuredClone(SA_FOOTER),
    customizer: {
      buttons: { style: "pill" },
      header: { height: 72, sticky: true, glass: false, menuAlign: "center" },
      layout: { contentLayout: "boxed", sidebarOnPage: false, articleWidth: "720px" },
    },
  }),
  [KA_THEME_ID]: () => ({
    header: structuredClone(KA_HEADER),
    footer: structuredClone(KA_FOOTER),
    customizer: {
      buttons: { style: "sharp" },
      header: { height: 72, sticky: true, glass: false, menuAlign: "left" },
      layout: { contentLayout: "boxed", sidebarOnPage: false, articleWidth: "680px" },
    },
  }),
  [YB_THEME_ID]: () => ({
    header: structuredClone(YB_HEADER),
    footer: structuredClone(YB_FOOTER),
    menuItems: structuredClone(YB_HEADER_MENU),
    customizer: {
      buttons: { style: "sharp" },
      header: { height: 64, sticky: true, glass: false, menuAlign: "left", logoImage: YB_LOGO, logoText: YB_BRAND },
      layout: { contentLayout: "boxed" },
    },
  }),
  [INK_GRID_ID]: () => ({
    header: headerById("header-center"),
    footer: { ...footerById("footer-plain"), ...structuredClone(INK_GRID_FOOTER) },
    customizer: {
      buttons: { style: "sharp" },
      header: { height: 56, sticky: true, glass: false, menuAlign: "center" },
      layout: { contentLayout: "fullwidth" },
    },
  }),
};

/** Temanın hazır düzeni; yüklenen veri temaları ve Yazılım Firması (kendi uygulayıcısı var) için `null`. */
export function getThemeChromePreset(themeId: string): ThemeChromePreset | null {
  const make = PRESETS[themeId];
  return make ? make() : null;
}
