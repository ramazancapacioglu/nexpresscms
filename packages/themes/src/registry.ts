import { darkModeCss, type DesignTokens, type SiteCustomizerSettings, type SiteProfile } from "@nexpress/core";
import { YF_LEGACY_THEME_ID, YF_THEME_ID, YF_TOKENS } from "./yazilim-firmasi";
import { INK_GRID_ID, INK_GRID_TOKENS } from "./ink-grid";
import { KA_THEME_ID, KA_TOKENS } from "./kuzey-atolye";
import { SA_THEME_ID, SA_TOKENS } from "./sera-ajans";
import { CR_THEME_ID, CR_TOKENS } from "./crimson-erp";
import { YB_THEME_ID, YB_TOKENS } from "./yazilim-bayi";

export interface ThemeManifest {
  id:
    | "corporate-aurora"
    | "commerce-velocity"
    | "editorial-pulse"
    | typeof CR_THEME_ID
    | typeof INK_GRID_ID
    | typeof YF_THEME_ID
    | typeof KA_THEME_ID
    | typeof SA_THEME_ID
    | typeof YB_THEME_ID;
  name: string;
  tagline: string;
  description: string;
  version: string;
  author: string;
  recommendedProfile: SiteProfile;
  features: string[];
  tokens: DesignTokens;
}

export * from "./palettes";

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
    id: CR_THEME_ID,
    name: "Crimson ERP & Muhasebe",
    tagline: "Beyaz şerit, yakut kırmızı kapsül, ERP ve e-dönüşüm vitrini",
    description:
      "Kurumsal yazılım vitrini: beyaz yapışkan şerit, solda kırmızı sözcük, ortada menü, sağda arama ve kapsül düğme. Ana sayfa üç parçadır: cümle, örnek görsel kart, kırmızı arama kutusu. Ürün, ölçek, bulut, yerinde kurulum, kampanya ve destek sayfaları demo olarak gelir. İndirim oranı ve müşteri adı yoktur.",
    version: "1.1.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: [
      "Beyaz şerit ve kırmızı kapsül",
      "Üç parçalı vitrin",
      "Ürün menüsü",
      "Dört sütun dizin altlık",
    ],
    tokens: CR_TOKENS,
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
  {
    id: KA_THEME_ID,
    name: "Kuzey Atölye",
    tagline: "Kâğıt zemin, serif başlık, tek çam yeşili — yazılım atölyesi",
    description:
      "Orta ölçekli işletmeye iş yazılımı yazan atölye vitrini. Cam ve gradyan yok. Header, footer, yazı kenarı ve demo sayfalar temayla gelir. Demo verisi diye işaretlidir.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: ["Kâğıt zemin", "Serif başlık", "Tek vurgu rengi", "Yazı kenarı", "0 KB istemci JS"],
    tokens: KA_TOKENS,
  },
  {
    id: SA_THEME_ID,
    name: "Sera Ajans",
    tagline: "Açık gül zemin, iri başlık, siyah kapsül — dijital ajans",
    description:
      "Marka, site ve ölçümü aynı masada tutan ajans vitrini. Çizgi daire, iş listesi, siyah altlık. Demo verisi diye işaretlidir. Ödül ve müşteri adı yoktur.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: ["Gül zemin", "İri başlık", "Siyah kapsül düğme", "İş listesi", "0 KB istemci JS"],
    tokens: SA_TOKENS,
  },
  {
    id: YB_THEME_ID,
    name: "Yazılım Bayi Teması",
    tagline: "Yetkili yazılım bayisi ve çözüm ortağı siteleri için",
    description:
      "İki katmanlı başlık (bayi adı, hızlı bağlantılar, telefon ve ana menü), sol metin + sağ görsel mozaikli vitrin, altı kartlı çözüm ızgarası, mavi demo/hemen ara bandı, muhasebe, sektörel ve e-dönüşüm şeritleri, kampanya vitrini, SSS ve çok sütunlu dizin altlığı. Yeşil ve lacivert kurumsal palet.",
    version: "1.0.0",
    author: "NexPress Design Lab",
    recommendedProfile: "corporate",
    features: ["İki katmanlı başlık", "Görsel mozaikli vitrin", "Altı kartlı çözüm ızgarası", "Demo / Hemen ara bandı", "Dizin altlığı"],
    tokens: YB_TOKENS,
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
