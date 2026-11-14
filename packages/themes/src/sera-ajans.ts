import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord } from "@nexpress/core";

/**
 * Sera: dijital ajans vitrini.
 * Açık gül zemin, iri sıkı başlık, siyah kapsül düğme, çizgi daire ve iş listesi.
 * Marka örnektir. Demo sayfalar "Demo verisi" diye işaretlenir.
 */
export const SA_THEME_ID = "sera-ajans" as const;
export const SA_HOME_SLUG = "sera-vitrin";
export const SA_BRAND = "Sera";
export const SA_PHONE = "0232 000 00 00";
export const SA_EMAIL = "merhaba@seraajans.example";

const item = (id: string, label: string, slug: string): NavigationMenuItem => ({
  id: `sa_${id}`,
  label,
  href: `/tr/${slug}`,
  source: { kind: "custom" },
});

export const SA_HEADER_MENU: NavigationMenuItem[] = [
  item("isler", "İşler", "sera-isler"),
  item("hizmet", "Hizmetler", "sera-hizmetler"),
  item("yaklasim", "Yaklaşım", "sera-yaklasim"),
  item("ajans", "Ajans", "sera-ajans"),
  item("yazilar", "Yazılar", "sera-yazilar"),
  item("iletisim", "İletişim", "sera-iletisim"),
];

export const SA_MENUS: SiteMenuRecord[] = [
  { id: "menu_sa_header", name: "Ana menü", header: true, items: SA_HEADER_MENU },
];

export const SA_HEADER: HeaderConfig = {
  options: { ctaStyle: "solid" },
  topBar: {
    enabled: false,
    contactPhone: SA_PHONE,
    contactEmail: SA_EMAIL,
    announcementText: "",
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
    glassmorphism: false,
    leftWidgets: ["logo"],
    centerWidgets: ["menu"],
    rightWidgets: ["phone", "cta"],
    ctaLabel: "Teklif al",
    ctaHref: "/tr/sera-iletisim",
    mobileLeftWidgets: ["logo"],
    mobileCenterWidgets: [],
    mobileRightWidgets: ["menu"],
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

const footLinks = (id: string, pairs: Array<[string, string]>) =>
  pairs.map(([label, slug], index) => ({ id: `${id}_${index}`, label, href: `/tr/${slug}` }));

export const SA_FOOTER: FooterConfig = {
  layoutPreset: "4-equal",
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: `© 2026 ${SA_BRAND}. Demo verisi.`,
  bottomLinks: [
    { label: "Gizlilik", href: "/tr/sera-gizlilik" },
    { label: "Sorular", href: "/tr/sera-sss" },
    { label: "İletişim", href: "/tr/sera-iletisim" },
  ],
  columns: [
    { id: "sa_f_is", title: "İşler", colSpan: 3, links: footLinks("is", [["Tümü", "sera-isler"], ["Pazar", "sera-is-pazar"], ["Klinik", "sera-is-klinik"], ["Atölye", "sera-is-atolye"]]) },
    { id: "sa_f_hz", title: "Hizmet", colSpan: 3, links: footLinks("hz", [["Hizmetler", "sera-hizmetler"], ["Yaklaşım", "sera-yaklasim"]]) },
    { id: "sa_f_aj", title: "Ajans", colSpan: 3, links: footLinks("aj", [["Ajans", "sera-ajans"], ["Yazılar", "sera-yazilar"], ["Sorular", "sera-sss"]]) },
    { id: "sa_f_yz", title: "Yazışma", colSpan: 3, links: footLinks("yz", [["İletişim", "sera-iletisim"], ["Gizlilik", "sera-gizlilik"]]) },
  ],
  widgets: [
    { id: "wdg_sa_f_is", type: "nav_menu", title: "İşler", enabled: true, columnIndex: 0, settings: { links: footLinks("wis", [["Tümü", "sera-isler"], ["Pazar", "sera-is-pazar"], ["Klinik", "sera-is-klinik"], ["Atölye", "sera-is-atolye"]]) } },
    { id: "wdg_sa_f_hz", type: "nav_menu", title: "Hizmet", enabled: true, columnIndex: 1, settings: { links: footLinks("whz", [["Hizmetler", "sera-hizmetler"], ["Yaklaşım", "sera-yaklasim"]]) } },
    { id: "wdg_sa_f_aj", type: "nav_menu", title: "Ajans", enabled: true, columnIndex: 2, settings: { links: footLinks("waj", [["Ajans", "sera-ajans"], ["Yazılar", "sera-yazilar"], ["Sorular", "sera-sss"]]) } },
    { id: "wdg_sa_f_yz", type: "nav_menu", title: "Yazışma", enabled: true, columnIndex: 3, settings: { links: footLinks("wyz", [["İletişim", "sera-iletisim"], ["Gizlilik", "sera-gizlilik"]]) } },
  ],
};

export const SA_SIDEBAR: SidebarConfig = {
  enabled: true,
  position: "right",
  width: "300px",
  sticky: true,
  styleVariant: "minimal",
  title: "Yazılar",
  widgets: [],
  links: [],
  areas: [
    {
      id: "blog",
      name: "Yazılar",
      enabled: true,
      position: "right",
      width: "300px",
      sticky: true,
      styleVariant: "minimal",
      widgets: [
        { id: "wdg_sa_search", type: "search", title: "Yazılarda ara", enabled: true, settings: { placeholder: "Yazı ara" } },
        { id: "wdg_sa_recent", type: "recent_posts", title: "Son yazılar", enabled: true, settings: { count: 3, showThumbnail: false, showDate: true, style: "compact" } },
      ],
    },
  ],
};

export const SA_TOKENS: DesignTokens = {
  colors: {
    primary: "#161616",
    primaryForeground: "#ffffff",
    secondary: "#161616",
    secondaryForeground: "#f6d5de",
    accent: "#c41248",
    accentForeground: "#ffffff",
    background: "#f6d5de",
    foreground: "#161616",
    muted: "#fbe7ed",
    mutedForeground: "#3f3338",
    border: "#e4b3c2",
  },
  darkColors: {
    primary: "#f6d5de",
    primaryForeground: "#161616",
    secondary: "#24181c",
    secondaryForeground: "#f6d5de",
    accent: "#ff8eae",
    accentForeground: "#2a1018",
    background: "#1a1215",
    foreground: "#fbe7ed",
    muted: "#2a1c22",
    mutedForeground: "#e4b3c2",
    border: "#5c404a",
  },
  typography: {
    headingFont: '"Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif',
    bodyFont: '"Segoe UI", system-ui, Helvetica, Arial, sans-serif',
    monoFont: "ui-monospace, SFMono-Regular, Menlo, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
  geometry: {
    borderRadius: "12px",
    containerMaxWidth: "1180px",
    sectionSpacingY: "4.5rem",
    cardShadow: "none",
  },
};

const S = `[data-nx-skin="${SA_THEME_ID}"]`;

/** Ziyaretçi kabuğu. Daire çizgisi CSS'tedir; görsel dosya yok. */
export const SA_CSS = `
${S} { background:#f6d5de; color:#161616; }
${S} main { padding-top:0 !important; padding-bottom:3rem !important; background:#f6d5de; }
${S} .nx-public-header { background:rgba(246,213,222,.92) !important; border-bottom:0 !important; backdrop-filter:none !important; }
${S} .nx-logo span { font-weight:650; letter-spacing:-.04em; font-size:1.35rem; }
${S} .nx-public-header nav a { font-size:14px; font-weight:500; color:#161616; }
${S} .nx-public-header nav a:hover { color:#c41248; }
${S} .nx-header-phone { font-size:14px; font-weight:500; }
${S} .nx-header-cta { background:#161616 !important; color:#fff !important; border:0 !important; border-radius:999px !important; padding:8px 16px !important; font-weight:600 !important; }
${S} footer { background:#161616; color:#f6d5de; border-top:0; }
${S} footer h2, ${S} footer h3 { color:#f6d5de; font-size:13px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; }
${S} footer a { color:#f6d5de; font-size:14px; }
${S} footer a:hover { color:#fff; }
${S} .nx-sa-hero { position:relative; overflow:hidden; padding:3.5rem 0 2.5rem; }
${S} .nx-sa-hero::before { content:""; position:absolute; left:-40px; top:10px; width:280px; height:280px; border-radius:50%; background:repeating-radial-gradient(circle at 28% 50%, transparent 0 12px, rgba(196,18,72,.28) 13px 14px); pointer-events:none; }
${S} .nx-sa-kicker { position:relative; margin:0 0 1rem; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:#6b4450; }
${S} .nx-sa-hero h1 { position:relative; max-width:12ch; margin:0; font-size:clamp(3rem,7vw,6.1rem); font-weight:520; letter-spacing:-.05em; line-height:.9; color:#c41248; }
${S} .nx-sa-lead { position:relative; max-width:32rem; margin-top:1.5rem; font-size:1.05rem; line-height:1.55; color:#2a2226; }
${S} .nx-sa-actions { position:relative; display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-top:1.6rem; }
${S} .nx-sa-btn { background:#161616; color:#fff; border-radius:999px; padding:.7rem 1.1rem; text-decoration:none; font-size:14px; font-weight:600; }
${S} .nx-sa-textlink { color:#161616; font-size:14px; font-weight:600; text-underline-offset:3px; }
${S} .nx-sa-tldr { max-width:36rem; margin:0 0 2rem; color:#2a2226; }
${S} .sa-ink { background:#161616; color:#f7f2ea; margin:2rem 0; padding:3rem 2rem; }
${S} .sa-ink :is(h2,h3,p,div,span) { color:#f7f2ea !important; }
${S} .sa-ink h2 { font-size:clamp(2rem,4vw,3.4rem); font-weight:500 !important; letter-spacing:-.04em; line-height:1.05; max-width:16ch; }
${S} .sa-work { border-top:1px solid #1a1a1a; padding:1.35rem 0; }
${S} .sa-work h3 { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:520 !important; letter-spacing:-.03em; }
${S} .sa-kicker { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#6b4450; }
${S} .nx-sa-cta { margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid #1a1a1a; }
${S} .nx-sa-cta h2 { font-size:clamp(1.8rem,3vw,2.6rem); font-weight:520 !important; letter-spacing:-.03em; max-width:16ch; }
${S} .nx-sa-cta a { display:inline-block; margin-top:1rem; background:#161616; color:#fff; border-radius:999px; padding:.7rem 1.1rem; text-decoration:none; font-size:14px; font-weight:600; }
${S} h2, ${S} h3 { font-weight:520 !important; letter-spacing:-.03em; }
${S} form button[type="submit"] { background:#161616; color:#fff; border-radius:999px; }
@media (max-width:767px) {
  ${S} .nx-sa-hero h1 { font-size:2.7rem; }
  ${S} .nx-sa-hero::before { width:160px; height:160px; opacity:.7; }
  ${S} footer .grid { grid-template-columns:1fr 1fr; }
}
`.trim();
