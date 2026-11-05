import { darkModeCss, type DesignTokens, type SiteCustomizerSettings, type SiteProfile } from "@nexpress/core";
import { YF_LEGACY_THEME_ID, YF_THEME_ID, YF_TOKENS } from "./yazilim-firmasi";
import { INK_GRID_ID, INK_GRID_TOKENS } from "./ink-grid";

export interface ThemeManifest {
  id:
    | "corporate-aurora"
    | "commerce-velocity"
    | "editorial-pulse"
    | "crimson-erp"
    | typeof INK_GRID_ID
    | typeof YF_THEME_ID;
  name: string;
  tagline: string;
  description: string;
  version: string;
  author: string;
  recommendedProfile: SiteProfile;
  features: string[];
  tokens: DesignTokens;
}

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

export const OFFICIAL_THEME_STORE: ThemeManifest[] = [
  {
    id: "corporate-aurora",
    name: "Corporate Aurora",
    tagline: "B2B, SaaS ve Kurumsal Teknoloji Markaları İçin",
    description:
      "Derin kobalt-indigo vurgular, cam efektli (glassmorphic) 3 katmanlı başlık, Bento özellik ızgaraları ve kurumsal güven odaklı tipografi.",
    version: "1.2.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: [
      "Bento Özellik Grid Varyantı",
      "Glassmorphic Sticky Header",
      "Answer-First TL;DR Vurgu Kutusu",
      "100/100 Lighthouse RSC",
    ],
    tokens: {
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
      typography: {
        headingFont: "Inter, system-ui, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        monoFont: "JetBrains Mono, monospace",
        baseSizePx: 16,
        scaleRatio: 1.25,
      },
      geometry: {
        borderRadius: "0.75rem",
        containerMaxWidth: "1280px",
        sectionSpacingY: "5rem",
        cardShadow: "md",
      },
    },
  },
  {
    id: "commerce-velocity",
    name: "Commerce Velocity",
    tagline: "Yüksek Dönüşümlü E-Ticaret, Katalog ve Kampanya Siteleri İçin",
    description:
      "Zümrüt yeşili ve sıcak kehribar dönüşüm aksanları, 3 şeritli e-ticaret mega-menüsü, canlı GTIN/Fiyat ürün kartları ve hızlı karşılaştırma tabloları.",
    version: "1.1.0",
    author: "NexPress Design Lab",
    recommendedProfile: "ecommerce",
    features: [
      "Dönüşüm Odaklı Ürün & Teklif Kartları",
      "3 Şeritli Katalog Mega-Menüsü",
      "Merchant Center & Offer Şema Vurgusu",
      "Sıfır-JS Hızlı Vitrin",
    ],
    tokens: {
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
      typography: {
        headingFont: "Plus Jakarta Sans, Inter, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        monoFont: "JetBrains Mono, monospace",
        baseSizePx: 16,
        scaleRatio: 1.2,
      },
      geometry: {
        borderRadius: "0.5rem",
        containerMaxWidth: "1360px",
        sectionSpacingY: "4rem",
        cardShadow: "sm",
      },
    },
  },
  {
    id: "editorial-pulse",
    name: "Editorial Pulse",
    tagline: "Haber Portalları, Teknik Bilgi Bankası (KB) ve Araştırma Yayınları İçin",
    description:
      "Yüksek okunabilirlikli editoryal kontrast, zarif keskin hatlar, teknik dokümantasyon/kod blokları ve AI Soru-Cevap (PAA) odaklı bilgi mimarisi.",
    version: "1.0.4",
    author: "NexPress Design Lab",
    recommendedProfile: "news",
    features: [
      "Editoryal Dergi & KB Grid Düzeni",
      "Odaklanmış Okuma Deneyimi",
      "TechArticle & FAQPage Özel Görünümü",
      "Anlık Markdown & /llms.txt Bağlantısı",
    ],
    tokens: {
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
      typography: {
        headingFont: "Newsreader, Georgia, serif",
        bodyFont: "Inter, system-ui, sans-serif",
        monoFont: "JetBrains Mono, monospace",
        baseSizePx: 17,
        scaleRatio: 1.33,
      },
      geometry: {
        borderRadius: "0.25rem",
        containerMaxWidth: "1140px",
        sectionSpacingY: "4.5rem",
        cardShadow: "none",
      },
    },
  },
  {
    id: INK_GRID_ID,
    name: "Ink Grid",
    tagline: "Siyah tuval, ince ızgara ve kod öncelikli ürün siteleri",
    description:
      "Tam genişlik siyah vitrin, ince çerçeve, geniş başlık ve komut satırı çağrıları. Ürün, geliştirici, kurumsal, doküman, fiyat ve örnek çalışma sayfaları temayla birlikte gelir. Etkinleşince ana sayfa bu vitrini basar.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: [
      "Siyah tam genişlik vitrin",
      "Örnek ürün, doküman ve fiyat sayfaları",
      "İnce ızgara ve komut çağrısı",
      "0 KB ön yüz istemci JS",
    ],
    tokens: INK_GRID_TOKENS,
  },
  {
    id: "crimson-erp",
    name: "Crimson ERP & Muhasebe",
    tagline: "Kurumsal Yazılım, ERP, e-Dönüşüm ve Muhasebe Çözüm Platformları İçin",
    description:
      "Yakut kırmızısı (#C8102E) ve koyu arduvaz kurumsal kimlik, hero içinde sağ sütun 'Sizi Arayalım' teklif formu, yapışkan HTML çapa (sticky anchor) kategori gezgini, Bulut/On-Premise çözüm sekmeleri ve işletme ölçeğine göre karşılaştırma matrisi.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: [
      "Yapışkan HTML Çapa (Sticky Anchor) Kategori Gezgini",
      "Bölünmüş Hero + Hızlı Teklif & Demo Talep Kartı",
      "Bulut / On-Premise Çözüm Ailesi Sekmeleri",
      "İşletme Ölçeğine Göre Paket Karşılaştırma Matrisi",
    ],
    tokens: {
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
      typography: {
        headingFont: "Plus Jakarta Sans, Inter, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        monoFont: "JetBrains Mono, monospace",
        baseSizePx: 16,
        scaleRatio: 1.25,
      },
      geometry: {
        borderRadius: "0.75rem",
        containerMaxWidth: "1320px",
        sectionSpacingY: "4.5rem",
        cardShadow: "md",
      },
    },
  },
  {
    id: YF_THEME_ID,
    name: "Yazılım Firması Teması",
    tagline: "Siyah vitrin, mega menü, dizin footer — kurumsal yazılım sitesi",
    description:
      "Yazılım üreticileri için tam site: buzlu şerit, dört sütunlu mega menü, siyah kahraman alanı, ürün/sektör/e-dönüşüm sayfaları, dizin footer ve sağdan açılan arama formu. Demo veriyi aktarınca tüm sayfalar düzenlenebilir olarak gelir.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: [
      "52px buzlu şerit",
      "Mega menü sütunları",
      "Sağ demo formu",
      "Açık gri footer",
      "Yazı kenar çubuğu",
    ],
    tokens: YF_TOKENS,
  },
];

export function getThemeManifest(themeId: string): ThemeManifest {
  const id = themeId === YF_LEGACY_THEME_ID ? YF_THEME_ID : themeId;
  return (
    OFFICIAL_THEME_STORE.find((t) => t.id === id) ?? OFFICIAL_THEME_STORE[0]!
  );
}

/**
 * Tasarım Tokenlarını ve Tema Özelleştirici ayarlarını ön yüz için saf CSS değişkenlerine derler (0-KB İstemci JS).
 */
export function compileDesignTokensToCssVars(
  tokens: DesignTokens,
  customizer?: Partial<SiteCustomizerSettings>
): string {
  const btnRadius =
    customizer?.buttons?.style === "pill"
      ? "9999px"
      : customizer?.buttons?.style === "sharp"
        ? "0.125rem"
        : tokens.geometry.borderRadius;
  const btnTransform = customizer?.buttons?.uppercase ? "uppercase" : "none";
  const articleWidth = customizer?.layout?.articleWidth ?? "840px";
  const headingWeight = customizer?.typography?.headingWeight ?? "700";
  const bodyLineHeight = customizer?.typography?.bodyLineHeight ?? "1.65";

  return `
    :root {
      --nx-primary: ${tokens.colors.primary};
      --nx-primary-fg: ${tokens.colors.primaryForeground};
      --nx-secondary: ${tokens.colors.secondary};
      --nx-secondary-fg: ${tokens.colors.secondaryForeground};
      --nx-accent: ${tokens.colors.accent};
      --nx-accent-fg: ${tokens.colors.accentForeground};
      --nx-bg: ${tokens.colors.background};
      --nx-fg: ${tokens.colors.foreground};
      --nx-muted: ${tokens.colors.muted};
      --nx-muted-fg: ${tokens.colors.mutedForeground};
      --nx-border: ${tokens.colors.border};
      --nx-fg-soft: color-mix(in srgb, var(--nx-fg) 80%, var(--nx-bg));
      --nx-card: #ffffff;
      --nx-link: color-mix(in srgb, var(--nx-primary) 85%, #000);
      --nx-radius: ${tokens.geometry.borderRadius};
      --nx-btn-radius: ${btnRadius};
      --nx-btn-transform: ${btnTransform};
      --nx-container: ${tokens.geometry.containerMaxWidth};
      --nx-article-width: ${articleWidth};
      --nx-section-y: ${tokens.geometry.sectionSpacingY};
      --nx-font-heading: ${tokens.typography.headingFont};
      --nx-font-body: ${tokens.typography.bodyFont};
      --nx-font-mono: ${tokens.typography.monoFont};
      --nx-heading-weight: ${headingWeight};
      --nx-body-lh: ${bodyLineHeight};
    }
    html { scroll-behavior: smooth; }
    ${customizer?.darkMode === "auto" ? darkModeCss(tokens.colors, customizer.darkColors ?? {}) : ""}
    ${customizer?.customCss ? customizer.customCss : ""}
  `.trim();
}
