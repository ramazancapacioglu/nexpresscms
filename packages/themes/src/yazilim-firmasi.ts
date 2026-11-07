import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord, SiteWidget } from "@nexpress/core";

/**
 * Yazılım Firması Teması: kurumsal yazılım üreticisi sitesinin yerleşimi.
 * Siyah vitrin, buzlu 52px şerit, dört sütunlu mega menü, geniş dizin footer'ı.
 * Marka adı örnektir (MerkezSoft); logo iki renkli yazı markasıdır, görsel kopyalanmaz.
 */
export const YF_THEME_ID = "yazilim-firmasi" as const;
/** Eski kayıtlar bu kimlikle etkinleştirilmişti; manifest çözümünde yeni kimliğe yönlenir. */
export const YF_LEGACY_THEME_ID = "akinsoft-merkez";
export const YF_REACH_FORM_ID = "frm_yf_reach";
export const YF_BRAND = "MERKEZSOFT";
export const YF_PHONE = "444 00 00";
export const YF_EMAIL = "bilgi@merkezsoft.example";

const link = (id: string, label: string, href: string, children?: NavigationMenuItem[]): NavigationMenuItem => ({
  id,
  label,
  href,
  source: { kind: "custom" },
  ...(children?.length ? { children } : {}),
});

const L = (id: string, label: string, slug: string) => link(`yf_${id}`, label, `/tr/${slug}`);
const group = (id: string, label: string, slug: string, children: NavigationMenuItem[]) => link(`yf_${id}`, label, `/tr/${slug}`, children);

const promo = (title: string, subtitle: string, ctaText: string, ctaHref: string) => ({ title, subtitle, ctaText, ctaHref, highlightColor: "#0071e3" });

/** Header menüsü: kökler mega panelde, altlar sütun ya da liste. */
export const YF_HEADER_MENU: NavigationMenuItem[] = [
  {
    ...group("cozum", "Çözümlerimiz", "programlar", [
      group("erp", "ERP", "erp", [L("mrp", "Üretim (MRP)", "uretim-mrp"), L("crm", "CRM", "crm"), L("ik", "İnsan Kaynakları", "insan-kaynaklari"), L("ofis", "Ofis ve Veri Yönetimi", "ofis-veri"), L("merkez", "Merkez ERP 26", "merkez-erp")]),
      group("muh", "Muhasebe", "muhasebe", [L("gm", "Genel Muhasebe", "genel-muhasebe"), L("om", "Ön Muhasebe", "on-muhasebe"), L("mm", "Mali Müşavir", "mali-musavir")]),
      group("bulut", "Bulut", "bulut", [L("berp", "Bulut ERP", "bulut-erp"), L("etic", "e-Ticaret", "e-ticaret"), L("gp", "Görev Panosu", "gorev-panosu"), L("qr", "QR Menü", "qr-menu"), L("dm", "Destek Masası", "destek-masasi")]),
      group("edon", "e-Dönüşüm", "e-donusum", [L("ef", "e-Fatura", "e-fatura"), L("ea", "e-Arşiv", "e-arsiv"), L("ei", "e-İrsaliye", "e-irsaliye"), L("ed", "e-Defter", "e-defter"), L("em", "e-Mutabakat", "e-mutabakat"), L("emu", "e-Müstahsil", "e-mustahsil")]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 4, width: "full", items: [], promoBanner: promo("Bulut ERP'yi ücretsiz deneyin", "Kurulum yok, tarayıcıdan açılır.", "Hemen dene", "/tr/ucretsiz-tanitim") },
  },
  {
    ...group("sektor", "Sektörel", "sektorel", [
      group("sat", "Satış noktası", "sektorel", [L("hs", "Hızlı Satış", "hizli-satis"), L("rest", "Restoran / Cafe", "restoran"), L("saha", "Saha Satış", "saha-satis"), L("kuaf", "Kuaför", "kuafor")]),
      group("hiz", "Hizmet", "sektorel", [L("otel", "Otel", "otel"), L("serv", "Teknik Servis", "servis"), L("sag", "Sağlık", "saglik"), L("egit", "Eğitim", "egitim")]),
      group("tes", "Tesis", "sektorel", [L("akar", "Akaryakıt", "akaryakit"), L("otop", "Otopark", "otopark"), L("emlak", "Emlak", "emlak")]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 3, width: "wide", items: [] },
  },
  {
    ...group("ek", "Ek Hizmetler", "diger-cozumler", [
      group("ekb", "Belge ve mesaj", "e-donusum", [L("sms", "SMS / Kontör", "sms-kontor"), L("ekd", "e-Dönüşüm", "e-donusum")]),
      group("eks", "Destek ve keşif", "destek-asistani", [L("kb", "Destek Asistanı", "destek-asistani"), L("sss", "Sıkça Sorulan Sorular", "sikca-sorulan-sorular"), L("dem", "Ücretsiz tanıtım", "ucretsiz-tanitim")]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 2, width: "narrow", items: [] },
  },
  L("kamp", "Kampanyalar", "kampanyalar"),
  L("ortak", "Çözüm Ortağı", "cozum-ortaklari"),
  group("kur", "Kurumsal", "kurumsal", [L("hak", "Hakkımızda", "kurumsal"), L("av", "Avantajlar Dünyası", "avantajlar-dunyasi"), L("med", "Medya Merkezi", "medya-merkezi"), L("blog", "Blog", "blog"), L("ilet", "İletişim", "iletisim")]),
];

export const YF_QUICK_MENU: NavigationMenuItem[] = [
  L("q1", "Ücretsiz tanıtım", "ucretsiz-tanitim"),
  L("q2", "Güncel kampanyalar", "kampanyalar"),
  L("q3", "e-Dönüşüm", "e-donusum"),
  L("q4", "Merkez ERP 26", "merkez-erp"),
  L("q5", "Tüm çözümler", "programlar"),
  L("q6", "Sıkça sorulan sorular", "sikca-sorulan-sorular"),
];

export const YF_MENUS: SiteMenuRecord[] = [
  { id: "menu_yf_header", name: "Ana menü", header: true, items: YF_HEADER_MENU },
  { id: "menu_yf_quick", name: "Hızlı bağlantılar", header: false, items: YF_QUICK_MENU },
];

export const YF_HEADER: HeaderConfig = {
  topBar: {
    enabled: false,
    contactPhone: YF_PHONE,
    contactEmail: "",
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
    ctaHref: "/tr/ucretsiz-tanitim",
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

/** Footer dizini: gerçek sitedeki gibi tek bakışta tüm bölümler. */
const FOOTER_GROUPS: Array<[string, string, Array<[string, string]>]> = [
  ["erp", "Kurumsal kaynak planlaması", [["Üretim (MRP)", "uretim-mrp"], ["CRM", "crm"], ["İnsan Kaynakları", "insan-kaynaklari"], ["Ofis ve Veri Yönetimi", "ofis-veri"]]],
  ["bulut", "Bulut çözümler", [["Bulut ERP", "bulut-erp"], ["e-Ticaret", "e-ticaret"], ["Görev Panosu", "gorev-panosu"], ["QR Menü", "qr-menu"], ["Destek Masası", "destek-masasi"]]],
  ["edon", "e-Dönüşüm", [["e-Fatura", "e-fatura"], ["e-Arşiv", "e-arsiv"], ["e-İrsaliye", "e-irsaliye"], ["e-Defter", "e-defter"], ["e-Mutabakat", "e-mutabakat"], ["e-Müstahsil", "e-mustahsil"]]],
  ["muh", "Muhasebe", [["Genel Muhasebe", "genel-muhasebe"], ["Ön Muhasebe", "on-muhasebe"], ["Mali Müşavir", "mali-musavir"]]],
  ["sek", "Sektörel çözümler", [["Hızlı Satış", "hizli-satis"], ["Restoran / Cafe", "restoran"], ["Otel", "otel"], ["Servis", "servis"], ["Akaryakıt", "akaryakit"], ["Emlak", "emlak"]]],
  ["kur", "Kurumsal", [["Hakkımızda", "kurumsal"], ["Çözüm Ortağı", "cozum-ortaklari"], ["Medya Merkezi", "medya-merkezi"], ["Blog", "blog"], ["Avantajlar Dünyası", "avantajlar-dunyasi"]]],
  ["des", "Destek", [["Destek Asistanı", "destek-asistani"], ["Sıkça Sorulan Sorular", "sikca-sorulan-sorular"], ["SMS / Kontör", "sms-kontor"], ["İstek ve Öneri", "istek-oneri"]]],
  ["ilet", "İletişim", [["Ücretsiz tanıtım", "ucretsiz-tanitim"], ["İletişim", "iletisim"], ["Kampanyalar", "kampanyalar"]]],
];

export const YF_FOOTER: FooterConfig = {
  layoutPreset: "4-equal",
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: `© 1995 – 2026 ${YF_BRAND.charAt(0)}${YF_BRAND.slice(1).toLowerCase()} Yazılım | Tüm hakları saklıdır.`,
  bottomLinks: [
    { label: "Gizlilik politikası", href: "/tr/gizlilik-politikasi" },
    { label: "Kullanım koşulları", href: "/tr/kullanim-kosullari" },
    { label: "İletişim", href: "/tr/iletisim" },
  ],
  columns: FOOTER_GROUPS.map(([id, title, links]) => ({
    id: `yf_f_${id}`,
    title,
    colSpan: 3,
    links: links.map(([label, slug]) => ({ label, href: `/tr/${slug}` })),
  })),
  widgets: FOOTER_GROUPS.map(([id, title, links], i): SiteWidget => ({
    id: `wdg_yf_f_${id}`,
    type: "nav_menu",
    title,
    enabled: true,
    columnIndex: Math.floor(i / 2),
    settings: { links: links.map(([label, slug], n) => ({ id: `${id}_${n}`, label, href: `/tr/${slug}` })) },
  })),
};

const quickWidget = { id: "wdg_yf_quick", type: "nav_menu" as const, title: "Hızlı bağlantılar", enabled: true, settings: { menuId: "menu_yf_quick" } };
const contactWidget = {
  id: "wdg_yf_contact",
  type: "contact_card" as const,
  title: "Bize ulaşın",
  enabled: true,
  settings: { phone: YF_PHONE, email: YF_EMAIL, hours: "Hafta içi 09:00–18:00", subtitle: "Demo ve destek" },
};
const area = (id: string, name: string) => ({ id, name, enabled: true, position: "right" as const, width: "300px" as const, sticky: true, styleVariant: "minimal" as const, widgets: [quickWidget, contactWidget] });

/** Blog kenarı: arama, son yazılar, kategoriler, hızlı bağlantılar ve iletişim. */
const blogWidgets = [
  { id: "wdg_yf_search", type: "search" as const, title: "Blogda ara", enabled: true, settings: { placeholder: "Yazı ara…", popularKeywords: "e-Fatura, ERP, Bulut, Muhasebe" } },
  { id: "wdg_yf_recent", type: "recent_posts" as const, title: "Son yazılar", enabled: true, settings: { count: 4, showThumbnail: true, showDate: true, style: "compact" as const } },
  { id: "wdg_yf_cats", type: "categories" as const, title: "Kategoriler", enabled: true, settings: { count: 8, showCount: true, showHierarchy: false, style: "list" as const } },
  quickWidget,
  contactWidget,
];

export const YF_SIDEBAR: SidebarConfig = {
  enabled: true,
  position: "right",
  width: "300px",
  sticky: true,
  styleVariant: "minimal",
  title: "Kenar",
  widgets: [quickWidget, contactWidget],
  links: [],
  areas: [{ ...area("blog", "Blog"), widgets: blogWidgets }, area("shop", "Mağaza"), area("page", "Sayfa")],
};

export const YF_TOKENS: DesignTokens = {
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
    headingFont: "Inter, system-ui, Segoe UI, Helvetica Neue, sans-serif",
    bodyFont: "Inter, system-ui, Segoe UI, Helvetica Neue, sans-serif",
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

const S = `[data-nx-skin="${YF_THEME_ID}"]`;

/** Ziyaretçi kabuğu. Seçiciler yalnızca bu temanın derisine bağlanır; bant sınıfları (`yf-*`) sayfa bloklarının `cssClass` alanıyla kullanılır. */
export const YF_CSS = `
${S} { background:#fff; color:#1d1d1f; }
${S} main { overflow-x:clip; padding-top:0; padding-bottom:0; }
${S} .space-y-8 > .nx-block.yf-band, ${S} .space-y-8 > .nx-block:has(.nx-yf-hero) { margin-block:0 !important; }
${S} .nx-public-header { background:rgba(255,255,255,.98) !important; border-bottom:1px solid rgba(0,0,0,.1) !important; backdrop-filter:blur(20px) saturate(180%); }
${S} .nx-public-header nav { gap:22px; }
${S} .nx-public-header nav a { font-size:12px; font-weight:400; color:#333; letter-spacing:0; }
${S} .nx-public-header nav a:hover { color:#0071e3; }
${S} .nx-public-header a[class*="px-4"] { white-space:nowrap; background:#0071e3 !important; color:#fff !important; border-radius:980px !important; font-size:12px; padding:6px 14px; }
${S} footer { background:#f5f5f7; border-top-color:#d2d2d7 !important; color:#1d1d1f; }
${S} footer h2, ${S} footer h3 { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#1d1d1f; }
${S} footer a { font-size:13px; color:#424245; }
${S} footer a:hover { color:#0071e3; }
${S} form.relative { border-color:#d2d2d7; border-radius:18px; box-shadow:0 8px 30px rgba(0,0,0,.06); }
${S} form button[type="submit"] { background:#0071e3; border-radius:980px; }
${S} .nx-yf-reach { position:fixed; right:20px; bottom:20px; z-index:40; }
${S} .nx-yf-reach > summary { display:flex; align-items:center; gap:8px; cursor:pointer; list-style:none; background:#0071e3; color:#fff; border-radius:980px; padding:12px 18px; font-size:13px; font-weight:600; box-shadow:0 10px 30px rgba(0,113,227,.35); }
${S} .nx-yf-reach > summary::-webkit-details-marker { display:none; }
${S} .nx-yf-reach[open] > summary { background:#1d1d1f; }
${S} .nx-yf-reach > div { position:absolute; right:0; bottom:56px; width:min(320px,calc(100vw - 32px)); background:#fff; border:1px solid #d2d2d7; border-radius:18px; padding:16px; box-shadow:0 20px 50px rgba(0,0,0,.18); color:#1d1d1f; }
${S} .nx-yf-reach form { display:grid; gap:8px; }
${S} .nx-yf-reach input[name="ad"], ${S} .nx-yf-reach input[name="telefon"] { width:100%; border:1px solid #d2d2d7; border-radius:10px; padding:9px 12px; font-size:14px; }
${S} .nx-yf-reach-title { font-size:14px; font-weight:600; margin-bottom:8px; }
${S} .nx-yf-reach-consent { display:flex; gap:8px; align-items:flex-start; font-size:12px; color:#424245; }
${S} .nx-yf-reach button { background:#0071e3; color:#fff; border-radius:980px; padding:10px; font-size:14px; font-weight:600; }
${S} .nx-yf-reach-ok { color:#00ac48; font-size:13px; margin-bottom:8px; }
${S} .nx-yf-reach-err { color:#c0392b; font-size:13px; margin-bottom:8px; }
${S} .nx-yf-hero { background:#000; color:#f5f5f7; border:0; border-radius:0; padding:72px 24px 40px; text-align:center; }
${S} .nx-yf-hero > div > div { justify-content:center; }
${S} .nx-yf-hero h1 { margin-inline:auto; }
${S} .nx-yf-hero p { margin-inline:auto; }
${S} .nx-yf-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:24px; color:#f5f5f7; }
${S} .nx-yf-hero { margin-top:0; }
${S} .nx-block > section:not(.nx-yf-hero):not(.nx-yf-band) { padding-inline:1.25rem; }
${S} .nx-block a.inline-flex { background:#0071e3 !important; color:#fff !important; border-radius:980px !important; border:0; }
${S} .nx-block a.inline-flex.border-2 { background:transparent !important; color:inherit !important; border:1.5px solid currentColor; }
/* Bant sınıfları: blok > Stil > CSS sınıfı */
${S} .yf-dark { background:#000; color:#f5f5f7; }
${S} .yf-soft { background:#f5f5f7; }
${S} .yf-navy { background:#084f9e; color:#fff; }
${S} .yf-dark :is(h1,h2,h3,h4,p,li,div,span), ${S} .yf-navy :is(h1,h2,h3,h4,p,li,div,span) { color:inherit; }
${S} .yf-dark :is(p,.nx-rich) { color:#a1a1a6; }
${S} .yf-center :is(h1,h2,h3,h4,p,.nx-rich) { text-align:center; margin-inline:auto; }
${S} .yf-center .nx-rich { max-width:46rem; }
${S} .yf-band :is(h2) { font-size:clamp(1.9rem,4vw,3rem); font-weight:700; letter-spacing:-.02em; }
${S} div:has(> .nx-block.yf-card) { display:flex; }
${S} .nx-block.yf-card { flex:1; min-width:0; }
${S} .yf-card { background:#fff; border:1px solid #e6e6ea; border-radius:24px; padding:20px; overflow:hidden; height:100%; transition:transform .25s, box-shadow .25s; }
${S} .yf-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.1); }
${S} .yf-soft .yf-card { background:#fff; }
${S} .yf-dark .yf-card { background:#111113; border-color:rgba(255,255,255,.1); }
${S} .yf-card h3 { font-size:1.15rem; font-weight:600; }
${S} .yf-card img { border-radius:14px; }
${S} .yf-tag { display:inline-block; background:#00ac48; color:#fff; border-radius:980px; padding:2px 10px; font-size:11px; font-weight:700; }
${S} .yf-link a { color:#0071e3; font-size:14px; }
${S} .yf-stat :is(h3) { font-size:clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-.02em; }
${S} .nx-mega { border-radius:18px !important; border-color:#e6e6ea !important; box-shadow:0 24px 60px rgba(0,0,0,.14) !important; padding:28px 28px 22px !important; }
${S} .nx-mega-title { font-size:11px !important; font-weight:700 !important; letter-spacing:.08em !important; text-transform:uppercase; color:#084f9e !important; }
${S} .nx-mega li a { font-size:13px !important; font-weight:400 !important; text-transform:none !important; letter-spacing:0 !important; color:#1d1d1f !important; border-radius:8px; }
${S} .nx-mega li a:hover { color:#0071e3 !important; background:#f5f5f7; }
${S} .nx-mobile-nav > summary { height:34px; border-radius:980px; border-color:#d2d2d7; font-size:12px; padding:0 14px; }
${S} .nx-mobile-nav > nav { width:min(400px,calc(100vw - 16px)); max-height:min(78vh,640px); border-radius:18px; border:1px solid #e6e6ea; background:#fff; padding:8px; box-shadow:0 24px 60px rgba(0,0,0,.16); }
${S} .nx-mobile-nav a, ${S} .nx-mobile-nav summary { color:#1d1d1f; }
@media (max-width:767px) {
  ${S} .nx-yf-hero { padding:48px 16px 24px; }
  ${S} .nx-yf-hero h1 { font-size:2rem; }
  ${S} .yf-band { padding-top:44px !important; padding-bottom:44px !important; }
  ${S} .yf-rowwrap > div { flex-direction:row !important; flex-wrap:wrap; }
  ${S} .yf-rowwrap > div > div { flex:0 0 calc(50% - 12px) !important; }
  ${S} .nx-yf-reach { right:12px; bottom:12px; }
  ${S} .nx-yf-reach > summary { padding:10px 14px; }
  ${S} .nx-block table { display:block; overflow-x:auto; }
  ${S} footer > div:first-child { grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px 16px; }
  ${S} footer > div:first-child > div { grid-column:auto !important; }
  ${S} .nx-yf-reach > div { right:-4px; }
}
/* Arama düğmesi: bağlantı yerine pencere açar; büyüteç ikonu yazının yerini alır */
${S} button.nx-header-search { font-size:0; line-height:0; width:40px; height:40px; border:0; padding:0; cursor:pointer; background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231a202c' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-3.5-3.5'/%3E%3C/svg%3E") center/22px no-repeat; }
/* Canlı arama penceresi: üst katman, bu temanın arama düğmesine bağlı */
${S} .nx-yf-search { margin:0; border:0; padding:0; background:transparent; width:min(680px,calc(100vw - 24px)); inset:14vh auto auto 50%; transform:translateX(-50%); }
${S} .nx-yf-search::backdrop { background:rgba(4,38,70,.45); }
${S} .nx-yf-search-panel { background:#fff; color:#1a202c; border-radius:18px; padding:18px; box-shadow:0 24px 70px rgba(0,0,0,.28); }
${S} .nx-yf-search-panel input { width:100%; border:1px solid #d7dee7; border-radius:12px; padding:12px 14px; font-size:16px; outline:none; }
${S} .nx-yf-search-panel input:focus { border-color:#0b4f8a; }
${S} .nx-yf-search-panel a { display:block; padding:10px 8px; border-bottom:1px solid #eef2f6; color:#042646; text-decoration:none; }
${S} .nx-yf-search-panel a:hover { background:#f7fafc; }
${S} .nx-yf-search-panel a strong { display:block; font-size:15px; }
${S} .nx-yf-search-panel a p { margin:4px 0 0; font-size:13px; color:#4a5568; }

`.trim();
