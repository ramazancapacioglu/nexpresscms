import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord } from "@nexpress/core";

/**
 * Kuzey Atölye: yazılım atölyesi vitrini.
 * Kâğıt zemin, serif başlık, tek çam yeşili. Cam, gradyan ve yuvarlak düğme yok.
 * Marka örnektir. Demo sayfalar "Demo verisi" diye işaretlenir.
 */
export const KA_THEME_ID = "kuzey-atolye" as const;
export const KA_HOME_SLUG = "kuzey-vitrin";
export const KA_BRAND = "Kuzey Atölye";
export const KA_PHONE = "0232 000 00 00";
export const KA_EMAIL = "bilgi@kuzeyatolye.example";

const item = (id: string, label: string, slug: string): NavigationMenuItem => ({
  id: `ka_${id}`,
  label,
  href: `/tr/${slug}`,
  source: { kind: "custom" },
});

export const KA_HEADER_MENU: NavigationMenuItem[] = [
  item("hizmet", "Hizmetler", "kuzey-hizmetler"),
  item("yaklasim", "Yaklaşım", "kuzey-yaklasim"),
  item("isler", "İşler", "kuzey-isler"),
  item("yazilar", "Yazılar", "kuzey-yazilar"),
  item("atolye", "Atölye", "kuzey-hakkinda"),
  item("iletisim", "İletişim", "kuzey-iletisim"),
];

export const KA_MENUS: SiteMenuRecord[] = [
  { id: "menu_ka_header", name: "Ana menü", header: true, items: KA_HEADER_MENU },
];

const mobile = {
  mobileLeftWidgets: ["logo"],
  mobileCenterWidgets: [] as string[],
  mobileRightWidgets: ["menu"],
};

export const KA_HEADER: HeaderConfig = {
  options: { ctaStyle: "outline" },
  topBar: {
    enabled: true,
    contactPhone: KA_PHONE,
    contactEmail: KA_EMAIL,
    announcementText: "",
    leftWidgets: ["contact"],
    centerWidgets: [],
    rightWidgets: [],
    mobileLeftWidgets: ["contact"],
    mobileCenterWidgets: [],
    mobileRightWidgets: [],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: false,
    leftWidgets: ["logo"],
    centerWidgets: ["menu"],
    rightWidgets: ["cta"],
    ctaLabel: "Yazın",
    ctaHref: "/tr/kuzey-iletisim",
    ...mobile,
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

const footLinks = (id: string, pairs: Array<[string, string]>) =>
  pairs.map(([label, slug], index) => ({ id: `${id}_${index}`, label, href: `/tr/${slug}` }));

export const KA_FOOTER: FooterConfig = {
  layoutPreset: "3-equal",
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: `© 2026 ${KA_BRAND}. Demo verisi.`,
  bottomLinks: [
    { label: "Gizlilik", href: "/tr/kuzey-gizlilik" },
    { label: "İletişim", href: "/tr/kuzey-iletisim" },
    { label: "Sorular", href: "/tr/kuzey-sss" },
  ],
  columns: [
    { id: "ka_f_is", title: "İş", colSpan: 4, links: footLinks("is", [["Hizmetler", "kuzey-hizmetler"], ["Yaklaşım", "kuzey-yaklasim"], ["Seçilmiş işler", "kuzey-isler"]]) },
    { id: "ka_f_atolye", title: "Atölye", colSpan: 4, links: footLinks("at", [["Hakkında", "kuzey-hakkinda"], ["Yazılar", "kuzey-yazilar"], ["Sık sorulanlar", "kuzey-sss"]]) },
    { id: "ka_f_yazi", title: "Yazışma", colSpan: 4, links: footLinks("yz", [["İletişim", "kuzey-iletisim"], ["Gizlilik", "kuzey-gizlilik"]]) },
  ],
  widgets: [
    { id: "wdg_ka_f_is", type: "nav_menu", title: "İş", enabled: true, columnIndex: 0, settings: { links: footLinks("wis", [["Hizmetler", "kuzey-hizmetler"], ["Yaklaşım", "kuzey-yaklasim"], ["Seçilmiş işler", "kuzey-isler"]]) } },
    { id: "wdg_ka_f_at", type: "nav_menu", title: "Atölye", enabled: true, columnIndex: 1, settings: { links: footLinks("wat", [["Hakkında", "kuzey-hakkinda"], ["Yazılar", "kuzey-yazilar"], ["Sık sorulanlar", "kuzey-sss"]]) } },
    { id: "wdg_ka_f_yz", type: "nav_menu", title: "Yazışma", enabled: true, columnIndex: 2, settings: { links: footLinks("wyz", [["İletişim", "kuzey-iletisim"], ["Gizlilik", "kuzey-gizlilik"], ["Telefon", "kuzey-iletisim"]]) } },
  ],
};

/** Yazı kenarı: arama ve son yazılar. Sayfa gövdesinde kenar kapalı kalır. */
export const KA_SIDEBAR: SidebarConfig = {
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
        { id: "wdg_ka_search", type: "search", title: "Yazılarda ara", enabled: true, settings: { placeholder: "Yazı ara" } },
        { id: "wdg_ka_recent", type: "recent_posts", title: "Son yazılar", enabled: true, settings: { count: 3, showThumbnail: false, showDate: true, style: "compact" } },
      ],
    },
  ],
};

export const KA_TOKENS: DesignTokens = {
  colors: {
    primary: "#1e4636",
    primaryForeground: "#f6f1e7",
    secondary: "#e7e0d2",
    secondaryForeground: "#1c1915",
    accent: "#8c3a2a",
    accentForeground: "#f6f1e7",
    background: "#f6f1e7",
    foreground: "#1c1915",
    muted: "#efe8db",
    mutedForeground: "#5c564c",
    border: "#d4cbb8",
  },
  darkColors: {
    primary: "#d7e4dc",
    primaryForeground: "#14261e",
    secondary: "#2a2622",
    secondaryForeground: "#f6f1e7",
    accent: "#e7b2a6",
    accentForeground: "#2a1612",
    background: "#171512",
    foreground: "#f6f1e7",
    muted: "#241f1b",
    mutedForeground: "#d4cbb8",
    border: "#5c564c",
  },
  typography: {
    headingFont: '"Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif',
    bodyFont: 'system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
    monoFont: "ui-monospace, SFMono-Regular, Menlo, monospace",
    baseSizePx: 17,
    scaleRatio: 1.25,
  },
  geometry: {
    borderRadius: "2px",
    containerMaxWidth: "1080px",
    sectionSpacingY: "4.5rem",
    cardShadow: "none",
  },
};

const S = `[data-nx-skin="${KA_THEME_ID}"]`;

/** Ziyaretçi kabuğu. Yazı tipi dosyası yok; sistem yığını kullanılır. */
export const KA_CSS = `
${S} { background:#f6f1e7; color:#1c1915; }
${S} main { padding-top:1.25rem !important; padding-bottom:3rem !important; }
${S} .nx-public-header { background:#f6f1e7 !important; border-bottom:1px solid #1c1915 !important; backdrop-filter:none !important; }
${S} .nx-header-top { background:#f6f1e7 !important; color:#5c564c !important; border-bottom:1px solid #d4cbb8 !important; }
${S} .nx-logo span { font-family:"Iowan Old Style", Palatino, Georgia, serif; font-weight:500; letter-spacing:-.02em; font-size:1.25rem; }
${S} .nx-public-header nav a { font-size:14px; font-weight:450; color:#1c1915; letter-spacing:0; }
${S} .nx-public-header nav a:hover { text-decoration:underline; text-underline-offset:3px; }
${S} .nx-header-cta { background:transparent !important; color:#1c1915 !important; border:1px solid #1c1915 !important; border-radius:2px !important; font-weight:500 !important; box-shadow:none !important; }
${S} footer { background:#efe8db; color:#1c1915; border-top:1px solid #1c1915; }
${S} footer h2, ${S} footer h3 { font-family:"Iowan Old Style", Palatino, Georgia, serif; font-size:1rem; font-weight:500; letter-spacing:0; text-transform:none; color:#1c1915; }
${S} footer a { font-size:14px; color:#1c1915; }
${S} footer a:hover { text-decoration:underline; text-underline-offset:3px; }
${S} .nx-ka-hero { padding:2.25rem 0 1.75rem; border-bottom:1px solid #d4cbb8; margin-bottom:2.5rem; }
${S} .nx-ka-kicker { margin:0 0 .85rem; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#5c564c; }
${S} .nx-ka-hero h1 { max-width:16ch; font-family:"Iowan Old Style", Palatino, Georgia, serif; font-size:clamp(2.35rem,5vw,4rem); font-weight:500; letter-spacing:-.03em; line-height:1.05; color:#1c1915; }
${S} .nx-ka-lead { max-width:38rem; margin-top:1.15rem; font-size:1.125rem; line-height:1.6; color:#3f3a33; }
${S} .nx-ka-actions { display:flex; flex-wrap:wrap; gap:1.25rem; align-items:center; margin-top:1.6rem; }
${S} .nx-ka-btn { background:#1e4636; color:#f6f1e7; padding:.7rem 1rem; text-decoration:none; font-size:14px; }
${S} .nx-ka-btn:hover { background:#16362a; }
${S} .nx-ka-textlink { color:#1c1915; font-size:14px; text-underline-offset:3px; }
${S} h2, ${S} h3 { font-weight:500 !important; letter-spacing:-.02em; }
${S} .nx-ka-tldr { max-width:40rem; margin:1.25rem 0 2rem; color:#3f3a33; font-size:1.05rem; line-height:1.6; }
${S} .nx-ka-cta { border-top:1px solid #1c1915; margin-top:2.5rem; padding:1.75rem 0 0; }
${S} .nx-ka-cta h2 { font-family:"Iowan Old Style", Palatino, Georgia, serif; font-size:clamp(1.7rem,3vw,2.3rem); font-weight:500; letter-spacing:-.02em; }
${S} .nx-ka-cta p { max-width:36rem; margin-top:.4rem; color:#3f3a33; }
${S} .nx-ka-cta a { display:inline-block; margin-top:1rem; color:#1c1915; border-bottom:1px solid #1c1915; text-decoration:none; }
${S} .flex.h-8.w-8.rounded-full { border-radius:0 !important; background:transparent !important; color:#1c1915 !important; border:1px solid #1c1915; font-family:ui-monospace, Menlo, monospace; }
${S} form button[type="submit"] { background:#1e4636; color:#f6f1e7; border-radius:2px; }
${S} details { border-radius:0 !important; background:#fffdf8 !important; }
@media (max-width:767px) {
  ${S} .nx-ka-hero h1 { font-size:2.15rem; }
  ${S} footer .grid { grid-template-columns:1fr 1fr; }
}
`.trim();
