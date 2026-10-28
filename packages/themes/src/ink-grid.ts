import type { DesignTokens, FooterConfig, NavigationMenuItem } from "@nexpress/core";

/** Koyu ızgara vitrin teması. Ayrı tema paketi klasörü yok; manifesto burada durur. */
export const INK_GRID_ID = "ink-grid" as const;

export const INK_GRID_HOME_SLUG = "vitrin";

export const INK_GRID_TOKENS: DesignTokens = {
  colors: {
    primary: "#fafafa",
    primaryForeground: "#000000",
    secondary: "#000000",
    secondaryForeground: "#fafafa",
    accent: "#fafafa",
    accentForeground: "#000000",
    background: "#000000",
    foreground: "#fafafa",
    muted: "#0a0a0a",
    mutedForeground: "#a1a1aa",
    border: "#262626",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, ui-monospace, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
  geometry: {
    borderRadius: "0px",
    containerMaxWidth: "1440px",
    sectionSpacingY: "0px",
    cardShadow: "none",
  },
};

export const INK_GRID_MENU: NavigationMenuItem[] = [
  { id: "ink_nav_product", label: "Ürün", href: "/tr/urun" },
  { id: "ink_nav_why", label: "Neden", href: "/tr/kurumsal" },
  { id: "ink_nav_dev", label: "Geliştiriciler", href: "/tr/gelistiriciler" },
  { id: "ink_nav_docs", label: "Doküman", href: "/tr/dokuman" },
  { id: "ink_nav_cases", label: "Örnekler", href: "/tr/ornek-calismalar" },
];

export const INK_GRID_FOOTER: FooterConfig = {
  columns: [
    {
      id: "ink_f_use",
      title: "Kullanım",
      colSpan: 1,
      links: [
        { label: "İçerik çerçevesi", href: "/tr/urun" },
        { label: "Kurumsal", href: "/tr/kurumsal" },
        { label: "Fiyatlandırma", href: "/tr/fiyatlandirma" },
        { label: "Örnek çalışmalar", href: "/tr/ornek-calismalar" },
      ],
    },
    {
      id: "ink_f_dev",
      title: "Geliştiriciler",
      colSpan: 1,
      links: [
        { label: "Doküman", href: "/tr/dokuman" },
        { label: "Başlangıç", href: "/tr/gelistiriciler" },
        { label: "/llms.txt", href: "/llms.txt" },
      ],
    },
    {
      id: "ink_f_co",
      title: "Stüdyo",
      colSpan: 1,
      links: [
        { label: "Yönetim", href: "/admin" },
        { label: "Tema mağazası", href: "/admin/themes" },
      ],
    },
  ],
  showNewsletter: true,
  showLocalBusinessCard: false,
  copyrightText: "© 2026 NexPress — Ink Grid vitrin.",
  bottomLinks: [
    { label: "Gizlilik", href: "/tr/dokuman" },
    { label: "İletişim", href: "/tr/kurumsal" },
  ],
};

export const INK_GRID_CSS = `
[data-nx-skin="ink"] { background:#000; color:#fafafa; }
[data-nx-skin="ink"] .text-slate-900,
[data-nx-skin="ink"] .text-slate-800 { color:#fafafa !important; }
[data-nx-skin="ink"] .text-slate-700,
[data-nx-skin="ink"] .text-slate-600,
[data-nx-skin="ink"] .text-slate-500,
[data-nx-skin="ink"] .text-slate-400 { color:#a3a3a3 !important; }
[data-nx-skin="ink"] .bg-white,
[data-nx-skin="ink"] .bg-slate-50 { background-color:transparent !important; }
[data-nx-skin="ink"] .border-slate-200,
[data-nx-skin="ink"] .border-slate-300 { border-color:rgba(255,255,255,.14) !important; }
[data-nx-skin="ink"] .rounded,
[data-nx-skin="ink"] .rounded-md,
[data-nx-skin="ink"] .rounded-lg,
[data-nx-skin="ink"] .rounded-xl,
[data-nx-skin="ink"] .rounded-full { border-radius:0 !important; }
[data-nx-skin="ink"] .shadow-xs,
[data-nx-skin="ink"] .shadow-sm,
[data-nx-skin="ink"] .shadow-md,
[data-nx-skin="ink"] .shadow-2xs { box-shadow:none !important; }
`.trim();
