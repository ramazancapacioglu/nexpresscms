import {
  AKINSOFT_FOOTER,
  AKINSOFT_HEADER,
  AKINSOFT_MENUS,
  AKINSOFT_REACH_FORM_ID,
  AKINSOFT_SIDEBAR,
} from "@nexpress/themes";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";

/** Temayı seçince şerit, menü, footer, kenar ve demo formu yayına yazılır. Sayfa içerikleri silinmez. */
export async function applyAkinsoftChrome(siteId: string, locale = "tr") {
  const repo = getScopedRepository(siteId);
  const forms = getFormDefinitionRepository(siteId);
  await forms.create({
    id: AKINSOFT_REACH_FORM_ID,
    name: "Bize ulaşın",
    status: "active",
    spec: {
      fields: [
        { id: "ad", name: "ad", label: "Ad soyad", type: "text", required: true },
        { id: "tel", name: "telefon", label: "Telefon", type: "tel", required: true },
        { id: "eposta", name: "eposta", label: "E-posta", type: "email", required: true },
        { id: "not", name: "mesaj", label: "Mesaj", type: "textarea", required: false },
      ],
      submitLabel: "Gönder",
      successMessage: "Talebiniz alındı.",
      appearance: { columns: 1, labels: "top", density: "compact", buttonAlign: "full", surface: "inline", triggerLabel: "", stepped: false },
    },
  });
  const headerMenu = AKINSOFT_MENUS.find((m) => m.header)?.items ?? [];
  await repo.saveNavigationLayout({
    locale,
    headerConfig: AKINSOFT_HEADER,
    menuItems: headerMenu,
    menus: AKINSOFT_MENUS,
    footerConfig: AKINSOFT_FOOTER,
    sidebarConfig: AKINSOFT_SIDEBAR,
  });
  await repo.saveSiteSettings({
    customizer: {
      buttons: { style: "pill" },
      header: {
        logoText: "AKINSOFT",
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
      layout: { sidebarOnPage: true, sidebarPosition: "right", sidebarWidth: "300px" },
    },
  });
}
