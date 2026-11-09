import type { FooterLayoutPreset, SiteWidget } from "./widgets";

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

/** Dil başına birden çok menü. Header'da basılan kayıt `header: true` olur; diğerleri footer ve kenar çubuğunda seçilir. */
export interface SiteMenuRecord {
  id: string;
  name: string;
  header: boolean;
  items: NavigationMenuItem[];
}

export interface HeaderBarSlotConfig {
  enabled: boolean;
  sticky?: boolean;
  glassmorphism?: boolean;
  leftWidgets: string[];
  centerWidgets: string[];
  rightWidgets: string[];
  /** Küçük ekran dizisi. Yoksa masaüstünden türetilir (`resolveMobileHeaderZones`). */
  mobileLeftWidgets?: string[];
  mobileCenterWidgets?: string[];
  mobileRightWidgets?: string[];
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
  /** Bu dilde kayıtlı menüler. Header menüsü ayrıca `menuItems` alanına yazılır. */
  menus?: SiteMenuRecord[];
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

