import type { DesignTokens, FooterConfig, HeaderConfig, NavigationMenuItem, SidebarConfig, SiteMenuRecord } from "@nexpress/core";

/**
 * Crimson ERP: beyaz şerit, yakut kırmızısı kapsül, üç parçalı vitrin.
 * Solda cümle, ortada kart, sağda arama kutusu. Ürün adı ve fotoğraf kopyalanmaz.
 * Demo sayfalar "Demo verisi" diye işaretlenir.
 */
export const CR_THEME_ID = "crimson-erp" as const;
export const CR_HOME_SLUG = "crimson-vitrin";
export const CR_BRAND = "Crimson";
export const CR_PHONE = "0850 000 00 00";
export const CR_EMAIL = "satis@crimson-erp.example";

const link = (id: string, label: string, slug: string, children?: NavigationMenuItem[]): NavigationMenuItem => ({
  id: `cr_${id}`,
  label,
  href: `/tr/${slug}`,
  source: { kind: "custom" },
  ...(children?.length ? { children } : {}),
});

const promo = {
  title: "Fiyat için yazın",
  subtitle: "Kişi, şube ve kurulum biçimi yeter. Demo verisidir.",
  ctaText: "Fiyat alın",
  ctaHref: "/tr/crimson-iletisim",
  highlightColor: "#c8102e",
};

/** Ürünler, hizmetler ve kurum üç sütunlu panel açar. Alt öğe sütun başlığı, torun bağlantıdır. */
export const CR_HEADER_MENU: NavigationMenuItem[] = [
  {
    ...link("urun", "Ürünler", "crimson-urunler", [
      link("cek", "Çekirdek", "crimson-urunler", [
        link("erp", "ERP", "crimson-erp"),
        link("om", "Ön muhasebe", "crimson-on-muhasebe"),
        link("pr", "Perakende", "crimson-perakende"),
      ]),
      link("bel", "e-Belge", "crimson-e-donusum", [
        link("ed", "e-Dönüşüm", "crimson-e-donusum"),
        link("ef", "e-Fatura", "crimson-e-fatura"),
        link("ea", "e-Arşiv", "crimson-e-arsiv"),
        link("ei", "e-İrsaliye", "crimson-e-irsaliye"),
      ]),
      link("dag", "Dağıtım", "crimson-bulut", [
        link("bl", "Bulut", "crimson-bulut"),
        link("yr", "Yerinde", "crimson-yerinde"),
        link("ol", "Ölçek", "crimson-olcek"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 3, width: "full", items: [], promoBanner: promo },
  },
  {
    ...link("hz", "Hizmetler", "crimson-hizmetler", [
      link("kur", "Kurulum", "crimson-hizmetler", [
        link("hz1", "Kurulum", "crimson-hizmetler"),
        link("ak", "Aktarım", "crimson-aktarim"),
        link("eg", "Eğitim", "crimson-egitim"),
      ]),
      link("yan", "Yanında", "crimson-destek", [
        link("ds", "Destek", "crimson-destek"),
        link("ss", "Sorular", "crimson-sss"),
        link("il", "İletişim", "crimson-iletisim"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 2, width: "wide", items: [] },
  },
  link("io", "İş ortakları", "crimson-is-ortagi"),
  link("kp", "Kampanyalar", "crimson-kampanyalar"),
  {
    ...link("kr", "Kurumsal", "crimson-kurumsal", [
      link("krg", "Kurum", "crimson-kurumsal", [
        link("kr1", "Hakkında", "crimson-kurumsal"),
        link("io2", "İş ortağı", "crimson-is-ortagi"),
        link("gz", "Gizlilik", "crimson-gizlilik"),
      ]),
      link("ici", "İçerik", "crimson-yazilar", [
        link("yz", "Yazılar", "crimson-yazilar"),
        link("kp2", "Kampanyalar", "crimson-kampanyalar"),
        link("ss2", "Sorular", "crimson-sss"),
      ]),
    ]),
    megaMenu: { enabled: true, mode: "children", columns: 2, width: "wide", items: [] },
  },
];

export const CR_MENUS: SiteMenuRecord[] = [
  { id: "menu_cr_header", name: "Ana menü", header: true, items: CR_HEADER_MENU },
];

export const CR_HEADER: HeaderConfig = {
  options: { ctaStyle: "solid" },
  topBar: {
    enabled: false,
    contactPhone: CR_PHONE,
    contactEmail: CR_EMAIL,
    announcementText: "",
    leftWidgets: [],
    centerWidgets: [],
    rightWidgets: [],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: false,
    leftWidgets: ["logo"],
    centerWidgets: ["menu"],
    rightWidgets: ["search", "cta"],
    ctaLabel: "Fiyat alın",
    ctaHref: "/tr/crimson-iletisim",
    mobileLeftWidgets: ["logo"],
    mobileCenterWidgets: [],
    mobileRightWidgets: ["menu"],
  },
  bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [], links: [] },
};

const foot = (id: string, pairs: Array<[string, string]>) =>
  pairs.map(([label, slug], index) => ({ id: `${id}_${index}`, label, href: `/tr/${slug}` }));

export const CR_FOOTER: FooterConfig = {
  layoutPreset: "4-equal",
  showNewsletter: false,
  showLocalBusinessCard: false,
  copyrightText: `© 2026 ${CR_BRAND}. Demo verisi.`,
  bottomLinks: [
    { label: "Gizlilik", href: "/tr/crimson-gizlilik" },
    { label: "İletişim", href: "/tr/crimson-iletisim" },
    { label: "Destek", href: "/tr/crimson-destek" },
  ],
  columns: [
    { id: "cr_f_ur", title: "Ürünler", colSpan: 3, links: foot("ur", [["Tümü", "crimson-urunler"], ["ERP", "crimson-erp"], ["Ön muhasebe", "crimson-on-muhasebe"], ["e-Dönüşüm", "crimson-e-donusum"], ["Perakende", "crimson-perakende"]]) },
    { id: "cr_f_da", title: "Dağıtım", colSpan: 3, links: foot("da", [["Bulut", "crimson-bulut"], ["Yerinde", "crimson-yerinde"], ["Ölçek", "crimson-olcek"]]) },
    { id: "cr_f_kr", title: "Kurum", colSpan: 3, links: foot("kr", [["Kurumsal", "crimson-kurumsal"], ["Kampanyalar", "crimson-kampanyalar"], ["İş ortağı", "crimson-is-ortagi"], ["Yazılar", "crimson-yazilar"]]) },
    { id: "cr_f_ds", title: "Destek", colSpan: 3, links: foot("ds", [["Destek", "crimson-destek"], ["Sorular", "crimson-sss"], ["İletişim", "crimson-iletisim"], ["Hizmetler", "crimson-hizmetler"]]) },
  ],
  widgets: [
    { id: "wdg_cr_f_ur", type: "nav_menu", title: "Ürünler", enabled: true, columnIndex: 0, settings: { links: foot("wur", [["Tümü", "crimson-urunler"], ["ERP", "crimson-erp"], ["Ön muhasebe", "crimson-on-muhasebe"], ["e-Dönüşüm", "crimson-e-donusum"]]) } },
    { id: "wdg_cr_f_da", type: "nav_menu", title: "Dağıtım", enabled: true, columnIndex: 1, settings: { links: foot("wda", [["Bulut", "crimson-bulut"], ["Yerinde", "crimson-yerinde"], ["Ölçek", "crimson-olcek"], ["Perakende", "crimson-perakende"]]) } },
    { id: "wdg_cr_f_kr", type: "nav_menu", title: "Kurum", enabled: true, columnIndex: 2, settings: { links: foot("wkr", [["Kurumsal", "crimson-kurumsal"], ["Kampanyalar", "crimson-kampanyalar"], ["İş ortağı", "crimson-is-ortagi"], ["Yazılar", "crimson-yazilar"]]) } },
    { id: "wdg_cr_f_ds", type: "nav_menu", title: "Destek", enabled: true, columnIndex: 3, settings: { links: foot("wds", [["Destek", "crimson-destek"], ["Sorular", "crimson-sss"], ["İletişim", "crimson-iletisim"], ["Gizlilik", "crimson-gizlilik"]]) } },
  ],
};

export const CR_SIDEBAR: SidebarConfig = {
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
        { id: "wdg_cr_search", type: "search", title: "Yazılarda ara", enabled: true, settings: { placeholder: "Yazı ara" } },
        { id: "wdg_cr_recent", type: "recent_posts", title: "Son yazılar", enabled: true, settings: { count: 3, showThumbnail: false, showDate: true, style: "compact" } },
      ],
    },
  ],
};

export const CR_TOKENS: DesignTokens = {
  colors: {
    primary: "#c8102e",
    primaryForeground: "#ffffff",
    secondary: "#1a1a1a",
    secondaryForeground: "#ffffff",
    accent: "#9f0e24",
    accentForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#f4f5f7",
    mutedForeground: "#3f3f46",
    border: "#e6e6ea",
  },
  darkColors: {
    primary: "#ff8ea3",
    primaryForeground: "#2a0a10",
    secondary: "#24181c",
    secondaryForeground: "#fff5f7",
    accent: "#ffb3c0",
    accentForeground: "#2a0a10",
    background: "#141416",
    foreground: "#f4f5f7",
    muted: "#1e1e22",
    mutedForeground: "#d4d4d8",
    border: "#3f3f46",
  },
  typography: {
    headingFont: '"Segoe UI", system-ui, Helvetica, Arial, sans-serif',
    bodyFont: '"Segoe UI", system-ui, Helvetica, Arial, sans-serif',
    monoFont: "ui-monospace, SFMono-Regular, Menlo, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
  geometry: {
    borderRadius: "16px",
    containerMaxWidth: "1200px",
    sectionSpacingY: "4rem",
    cardShadow: "none",
  },
};

const S = `[data-nx-skin="${CR_THEME_ID}"]`;

/** Beyaz şerit ve üç parçalı vitrin. Fotoğraf dosyası yok; orta kart çizimdir. */
export const CR_CSS = `
${S} { background:#fff; color:#1a1a1a; }
${S} main { padding-top:1rem !important; background:#fff; }
${S} .nx-public-header { background:#fff !important; border-bottom:1px solid #eee !important; backdrop-filter:none !important; }
${S} .nx-logo span { color:#c8102e; font-weight:800; letter-spacing:-.05em; font-size:1.45rem; text-transform:lowercase; }
${S} .nx-public-header nav a, ${S} .nx-header-search { font-size:14px; font-weight:500; color:#1a1a1a; text-decoration:none; }
${S} .nx-public-header nav a:hover { color:#c8102e; }
${S} .nx-header-cta { background:#c8102e !important; color:#fff !important; border:0 !important; border-radius:999px !important; padding:8px 16px !important; }
${S} footer { background:#f7f7f8; color:#1a1a1a; border-top:1px solid #eee; }
${S} footer h2, ${S} footer h3 { font-size:13px; letter-spacing:.04em; text-transform:uppercase; color:#1a1a1a; }
${S} footer a { font-size:14px; color:#3f3f46; }
${S} footer a:hover { color:#c8102e; }
${S} .nx-cr-hero { display:grid; grid-template-columns:1.05fr .9fr .72fr; gap:18px; align-items:stretch; background:#f3f4f6; border-radius:28px; padding:28px; }
${S} .nx-cr-kicker { margin:0 0 .8rem; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:#6b7280; }
${S} .nx-cr-hero h1 { margin:0; font-size:clamp(1.8rem,3vw,2.5rem); font-weight:650; letter-spacing:-.03em; line-height:1.15; max-width:16ch; }
${S} .nx-cr-lead { margin-top:1rem; max-width:34rem; color:#3f3f46; line-height:1.55; }
${S} .nx-cr-pill { display:inline-flex; margin-top:1.4rem; background:#c8102e; color:#fff; border-radius:999px; padding:.75rem 1.15rem; text-decoration:none; font-weight:650; font-size:14px; }
${S} .nx-cr-text { display:inline-block; margin:1.4rem 0 0 .8rem; color:#c8102e; font-weight:650; text-decoration:none; }
${S} .nx-cr-stage { border-radius:20px; min-height:260px; position:relative; overflow:hidden; background:#2a1218; }
${S} .nx-cr-stage img { width:100%; height:100%; min-height:260px; object-fit:cover; display:block; }
${S} .nx-cr-stage::after { content:"Demo verisi"; position:absolute; left:16px; bottom:16px; color:#fff; font-size:12px; letter-spacing:.06em; text-transform:uppercase; background:rgba(26,26,26,.45); padding:4px 8px; border-radius:999px; }
${S} .nx-cr-call { background:#c8102e; color:#fff; border-radius:20px; padding:22px 20px; display:flex; flex-direction:column; justify-content:flex-end; min-height:260px; }
${S} .nx-cr-call p { margin:0; font-size:1.35rem; font-weight:650; letter-spacing:-.02em; line-height:1.2; }
${S} .nx-cr-call span { display:block; margin-top:.7rem; font-size:13px; letter-spacing:.04em; opacity:.9; }
${S} .nx-cr-call a { display:inline-block; margin-top:1.2rem; background:#fff; color:#c8102e; border-radius:999px; padding:.7rem 1rem; text-decoration:none; font-weight:700; font-size:14px; }
${S} .nx-cr-page { padding:.4rem 0 1rem; }
${S} .nx-cr-page h1 { margin:0; font-size:clamp(2rem,4vw,3rem); font-weight:650; letter-spacing:-.03em; line-height:1.1; max-width:16ch; }
${S} .nx-cr-tldr { max-width:40rem; margin:1.25rem 0; color:#3f3f46; }
${S} .cr-card { background:#fff; border:1px solid #eee; border-radius:16px; padding:18px; height:100%; }
${S} .cr-card h3 { font-size:1.15rem; }
${S} .cr-red { background:#c8102e; color:#fff; border-radius:16px; padding:18px; }
${S} .cr-red :is(h2,h3,p,div,a) { color:#fff !important; }
${S} .nx-cr-cta { margin-top:2rem; padding:1.5rem 0; border-top:1px solid #eee; }
${S} .nx-cr-cta a { display:inline-block; margin-top:.8rem; background:#c8102e; color:#fff; border-radius:999px; padding:.7rem 1.1rem; text-decoration:none; font-weight:650; }
${S} form button[type="submit"] { background:#c8102e; color:#fff; border-radius:999px; }
@media (max-width:900px) {
  ${S} .nx-cr-hero { grid-template-columns:1fr; }
  ${S} footer .grid { grid-template-columns:1fr 1fr; }
}
`.trim();
