import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem } from "@nexpress/core";

/**
 * Yazılım Bayi Teması: bir yazılım markasının yetkili bayi / çözüm ortağı sitesi.
 * İki katmanlı başlık (üstte bayi adı, hızlı bağlantılar ve telefon; altında logo ve ana menü), sol metin + sağ görsel mozaikli vitrin,
 * altı kartlı çözüm ızgarası, mavi "demo / hemen ara" bandı, görsel + metin şeritleri, kampanya vitrini, SSS, çok sütunlu dizin altlığı.
 * Marka adı örnektir (Bayi Yazılım); gerçek bayi kendi adını ve görselini panelden yazar. Hiçbir istemci JS'i yoktur.
 */
export const YB_THEME_ID = "yazilim-bayi" as const;
export const YB_HOME_SLUG = "yb-vitrin";
/** Temsili görseller `apps/cms/public/demo/yazilim-bayi` altındadır. */
export const YB_ART = "/demo/yazilim-bayi";
export const YB_BRAND = "Akınsoft İzmir Ana Bayi";
export const YB_PHONE = "0 232 425 19 88";
export const YB_PHONE_2 = "0 544 413 80 94";
export const YB_EMAIL = "bilgi@akinsoftizmir.com.tr";
export const YB_ADDRESS = "Muciburrahman Sk. No:3/522 Konak İzmir";
/** Logo ve sosyal bağlantılar kaynak siteden alınmıştır (`apps/cms/public/demo/yazilim-bayi/logo.webp`). */
export const YB_LOGO = `${YB_ART}/logo.webp`;
export const YB_SOCIALS = {
  facebook: "https://www.facebook.com/akinsoftizmiir",
  x: "https://twitter.com/akinsoftizmirb1",
  instagram: "https://www.instagram.com/akinsoftizmirbayi",
  linkedin: "https://www.linkedin.com/company/akinsoft-izmir/",
} as const;

export const YB_TOKENS: DesignTokens = {
  colors: {
    primary: "#0c644e",
    primaryForeground: "#ffffff",
    secondary: "#042646",
    secondaryForeground: "#ffffff",
    accent: "#0b4f8a",
    accentForeground: "#ffffff",
    background: "#f7fafc",
    foreground: "#1a202c",
    muted: "#eaf4f1",
    mutedForeground: "#4a5568",
    border: "#cfe3e8",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
  geometry: {
    borderRadius: "0.625rem",
    containerMaxWidth: "1180px",
    sectionSpacingY: "4rem",
    cardShadow: "sm",
  },
};

/** Kaynak sitedeki yolu (`/hakkimizda/`) tema adresine (`/tr/hakkimizda`) çevirir. */
const T = (path: string) => `/tr/${path.replace(/^\/|\/$/g, "")}`;

type Raw = [label: string, href: string, children?: Array<[string, string]>];

/** Başlığın üst şeridindeki hızlı bağlantılar (kaynak sitedeki yollarla). */
const UTILITY: Raw[] = [
  ["Demo Talebi", "/akinsoft-demo-talebi/"],
  ["Destek Talebi", "/akinsoft-destek/"],
  ["Kurumsal", "/hakkimizda/", [["Kampanyalar", "/akinsoft-kampanyalar/"], ["Hakkımızda", "/hakkimizda/"], ["Akınsoft SSS", "/akinsoft-sikca-sorulan-sorular/"], ["AI Prompts", "/ai-prompts/"]]],
  ["Blog", "/blog/", [["Makaleler", "/makaleler/"], ["Akınsoft Kampanyalar", "/akinsoft-kampanyalar/"], ["Bilgi Bankası", "/bilgi-bankasi/"], ["Duyurular", "/duyurular/"]]],
  ["İletişim", "/iletisim/"],
];

export const YB_HEADER: HeaderConfig = {
  topBar: {
    enabled: true,
    announcementText: YB_BRAND,
    contactPhone: YB_PHONE,
    contactEmail: "",
    leftWidgets: ["announcement"],
    centerWidgets: [],
    rightWidgets: ["links", "phone", "search"],
    mobileLeftWidgets: ["announcement"],
    mobileCenterWidgets: [],
    mobileRightWidgets: ["phone"],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: false,
    leftWidgets: ["logo", "menu"],
    centerWidgets: [],
    rightWidgets: [],
    mobileLeftWidgets: ["logo"],
    mobileCenterWidgets: [],
    mobileRightWidgets: ["menu"],
    ctaLabel: "",
    ctaHref: "",
  },
  bottomBar: {
    enabled: false,
    leftWidgets: [],
    centerWidgets: [],
    rightWidgets: [],
    links: UTILITY.map(([label, href, kids], i) => ({
      id: `yb_u${i}`,
      label,
      href: T(href),
      source: { kind: "custom" as const },
      ...(kids ? { children: kids.map(([l, h], n) => ({ id: `yb_u${i}_${n}`, label: l, href: T(h), source: { kind: "custom" as const } })) } : {}),
    })),
  },
};

/** Altlık dizini: kaynak sitedeki beş çözüm ailesi ve iletişim bilgisi. */
const FOOTER_GROUPS: Array<[string, string, Array<[string, string]>]> = [
  ["muh", "Muhasebe Programları", [["Ön Muhasebe Programı", "/on-muhasebe-programi/"], ["Genel Muhasebe Programı", "/genel-muhasebe-programi/"], ["OctoCloud Bulut Muhasebe", "/octocloud/"], ["OctoPlus Ön Muhasebe", "/octoplus/"]]],
  ["erp", "ERP Çözümleri", [["Wolvox ERP", "/wolvox-erp/"], ["İnsan Kaynakları Yönetimi", "/insan-kaynaklari-yonetimi/"], ["Wolvox CRM Yönetimi", "/wolvox-crm-yonetimi/"], ["Wolvox Webconnect", "/wolvox-webconnect/"], ["Wolvox MRP Üretim Yöntemi", "/wolvox-uretim-yontemi/"]]],
  ["bul", "Bulut Yazılımlar", [["E-ticaret", "/e-ticaret/"], ["Akınsoft MyFranchise", "/akinsoft-myfranchise/"], ["OctoCloud", "/octocloud/"], ["Hotel Smart", "/hotel-smart/"], ["Pro Kuaför – Randevu Yazılımı", "/prokuafor/"], ["QR Menü", "/qr-menu/"], ["E-Teklif", "/wolvox-webconnect-e-teklif/"]]],
  ["edon", "E-Dönüşüm", [["e-Fatura", "/e-fatura/"], ["e-Arşiv Fatura", "/e-arsiv-fatura/"], ["e-Defter", "/e-defter/"], ["e-İrsaliye", "/e-irsaliye/"], ["e-Müstahsil Makbuzu", "/e-mustahsil-makbuzu/"], ["e-Adisyon", "/e-adisyon/"], ["e-Mutabakat", "/e-mutabakat/"]]],
  ["sek", "Sektörel Yazılımlar", [["Wolvox Restoran Yönetimi", "/akinsoft-wolvox-restoran-yonetimi/"], ["Wolvox Hızlı Satış Programı", "/wolvox-hizli-satis/"], ["Süper Market Yönetimi", "/super-market-yonetimi/"], ["Servis Yönetimi", "/servis-yonetimi/"], ["Mobil Satış – Saha Satış Yazılımı", "/mobil-satis/"], ["Otel Yönetimi Programı", "/otel-yonetimi-programi/"], ["Sürücü Kursu Otomasyonu", "/surucu-kursu-otomasyonu/"]]],
];

const YB_FOOTER_COLUMNS: FooterConfig["columns"] = [
  {
    id: "yb_f_ilet",
    title: "İletişim",
    colSpan: 2,
    links: [
      { label: YB_PHONE, href: "tel:+902324251988" },
      { label: YB_PHONE_2, href: "tel:+905444138094" },
      { label: YB_EMAIL, href: `mailto:${YB_EMAIL}` },
      { label: YB_ADDRESS, href: "/tr/iletisim" },
      { label: "Demo Talebi", href: "/tr/akinsoft-demo-talebi" },
      { label: "Destek Talebi", href: "/tr/akinsoft-destek" },
    ],
  },
  ...FOOTER_GROUPS.map(([id, title, links]) => ({
    id: `yb_f_${id}`,
    title,
    colSpan: 2,
    links: links.map(([label, href]) => ({ label, href: T(href) })),
  })),
];

export const YB_FOOTER: FooterConfig = {
  layoutPreset: "6-equal",
  options: {
    main: { background: "default", divider: true, paddingY: 40 },
    bottom: { background: "custom", customColor: "#0b4f8a", width: "full", layout: "split", paddingY: 18, socials: { ...YB_SOCIALS } },
  },
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: `© 2026 ${YB_BRAND} tüm Hakları Saklıdır`,
  bottomLinks: [
    { label: "Gizlilik Politikası", href: "/tr/gizlilik-politikasi" },
    { label: "Akınsoft Ücretsiz İndir", href: "/tr/akinsoft-installer-indir" },
    { label: "Online Lisans Kontrol", href: "/tr/online-lisans-kontrol" },
    { label: "Bilgi Bankası", href: "/tr/bilgi-bankasi" },
    { label: "Pinterest", href: "https://tr.pinterest.com/akinsoftizmir1/" },
  ],
  columns: YB_FOOTER_COLUMNS,
  widgets: YB_FOOTER_COLUMNS.map((col, columnIndex) => ({
    id: `wdg_${col.id}`,
    type: "nav_menu" as const,
    title: col.title,
    enabled: true,
    columnIndex,
    settings: {
      links: col.links.map((link, index) => ({ id: `${col.id}_${index}`, label: link.label, href: link.href })),
    },
  })),
};

const item = (id: string, label: string, slug: string, children?: NavigationMenuItem[]): NavigationMenuItem => ({
  id: `yb_m_${id}`,
  label,
  href: `/tr/${slug}`,
  source: { kind: "custom" },
  ...(children?.length ? { children } : {}),
});

/** Ana menü: kaynak sitedeki beş çözüm ailesi ve altlarındaki ürünler. Yalnızca site menüsü boşken yazılır. */
const MENU: Array<[string, string, Array<[string, string]>]> = [
  ["ERP Çözümleri", "/kurumsal-kaynak-planlama/", [["Wolvox ERP", "/wolvox-erp/"], ["İnsan Kaynakları Yönetimi", "/insan-kaynaklari-yonetimi/"], ["Wolvox CRM Yönetimi", "/wolvox-crm-yonetimi/"], ["Wolvox Webconnect", "/wolvox-webconnect/"]]],
  ["Muhasebe Programları", "/muhasebe-programlari", [["Ön Muhasebe Yazılımı", "/on-muhasebe-programi/"], ["Genel Muhasebe Yazılımı", "/genel-muhasebe-programi/"], ["OctoCloud Bulut Muhasebe", "/octocloud/"], ["Octo Plus Kolay Muhasebe", "/octoplus/"]]],
  ["Sektörel Programlar", "/sektorel-cozumler/", [["Wolvox Restoran", "/akinsoft-wolvox-restoran-yonetimi/"], ["Mobil Satış", "/mobil-satis/"], ["Süper Market Yazılımı", "/super-market-yonetimi/"], ["Wolvox Hızlı Satış Programı", "/wolvox-hizli-satis/"], ["Otel Yönetimi Programı", "/otel-yonetimi-programi/"], ["Sürücü Kursu Otomasyonu", "/surucu-kursu-otomasyonu/"], ["Servis Yönetimi", "/servis-yonetimi/"], ["Wolvox Fiyatmatik", "/fiyatmatik/"]]],
  ["E-Dönüşüm", "/akinsoft-e-donusum/", [["E-Arşiv Fatura", "/e-arsiv-fatura/"], ["e-Defter", "/e-defter/"], ["e-Fatura", "/e-fatura/"], ["e-İrsaliye", "/e-irsaliye/"], ["e-Müstahsil Makbuzu", "/e-mustahsil-makbuzu/"], ["E-Adisyon", "/e-adisyon/"], ["e-Mutabakat", "/e-mutabakat/"]]],
  ["Bulut Yazılımlar", "/bulut-yazilim-cozumleri/", [["E-Ticaret", "/e-ticaret/"], ["Yedekleme Programı", "/bulut-yedekleme-programi/"], ["Akınsoft MyFranchise", "/akinsoft-myfranchise/"], ["E-Ofis Yazılımı", "/e-ofis/"], ["Hotel Smart", "/hotel-smart/"], ["Pro Kuaför – Randevu Yazılımı", "/prokuafor/"], ["QR Menü", "/qr-menu/"], ["KDV Hesaplama Aracı", "/kdv-hesaplama-araci/"]]],
];

export const YB_HEADER_MENU: NavigationMenuItem[] = MENU.map(([label, href, kids], i) =>
  item(`m${i}`, label, `${href}`.replace(/^\//, "").replace(/\/$/, ""), kids.map(([l, h], n) => item(`m${i}_${n}`, l, h.replace(/^\//, "").replace(/\/$/, "")))),
);

const S = `[data-nx-skin="${YB_THEME_ID}"]`;

/**
 * Ziyaretçi kabuğu. Seçiciler yalnızca bu temanın derisine bağlıdır; bant ve kart sınıfları (`yf-*`, `yb-*`) sayfa bloklarının
 * `cssClass` alanından gelir (bant/kart yardımcıları Yazılım Firması kitindedir).
 */
export const YB_CSS = `
${S} { background:#f7fafc; color:#1a202c; }
${S} main { overflow-x:clip; padding-top:0; padding-bottom:0; }
${S} .space-y-8 > .nx-block.yf-band, ${S} .space-y-8 > .nx-block:has(.nx-yb-hero) { margin-block:0 !important; }
${S} .nx-public-header { background:#fff !important; border-bottom:1px solid #0b4f8a !important; }
${S} .nx-utility-link { color:#1a202c; font-size:13px; font-weight:500; }
${S} .nx-utility-link:hover { color:#0c644e; }
/* Koyu üst şeritte hızlı bağlantılar açık renk olmalı; koyu yazı lacivert zeminde görünmez kalırdı */
${S} .nx-header-top .nx-utility-link { color:#ffffff; }
${S} .nx-header-top .nx-utility-link:hover { color:#9fe0c8; }
${S} .nx-public-header nav a { font-size:14px; font-weight:600; color:#042646; }
${S} .nx-public-header nav a:hover { color:#0c644e; }
${S} .nx-public-header a[href^="tel:"] { color:#0c644e; font-weight:700; font-size:16px; }
${S} footer { background:#f7fafc; border-top:1px solid #cfe3e8 !important; color:#1a202c; }
${S} footer h2, ${S} footer h3 { font-size:15px; font-weight:700; color:#042646; padding-bottom:8px; border-bottom:1px solid #0b4f8a; display:inline-block; }
${S} footer .nx-footer-link, ${S} footer a { font-size:13px; }
${S} footer a:hover { color:#0c644e; }
${S} form button[type="submit"] { background:#0c644e; border-radius:6px; }
${S} .nx-yb-hero { background:#eef5f8; color:#042646; border:0; border-radius:0; padding:56px 24px; }
${S} .nx-yb-hero-in { max-width:1180px; margin-inline:auto; display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:40px; align-items:center; }
${S} .nx-yb-hero h1 { font-size:clamp(1.8rem,3.4vw,2.6rem); font-weight:800; line-height:1.15; color:#042646; }
${S} .nx-yb-hero p { color:#1a202c; line-height:1.7; margin-top:16px; }
${S} .nx-yb-badge { display:inline-block; background:#e3f1ec; color:#0c644e; border-radius:6px; padding:3px 12px; font-size:12px; font-weight:700; margin-bottom:14px; }
${S} .nx-yb-btn { display:inline-flex; align-items:center; gap:6px; border-radius:4px; padding:11px 22px; font-size:14px; font-weight:700; background:#0c644e; color:#fff; }
${S} .nx-yb-btn:hover { background:#094d3c; }
${S} .nx-yb-btn-ghost { background:#fff; color:#0c644e; border:1.5px solid #0c644e; }
${S} .nx-yb-mosaic { display:grid; grid-template-columns:1.4fr 1fr; grid-template-rows:1fr 1fr; gap:14px; height:360px; }
${S} .nx-yb-mosaic img { width:100%; height:100%; object-fit:cover; border-radius:12px; display:block; }
${S} .nx-yb-mosaic img:first-child { grid-row:1 / span 2; }
${S} .yf-soft { background:#eef5f8; }
${S} .yf-dark { background:#042646; color:#fff; }
${S} .yf-navy { background:#0b4f8a; color:#fff; }
${S} .yf-dark :is(h1,h2,h3,h4,p,li,div,span), ${S} .yf-navy :is(h1,h2,h3,h4,p,li,div,span) { color:inherit; }
${S} .yf-center :is(h1,h2,h3,h4,p,.nx-rich) { text-align:center; margin-inline:auto; }
${S} .yf-center .nx-rich { max-width:46rem; }
${S} .yf-band :is(h2) { font-size:clamp(1.5rem,3vw,2rem); font-weight:800; color:inherit; }
${S} .yf-band :is(h2,h3):not(.yf-card *) { color:#042646; }
${S} .yf-dark :is(h2,h3), ${S} .yf-navy :is(h2,h3) { color:#fff !important; }
${S} div:has(> .nx-block.yf-card) { display:flex; }
${S} .nx-block.yf-card { flex:1; min-width:0; }
${S} .yf-card, ${S} .yb-card { background:#fff; border:1px solid #cfe3e8; border-radius:10px; padding:20px; overflow:hidden; height:100%; transition:box-shadow .2s, border-color .2s; }
${S} .yf-card:hover, ${S} .yb-card:hover { border-color:#0c644e; box-shadow:0 10px 28px rgba(4,38,70,.1); }
${S} .yf-card h3, ${S} .yb-card h3 { font-size:1.05rem; font-weight:700; color:#042646; }
${S} .yf-card img { border-radius:8px; }
${S} .yf-tag { display:inline-block; background:#0c644e; color:#fff; border-radius:4px; padding:2px 10px; font-size:11px; font-weight:700; }
${S} .yf-link a { color:#0c644e; font-size:14px; font-weight:600; }
${S} .yf-stat :is(h3) { font-size:clamp(1.8rem,3.6vw,2.6rem); font-weight:800; color:#0c644e; }
${S} .yb-intro { background:#fff; border-radius:10px; padding:24px; box-shadow:0 8px 28px rgba(4,38,70,.08); }
${S} .yb-banner { background:#0b4f8a; border-radius:10px; padding:26px 30px; }
${S} .yb-banner :is(h2,h3,p,.nx-rich,span,a) { color:#fff !important; }
${S} .yb-banner .yb-chip { border:1.5px solid #fff; border-radius:8px; padding:12px 16px; }
${S} .yb-checks { display:flex; flex-wrap:wrap; gap:10px 28px; }
${S} .yb-checks a { color:#042646; text-decoration:underline; font-weight:600; font-size:14px; }
${S} .yb-checks a::before { content:"☑ "; color:#0b4f8a; }
${S} .yb-panel { background:#eceff1; border-radius:14px; padding:24px; }
${S} .yb-panel img { border-radius:10px; }
@media (max-width: 860px) {
  ${S} .nx-yb-hero-in { grid-template-columns:1fr; }
  ${S} .nx-yb-mosaic { height:260px; }
}
@media (max-width: 720px) {
  ${S} .nx-yb-hero { padding:32px 16px; }
  ${S} .yf-band { padding-top:36px !important; padding-bottom:36px !important; }
  ${S} .yf-rowwrap > div { flex-direction:row !important; flex-wrap:wrap; }
  ${S} .yf-rowwrap > div > div { flex:0 0 calc(50% - 12px) !important; }
}
`;
