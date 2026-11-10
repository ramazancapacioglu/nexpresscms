import type { NavigationMenuItem, SiteMenuRecord } from "@nexpress/core";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";

/** Veri kümesindeki sayfalar palet değişkenini tanımlamazsa bu renkler kullanılır. */
export const DATASET_PALETTE: Record<string, string> = {
  "--global-palette1": "#0c644e",
  "--global-palette2": "#09589a",
  "--global-palette3": "#060a0d",
  "--global-palette4": "#252424",
  "--global-palette5": "#3182ce",
  "--global-palette6": "#343433",
  "--global-palette7": "#edf2f7",
  "--global-palette8": "#f8fffe",
  "--global-palette9": "#ffffff",
};

export const DATASET_ORIGIN = "https://akinsoftizmir.com.tr";

function headerMenu(): NavigationMenuItem[] {
  const nav = [
    {
      id: "m_erp",
      label: "ERP Çözümleri",
      href: "/kurumsal-kaynak-planlama",
      children: [
        { id: "m_erp_1", label: "Wolvox ERP", href: "/wolvox-erp" },
        { id: "m_erp_2", label: "Wolvox İK", href: "/insan-kaynaklari-yonetimi" },
        { id: "m_erp_3", label: "Wolvox CRM", href: "/wolvox-crm-yonetimi" },
        { id: "m_erp_4", label: "Wolvox Webconnect", href: "/wolvox-webconnect" },
        { id: "m_erp_5", label: "Wolvox MRP Üretim Yöntemi", href: "/wolvox-uretim-yontemi" },
      ],
    },
    {
      id: "m_muh",
      label: "Muhasebe Programları",
      href: "/muhasebe-programlari",
      children: [
        { id: "m_muh_1", label: "Ön Muhasebe Yazılımı", href: "/on-muhasebe-programi" },
        { id: "m_muh_2", label: "Genel Muhasebe Yazılımı", href: "/genel-muhasebe-programi" },
        { id: "m_muh_3", label: "OctoCloud Bulut Muhasebe", href: "/octocloud" },
        { id: "m_muh_4", label: "Octo Plus Kolay Muhasebe", href: "/octoplus" },
      ],
    },
    {
      id: "m_sek",
      label: "Sektörel Programlar",
      href: "/sektorel-cozumler",
      children: [
        { id: "m_sek_1", label: "Wolvox Restoran", href: "/akinsoft-wolvox-restoran-yonetimi" },
        { id: "m_sek_2", label: "Mobil Satış", href: "/mobil-satis" },
        { id: "m_sek_3", label: "Süper Market Yazılımı", href: "/super-market-yonetimi" },
        { id: "m_sek_4", label: "Wolvox Hızlı Satış Programı", href: "/wolvox-hizli-satis" },
        { id: "m_sek_5", label: "Otel Yönetimi Programı", href: "/otel-yonetimi-programi" },
        { id: "m_sek_6", label: "Sürücü Kursu Otomasyonu", href: "/surucu-kursu-otomasyonu" },
        { id: "m_sek_7", label: "Servis Yönetimi", href: "/servis-yonetimi" },
        { id: "m_sek_8", label: "Wolvox Fiyatmatik", href: "/fiyatmatik" },
      ],
    },
    {
      id: "m_edon",
      label: "E-Dönüşüm",
      href: "/akinsoft-e-donusum",
      children: [
        { id: "m_edon_1", label: "E-Arşiv Fatura", href: "/e-arsiv-fatura" },
        { id: "m_edon_2", label: "e-Defter", href: "/e-defter" },
        { id: "m_edon_3", label: "e-Fatura", href: "/e-fatura" },
        { id: "m_edon_4", label: "e-İrsaliye", href: "/e-irsaliye" },
        { id: "m_edon_5", label: "e-Müstahsil Makbuzu", href: "/e-mustahsil-makbuzu" },
        { id: "m_edon_6", label: "E-Adisyon", href: "/e-adisyon" },
        { id: "m_edon_7", label: "e-Mutabakat", href: "/e-mutabakat" },
      ],
    },
    {
      id: "m_bulut",
      label: "Bulut Yazılımlar",
      href: "/bulut-yazilim-cozumleri",
      children: [
        { id: "m_bulut_1", label: "E-Ticaret", href: "/e-ticaret" },
        { id: "m_bulut_2", label: "Yedekleme Programı", href: "/bulut-yedekleme-programi" },
        { id: "m_bulut_3", label: "Akınsoft MyFranchise", href: "/akinsoft-myfranchise" },
        { id: "m_bulut_4", label: "E-Ofis Yazılımı", href: "/e-ofis" },
        { id: "m_bulut_5", label: "Hotel Smart", href: "/hotel-smart" },
        { id: "m_bulut_6", label: "Pro Kuaför", href: "/prokuafor" },
        { id: "m_bulut_7", label: "QR Menü", href: "/qr-menu" },
      ],
    },
    {
      id: "m_kur",
      label: "Kurumsal",
      href: "/hakkimizda",
      children: [
        { id: "m_kur_1", label: "Kampanyalar", href: "/akinsoft-kampanyalar" },
        { id: "m_kur_2", label: "Hakkımızda", href: "/hakkimizda" },
        { id: "m_kur_3", label: "Akınsoft SSS", href: "/akinsoft-sikca-sorulan-sorular" },
        { id: "m_kur_4", label: "Demo Talebi", href: "/akinsoft-demo-talebi" },
        { id: "m_kur_5", label: "Destek Talebi", href: "/akinsoft-destek" },
      ],
    },
    { id: "m_iletisim", label: "İletişim", href: "/iletisim", children: [] as { id: string; label: string; href: string }[] },
  ];
  return nav.map((item) => ({
    ...item,
    source: { kind: "custom" as const },
    children: item.children.map((child) => ({ ...child, source: { kind: "custom" as const }, children: [] })),
  }));
}

async function ensureLeadForm(siteId: string): Promise<void> {
  const forms = getFormDefinitionRepository(siteId);
  const existing = await forms.get("frm_wp_1");
  const spec = {
    fields: [
      { id: "f_name", name: "ad_soyad", label: "Ad Soyad", type: "text" as const, required: true, placeholder: "Adınız ve soyadınız", help: "", width: "half" as const, options: [] },
      { id: "f_company", name: "firma_adi", label: "Firma Adı", type: "text" as const, required: false, placeholder: "Firma unvanı", help: "", width: "half" as const, options: [] },
      { id: "f_phone", name: "telefon", label: "Telefon", type: "tel" as const, required: true, placeholder: "0 (5XX) XXX XX XX", help: "", width: "half" as const, options: [] },
      { id: "f_email", name: "eposta", label: "E-Posta", type: "email" as const, required: false, placeholder: "ornek@firma.com", help: "", width: "half" as const, options: [] },
      { id: "f_message", name: "mesaj", label: "Mesajınız / Talebiniz", type: "textarea" as const, required: false, placeholder: "İlgilendiğiniz yazılım veya talebiniz", help: "", width: "full" as const, options: [] },
    ],
    submitLabel: "Gönder",
    successMessage: "Talebiniz alındı. Uzman ekibimiz en kısa sürede sizinle iletişime geçecektir.",
    redirectUrl: "",
  };
  if (existing) await forms.update("frm_wp_1", { name: "İletişim & Demo Talep Formu", spec });
  else await forms.create({ id: "frm_wp_1", name: "İletişim & Demo Talep Formu", spec });
}

/** Veri kümesine ait menü, üst şerit, logo ve form. Canlı köprü bu fonksiyonu çağırmaz. */
export async function applyDatasetChrome(siteId: string, locale: string): Promise<void> {
  await ensureLeadForm(siteId);
  const repo = getScopedRepository(siteId);
  const navLayout = await repo.getNavigationLayout(locale);
  if (navLayout) {
    const headerItems = headerMenu();
    const menus: SiteMenuRecord[] = [{ id: "menu_wp_header", name: "Ana Menü", header: true, items: headerItems }];
    await repo.saveNavigationLayout({
      locale,
      headerConfig: {
        ...navLayout.headerConfig,
        topBar: {
          ...navLayout.headerConfig.topBar,
          enabled: true,
          announcementText: "Akınsoft İzmir Ana Bayi — Dijital Evre",
          contactPhone: "0 232 332 02 15",
          contactEmail: "akinsoft@dijitalevre.com",
        },
        mainBar: {
          ...navLayout.headerConfig.mainBar,
          ctaLabel: "0 232 332 02 15",
          ctaHref: "tel:+902323320215",
        },
      },
      footerConfig: navLayout.footerConfig,
      menuItems: headerItems,
      menus,
    });
  }
  await repo.saveSiteSettings({
    customizer: {
      header: {
        logoText: "Akınsoft İzmir Ana Bayi",
        logoImage: "/images/akinsoft-izmir-logo-5.webp",
      },
      layout: {
        articleWidth: "1290px",
      },
    },
  });
}
