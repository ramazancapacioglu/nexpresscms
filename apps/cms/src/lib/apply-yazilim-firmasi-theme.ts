import {
  HEADER_TEMPLATES,
  YF_BRAND,
  YF_FOOTER,
  YF_HEADER,
  YF_LEGACY_THEME_ID,
  YF_MENUS,
  YF_REACH_FORM_ID,
  YF_SIDEBAR,
  YF_THEME_ID,
} from "@nexpress/themes";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";

export function isYazilimFirmasiTheme(themeId: string): boolean {
  return themeId === YF_THEME_ID || themeId === YF_LEGACY_THEME_ID;
}

/**
 * Yazılım Firması kapanınca tam genişlik, hap düğme ve o temanın şerit düzeni kalkar.
 * Menü ağacı ve footer içeriği durur; sayfalar silinmez.
 */
export async function restoreChromeAfterYazilimFirmasi(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const nav = await repo.getNavigationLayout(locale);
  const plain = HEADER_TEMPLATES.find((item) => item.id === "header-plain")?.value;
  if (nav && plain) {
    const ctaLabel = nav.headerConfig.mainBar?.ctaLabel || plain.mainBar.ctaLabel;
    const ctaHref = nav.headerConfig.mainBar?.ctaHref || plain.mainBar.ctaHref;
    await repo.saveNavigationLayout({
      locale,
      headerConfig: { ...plain, mainBar: { ...plain.mainBar, ctaLabel, ctaHref } },
      menuItems: nav.menuItems,
      footerConfig: nav.footerConfig,
      sidebarConfig: nav.sidebarConfig,
    });
  }
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "solid" },
      header: { height: 64, glass: false, sticky: true },
      layout: { contentLayout: "boxed", sidebarOnPage: false },
    },
  });
}

/** Temayı seçince şerit, menü, footer, kenar ve demo formu yayına yazılır. Sayfa içerikleri silinmez. */
export async function applyYazilimFirmasiChrome(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const forms = getFormDefinitionRepository(siteId);
  const reachForm = {
    id: YF_REACH_FORM_ID,
    name: "Sizi arayalım",
    status: "active",
    spec: {
      fields: [
        { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true },
        { id: "tel", name: "telefon", label: "Telefon", type: "tel", required: true },
        { id: "onay", name: "onay", label: "Aydınlatma metnini okudum ve anladım.", type: "checkbox", required: true },
      ],
      submitLabel: "Gönder",
      successMessage: "Talebiniz alındı.",
      appearance: { columns: 1, labels: "top", density: "compact", buttonAlign: "full", surface: "inline", triggerLabel: "", stepped: false },
    },
  } as const;
  // Eski kayıt (alanları değişmiş olabilir) güncellenir; yoksa oluşturulur.
  if (await forms.get(YF_REACH_FORM_ID)) await forms.update(YF_REACH_FORM_ID, reachForm);
  else await forms.create(reachForm);
  const headerMenu = YF_MENUS.find((m) => m.header)?.items ?? [];
  await repo.saveNavigationLayout({
    locale,
    headerConfig: YF_HEADER,
    menuItems: headerMenu,
    menus: YF_MENUS,
    footerConfig: YF_FOOTER,
    sidebarConfig: YF_SIDEBAR,
  });
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "pill" },
      header: {
        logoText: YF_BRAND,
        height: 52,
        sticky: true,
        glass: true,
        showTagline: false,
        menuAlign: "center",
        showCta: true,
        ctaLabel: "Demo Talebi",
        ctaHref: `/${locale}/iletisim`,
      },
      footer: { background: "#f5f5f7", textColor: "#1d1d1f", columns: 4 },
      layout: { contentLayout: "fullwidth", sidebarOnPage: false, sidebarPosition: "right", sidebarWidth: "300px" },
    },
  });
}
