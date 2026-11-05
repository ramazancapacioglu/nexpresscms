import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord, SiteWidget } from "@nexpress/core";

/** AKINSOFT merkez sitesinin yerleşim düzeni. Logo yolu kopyalanmaz; iki renkli yazı markası kullanılır. */
export const AKINSOFT_THEME_ID = "akinsoft-merkez" as const;
export const AKINSOFT_REACH_FORM_ID = "frm_akinsoft_reach";

const link = (id: string, label: string, href: string, children?: NavigationMenuItem[]): NavigationMenuItem => ({
  id,
  label,
  href,
  source: { kind: "custom" },
  ...(children?.length ? { children } : {}),
});

const col = (id: string, label: string, href: string, children: NavigationMenuItem[]): NavigationMenuItem =>
  link(id, label, href, children);

/** Header menüsü: kökler mega panelde, altlar sütun ya da liste. */
export const AKINSOFT_HEADER_MENU: NavigationMenuItem[] = [
  {
    ...col("as_cozum", "Çözümlerimiz", "/tr/programlar", [
      col("as_erp", "ERP", "/tr/programlar", [
        link("as_mrp", "WOLVOX MRP", "/tr/programlar"),
        link("as_crm", "WOLVOX CRM", "/tr/programlar"),
        link("as_ik", "İnsan Kaynakları", "/tr/programlar"),
        link("as_ofis", "Ofis ve Veri Yönetimi", "/tr/programlar"),
      ]),
      col("as_muh", "Muhasebe", "/tr/muhasebe", [
        link("as_genel", "Genel Muhasebe", "/tr/muhasebe"),
        link("as_on", "Ön Muhasebe", "/tr/muhasebe"),
        link("as_mali", "Mali Müşavir", "/tr/muhasebe"),
      ]),
      col("as_bulut", "Bulut", "/tr/bulut", [
        link("as_wcloud", "WolvoxCloud", "/tr/bulut"),
        link("as_etic", "E-Ticaret", "/tr/e-ticaret"),
        link("as_task", "TaskPano", "/tr/bulut"),
        link("as_octo", "OctoCloud", "/tr/bulut"),
        link("as_qr", "QR Menü", "/tr/bulut"),
        link("as_limon", "LimonDesk", "/tr/bulut"),
      ]),
      col("as_edon", "e-Dönüşüm", "/tr/e-donusum", [
        link("as_ef", "e-Fatura", "/tr/e-donusum"),
        link("as_ea", "e-Arşiv", "/tr/e-donusum"),
        link("as_ei", "e-İrsaliye", "/tr/e-donusum"),
        link("as_ed", "e-Defter", "/tr/e-donusum"),
        link("as_em", "e-Mutabakat", "/tr/e-donusum"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 4, width: "full", items: [] },
  },
  {
    ...col("as_sektor", "Sektörel", "/tr/sektorel", [
      col("as_sat", "Satış noktası", "/tr/sektorel", [
        link("as_hs", "Hızlı Satış", "/tr/sektorel"),
        link("as_rest", "Restoran", "/tr/sektorel"),
        link("as_cafe", "İnternet Kafe", "/tr/sektorel"),
        link("as_saha", "Saha Satış", "/tr/sektorel"),
      ]),
      col("as_hiz", "Hizmet", "/tr/sektorel", [
        link("as_otel", "Otel", "/tr/sektorel"),
        link("as_servis", "Teknik Servis", "/tr/sektorel"),
        link("as_kuafor", "Kuaför", "/tr/sektorel"),
        link("as_saglik", "Sağlık", "/tr/sektorel"),
      ]),
      col("as_tesis", "Tesis", "/tr/sektorel", [
        link("as_akary", "Akaryakıt", "/tr/sektorel"),
        link("as_otopark", "Otopark", "/tr/sektorel"),
        link("as_emlak", "Emlak", "/tr/sektorel"),
        link("as_egitim", "Eğitim", "/tr/sektorel"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 3, width: "wide", items: [] },
  },
  {
    ...col("as_ek", "Ek Hizmetler", "/tr/e-donusum", [
      col("as_ek_belge", "Belge ve mesaj", "/tr/e-donusum", [
        link("as_ek_sms", "SMS / Kontör", "/tr/e-donusum"),
        link("as_ek_edon", "e-Dönüşüm", "/tr/e-donusum"),
      ]),
      col("as_ek_destek", "Destek", "/tr/iletisim", [
        link("as_ek_demo", "Ücretsiz tanıtım", "/tr/iletisim"),
        link("as_ek_kb", "Bilgi bankası", "/tr/bilgi-bankasi"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 2, width: "narrow", items: [] },
  },
  link("as_kamp", "Kampanyalar", "/tr/kampanyalar"),
  link("as_robot", "Akınrobotics", "/tr/kurumsal"),
  link("as_kur", "Kurumsal", "/tr/kurumsal", [
    link("as_hak", "Hakkımızda", "/tr/kurumsal"),
    link("as_ortak", "Çözüm Ortağı", "/tr/kurumsal"),
    link("as_blog", "Blog", "/tr/blog"),
    link("as_ilet", "İletişim", "/tr/iletisim"),
  ]),
];

export const AKINSOFT_QUICK_MENU: NavigationMenuItem[] = [
  link("as_q1", "Ücretsiz tanıtım", "/tr/iletisim"),
  link("as_q2", "Güncel kampanyalar", "/tr/kampanyalar"),
  link("as_q3", "e-Dönüşüm", "/tr/e-donusum"),
  link("as_q4", "WOLVOX ERP", "/tr/programlar"),
  link("as_q5", "Tüm çözümler", "/tr/programlar"),
  link("as_q6", "Bilgi bankası", "/tr/bilgi-bankasi"),
];

export const AKINSOFT_MENUS: SiteMenuRecord[] = [
  { id: "menu_akinsoft_header", name: "Ana menü", header: true, items: AKINSOFT_HEADER_MENU },
  { id: "menu_akinsoft_quick", name: "Hızlı bağlantılar", header: false, items: AKINSOFT_QUICK_MENU },
];

export const AKINSOFT_HEADER: HeaderConfig = {
  topBar: {
    enabled: false,
    contactPhone: "444 40 80",
    contactEmail: "info@akinsoft.com.tr",
    leftWidgets: [],
    centerWidgets: [],
    rightWidgets: [],
    mobileLeftWidgets: [],
    mobileCenterWidgets: [],
    mobileRightWidgets: [],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: true,
    leftWidgets: ["logo"],
    centerWidgets: ["menu"],
    rightWidgets: ["contact", "cta"],
    mobileLeftWidgets: ["logo"],
    mobileCenterWidgets: [],
    mobileRightWidgets: ["contact", "menu"],
    ctaLabel: "Demo Talebi",
    ctaHref: "/tr/iletisim",
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

const menuCol = (columnIndex: number, id: string, title: string, links: Array<[string, string]>): SiteWidget => ({
  id: `wdg_ft_${id}`,
  type: "nav_menu",
  title,
  enabled: true,
  columnIndex,
  settings: { links: links.map(([label, href], i) => ({ id: `${id}_${i}`, label, href })) },
});

export const AKINSOFT_FOOTER: FooterConfig = {
  layoutPreset: "4-equal",
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: "© AKINSOFT — İşletmenize özel yazılım çözümleri",
  bottomLinks: [
    { label: "İletişim", href: "/tr/iletisim" },
    { label: "Kampanyalar", href: "/tr/kampanyalar" },
    { label: "e-Dönüşüm", href: "/tr/e-donusum" },
  ],
  columns: [
    {
      id: "as_f_erp",
      title: "Kurumsal kaynak planlaması",
      colSpan: 3,
      links: [
        { label: "WOLVOX MRP", href: "/tr/programlar" },
        { label: "WOLVOX CRM", href: "/tr/programlar" },
        { label: "İnsan Kaynakları", href: "/tr/programlar" },
        { label: "Ofis ve Veri Yönetimi", href: "/tr/programlar" },
      ],
    },
    {
      id: "as_f_cloud",
      title: "Bulut çözümler",
      colSpan: 3,
      links: [
        { label: "WolvoxCloud", href: "/tr/bulut" },
        { label: "e-Ticaret", href: "/tr/e-ticaret" },
        { label: "OctoCloud", href: "/tr/bulut" },
        { label: "QR Menü", href: "/tr/bulut" },
        { label: "LimonDesk", href: "/tr/bulut" },
      ],
    },
    {
      id: "as_f_edon",
      title: "e-Dönüşüm",
      colSpan: 3,
      links: [
        { label: "e-Fatura", href: "/tr/e-donusum" },
        { label: "e-Arşiv", href: "/tr/e-donusum" },
        { label: "e-İrsaliye", href: "/tr/e-donusum" },
        { label: "e-Defter", href: "/tr/e-donusum" },
        { label: "e-Mutabakat", href: "/tr/e-donusum" },
      ],
    },
    {
      id: "as_f_co",
      title: "Kurumsal",
      colSpan: 3,
      links: [
        { label: "Hakkımızda", href: "/tr/kurumsal" },
        { label: "Kampanyalar", href: "/tr/kampanyalar" },
        { label: "Blog", href: "/tr/blog" },
        { label: "İletişim", href: "/tr/iletisim" },
      ],
    },
  ],
  widgets: [
    menuCol(0, "as_f_erp", "Kurumsal kaynak planlaması", [
      ["WOLVOX MRP", "/tr/programlar"],
      ["WOLVOX CRM", "/tr/programlar"],
      ["İnsan Kaynakları", "/tr/programlar"],
      ["Ofis ve Veri Yönetimi", "/tr/programlar"],
    ]),
    menuCol(1, "as_f_cloud", "Bulut çözümler", [
      ["WolvoxCloud", "/tr/bulut"],
      ["e-Ticaret", "/tr/e-ticaret"],
      ["OctoCloud", "/tr/bulut"],
      ["QR Menü", "/tr/bulut"],
      ["LimonDesk", "/tr/bulut"],
    ]),
    menuCol(2, "as_f_edon", "e-Dönüşüm", [
      ["e-Fatura", "/tr/e-donusum"],
      ["e-Arşiv", "/tr/e-donusum"],
      ["e-İrsaliye", "/tr/e-donusum"],
      ["e-Defter", "/tr/e-donusum"],
      ["e-Mutabakat", "/tr/e-donusum"],
    ]),
    menuCol(3, "as_f_co", "Kurumsal", [
      ["Hakkımızda", "/tr/kurumsal"],
      ["Kampanyalar", "/tr/kampanyalar"],
      ["Blog", "/tr/blog"],
      ["İletişim", "/tr/iletisim"],
    ]),
  ],
};

const quickWidget = {
  id: "wdg_as_quick",
  type: "nav_menu" as const,
  title: "Hızlı bağlantılar",
  enabled: true,
  settings: { menuId: "menu_akinsoft_quick" },
};
const contactWidget = {
  id: "wdg_as_contact",
  type: "contact_card" as const,
  title: "Bize ulaşın",
  enabled: true,
  settings: { phone: "444 40 80", email: "info@akinsoft.com.tr", hours: "Hafta içi 09:00–18:00", subtitle: "Demo ve destek" },
};

export const AKINSOFT_SIDEBAR: SidebarConfig = {
  enabled: true,
  position: "right",
  width: "300px",
  sticky: true,
  styleVariant: "minimal",
  title: "Kenar",
  widgets: [quickWidget, contactWidget],
  links: [],
  areas: [
    { id: "blog", name: "Blog", enabled: true, position: "right", width: "300px", sticky: true, styleVariant: "minimal", widgets: [quickWidget, contactWidget] },
    { id: "shop", name: "Mağaza", enabled: true, position: "right", width: "300px", sticky: true, styleVariant: "minimal", widgets: [quickWidget, contactWidget] },
    { id: "page", name: "Sayfa", enabled: true, position: "right", width: "300px", sticky: true, styleVariant: "minimal", widgets: [quickWidget, contactWidget] },
  ],
};

export const AKINSOFT_TOKENS: DesignTokens = {
  colors: {
    primary: "#084f9e",
    primaryForeground: "#ffffff",
    secondary: "#1d1d1f",
    secondaryForeground: "#f5f5f7",
    accent: "#0071e3",
    accentForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#1d1d1f",
    muted: "#f5f5f7",
    mutedForeground: "#424245",
    border: "#d2d2d7",
  },
  darkColors: {
    primary: "#8eb6ff",
    primaryForeground: "#041226",
    secondary: "#0b0b0d",
    secondaryForeground: "#f5f5f7",
    accent: "#4da3ff",
    accentForeground: "#041226",
    background: "#000000",
    foreground: "#f5f5f7",
    muted: "#1d1d1f",
    mutedForeground: "#d2d2d7",
    border: "#424245",
  },
  typography: {
    headingFont: "system-ui, Segoe UI, Helvetica Neue, sans-serif",
    bodyFont: "system-ui, Segoe UI, Helvetica Neue, sans-serif",
    monoFont: "ui-monospace, SFMono-Regular, Menlo, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
  geometry: {
    borderRadius: "16px",
    containerMaxWidth: "1200px",
    sectionSpacingY: "72px",
    cardShadow: "sm",
  },
};

/** Ziyaretçi kabuğu. Seçiciler yalnızca bu temanın derisine bağlanır. */
export const AKINSOFT_CSS = `
[data-nx-skin="akinsoft-merkez"] { background:#fff; color:#1d1d1f; }
[data-nx-skin="akinsoft-merkez"] .nx-public-header {
  background: rgba(255,255,255,.98) !important;
  border-bottom: 1px solid rgba(0,0,0,.1) !important;
  backdrop-filter: blur(20px) saturate(180%);
}
[data-nx-skin="akinsoft-merkez"] .nx-public-header nav { gap: 22px; }
[data-nx-skin="akinsoft-merkez"] .nx-public-header nav a {
  font-size: 12px;
  font-weight: 400;
  color: #333;
  letter-spacing: 0;
}
[data-nx-skin="akinsoft-merkez"] .nx-public-header nav a:hover { color: #0071e3; }
[data-nx-skin="akinsoft-merkez"] .nx-public-header a[class*="px-4"] {
  background: #0071e3 !important;
  color: #fff !important;
  border-radius: 980px !important;
  font-size: 12px;
  padding: 6px 14px;
}
[data-nx-skin="akinsoft-merkez"] footer {
  background: #f5f5f7;
  border-top-color: #d2d2d7 !important;
  color: #1d1d1f;
}
[data-nx-skin="akinsoft-merkez"] footer h2,
[data-nx-skin="akinsoft-merkez"] footer h3 {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #1d1d1f;
}
[data-nx-skin="akinsoft-merkez"] footer a { font-size: 13px; color: #424245; }
[data-nx-skin="akinsoft-merkez"] footer a:hover { color: #0071e3; }
[data-nx-skin="akinsoft-merkez"] form.relative {
  border-color: #d2d2d7;
  border-radius: 18px;
  box-shadow: 0 8px 30px rgba(0,0,0,.06);
}
[data-nx-skin="akinsoft-merkez"] form button[type="submit"] {
  background: #0071e3;
  border-radius: 980px;
}
[data-nx-skin="akinsoft-merkez"] .nx-as-reach { position: fixed; right: 0; top: 42%; z-index: 40; }
[data-nx-skin="akinsoft-merkez"] .nx-as-reach > summary {
  writing-mode: vertical-rl;
  cursor: pointer;
  list-style: none;
  background: #084f9e;
  color: #fff;
  border-radius: 12px 0 0 12px;
  padding: 14px 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .04em;
}
[data-nx-skin="akinsoft-merkez"] .nx-as-reach > summary::-webkit-details-marker { display: none; }
[data-nx-skin="akinsoft-merkez"] .nx-as-reach[open] > div {
  position: absolute;
  right: 36px;
  top: 0;
  width: min(320px, 86vw);
  background: #fff;
  border: 1px solid #d2d2d7;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 16px 40px rgba(0,0,0,.12);
}
[data-nx-skin="akinsoft-merkez"] .nx-as-hero {
  background: #000;
  color: #f5f5f7;
  border: 0;
  border-radius: 0;
  padding: 72px 24px;
}
[data-nx-skin="akinsoft-merkez"] .nx-as-card {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 24px;
  color: #f5f5f7;
}
[data-nx-skin="akinsoft-merkez"] .nx-as-hero,
[data-nx-skin="akinsoft-merkez"] .nx-as-band {
  margin-left: -1rem;
  margin-right: -1rem;
}
@media (min-width: 640px) {
  [data-nx-skin="akinsoft-merkez"] .nx-as-hero,
  [data-nx-skin="akinsoft-merkez"] .nx-as-band {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
  }
}
[data-nx-skin="akinsoft-merkez"] .nx-as-hero { margin-top: -2.5rem; }
[data-nx-skin="akinsoft-merkez"] .nx-block:has(.nx-as-hero) + .nx-block:has(.nx-as-band),
[data-nx-skin="akinsoft-merkez"] .nx-block:has(.nx-as-band) + .nx-block:has(.nx-as-band) { margin-top: -2rem; }
[data-nx-skin="akinsoft-merkez"] .nx-mega {
  border-radius: 18px !important;
  border-color: #e6e6ea !important;
  box-shadow: 0 24px 60px rgba(0,0,0,.14) !important;
  padding: 28px 28px 22px !important;
}
[data-nx-skin="akinsoft-merkez"] .nx-mega-title {
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: .08em !important;
  text-transform: uppercase;
  color: #084f9e !important;
}
[data-nx-skin="akinsoft-merkez"] .nx-mega li a {
  font-size: 13px !important;
  font-weight: 400 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: #1d1d1f !important;
  border-radius: 8px;
}
[data-nx-skin="akinsoft-merkez"] .nx-mega li a:hover { color: #0071e3 !important; background: #f5f5f7; }
[data-nx-skin="akinsoft-merkez"] .nx-mobile-nav > summary {
  height: 34px;
  border-radius: 980px;
  border-color: #d2d2d7;
  font-size: 12px;
  padding: 0 14px;
}
[data-nx-skin="akinsoft-merkez"] .nx-mobile-nav > nav {
  width: min(400px, calc(100vw - 16px));
  max-height: min(78vh, 640px);
  border-radius: 18px;
  border: 1px solid #e6e6ea;
  background: #fff;
  padding: 8px;
  box-shadow: 0 24px 60px rgba(0,0,0,.16);
}
[data-nx-skin="akinsoft-merkez"] .nx-mobile-nav a,
[data-nx-skin="akinsoft-merkez"] .nx-mobile-nav summary {
  color: #1d1d1f;
}
`.trim();
