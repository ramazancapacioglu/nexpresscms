import type { FooterConfig, NavigationLink, SidebarConfig } from "./types";

/**
 * Kenar Çubuğu (Sidebar) ve Alt Bölüm (Footer) için Birleşik Bileşen (Widget) Türleri.
 * Düz bağlantı listesi yerine yerleşime göre eklenebilen dinamik ve zengin bileşenler sunar.
 */
export const SITE_WIDGET_TYPES = [
  "categories",
  "recent_posts",
  "recent_comments",
  "campaigns",
  "featured_products",
  "popular_tags",
  "search",
  "newsletter",
  "about_brand",
  "contact_card",
  "trust_badges",
  "toc",
  "nav_menu",
] as const;

export type SiteWidgetType = (typeof SITE_WIDGET_TYPES)[number];

export type FooterLayoutPreset =
  | "4-equal"
  | "brand-wide-4"
  | "3-equal"
  | "2-asymmetric"
  | "1-centered";

export interface FooterLayoutPresetMeta {
  id: FooterLayoutPreset;
  label: string;
  description: string;
  columnCount: number;
  /** Masaüstü 12'lik ızgarada her sütunun genişliği */
  colSpans: number[];
  columnLabels: string[];
}

export const FOOTER_LAYOUT_PRESETS: FooterLayoutPresetMeta[] = [
  {
    id: "brand-wide-4",
    label: "Marka Geniş + 3 Sütun (4+2+3+3)",
    description: "1. sütun marka/bülten için geniş, diğer 3 sütun kategoriler, son yazılar ve kampanyalar için.",
    columnCount: 4,
    colSpans: [4, 2, 3, 3],
    columnLabels: ["1. Sütun (Marka / Geniş)", "2. Sütun", "3. Sütun", "4. Sütun"],
  },
  {
    id: "4-equal",
    label: "4 Eşit Sütun (3+3+3+3)",
    description: "Dört eşit genişlikte bileşen sütunu. Yoğun içerik ve e-ticaret siteleri için idealdir.",
    columnCount: 4,
    colSpans: [3, 3, 3, 3],
    columnLabels: ["1. Sütun", "2. Sütun", "3. Sütun", "4. Sütun"],
  },
  {
    id: "3-equal",
    label: "3 Eşit Sütun (4+4+4)",
    description: "Üç dengeli bileşen alanı: Marka, Kategoriler/Son Yazılar ve Kampanya/İletişim.",
    columnCount: 3,
    colSpans: [4, 4, 4],
    columnLabels: ["1. Sütun (Sol)", "2. Sütun (Orta)", "3. Sütun (Sağ)"],
  },
  {
    id: "2-asymmetric",
    label: "2 Sütun Asimetrik (5+7)",
    description: "Solda marka ve bülten, sağda son yazılar veya kampanya vitrini.",
    columnCount: 2,
    colSpans: [5, 7],
    columnLabels: ["1. Sütun (Sol - 5/12)", "2. Sütun (Sağ - 7/12)"],
  },
  {
    id: "1-centered",
    label: "Tek Sütun Merkezi Vitrin (12)",
    description: "Minimalist kurumsal veya ürün lansman sayfaları için tam genişlik tek alan.",
    columnCount: 1,
    colSpans: [12],
    columnLabels: ["Merkez Bileşen Alanı"],
  },
];

export interface SiteWidgetSettings {
  subtitle?: string;
  count?: number;
  showCount?: boolean;
  showThumbnail?: boolean;
  showDate?: boolean;
  showRating?: boolean;
  showHierarchy?: boolean;
  style?: "list" | "pills" | "cards" | "compact" | "numbered";
  tone?: "default" | "primary" | "dark" | "accent" | "subtle";
  badge?: string;
  couponCode?: string;
  discountText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  placeholder?: string;
  popularKeywords?: string;
  privacyNote?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  socials?: {
    x?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  badges?: Array<{ icon: string; title: string; subtitle: string }>;
  links?: Array<{ id: string; label: string; href: string; icon?: string; badge?: string }>;
}

export interface SiteWidget {
  id: string;
  type: SiteWidgetType;
  title: string;
  enabled: boolean;
  /** Footer yerleşiminde hangi sütunda (0..3) yer aldığı */
  columnIndex?: number;
  settings: SiteWidgetSettings;
}

export interface WidgetCatalogEntry {
  type: SiteWidgetType;
  name: string;
  category: "dynamic" | "commerce" | "engagement" | "brand";
  categoryLabel: string;
  description: string;
  icon: string;
  defaultTitle: string;
  defaultSettings: SiteWidgetSettings;
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    type: "categories",
    name: "Kategoriler",
    category: "dynamic",
    categoryLabel: "Dinamik İçerik",
    description: "Sitedeki blog ve içerik kategorilerini yazı sayılarıyla birlikte dinamik listeler.",
    icon: "layers",
    defaultTitle: "Kategoriler",
    defaultSettings: {
      count: 6,
      showCount: true,
      showHierarchy: true,
      style: "list",
    },
  },
  {
    type: "recent_posts",
    name: "Son Yazılar",
    category: "dynamic",
    categoryLabel: "Dinamik İçerik",
    description: "Son yayınlanan blog yazılarını ve rehberleri kapak görseli ve tarihiyle gösterir.",
    icon: "newspaper",
    defaultTitle: "Son Yazılar",
    defaultSettings: {
      count: 4,
      showThumbnail: true,
      showDate: true,
      style: "compact",
    },
  },
  {
    type: "recent_comments",
    name: "Son Yorumlar & İncelemeler",
    category: "dynamic",
    categoryLabel: "Dinamik İçerik",
    description: "Ziyaretçilerin son onaylanan yorumlarını ve yıldızlı değerlendirmelerini listeler.",
    icon: "message",
    defaultTitle: "Son Yorumlar",
    defaultSettings: {
      count: 4,
      showRating: true,
      style: "cards",
    },
  },
  {
    type: "campaigns",
    name: "Kampanya & Fırsat Kutusu",
    category: "commerce",
    categoryLabel: "Kampanya & Ticaret",
    description: "Özel indirim, kupon kodu, aktif kampanya duyurusu ve harekete geçirici buton kartı.",
    icon: "megaphone",
    defaultTitle: "Haftanın Kampanyası",
    defaultSettings: {
      badge: "ÖZEL FIRSAT",
      discountText: "%25 İndirim",
      subtitle: "Kurumsal paketlerde ve yıllık lisanslarda geçerli sınırlı süreli fırsat.",
      couponCode: "AVANTAJ25",
      ctaLabel: "Kampanyayı İncele",
      ctaHref: "/tr/magaza",
      tone: "primary",
    },
  },
  {
    type: "featured_products",
    name: "Öne Çıkan Ürünler",
    category: "commerce",
    categoryLabel: "Kampanya & Ticaret",
    description: "Mağazadaki seçili ürünleri fiyat, rozet ve hızlı inceleme bağlantısıyla vitrinler.",
    icon: "bag",
    defaultTitle: "Öne Çıkan Ürünler",
    defaultSettings: {
      count: 3,
      showThumbnail: true,
      badge: "Popüler",
      ctaLabel: "Tüm Mağaza",
      ctaHref: "/tr/magaza",
    },
  },
  {
    type: "popular_tags",
    name: "Popüler Etiketler Bulutu",
    category: "dynamic",
    categoryLabel: "Dinamik İçerik",
    description: "Konu etiketlerini tıklanabilir rozet bulutu olarak gösterir.",
    icon: "tag",
    defaultTitle: "Popüler Etiketler",
    defaultSettings: {
      count: 10,
      showCount: false,
      style: "pills",
    },
  },
  {
    type: "search",
    name: "Site İçi Arama",
    category: "engagement",
    categoryLabel: "Etkileşim & Keşif",
    description: "Hızlı arama kutusu ve popüler arama anahtar kelimeleri.",
    icon: "search",
    defaultTitle: "Arama Yap",
    defaultSettings: {
      placeholder: "Yazı, kategori veya ürün ara…",
      popularKeywords: "Performans, SEO, E-Ticaret, Kurumsal",
    },
  },
  {
    type: "newsletter",
    name: "E-Bülten Aboneliği",
    category: "engagement",
    categoryLabel: "Etkileşim & Keşif",
    description: "Ziyaretçilerden e-posta aboneliği toplayan modern kayıt kutusu.",
    icon: "mail",
    defaultTitle: "Bültene Abone Olun",
    defaultSettings: {
      subtitle: "Yeni rehberler, ürün güncellemeleri ve özel kampanyalar e-postanıza gelsin.",
      placeholder: "E-posta adresiniz…",
      ctaLabel: "Abone Ol",
      privacyNote: "İstediğiniz zaman tek tıkla ayrılabilirsiniz.",
      tone: "subtle",
    },
  },
  {
    type: "about_brand",
    name: "Marka Özeti & Sosyal Medya",
    category: "brand",
    categoryLabel: "Marka & Kurumsal",
    description: "Site/marka tanıtımı, iletişim satırları ve sosyal medya simge bağlantıları.",
    icon: "building",
    defaultTitle: "Hakkımızda",
    defaultSettings: {
      subtitle: "Yeni nesil yüksek hızlı web ve dijital içerik platformu.",
      phone: "+90 (212) 000 00 00",
      email: "iletisim@ornek.com",
      address: "İstanbul Teknoloji Merkezi",
      socials: {
        x: "https://x.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
        youtube: "",
        github: "https://github.com",
      },
    },
  },
  {
    type: "contact_card",
    name: "Uzman Desteği & İletişim Kartı",
    category: "brand",
    categoryLabel: "Marka & Kurumsal",
    description: "Telefon, çalışma saatleri ve hızlı randevu/teklif çağrı kartı.",
    icon: "headphones",
    defaultTitle: "Uzman Desteği",
    defaultSettings: {
      subtitle: "Projeniz için mimari danışmanlık veya fiyat teklifi alın.",
      phone: "+90 (212) 000 00 00",
      email: "destek@ornek.com",
      hours: "Hafta içi 09:00 – 18:00",
      ctaLabel: "Bize Ulaşın",
      ctaHref: "/tr/kurumsal",
      tone: "dark",
    },
  },
  {
    type: "trust_badges",
    name: "Güven & Garanti Rozetleri",
    category: "commerce",
    categoryLabel: "Kampanya & Ticaret",
    description: "SSL güvenliği, hızlı teslimat, iade garantisi ve 7/24 destek rozetleri.",
    icon: "shield",
    defaultTitle: "Güvenli Alışveriş & Hizmet",
    defaultSettings: {
      badges: [
        { icon: "shield", title: "256-Bit SSL Güvenliği", subtitle: "Şifreli ve güvenli altyapı" },
        { icon: "truck", title: "Anında Teslimat & Kurulum", subtitle: "Hızlı devreye alma" },
        { icon: "award", title: "%100 Memnuniyet Garantisi", subtitle: "14 gün koşulsuz iade" },
      ],
    },
  },
  {
    type: "toc",
    name: "İçindekiler Rehberi (TOC)",
    category: "engagement",
    categoryLabel: "Etkileşim & Keşif",
    description: "Makale ve dokümantasyon sayfalarında bölüm başlıklarına hızlı geçiş kutusu.",
    icon: "book",
    defaultTitle: "Bu Sayfada",
    defaultSettings: {
      subtitle: "Bölüm başlıklarına hızlı göz atın",
      count: 6,
    },
  },
  {
    type: "nav_menu",
    name: "Menü & Hızlı Bağlantı Grubu",
    category: "brand",
    categoryLabel: "Marka & Kurumsal",
    description: "İkonlu ve rozetli özel yönlendirme menüsü (Kurumsal, Yasal, Çözümler vb.).",
    icon: "compass",
    defaultTitle: "Hızlı Erişim",
    defaultSettings: {
      links: [
        { id: "wl_1", label: "Hakkımızda & Kurumsal", href: "/tr/kurumsal", icon: "building" },
        { id: "wl_2", label: "Ürünler & Çözümler", href: "/tr/urun", icon: "box", badge: "Yeni" },
        { id: "wl_3", label: "Fiyatlandırma", href: "/tr/fiyatlandirma", icon: "credit-card" },
        { id: "wl_4", label: "Teknik Dokümantasyon", href: "/tr/dokuman", icon: "book" },
      ],
    },
  },
];

let widgetCounter = 0;

export function createDefaultWidget(
  type: SiteWidgetType,
  columnIndex = 0,
  overrides?: Partial<SiteWidget>
): SiteWidget {
  const entry = WIDGET_CATALOG.find((w) => w.type === type) ?? WIDGET_CATALOG[0]!;
  widgetCounter = (widgetCounter + 1) % 100000;
  return {
    id: `wdg_${type}_${Date.now().toString(36)}_${widgetCounter}`,
    type,
    title: overrides?.title ?? entry.defaultTitle,
    enabled: overrides?.enabled ?? true,
    columnIndex,
    settings: structuredClone({
      ...entry.defaultSettings,
      ...(overrides?.settings ?? {}),
    }),
  };
}

/**
 * Kenar çubuğu yapılandırmasından aktif widget listesini çözer.
 * Eğer eski kayıtta henüz `widgets` dizisi yoksa varsayılan zengin widget setini (veya eski linkleri) döndürür.
 */
export function resolveSidebarWidgets(sidebar?: SidebarConfig | null): SiteWidget[] {
  if (!sidebar) return [];
  if (Array.isArray(sidebar.widgets) && sidebar.widgets.length > 0) {
    return sidebar.widgets;
  }
  const fallback: SiteWidget[] = [
    createDefaultWidget("search", 0, { id: "wdg_sb_search" }),
    createDefaultWidget("categories", 0, { id: "wdg_sb_cats" }),
    createDefaultWidget("recent_posts", 0, { id: "wdg_sb_posts" }),
    createDefaultWidget("campaigns", 0, { id: "wdg_sb_campaign" }),
  ];
  if (Array.isArray(sidebar.links) && sidebar.links.length > 0) {
    fallback.push(
      createDefaultWidget("nav_menu", 0, {
        id: "wdg_sb_legacy_links",
        title: sidebar.title || "Hızlı Bağlantılar",
        settings: {
          links: sidebar.links.map((l: NavigationLink) => ({
            id: l.id,
            label: l.label,
            href: l.href,
            icon: l.icon,
            badge: l.badge,
          })),
        },
      })
    );
  }
  return fallback;
}

/**
 * Footer yapılandırmasından sütun bazlı widget listesini çözer.
 * Eski kayıtta `widgets` yoksa mevcut `columns` ve `showNewsletter` ayarlarını otomatik olarak widget yapısına dönüştürür.
 */
export function resolveFooterWidgets(
  footer?: FooterConfig | null,
  siteName = "NexPress",
  siteDna?: string | null
): SiteWidget[] {
  if (!footer) return [];
  if (Array.isArray(footer.widgets) && footer.widgets.length > 0) {
    return footer.widgets;
  }

  const widgets: SiteWidget[] = [
    createDefaultWidget("about_brand", 0, {
      id: "wdg_ft_brand",
      title: siteName,
      columnIndex: 0,
      settings: {
        subtitle: siteDna || "Yüksek performanslı, SEO ve dönüşüm odaklı kurumsal dijital platform.",
        phone: "+90 (212) 000 00 00",
        email: "iletisim@ornek.com",
        socials: {
          x: "https://x.com",
          linkedin: "https://linkedin.com",
          github: "https://github.com",
        },
      },
    }),
  ];

  if (footer.showNewsletter) {
    widgets.push(
      createDefaultWidget("newsletter", 0, {
        id: "wdg_ft_newsletter",
        columnIndex: 0,
      })
    );
  }

  const cols = footer.columns ?? [];
  if (cols.length > 0) {
    cols.slice(0, 3).forEach((col, idx) => {
      widgets.push(
        createDefaultWidget("nav_menu", idx + 1, {
          id: `wdg_ft_col_${col.id}`,
          title: col.title,
          columnIndex: Math.min(3, idx + 1),
          settings: {
            links: col.links.map((l, i) => ({
              id: `${col.id}_${i}`,
              label: l.label,
              href: l.href,
              badge: l.badge,
            })),
          },
        })
      );
    });
  } else {
    widgets.push(
      createDefaultWidget("categories", 1, { id: "wdg_ft_cats", columnIndex: 1 }),
      createDefaultWidget("recent_posts", 2, { id: "wdg_ft_posts", columnIndex: 2, settings: { count: 3, showThumbnail: false, showDate: true } }),
      createDefaultWidget("campaigns", 3, { id: "wdg_ft_camp", columnIndex: 3 })
    );
  }

  return widgets;
}

