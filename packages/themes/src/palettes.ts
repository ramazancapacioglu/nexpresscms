import type { DesignTokens } from "@nexpress/core";

export interface GlobalColorPalettePreset {
  id: string;
  name: string;
  description: string;
  colors: DesignTokens["colors"];
}

export interface GlobalTypographyPairPreset {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  baseSizePx: number;
  scaleRatio: number;
}

export const GLOBAL_COLOR_PALETTES: GlobalColorPalettePreset[] = [
  {
    id: "aurora-cobalt",
    name: "Aurora Cobalt (Varsayılan Kurumsal)",
    description: "Kobalt mavi, derin lacivert ve kristal beyazı B2B paleti.",
    colors: {
      primary: "#2563eb",
      primaryForeground: "#ffffff",
      secondary: "#0f172a",
      secondaryForeground: "#f8fafc",
      accent: "#4f46e5",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#09090b",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
    },
  },
  {
    id: "emerald-fintech",
    name: "Emerald FinTech & Commerce",
    description: "Zümrüt yeşili, koyu arduvaz ve kehribar dönüşüm paleti.",
    colors: {
      primary: "#059669",
      primaryForeground: "#ffffff",
      secondary: "#111827",
      secondaryForeground: "#f9fafb",
      accent: "#d97706",
      accentForeground: "#ffffff",
      background: "#fcfcfd",
      foreground: "#111827",
      muted: "#f3f4f6",
      mutedForeground: "#4b5563",
      border: "#e5e7eb",
    },
  },
  {
    id: "crimson-editorial",
    name: "Crimson Editorial & Media",
    description: "Yakut kırmızısı, saf siyah ve yüksek kontrastlı dergi paleti.",
    colors: {
      primary: "#e11d48",
      primaryForeground: "#ffffff",
      secondary: "#18181b",
      secondaryForeground: "#fafafa",
      accent: "#9333ea",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#09090b",
      muted: "#f4f4f5",
      mutedForeground: "#52525b",
      border: "#e4e4e7",
    },
  },
  {
    id: "violet-ai-saas",
    name: "Violet AI & DeepTech",
    description: "Elektrik moru, siber çivit ve modern SaaS kontrastı.",
    colors: {
      primary: "#7c3aed",
      primaryForeground: "#ffffff",
      secondary: "#09090b",
      secondaryForeground: "#fafafa",
      accent: "#06b6d4",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#09090b",
      muted: "#f5f3ff",
      mutedForeground: "#5b21b6",
      border: "#ddd6fe",
    },
  },
  {
    id: "obsidian-minimal",
    name: "Obsidian Monochrome",
    description: "Attio & Linear tarzı ultra-minimal monokrom kurumsal palet.",
    colors: {
      primary: "#18181b",
      primaryForeground: "#fafafa",
      secondary: "#27272a",
      secondaryForeground: "#fafafa",
      accent: "#2563eb",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#09090b",
      muted: "#f4f4f5",
      mutedForeground: "#71717a",
      border: "#e4e4e7",
    },
  },
  {
    id: "crimson-erp-ruby",
    name: "Crimson ERP & Kurumsal Yazılım",
    description: "Kurumsal ERP, e-dönüşüm ve muhasebe platformları için yakut kırmızısı (#C8102E), koyu arduvaz ve yumuşak pembe vurgu paleti.",
    colors: {
      primary: "#c8102e",
      primaryForeground: "#ffffff",
      secondary: "#111827",
      secondaryForeground: "#f9fafb",
      accent: "#991b1b",
      accentForeground: "#ffffff",
      background: "#ffffff",
      foreground: "#111827",
      muted: "#f7f8fa",
      mutedForeground: "#4b5563",
      border: "#e5e7eb",
    },
  },
];

export const GLOBAL_TYPOGRAPHY_PAIRS: GlobalTypographyPairPreset[] = [
  {
    id: "inter-precision",
    name: "Inter Precision (SaaS & Kurumsal)",
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.25,
  },
  {
    id: "jakarta-modern",
    name: "Plus Jakarta + Inter (Modern Teknoloji)",
    headingFont: "Plus Jakarta Sans, Inter, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.25,
  },
  {
    id: "editorial-serif",
    name: "Newsreader Serif + Inter (Dergi & Akademik)",
    headingFont: "Newsreader, Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 17,
    scaleRatio: 1.33,
  },
  {
    id: "outfit-geometric",
    name: "Outfit Geometric + System (Yüksek Dönüşüm)",
    headingFont: "Outfit, Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    baseSizePx: 16,
    scaleRatio: 1.2,
  },
];

