import { z } from "zod";
import type { FooterLayoutPreset, SiteWidget } from "./widgets";

/**
 * 1. Çalışma ve Kiracı (Tenancy) Modları
 */
export type CmsMode = "single" | "multi_subdomain";
export type DbDialect = "sqlite" | "postgresql";

/**
 * 2. Polimorfik Site Profilleri (Kurumsal, E-Ticaret, Haber/Bilgi Bankası)
 */
export type SiteProfile = "corporate" | "ecommerce" | "news";

/**
 * 3. Polimorfik İçerik Türleri ve Yayın Durumları (Taslak, Yayında, Zamanlanmış, Kısıtlı)
 */
export type ContentType =
  | "template"    // Tema oluşturucu şablonu (header, footer, sayfa, blog, arşiv…): yayınlanmaz, hiçbir ziyaretçi yüzeyine girmez
  | "page"        // Kurumsal sayfalar & Görsel Kanvas açılış sayfaları
  | "post"        // Blog ve haber yazıları
  | "kb_tech"     // Teknik Bilgi Bankası (TechArticle / HowTo)
  | "ai_prompt"   // Soru Madenciliği / PAA sayfası (/soru/{slug} - FAQPage)
  | "product"     // Ürün veya Yazılım (Product / SoftwareApplication)
  | "campaign";   // Kampanya ve Teklif sayfası (/kampanya/{slug} - Offer)

export type ContentStatus =
  | "draft"       // Taslak
  | "published"   // Herkese Açık Yayında
  | "scheduled"   // İleri Tarihte Zamanlanmış
  | "restricted"  // Kısıtlı (Şifre veya Üye Korumalı)
  | "archived"    // Arşivlenmiş
  | "trashed";    // Çöp kutusunda (yumuşak silinmiş; hiçbir yüzeyde görünmez, 30 gün sonra kalıcı silinir)

export type ContentVisibility = "public" | "password" | "members_only" | "private";

/**
 * 3.1. Öne Çıkan Görsel (Featured Image) ve Görsel SEO Yapısı
 */
export interface FeaturedImageMeta {
  mediaId?: string;
  url: string;
  altText: string;
  titleText?: string;
  caption?: string;
  width?: number;
  height?: number;
  focalPoint?: { x: number; y: number };
  loadingPriority?: "eager" | "lazy";
  ogImageOverride?: boolean;
}

/**
 * 3.2. İçerik Etkileşim, Yorum, Değerlendirme ve Kısıtlı Yayın Ayarları
 */
export interface ContentPublishingSettings {
  visibility: ContentVisibility;
  accessPassword?: string;
  scheduledAt?: string;
  allowComments: boolean;
  allowReviews: boolean;
  showShareBar: boolean;
  isSticky?: boolean;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  categories: string[]; // kategori slug veya id listesi
  tags: string[];       // etiket listesi
  featuredImageMeta?: FeaturedImageMeta;
}

/**
 * 4. Tasarım Tokenları (Tema Motoru & CSS Variables Kontratı)
 */
export interface DesignTokens {
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
  };
  darkColors?: Partial<DesignTokens["colors"]>;
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    baseSizePx: number;
    scaleRatio: number;
  };
  geometry: {
    borderRadius: string;
    containerMaxWidth: string;
    sectionSpacingY: string;
    cardShadow: "none" | "sm" | "md" | "lg" | "glow";
  };
}

/**
 * 5. Çift Modlu Görsel Editör: Hazır Bölümler + Temel Atomik Elementler (0-KB RSC Uyumlu)
 */
/** Tüm blok türleri: TEK kaynak. `BlockType` ve `BlockNodeSchema` (içe aktarma/AI doğrulaması) buradan türetilir. */
export const BLOCK_TYPES = [
  "hero",
  "heading",
  "heading_element",
  "paragraph",
  "paragraph_element",
  "text_div",
  "button_element",
  "image_figure",
  "media_file",
  "dynamic_list",
  "schema_card",
  "tpl_post_title",
  "tpl_post_content",
  "tpl_featured_image",
  "tpl_post_meta",
  "tpl_breadcrumb",
  "tpl_archive_title",
  "tpl_archive_list",
  "tpl_site_logo",
  "tpl_menu",
  "tpl_copyright",
  "tpl_cart_link",
  "tpl_product_buy",
  "divider_spacer",
  "review_box",
  "section",
  "columns",
  "column",
  "quote",
  "list_element",
  "video_embed",
  "testimonial_grid",
  "tldr_box",
  "grid_section",
  "bento_features",
  "product_embed",
  "pricing_table",
  "faq_accordion",
  "howto_steps",
  "comparison_table",
  "callout",
  "stats_strip",
  "cta_banner",
  "code_block",
  "info_box",
  "icon_list",
  "tabs",
  "accordion",
  "toc",
  "show_more",
  "button_row",
  "gallery",
  "image_overlay",
  "video_popup",
  "slider",
  "countdown",
  "progress_bar",
  "form_block",
  "data_table",
  "map_embed",
  "search_box",
  "post_grid",
  "modal_panel",
  "split_content",
  "portfolio_grid",
  "product_row",
  "user_card",
  "repeater",
  "vector_mark",
  "single_icon",
  "countup",
  "marquee",
  "shape_divider",
  "anchor_nav",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export type DeviceKey = "desktop" | "tablet" | "mobile";

/**
 * 5.1. NexPress Studio Blok Stil Sistemi (Her blok için aygıt bazlı CSS kontrolleri).
 * Ön yüzde saf CSS (`<style>`) olarak derlenir; sıfır istemci JavaScript'i gerektirir.
 */
export interface BlockStyleValues {
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginBottom?: string;
  background?: string; // renk veya CSS gradient
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string; // url
  backgroundOverlay?: string; // rgba overlay
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: string;
  maxWidth?: string;
  minHeight?: string;
  gap?: string;
  borderWidth?: string;
  borderColor?: string;
  borderRadius?: string;
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  // Tipografi
  fontFamily?: string;
  fontWeight?: string; // 100–900
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textShadow?: "none" | "sm" | "md" | "lg";
  // Kenar boşluğu (sol/sağ) ve kenarlık biçimi
  marginLeft?: string;
  marginRight?: string;
  borderStyle?: "solid" | "dashed" | "dotted" | "double";
  // Arka plan görseli
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: string; // "center", "top left", "50% 20%"
  backgroundFixed?: boolean; // paralaks benzeri sabit arka plan
  // Dönüşüm
  translateY?: string;
  scale?: number;
  rotate?: string;
}

/** Üzerine gelince (hover) uygulanan değerler; yalnızca geçişle güvenli biçimde değişen alanlar. */
export interface BlockHoverValues {
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  translateY?: string;
  scale?: number;
}

/** CSS ile çalışan giriş animasyonları (görünüme girerken; JS yok, desteklenmeyen tarayıcıda animasyonsuz). */
export type BlockAnimationName = "fade-in" | "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in";

export interface BlockStyle extends BlockStyleValues {
  tablet?: BlockStyleValues;
  mobile?: BlockStyleValues;
  hover?: BlockHoverValues;
  /** Giriş animasyonu */
  animation?: BlockAnimationName;
  /** Geçiş süresi (ms); hover geçişi için de kullanılır */
  transitionMs?: number;
  hideOn?: DeviceKey[] | { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  fullWidth?: boolean; // Kapsayıcıdan taşarak tam ekran genişlik
  anchorId?: string;
  cssClass?: string;
  customCss?: string; // `selector { ... }` biçiminde blok kapsamlı özel CSS
}

export interface BlockNode {
  id: string;
  type: BlockType;
  variant?: string;
  props: Record<string, unknown>;
  style?: BlockStyle;
  children?: BlockNode[];
  gridSpan?: {
    desktop: number; // 1..12
    tablet: number;  // 1..12
    mobile: number;  // 1..12
  };
}

/**
 * 6. 3 Katmanlı Görsel Header, Footer ve Mega-Menü Şeması
 */
export interface MegaMenuColumnItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon?: string;
  badge?: string;
  featuredContentId?: string;
}

/** Menü öğesinin hedefi. `custom` dışındakiler kimlikle bağlanır: slug değişse de bağlantı güncel kalır, hedef silinirse öğe yayında gizlenir. */
export type MenuSourceKind = "custom" | "home" | "content" | "category" | "tag" | "store" | "product";

export interface MenuSource {
  kind: MenuSourceKind;
  /** content: içerik kimliği, category/tag: taksonomi kimliği, product: ürün kimliği */
  refId?: string;
}

export interface NavigationLink {
  id: string;
  label: string;
  /** `source.kind !== "custom"` ise yayında kaynaktan çözülür; burada son bilinen değer saklanır */
  href: string;
  target?: "_self" | "_blank";
  source?: MenuSource;
  /** Menü öğesi veya mega menü sütun başlığı yanında gösterilecek yerleşik SVG simge adı */
  icon?: string;
  /** Kısa not (mega menüde alt başlık) */
  description?: string;
  badge?: string;
  /** Alt öğeler (en çok 3 düzey: kök > alt > torun) */
  children?: NavigationLink[];
}

export type MegaMenuWidth = "narrow" | "wide" | "full";

export interface MegaMenuConfig {
  enabled: boolean;
  /** `children`: sütunlar alt öğelerden kurulur (her alt öğe bir sütun başlığı, torunları bağlantılar). `custom`: elle kartlar */
  mode?: "children" | "custom";
  columns: number;
  width?: MegaMenuWidth;
  items: MegaMenuColumnItem[];
  promoBanner?: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
    highlightColor?: string;
  };
}

export interface NavigationMenuItem extends NavigationLink {
  megaMenu?: MegaMenuConfig;
}

export interface HeaderBarSlotConfig {
  enabled: boolean;
  sticky?: boolean;
  glassmorphism?: boolean;
  leftWidgets: string[];
  centerWidgets: string[];
  rightWidgets: string[];
}

export interface HeaderConfig {
  topBar: HeaderBarSlotConfig & {
    announcementText?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  mainBar: HeaderBarSlotConfig & {
    ctaLabel?: string;
    ctaHref?: string;
  };
  bottomBar: HeaderBarSlotConfig & {
    links?: NavigationLink[];
  };
}

/** Belirli bir içerik türü veya şablon için bağımsız kenar çubuğu alanı (Blog, Mağaza, Kategori, SSS, Sayfa vb.) */
export interface SidebarAreaConfig {
  id: string; // "primary", "blog", "shop", "archive", "faq", "page" veya özel id
  name: string;
  description?: string;
  enabled: boolean;
  position?: "left" | "right";
  width?: "260px" | "300px" | "340px";
  sticky?: boolean;
  styleVariant?: "cards" | "minimal" | "bordered";
  widgets?: SiteWidget[];
}

/** Sayfa gövdesinin yanında duran site kenar çubuğu. İçerik bloklarından ayrıdır; dinamik bileşenler (widget) barındırır. */
export interface SidebarConfig {
  enabled: boolean;
  position: "left" | "right";
  width?: "260px" | "300px" | "340px";
  sticky?: boolean;
  styleVariant?: "cards" | "minimal" | "bordered";
  title: string;
  widgets?: SiteWidget[];
  links: NavigationLink[];
  /** Birden fazla kenar çubuğu desteği (Blog, Ürün & Mağaza, Kategori, SSS, Sayfa vb.) */
  areas?: SidebarAreaConfig[];
}

export function emptySidebarConfig(): SidebarConfig {
  return {
    enabled: false,
    position: "right",
    width: "300px",
    sticky: true,
    styleVariant: "cards",
    title: "Kenar Çubuğu",
    widgets: [],
    links: [],
  };
}

export interface FooterColumnConfig {
  id: string;
  title: string;
  colSpan: number;
  links: Array<{ label: string; href: string; badge?: string }>;
}

export interface FooterTopBannerConfig {
  enabled: boolean;
  badge?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface FooterConfig {
  layoutPreset?: FooterLayoutPreset;
  topBanner?: FooterTopBannerConfig;
  widgets?: SiteWidget[];
  columns: FooterColumnConfig[];
  showNewsletter: boolean;
  showLocalBusinessCard: boolean;
  copyrightText: string;
  bottomLinks: Array<{ label: string; href: string }>;
}

/**
 * 7. JSON-LD Schema.org Grafik Düğümü
 */
export interface SchemaGraphNode {
  "@type": string | string[];
  "@id"?: string;
  [key: string]: unknown;
}

export const BlockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum(BLOCK_TYPES),
    variant: z.string().optional(),
    props: z.record(z.string(), z.unknown()),
    style: z.record(z.string(), z.unknown()).optional() as unknown as z.ZodType<BlockStyle | undefined>,
    children: z.array(BlockNodeSchema).optional(),
    gridSpan: z
      .object({
        desktop: z.number().min(1).max(12),
        tablet: z.number().min(1).max(12),
        mobile: z.number().min(1).max(12),
      })
      .optional(),
  })
);
