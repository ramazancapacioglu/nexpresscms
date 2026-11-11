import { sanitizeInstalledFonts, type InstalledFont } from "./fonts";
import { sanitizeChromeSnapshot, sanitizeReadingSlug, sanitizeThemeChrome, type ChromeSnapshot } from "./reading";
import { sanitizePermalinkStructure, type PermalinkStructure } from "./permalinks";
import { sanitizeStylePresets, type StylePreset } from "./style-presets";
import type { ContentType } from "./types";
import { DEFAULT_CUSTOMIZER_SETTINGS, DEFAULT_SEO_SETTINGS } from "./site-settings-defaults";

export { DEFAULT_CUSTOMIZER_SETTINGS, DEFAULT_SEO_SETTINGS };

/** SEO sekmesinde tutulan şema kuralı. Kategori kuralı tür kuralından önce gelir. */
export interface SchemaPlacement {
  id: string;
  name: string;
  schemaType: string;
  scope: "page" | "post" | "category";
  category: string;
  enabled: boolean;
}

const SCHEMA_TYPES = new Set(["WebPage", "Article", "BlogPosting", "NewsArticle", "FAQPage", "QAPage", "AboutPage", "ContactPage", "Organization", "SoftwareApplication", "Service", "Product", "HowTo"]);

export function sanitizeSchemaPlacements(value: unknown): SchemaPlacement[] {
  if (!Array.isArray(value)) return [];
  const out: SchemaPlacement[] = [];
  for (const item of value.slice(0, 40)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) : "";
    const name = typeof row.name === "string" ? row.name.trim().slice(0, 80) : "";
    const schemaType = typeof row.schemaType === "string" && SCHEMA_TYPES.has(row.schemaType) ? row.schemaType : "";
    const scope = row.scope === "post" || row.scope === "category" || row.scope === "page" ? row.scope : "";
    const category = typeof row.category === "string" ? row.category.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80) : "";
    if (!id || !name || !schemaType || !scope) continue;
    if (scope === "category" && !category) continue;
    out.push({ id, name, schemaType, scope, category, enabled: row.enabled !== false });
  }
  return out;
}

/** İçeriğe uygulanacak şema kuralı. Özel şema türü (SSS, yazılım, hakkımızda) ezilmez. */
export function schemaPlacementFor(
  rules: SchemaPlacement[] | undefined,
  input: { type: string; schemaType: string; categories: string[] }
): SchemaPlacement | null {
  const generic = input.schemaType === "WebPage" || input.schemaType === "Article" || input.schemaType === "BlogPosting";
  if (!generic) return null;
  const list = rules ?? [];
  const byCategory = list.find((rule) => rule.enabled && rule.scope === "category" && input.categories.includes(rule.category));
  if (byCategory) return byCategory;
  const scope = input.type === "post" ? "post" : input.type === "page" ? "page" : "";
  return list.find((rule) => rule.enabled && rule.scope === scope) ?? null;
}

/**
 * SEO MOTORU AYARLARI — SEO bir eklenti değil, her kayıtta ve her render'da çalışan çekirdek motordur.
 * Bu ayarlar motorun otomatik üretim (meta, canonical, schema, yönlendirme) davranışını yönetir.
 */
export interface SeoEngineSettings {
  titleTemplate: string; // %title% | %site%
  homeTitleTemplate: string; // %site% — %tagline%
  separator: string;
  titleSeparator?: string;
  defaultMetaDescription?: string;
  descriptionFallback: "tldr" | "excerpt" | "content";
  defaultOgImage: string;
  twitterHandle: string;
  organizationName: string;
  organizationLogo: string;
  sameAs: string[];
  robotsTxtExtra: string;
  /**
   * Arama motoru indeksi. `false` iken tüm site `noindex`, site haritası boş
   * ve `robots.txt` siteyi kapatır. Kopya veya deneme sitesinde kapalı tutulur.
   * Kayıt yoksa açık sayılır.
   */
  searchIndexing?: boolean;
  /** Şema türünün hangi yüzeye uygulanacağı. İçeriğin kendi özel şeması durur. */
  schemaPlacements?: SchemaPlacement[];
  /** Bot kimliği (`KNOWN_BOTS[].id`) → robots.txt kararı. Kayıt yoksa `allow`. */
  botPolicy?: Record<string, "allow" | "block">;
  /** Arama konsolu site sahipliği doğrulama kodları (yalnızca içerik değeri, etiket değil) */
  verification?: { google?: string; bing?: string; yandex?: string };
  /** Arama motoru ve analitik API entegrasyon ayarları (GSC, GA4, Bing, Yandex) */
  integrations?: {
    gsc?: {
      clientId?: string;
      clientSecret?: string;
      refreshToken?: string;
      siteUrl?: string;
      enabled?: boolean;
      lastSync?: string;
    };
    ga4?: {
      propertyId?: string;
      measurementId?: string;
      enabled?: boolean;
      lastSync?: string;
    };
    bing?: {
      apiKey?: string;
      siteUrl?: string;
      enabled?: boolean;
      lastSync?: string;
    };
    yandex?: {
      token?: string;
      counterId?: string;
      enabled?: boolean;
      lastSync?: string;
    };
  };
  autoSchema: boolean; // Bloklardan FAQPage/HowTo/BreadcrumbList/Review otomatik türet
  autoSchemaFromBlocks?: boolean;
  autoCanonical: boolean;
  autoRedirectOnSlugChange: boolean; // Slug değişince eski URL'den otomatik 301
  autoDescription: boolean; // Boş meta description otomatik üretilir
  autoGenerateDescription?: boolean;
  enableLlmsTxt?: boolean;
  enableIndexNow?: boolean;
  noIndexTagArchives: boolean;
  sitemapTypes: ContentType[];
  minWordCount: number;
  /** Kalıcı bağlantı yapısı. Varsayılan `postname` (`/{slug}`). */
  permalinkStructure?: PermalinkStructure;
}

export type ButtonCase = "none" | "uppercase";

/**
 * NEXPRESS STUDIO TEMA ÖZELLEŞTİRİCİ AYARLARI (Customizer)
 */
export interface SiteCustomizerSettings {
  activePaletteId?: string;
  /** `auto`: ziyaretçinin işletim sistemi karanlık modu seçtiyse otomatik türetilmiş karanlık palet kullanılır (JS yok) */
  darkMode: "off" | "auto";
  /** Karanlık palette elle ezilen renkler (yalnızca geçerli hex) */
  darkColors: Record<string, string>;
  /** Adlandırılmış blok stil ön ayarları (en çok 50) */
  stylePresets: StylePreset[];
  typography: {
    headingWeight: number | string;
    bodyLineHeight: number | string;
    headingTransform: "none" | "uppercase";
    googleFonts: boolean;
    /** Sunucuya indirilmiş yazı tipleri (`@font-face` bunlardan üretilir). */
    fonts?: InstalledFont[];
  };
  layout: {
    contentLayout: "boxed" | "fullwidth";
    articleWidth: string;
    pagePaddingY: string;
    /** Varsayılan kenar çubuğu konumu: kapalı, sağ veya sol */
    sidebarPosition?: "none" | "right" | "left";
    /** Kenar çubuğu genişliği (ör: 260px, 300px, 340px) */
    sidebarWidth?: string;
    /** Hangi şablon türlerinde kenar çubuğu gösterilsin */
    sidebarOnBlog?: boolean;
    sidebarOnArchive?: boolean;
    sidebarOnPage?: boolean;
    sidebarOnShop?: boolean;
    sidebarOnSearch?: boolean;
    /** Hangi içerik türü için hangi kenar çubuğu alanı gösterilsin (varsayılan: blog, page, shop, archive, primary) */
    blogSidebarId?: string;
    pageSidebarId?: string;
    shopSidebarId?: string;
    archiveSidebarId?: string;
    searchSidebarId?: string;
  };
  buttons: {
    style?: "solid" | "pill" | "sharp";
    uppercase?: boolean;
    radius: string;
    paddingY: string;
    paddingX: string;
    textTransform: ButtonCase;
    fontWeight: number;
    shadow: boolean;
  };
  header: {
    sticky: boolean;
    glass: boolean;
    height: number;
    logoText: string;
    logoImage: string;
    showTagline: boolean;
    menuAlign: "left" | "center" | "right";
    showCta: boolean;
    ctaLabel: string;
    ctaHref: string;
    background: string;
    showBorder: boolean;
  };
  footer: {
    background: string;
    textColor: string;
    columns: 2 | 3 | 4;
    showBrand: boolean;
    copyright: string;
  };
  pageTitle: {
    align: "left" | "center";
    showBreadcrumbs: boolean;
    showBreadcrumb?: boolean;
    showMeta: boolean;
    showFeaturedImage: boolean;
    showCategories: boolean;
  };
  archive: {
    layout: "grid" | "list";
    columns: 2 | 3 | 4;
    showExcerpt: boolean;
    showImage: boolean;
  };
  /** Sayfa başına dönüş. Bağlantıdır; ziyaretçi sayfasına istemci kodu eklemez. */
  backToTop: {
    enabled: boolean;
    position: "left" | "right";
    icon: "arrow" | "chevron" | "corner";
    /** Düğme zemini. İkon beyazdır. */
    color: string;
    size: "sm" | "md" | "lg";
  };
  customCss: string;
  headerScripts?: string;
  footerScripts?: string;
}

/** Dil başına özelleştirilmiş site kimliği ve SEO başlık şablonu (`sites.settings.general.locales[locale]`). */
export interface LocalizedSiteIdentity {
  name?: string;
  tagline?: string;
  titleTemplate?: string;
  homeTitleTemplate?: string;
}

/** Genel site ayarları (`/admin/settings`). Kurum kimliği/sameAs SEO ayarlarındadır. */
export interface GeneralSettings {
  contactEmail: string;
  /** IANA saat dilimi, örn. Europe/Istanbul */
  timezone: string;
  /** Açıkken ziyaretçi sayfaları bakım metnini görür; panel ve oturum açıkken önizleme durur. */
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  /** İkincil diller için site adı, slogan ve SEO başlık şablonu */
  locales?: Record<string, LocalizedSiteIdentity>;
  /** Ziyaretçi ana sayfası. Boşsa tema yedeği (`ana-sayfa` veya tema demosu) kullanılır. */
  frontPageSlug?: string;
  /** Yazıların listelendiği sayfa. Boşsa ayrı blog sayfası yoktur. */
  postsPageSlug?: string;
  /** Yazılım Firması kabuğu uygulanmadan önceki şerit, menü ve yerleşim. */
  chromeSnapshot?: ChromeSnapshot | null;
  /**
   * Tema başına şerit düzeni: tema değişirken ayrılan temanın başlık/altlık/menü düzeni buraya yazılır,
   * temaya dönülünce geri gelir. Kayıt yoksa temanın hazır düzeni uygulanır.
   */
  themeChrome?: Record<string, ChromeSnapshot>;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  contactEmail: "",
  timezone: "Europe/Istanbul",
  maintenanceEnabled: false,
  maintenanceMessage: "",
  locales: {},
  frontPageSlug: "",
  postsPageSlug: "",
  chromeSnapshot: null,
  themeChrome: {},
};

/** E-posta gönderimi (SMTP). `password` veritabanında `secret-box` ile şifreli durur ve panele geri verilmez. */
export interface EmailSettings {
  enabled: boolean;
  host: string;
  port: number;
  /** true: örtük TLS (genelde 465); false: STARTTLS (587) */
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = { enabled: false, host: "", port: 587, secure: false, user: "", password: "", fromName: "", fromEmail: "" };

export interface SiteSettings {
  email: EmailSettings;
  seo: SeoEngineSettings;
  customizer: SiteCustomizerSettings;
  general: GeneralSettings;
}

/**
 * Verilen dil için etkin site adını, sloganı ve SEO başlık şablonlarını çözer;
 * o dilde özel değer yoksa sitenin varsayılan değerlerine düşer.
 */
export function resolveLocalizedSiteIdentity(
  site: { name?: string | null; tagline?: string | null; settings?: unknown } | null | undefined,
  locale: string
): { name: string; tagline: string; seo: SeoEngineSettings } {
  const settings = resolveSiteSettings(site?.settings);
  const loc = settings.general.locales?.[locale.toLowerCase()];
  const name = (loc?.name?.trim() || site?.name || "NexPress CMS").trim();
  const tagline = (loc?.tagline?.trim() ?? site?.tagline ?? "").trim();
  const seo: SeoEngineSettings = {
    ...settings.seo,
    ...(loc?.titleTemplate?.trim() ? { titleTemplate: loc.titleTemplate.trim() } : {}),
    ...(loc?.homeTitleTemplate?.trim() ? { homeTitleTemplate: loc.homeTitleTemplate.trim() } : {}),
  };
  return { name, tagline, seo };
}

function sanitizeBackToTop(raw: unknown): SiteCustomizerSettings["backToTop"] {
  const base = DEFAULT_CUSTOMIZER_SETTINGS.backToTop;
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const color = typeof o.color === "string" && /^#[0-9a-fA-F]{6}$/.test(o.color) ? o.color.toLowerCase() : base.color;
  return {
    enabled: o.enabled === true,
    position: o.position === "left" ? "left" : "right",
    icon: o.icon === "chevron" || o.icon === "corner" ? o.icon : "arrow",
    color,
    size: o.size === "sm" || o.size === "lg" ? o.size : "md",
  };
}

function mergeSection<T extends object>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return { ...base };
  return { ...base, ...(override as Partial<T>) };
}

/**
 * Veritabanındaki ham `sites.settings` JSON'unu eksik anahtarları varsayılanlarla doldurarak çözer.
 */
export function resolveSiteSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.customizer && typeof r.customizer === "object" ? r.customizer : {}) as Record<
    string,
    unknown
  >;
  const d = DEFAULT_CUSTOMIZER_SETTINGS;
  const seoRaw = (r.seo && typeof r.seo === "object" ? r.seo : {}) as Record<string, unknown>;
  const generalRaw = (r.general && typeof r.general === "object" ? r.general : {}) as Record<string, unknown>;
  return {
    seo: {
      ...mergeSection(DEFAULT_SEO_SETTINGS, r.seo),
      schemaPlacements: sanitizeSchemaPlacements(seoRaw.schemaPlacements),
      permalinkStructure: sanitizePermalinkStructure(seoRaw.permalinkStructure),
    },
    general: {
      ...mergeSection(DEFAULT_GENERAL_SETTINGS, r.general),
      frontPageSlug: sanitizeReadingSlug(generalRaw.frontPageSlug),
      postsPageSlug: sanitizeReadingSlug(generalRaw.postsPageSlug),
      chromeSnapshot: sanitizeChromeSnapshot(generalRaw.chromeSnapshot),
      themeChrome: sanitizeThemeChrome(generalRaw.themeChrome),
    },
    email: mergeSection(DEFAULT_EMAIL_SETTINGS, r.email),
    customizer: {
      ...(typeof c.activePaletteId === "string" ? { activePaletteId: c.activePaletteId } : { activePaletteId: d.activePaletteId }),
      darkMode: c.darkMode === "auto" ? "auto" : "off",
      darkColors: Object.fromEntries(Object.entries((c.darkColors && typeof c.darkColors === "object" ? c.darkColors : {}) as Record<string, unknown>).filter(([, v]) => typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v))) as Record<string, string>,
      stylePresets: sanitizeStylePresets(c.stylePresets),
      typography: { ...mergeSection(d.typography, c.typography), fonts: sanitizeInstalledFonts((c.typography as { fonts?: unknown } | undefined)?.fonts) },
      layout: mergeSection(d.layout, c.layout),
      buttons: mergeSection(d.buttons, c.buttons),
      header: mergeSection(d.header, c.header),
      footer: mergeSection(d.footer, c.footer),
      pageTitle: mergeSection(d.pageTitle, c.pageTitle),
      archive: mergeSection(d.archive, c.archive),
      backToTop: sanitizeBackToTop(c.backToTop),
      customCss: typeof c.customCss === "string" ? c.customCss : d.customCss,
      headerScripts: typeof c.headerScripts === "string" ? c.headerScripts : "",
      footerScripts: typeof c.footerScripts === "string" ? c.footerScripts : "",
    },
  };
}

/**
 * İçeriğin `schemaAttributes.publishing` altında sakladığı yayın ayarlarını güvenli biçimde çözer.
 */
export interface ResolvedPublishing {
  visibility: "public" | "password" | "members_only" | "private";
  accessPassword: string;
  password?: string;
  scheduledAt: string;
  authorName?: string;
  categories: string[];
  tags: string[];
  allowComments: boolean;
  allowReviews: boolean;
  showShareBar: boolean;
  showShareButtons: boolean;
  /** Sayfa gövdesinde öne çıkan görsel. Kayıt yoksa gösterilir. */
  showFeaturedImage: boolean;
  /** Üst sayfa (`contents.id`). */
  parentId?: string;
  /** Bu sayfa bir sütun sayfasıdır; alt sayfalar altında listelenir. */
  pillar: boolean;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  featuredImageMeta: {
    url: string;
    altText: string;
    titleText: string;
    caption: string;
    loadingPriority: "eager" | "lazy";
  };
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
  noFollow: boolean;
  slugHistory: string[];
}

export function resolvePublishing(
  schemaAttributes: Record<string, unknown> | null | undefined
): ResolvedPublishing {
  const attrs = schemaAttributes ?? {};
  const pub = ((attrs._publishing ?? attrs.publishing) ?? {}) as Record<string, any>;
  const seo = (attrs.seo ?? {}) as Record<string, any>;
  const img = (pub.featuredImageMeta ?? {}) as Record<string, any>;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const imgUrl = String(pub.featuredImageUrl ?? img.url ?? "");
  const imgAlt = String(pub.featuredImageAlt ?? img.altText ?? "");
  const imgCaption = String(pub.featuredImageCaption ?? img.caption ?? "");
  const pwd = String(pub.password ?? pub.accessPassword ?? "");
  const share =
    pub.showShareButtons !== undefined
      ? pub.showShareButtons !== false
      : pub.showShareBar !== false;

  return {
    visibility: (pub.visibility as ResolvedPublishing["visibility"]) ?? "public",
    accessPassword: pwd,
    password: pwd,
    scheduledAt: String(pub.scheduledAt ?? ""),
    authorName: String(pub.authorName ?? "Baş Mimari Ekibi"),
    categories: strArr(pub.categories),
    tags: strArr(pub.tags),
    allowComments: pub.allowComments !== false,
    allowReviews: pub.allowReviews !== false,
    showShareBar: share,
    showShareButtons: share,
    showFeaturedImage: pub.showFeaturedImage !== false,
    parentId: typeof pub.parentId === "string" && pub.parentId.startsWith("cnt_") ? pub.parentId : undefined,
    pillar: pub.pillar === true,
    featuredImageUrl: imgUrl || undefined,
    featuredImageAlt: imgAlt || undefined,
    featuredImageCaption: imgCaption || undefined,
    featuredImageMeta: {
      url: imgUrl,
      altText: imgAlt,
      titleText: String(img.titleText ?? imgAlt),
      caption: imgCaption,
      loadingPriority: img.loadingPriority === "lazy" ? "lazy" : "eager",
    },
    focusKeyword: String(pub.focusKeyword ?? seo.focusKeyword ?? ""),
    ogTitle: String(seo.ogTitle ?? ""),
    ogDescription: String(seo.ogDescription ?? ""),
    noFollow: seo.noFollow === true,
    slugHistory: strArr(attrs.slugHistory),
  };
}
