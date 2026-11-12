import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
  BlockNode,
  ContentStatus,
  ContentType,
  DesignTokens,
  FooterConfig,
  HeaderConfig,
  NavigationMenuItem,
  SidebarConfig,
  SiteProfile,
} from "@nexpress/core";

/**
 * 1. SITES (SQLite / LibSQL Sıfır-Docker Şeması)
 */
export const sqliteSites = sqliteTable(
  "sites",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    domain: text("domain").notNull(),
    subdomain: text("subdomain"),
    siteProfile: text("site_profile").$type<SiteProfile>().default("corporate").notNull(),
    defaultLocale: text("default_locale").default("tr").notNull(),
    supportedLocales: text("supported_locales", { mode: "json" })
      .$type<string[]>()
      .default(["tr"])
      .notNull(),
    activeThemeId: text("active_theme_id").default("corporate-aurora").notNull(),
    designTokens: text("design_tokens", { mode: "json" }).$type<DesignTokens>().notNull(),
    brandVoice: text("brand_voice", { mode: "json" }).$type<Record<string, unknown>>().default({}),
    siteDna: text("site_dna"),
    styleExamples: text("style_examples", { mode: "json" })
      .$type<Array<Record<string, unknown>>>()
      .default([]),
    localSeo: text("local_seo", { mode: "json" }).$type<Record<string, unknown>>().default({}),
    settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>().default({}),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("sites_site_id_idx").on(t.siteId),
    uniqueIndex("sites_domain_uidx").on(t.domain),
  ]
);

/**
 * 2. NAVIGATION LAYOUTS
 */
export const sqliteNavigationLayouts = sqliteTable(
  "navigation_layouts",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    locale: text("locale").default("tr").notNull(),
    headerConfig: text("header_config", { mode: "json" }).$type<HeaderConfig>().notNull(),
    menuItems: text("menu_items", { mode: "json" }).$type<NavigationMenuItem[]>().notNull(),
    footerConfig: text("footer_config", { mode: "json" }).$type<FooterConfig>().notNull(),
    sidebarConfig: text("sidebar_config", { mode: "json" }).$type<SidebarConfig | null>(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("nav_layouts_site_id_idx").on(t.siteId),
    uniqueIndex("nav_layouts_site_locale_uidx").on(t.siteId, t.locale),
  ]
);

/**
 * 3. CONTENTS
 */
export const sqliteContents = sqliteTable(
  "contents",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    type: text("type").$type<ContentType>().default("page").notNull(),
    status: text("status").$type<ContentStatus>().default("published").notNull(),
    importanceScore: integer("importance_score").default(5).notNull(),
    schemaType: text("schema_type").default("WebPage").notNull(),
    schemaAttributes: text("schema_attributes", { mode: "json" })
      .$type<Record<string, unknown>>()
      .default({}),
    featuredImage: text("featured_image"),
    authorName: text("author_name").default("Sistem Editörü").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("contents_site_id_idx").on(t.siteId),
    index("contents_site_type_status_idx").on(t.siteId, t.type, t.status),
  ]
);

/**
 * 4. CONTENT TRANSLATIONS
 */
export const sqliteContentTranslations = sqliteTable(
  "content_translations",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => sqliteContents.id, { onDelete: "cascade" }),
    locale: text("locale").default("tr").notNull(),
    region: text("region").default("TR").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    tldr: text("tldr"),
    blocks: text("blocks", { mode: "json" }).$type<BlockNode[]>().default([]).notNull(),
    markdownCache: text("markdown_cache").default("").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: integer("no_index", { mode: "boolean" }).default(false).notNull(),
    seoScore: integer("seo_score").default(85).notNull(),
    gapFindings: text("gap_findings", { mode: "json" }).$type<string[]>().default([]).notNull(),
    descriptionSource: text("description_source").default("human").notNull(),
    /** Çeviri yayın durumu: yayında görünmesi için içeriğin durumu VE bu alan `published` olmalı */
    translationStatus: text("translation_status").default("published").notNull(),
    /** Çeviri başka bir dilden üretildiyse kaynak dil ve o andaki kaynak özeti (kaynak değişti tespiti) */
    sourceLocale: text("source_locale"),
    sourceHash: text("source_hash"),
    /** Çeviriye özgü yayın öznitelikleri (öne çıkan görsel alt/başlık, odak anahtar kelime, slug geçmişi); `_localized: true` ise içerik satırındakilerin yerine geçer */
    attributes: text("attributes", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("content_trans_site_id_idx").on(t.siteId),
    uniqueIndex("content_trans_site_locale_slug_uidx").on(t.siteId, t.locale, t.slug),
    index("content_trans_content_id_idx").on(t.contentId),
  ]
);

/**
 * 5. CONTENT ENTITY LINKS
 */
export const sqliteContentEntityLinks = sqliteTable(
  "content_entity_links",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    sourceContentId: text("source_content_id")
      .notNull()
      .references(() => sqliteContents.id, { onDelete: "cascade" }),
    targetContentId: text("target_content_id")
      .notNull()
      .references(() => sqliteContents.id, { onDelete: "cascade" }),
    relationType: text("relation_type").default("mentions").notNull(),
    anchorText: text("anchor_text"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("entity_links_site_id_idx").on(t.siteId),
    index("entity_links_source_idx").on(t.siteId, t.sourceContentId),
  ]
);

/**
 * 6. INSTALLED THEMES
 */
export const sqliteInstalledThemes = sqliteTable(
  "installed_themes",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    themeId: text("theme_id").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
    customTokens: text("custom_tokens", { mode: "json" })
      .$type<Partial<DesignTokens>>()
      .default({}),
    /** official: kodda tanımlı resmi tema; uploaded: `.nxtheme` paketinden yüklenen veri teması */
    source: text("source").default("official").notNull(),
    name: text("name").default("").notNull(),
    version: text("version").default("").notNull(),
    author: text("author").default("").notNull(),
    tagline: text("tagline").default("").notNull(),
    description: text("description").default("").notNull(),
    recommendedProfile: text("recommended_profile").default("corporate").notNull(),
    /** Paketin temel tasarım token'ları (özelleştirmeden bağımsız; dışa aktarma ve sıfırlama için) */
    packageTokens: text("package_tokens", { mode: "json" }).$type<DesignTokens | null>(),
    /** Doğrulanmış ve kapsamlanmış `skins.css` */
    css: text("css").default("").notNull(),
    /** Paketteki özgün (kapsamlanmamış) CSS: dışa aktarma bununla yapılır */
    rawCss: text("raw_css").default("").notNull(),
    header: text("header", { mode: "json" }).$type<Record<string, unknown> | null>(),
    footer: text("footer", { mode: "json" }).$type<Record<string, unknown> | null>(),
    pages: text("pages", { mode: "json" }).$type<Array<Record<string, unknown>>>().default([]).notNull(),
    screenshot: text("screenshot"),
    checksum: text("checksum").default("").notNull(),
    installedAt: integer("installed_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("installed_themes_site_id_idx").on(t.siteId),
    uniqueIndex("installed_themes_site_theme_uidx").on(t.siteId, t.themeId),
  ]
);

/**
 * 7. CONTENT CHUNKS
 */
export const sqliteContentChunks = sqliteTable(
  "content_chunks",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => sqliteContents.id, { onDelete: "cascade" }),
    locale: text("locale").default("tr").notNull(),
    chunkIndex: integer("chunk_index").default(0).notNull(),
    headingPath: text("heading_path"),
    chunkText: text("chunk_text").notNull(),
    chunkHash: text("chunk_hash"),
    embeddingModel: text("embedding_model"),
    wordCount: integer("word_count").default(0).notNull(),
    embeddingJson: text("embedding_json"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("content_chunks_site_id_idx").on(t.siteId),
    index("content_chunks_content_idx").on(t.siteId, t.contentId),
    index("content_chunks_model_idx").on(t.siteId, t.embeddingModel),
  ]
);

/**
 * 8. TAXONOMIES (SQLite / LibSQL)
 */
export const sqliteTaxonomies = sqliteTable(
  "taxonomies",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    taxonomyType: text("taxonomy_type").default("category").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    color: text("color").default("#266DF0"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    /** Bu terimin arşiv sayfası için seçilen şablon (`type: "template"` içerik kimliği); boşsa türün varsayılan şablonu */
    templateId: text("template_id"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    itemCount: integer("item_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("taxonomies_site_id_idx").on(t.siteId),
    uniqueIndex("taxonomies_site_type_slug_uidx").on(t.siteId, t.taxonomyType, t.slug),
  ]
);

/**
 * 9. MEDIA ASSETS (SQLite / LibSQL)
 */
export const sqliteMediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type").default("image/webp").notNull(),
    width: integer("width").default(1200).notNull(),
    height: integer("height").default(630).notNull(),
    sizeBytes: integer("size_bytes").default(84000).notNull(),
    altText: text("alt_text").default("").notNull(),
    titleText: text("title_text"),
    caption: text("caption"),
    /** Uzun açıklama (WordPress "Açıklama"): belge/video/ses sayfası ve arama için */
    description: text("description"),
    /** `image` | `document` | `video` | `audio`; görsel olmayanlar `/media/{id}/{ad}.{uzantı}` ile sunulur */
    kind: text("kind").$type<"image" | "document" | "video" | "audio">().default("image").notNull(),
    focalPoint: text("focal_point", { mode: "json" })
      .$type<{ x: number; y: number }>()
      .default({ x: 50, y: 50 }),
    seoScore: integer("seo_score").default(95).notNull(),
    /** Klasör (`media_folders.id`); boşsa kök */
    folderId: text("folder_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("media_assets_site_id_idx").on(t.siteId), index("media_assets_folder_idx").on(t.siteId, t.folderId)]
);

/**
 * 10. COMMENTS & REVIEWS (SQLite / LibSQL)
 */
export const sqliteCommentsReviews = sqliteTable(
  "comments_reviews",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => sqliteContents.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    entryType: text("entry_type").default("review").notNull(),
    rating: integer("rating").default(5).notNull(),
    title: text("title"),
    body: text("body").notNull(),
    pros: text("pros", { mode: "json" }).$type<string[]>().default([]),
    cons: text("cons", { mode: "json" }).$type<string[]>().default([]),
    status: text("status").default("approved").notNull(),
    isVerified: integer("is_verified", { mode: "boolean" }).default(true).notNull(),
    parentId: text("parent_id"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("comments_reviews_site_id_idx").on(t.siteId),
    index("comments_reviews_content_idx").on(t.siteId, t.contentId),
    index("comments_reviews_parent_idx").on(t.siteId, t.parentId),
  ]
);

/**
 * 11. COMMERCE — Ürün kataloğu, siparişler ve kalemler
 */
export const sqliteCommerceProducts = sqliteTable(
  "commerce_products",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id"),
    sku: text("sku").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description").default("").notNull(),
    descriptionHtml: text("description_html").default("").notNull(),
    priceCents: integer("price_cents").default(0).notNull(),
    compareAtCents: integer("compare_at_cents"),
    currency: text("currency").default("TRY").notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    stockStatus: text("stock_status").default("instock").notNull(),
    status: text("status").default("draft").notNull(),
    imageUrl: text("image_url"),
    galleryUrls: text("gallery_urls", { mode: "json" }).$type<string[]>().default([]),
    productKind: text("product_kind").default("simple").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("commerce_products_site_id_idx").on(t.siteId),
    index("commerce_products_slug_idx").on(t.siteId, t.slug),
    index("commerce_products_sku_idx").on(t.siteId, t.sku),
  ]
);

export const sqliteCommerceOrders = sqliteTable(
  "commerce_orders",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    orderNumber: text("order_number").notNull(),
    status: text("status").default("pending").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),
    shippingAddress: text("shipping_address", { mode: "json" })
      .$type<Record<string, string>>()
      .notNull(),
    billingAddress: text("billing_address", { mode: "json" }).$type<Record<string, string> | null>(),
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    shippingCents: integer("shipping_cents").default(0).notNull(),
    taxCents: integer("tax_cents").default(0).notNull(),
    totalCents: integer("total_cents").default(0).notNull(),
    currency: text("currency").default("TRY").notNull(),
    customerNote: text("customer_note"),
    source: text("source").default("site").notNull(),
    channelId: text("channel_id"),
    customerId: text("customer_id"),
    couponCode: text("coupon_code"),
    discountCents: integer("discount_cents").default(0).notNull(),
    shippingMethodId: text("shipping_method_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("commerce_orders_site_id_idx").on(t.siteId),
    index("commerce_orders_number_idx").on(t.siteId, t.orderNumber),
  ]
);

export const sqliteCommerceOrderItems = sqliteTable(
  "commerce_order_items",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    orderId: text("order_id")
      .notNull()
      .references(() => sqliteCommerceOrders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull(),
    title: text("title").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    unitPriceCents: integer("unit_price_cents").default(0).notNull(),
    lineTotalCents: integer("line_total_cents").default(0).notNull(),
  },
  (t) => [
    index("commerce_order_items_site_id_idx").on(t.siteId),
    index("commerce_order_items_order_idx").on(t.siteId, t.orderId),
  ]
);

export const sqliteCommerceCategories = sqliteTable(
  "commerce_categories",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    parentId: text("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("commerce_categories_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceProductCategories = sqliteTable(
  "commerce_product_categories",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    productId: text("product_id").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (t) => [index("commerce_product_categories_site_idx").on(t.siteId, t.productId)]
);

export const sqliteCommerceAttributes = sqliteTable(
  "commerce_attributes",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [index("commerce_attributes_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceAttributeValues = sqliteTable(
  "commerce_attribute_values",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    attributeId: text("attribute_id").notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("commerce_attribute_values_site_idx").on(t.siteId, t.attributeId)]
);

export const sqliteCommerceVariants = sqliteTable(
  "commerce_variants",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull(),
    priceCents: integer("price_cents").default(0).notNull(),
    compareAtCents: integer("compare_at_cents"),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    valueIds: text("value_ids", { mode: "json" }).$type<string[]>().default([]).notNull(),
    imageUrl: text("image_url"),
  },
  (t) => [index("commerce_variants_site_product_idx").on(t.siteId, t.productId)]
);

export const sqliteCommerceCustomerGroups = sqliteTable(
  "commerce_customer_groups",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
  },
  (t) => [index("commerce_customer_groups_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceCustomers = sqliteTable(
  "commerce_customers",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    source: text("source").default("site").notNull(),
    channelId: text("channel_id"),
    externalKey: text("external_key"),
    name: text("name").notNull(),
    email: text("email").default("").notNull(),
    phone: text("phone"),
    groupId: text("group_id"),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("commerce_customers_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceLoyaltyEntries = sqliteTable(
  "commerce_loyalty_entries",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    customerId: text("customer_id").notNull(),
    points: integer("points").default(0).notNull(),
    reason: text("reason").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("commerce_loyalty_site_idx").on(t.siteId, t.customerId)]
);

export const sqliteCommerceCampaigns = sqliteTable(
  "commerce_campaigns",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    discountType: text("discount_type").default("percent").notNull(),
    value: integer("value").default(0).notNull(),
    audience: text("audience").default("all").notNull(),
    groupId: text("group_id"),
    customerId: text("customer_id"),
    active: integer("active", { mode: "boolean" }).default(true).notNull(),
    startsAt: integer("starts_at", { mode: "timestamp" }),
    endsAt: integer("ends_at", { mode: "timestamp" }),
  },
  (t) => [index("commerce_campaigns_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceCoupons = sqliteTable(
  "commerce_coupons",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    campaignId: text("campaign_id"),
    code: text("code").notNull(),
    discountType: text("discount_type").default("percent").notNull(),
    value: integer("value").default(0).notNull(),
    customerId: text("customer_id"),
    groupId: text("group_id"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").default(0).notNull(),
    active: integer("active", { mode: "boolean" }).default(true).notNull(),
  },
  (t) => [index("commerce_coupons_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceReturns = sqliteTable(
  "commerce_returns",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    source: text("source").default("site").notNull(),
    orderId: text("order_id").notNull(),
    orderNumber: text("order_number").notNull(),
    kind: text("kind").default("return").notNull(),
    status: text("status").default("requested").notNull(),
    reason: text("reason").default("").notNull(),
    note: text("note").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("commerce_returns_site_id_idx").on(t.siteId)]
);

export const sqliteCommerceShippingMethods = sqliteTable(
  "commerce_shipping_methods",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    carrier: text("carrier").default("").notNull(),
    flatRateCents: integer("flat_rate_cents").default(0).notNull(),
    freeThresholdCents: integer("free_threshold_cents").default(0).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  },
  (t) => [index("commerce_shipping_methods_site_id_idx").on(t.siteId)]
);

/**
 * 12. MARKETPLACE — Pazar yeri kanalları, iş günlüğü ve dış siparişler
 */
export const sqliteMarketplaceChannels = sqliteTable(
  "marketplace_channels",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    driverId: text("driver_id").notNull(),
    label: text("label").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    environment: text("environment").default("sandbox").notNull(),
    credentials: text("credentials", { mode: "json" }).$type<Record<string, string>>().default({}).notNull(),
    connectionStatus: text("connection_status").default("unknown").notNull(),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
    lastError: text("last_error"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("marketplace_channels_site_id_idx").on(t.siteId)]
);

export const sqliteMarketplaceJobs = sqliteTable(
  "marketplace_jobs",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    channelId: text("channel_id")
      .notNull()
      .references(() => sqliteMarketplaceChannels.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    message: text("message").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("marketplace_jobs_site_id_idx").on(t.siteId),
    index("marketplace_jobs_channel_idx").on(t.siteId, t.channelId),
  ]
);

export const sqliteMarketplaceOrders = sqliteTable(
  "marketplace_orders",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    channelId: text("channel_id")
      .notNull()
      .references(() => sqliteMarketplaceChannels.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    status: text("status").default("").notNull(),
    buyerName: text("buyer_name").default("").notNull(),
    currency: text("currency").default("TRY").notNull(),
    total: integer("total_cents").default(0).notNull(),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    orderedAt: integer("ordered_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("marketplace_orders_site_id_idx").on(t.siteId),
    index("marketplace_orders_external_idx").on(t.siteId, t.channelId, t.externalId),
  ]
);

export const sqliteUsers = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    email: text("email").notNull(),
    name: text("name").default("").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"admin" | "editor" | "author" | "contributor">().default("editor").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    sessionVersion: integer("session_version").default(0).notNull(),
    /** Panel arayüz dili (boşsa Türkçe); içerik dilinden bağımsızdır */
    uiLocale: text("ui_locale"),
    status: text("status").$type<"active" | "disabled">().default("active").notNull(),
    passwordChangedAt: integer("password_changed_at", { mode: "timestamp" }),
    /** İki adımlı doğrulama: `secret-box` ile şifreli TOTP anahtarı; `totpEnabledAt` doluysa giriş ikinci adım ister */
    totpSecret: text("totp_secret"),
    totpEnabledAt: integer("totp_enabled_at", { mode: "timestamp" }),
    /** Son kabul edilen TOTP adımı (aynı kodun yeniden kullanımını engeller) */
    totpLastStep: integer("totp_last_step"),
    /** Kurtarma kodu SHA-256 özetleri (JSON dizi) */
    recoveryCodes: text("recovery_codes"),
  },
  (t) => [
    index("users_site_id_idx").on(t.siteId),
    uniqueIndex("users_site_email_uq").on(t.siteId, t.email),
  ]
);

export const sqliteBotDailyStats = sqliteTable(
  "bot_daily_stats",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    day: text("day").notNull(),
    botId: text("bot_id").notNull(),
    kind: text("kind").notNull(),
    trust: text("trust").$type<"verified" | "claimed">().notNull(),
    hits: integer("hits").default(0).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("bot_daily_stats_site_day_idx").on(t.siteId, t.day)]
);

export const sqliteAuditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    // Milisaniye: aynı saniyedeki kayıtların sırası korunur
    at: integer("at", { mode: "timestamp_ms" }).notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email").default("").notNull(),
    action: text("action").notNull(),
    target: text("target"),
    detail: text("detail").default("").notNull(),
    ip: text("ip").default("").notNull(),
  },
  (t) => [index("audit_log_site_at_idx").on(t.siteId, t.at)]
);

export const sqliteContentRevisions = sqliteTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id").notNull(),
    locale: text("locale").default("tr").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    authorId: text("author_id"),
    authorEmail: text("author_email").default("").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    /** İçeriğin geri yüklenebilir tam görüntüsü (blok ağacı, meta, yayın öznitelikleri) */
    snapshot: text("snapshot", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    /** Aynı görüntüyü iki kez saklamamak için özet */
    snapshotHash: text("snapshot_hash").notNull(),
    blockCount: integer("block_count").default(0).notNull(),
    wordCount: integer("word_count").default(0).notNull(),
  },
  (t) => [
    index("content_revisions_site_id_idx").on(t.siteId),
    index("content_revisions_content_idx").on(t.siteId, t.contentId, t.locale, t.createdAt),
  ]
);

/**
 * EKLENTİ DURUMU — kiracı başına eklenti açık/kapalı, modül anahtarları ve ayarlar.
 * Satır yoksa manifest varsayılanları geçerlidir.
 */
export const sqliteSitePlugins = sqliteTable(
  "site_plugins",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    pluginId: text("plugin_id").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    modules: text("modules", { mode: "json" }).$type<Record<string, boolean>>().default({}).notNull(),
    settings: text("settings", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    licenseKey: text("license_key"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("site_plugins_site_id_idx").on(t.siteId),
    uniqueIndex("site_plugins_site_plugin_uidx").on(t.siteId, t.pluginId),
  ]
);

/**
 * VERİ EKLENTİLERİ — panelden yüklenen `.nxplugin` paketleri. Paket kod çalıştırmaz: özel içerik türü tanımları,
 * başlangıç sayfaları ve giden webhook bildirimleri içerir. Kiracı başına; `enabled` açıkça verilen izinle açılır.
 */
export const sqliteDataPlugins = sqliteTable(
  "data_plugins",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    pluginId: text("plugin_id").notNull(),
    name: text("name").default("").notNull(),
    version: text("version").default("").notNull(),
    vendor: text("vendor").default("").notNull(),
    description: text("description").default("").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
    manifest: text("manifest", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    contentTypes: text("content_types", { mode: "json" }).$type<Array<Record<string, unknown>>>().default([]).notNull(),
    pages: text("pages", { mode: "json" }).$type<Array<Record<string, unknown>>>().default([]).notNull(),
    webhooks: text("webhooks", { mode: "json" }).$type<Array<Record<string, unknown>>>().default([]).notNull(),
    /** verified | signed-untrusted | unsigned */
    signature: text("signature").default("unsigned").notNull(),
    publisherKey: text("publisher_key").default("").notNull(),
    checksum: text("checksum").default("").notNull(),
    /** Webhook HMAC sırrı (`secret-box` ile şifreli) */
    webhookSecret: text("webhook_secret").default("").notNull(),
    lastDelivery: text("last_delivery", { mode: "json" }).$type<Record<string, unknown> | null>(),
    installedAt: integer("installed_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("data_plugins_site_id_idx").on(t.siteId),
    uniqueIndex("data_plugins_site_plugin_uidx").on(t.siteId, t.pluginId),
  ]
);

/**
 * ZİYARETÇİ ÜYELERİ — `members_only` içeriği açan parolasız (e-posta bağlantılı) hesaplar. Panel kullanıcılarından ayrıdır
 * (`users`). Yalnızca e-posta, ad ve onay zamanı tutulur (veri azaltma); silme gerçek silmedir.
 */
export const sqliteMembers = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    email: text("email").notNull(),
    name: text("name").default("").notNull(),
    /** active | pending (e-posta doğrulanmadı) | disabled */
    status: text("status").default("pending").notNull(),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
    /** Giriş bağlantısı sırası: yeni bağlantı/kullanım artırır (yalnızca en son bağlantı, tek kullanım). */
    linkSeq: integer("link_seq").default(0).notNull(),
    /** Oturum sürümü: çıkış-tümü, devre dışı bırakma ve silme çerezleri düşürür. */
    sessionVersion: integer("session_version").default(0).notNull(),
    /** Üyelik kademesi (`general.membership.tiers` kimliği); boş = kademesiz üye */
    tier: text("tier").default("").notNull(),
    /** Aydınlatma metni onayı (KVKK) */
    consentAt: integer("consent_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("members_site_id_idx").on(t.siteId),
    uniqueIndex("members_site_email_uidx").on(t.siteId, t.email),
  ]
);

/**
 * EKLENTİ WEBHOOK TESLİMATLARI — giden bildirimlerin kalıcı kuyruğu. Başarısız gönderim üstel bekleme ile yeniden denenir
 * (zamanlayıcı); `id` her denemede aynıdır (`X-NexPress-Delivery`), alıcı tekrarı eler.
 */
export const sqlitePluginDeliveries = sqliteTable(
  "plugin_deliveries",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    pluginId: text("plugin_id").notNull(),
    webhookId: text("webhook_id").notNull(),
    event: text("event").notNull(),
    /** Gönderilecek JSON gövde (içerik metni ve kişisel veri içermez) */
    body: text("body").notNull(),
    /** pending | delivered | failed */
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }).notNull(),
    lastStatus: integer("last_status"),
    lastError: text("last_error").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("plugin_deliveries_site_id_idx").on(t.siteId),
    index("plugin_deliveries_due_idx").on(t.siteId, t.status, t.nextAttemptAt),
    index("plugin_deliveries_plugin_idx").on(t.siteId, t.pluginId, t.createdAt),
  ]
);

/**
 * AJAN TALEPLERİ — yapay zeka ajanlarının MCP üzerinden bıraktığı teklif / destek / demo talepleri.
 * Kişisel veri içerir (e-posta, telefon): yönetici panelinden yönetilir, ön yüzde gösterilmez.
 */
export const sqliteAgentRequests = sqliteTable(
  "agent_requests",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    /** lead | ticket | demo */
    kind: text("kind").notNull(),
    /** new | handled */
    status: text("status").default("new").notNull(),
    name: text("name").default("").notNull(),
    email: text("email").default("").notNull(),
    phone: text("phone").default("").notNull(),
    company: text("company").default("").notNull(),
    message: text("message").default("").notNull(),
    productSlug: text("product_slug").default("").notNull(),
    /** Çağıran ajanın bildirdiği ad (UA/başlık), serbest metin */
    agent: text("agent").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("agent_requests_site_id_idx").on(t.siteId),
    index("agent_requests_status_idx").on(t.siteId, t.status, t.createdAt),
  ]
);

/** YAPAY ZEKA YÖNLENDİRMELERİ — ChatGPT, Perplexity vb. kaynaklardan gelen insan ziyaretlerinin günlük sayacı (IP/UA saklanmaz). */
export const sqliteAiReferralDaily = sqliteTable(
  "ai_referral_daily",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    day: text("day").notNull(),
    source: text("source").notNull(),
    path: text("path").default("/").notNull(),
    hits: integer("hits").default(0).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("ai_referral_daily_site_id_idx").on(t.siteId),
    index("ai_referral_daily_day_idx").on(t.siteId, t.day),
  ]
);

/** YÖNLENDİRMELER — elle yönetilen 301/302/307/308 kuralları (slug geçmişi otomatik 301'i ayrıdır). */
export const sqliteRedirects = sqliteTable(
  "redirects",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    code: integer("code").default(301).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    hits: integer("hits").default(0).notNull(),
    note: text("note").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    lastHitAt: integer("last_hit_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("redirects_site_id_idx").on(t.siteId),
    uniqueIndex("redirects_site_from_uidx").on(t.siteId, t.fromPath),
  ]
);

/** 404 İZLEYİCİ — bulunamayan ziyaretçi yolları (sorgu/çapa yok; yalnızca sayaç ve son yönlendiren alan adı). */
export const sqliteNotFoundLog = sqliteTable(
  "not_found_log",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    path: text("path").notNull(),
    hits: integer("hits").default(0).notNull(),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
    lastReferrer: text("last_referrer").default("").notNull(),
    ignored: integer("ignored", { mode: "boolean" }).default(false).notNull(),
  },
  (t) => [
    index("not_found_log_site_id_idx").on(t.siteId),
    index("not_found_log_hits_idx").on(t.siteId, t.hits),
  ]
);

/**
 * FORM GÖNDERİMLERİ — ziyaretçi formlarının (form_block) gelen kutusu. Kişisel veri içerir; yalnızca panelde görünür.
 * IP saklanmaz: günlük tuzlanmış özet (`ipHash`) yalnızca hız sınırı içindir.
 */
export const sqliteFormSubmissions = sqliteTable(
  "form_submissions",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    pagePath: text("page_path").notNull(),
    locale: text("locale").default("tr").notNull(),
    formId: text("form_id").notNull(),
    formTitle: text("form_title").default("").notNull(),
    fields: text("fields", { mode: "json" }).$type<Array<{ name: string; label: string; value: string }>>().default([]).notNull(),
    /** new | read | spam | archived */
    status: text("status").default("new").notNull(),
    ipHash: text("ip_hash").default("").notNull(),
    /** E-posta bildirimi: "" (gönderilmedi) | sent | failed | skipped */
    notifyStatus: text("notify_status").default("").notNull(),
    notifyError: text("notify_error").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("form_submissions_site_id_idx").on(t.siteId),
    index("form_submissions_status_idx").on(t.siteId, t.status, t.createdAt),
    index("form_submissions_ip_idx").on(t.siteId, t.ipHash, t.createdAt),
  ]
);

/**
 * FORMLAR — sürükle-bırak kurucuyla tanımlanan form şablonları. Alanlar `spec`te, e-posta bildirimi `notify`dadır.
 * `form_block` bloğu `props.formId` ile buna bağlanır; gönderimler `form_submissions.form_id` ile eşleşir.
 */
export const sqliteForms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    /** active | paused | archived: yalnızca `active` gönderim kabul eder */
    status: text("status").default("active").notNull(),
    templateId: text("template_id"),
    spec: text("spec", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    notify: text("notify", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("forms_site_id_idx").on(t.siteId), index("forms_site_status_idx").on(t.siteId, t.status)]
);

/**
 * MEDYA KLASÖRLERİ — medya kitaplığını düzenlemek için ağaç yapısı (en çok 3 düzey). Dosyalar `media_assets.folder_id` ile bağlanır;
 * klasör silinince içindekiler üst klasöre (yoksa köke) taşınır.
 */
export const sqliteMediaFolders = sqliteTable(
  "media_folders",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("media_folders_site_id_idx").on(t.siteId), index("media_folders_parent_idx").on(t.siteId, t.parentId)]
);

/**
 * BİLDİRİM MERKEZİ — panel içi bildirimler. `dedupeKey` aynı olayın tekrarını tek satırda toplar (`count`);
 * sistem sağlığından gelenler düzelince `resolvedAt` ile kapanır. Okundu durumu kullanıcıya özeldir (`notification_reads`).
 */
export const sqliteNotifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    kind: text("kind").notNull(),
    /** info | warning | critical */
    severity: text("severity").default("info").notNull(),
    title: text("title").notNull(),
    body: text("body").default("").notNull(),
    href: text("href").default("").notNull(),
    dedupeKey: text("dedupe_key"),
    count: integer("count").default(1).notNull(),
    /** admin: yalnızca yöneticiler | all: tüm panel kullanıcıları */
    audience: text("audience").default("admin").notNull(),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("notifications_site_id_idx").on(t.siteId), index("notifications_updated_idx").on(t.siteId, t.updatedAt), index("notifications_dedupe_idx").on(t.siteId, t.dedupeKey)]
);

export const sqliteNotificationReads = sqliteTable(
  "notification_reads",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    notificationId: text("notification_id").notNull(),
    userId: text("user_id").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("notification_reads_site_id_idx").on(t.siteId), index("notification_reads_user_idx").on(t.siteId, t.userId)]
);

/**
 * TASARIM KÜTÜPHANESİ — kullanıcının kaydettiği bölüm, sayfa ve tema tasarımları (elle veya AI ile üretilmiş).
 * AI çıktısı buraya yalnızca doğrulanıp kullanıcı onayıyla yazılır; `payload` uygulama anında yeniden doğrulanır.
 */
export const sqliteDesignLibrary = sqliteTable(
  "design_library",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    /** section | page | theme */
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    category: text("category").default("text").notNull(),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    /** ai | manual */
    source: text("source").default("manual").notNull(),
    prompt: text("prompt").default("").notNull(),
    report: text("report", { mode: "json" }).$type<Record<string, unknown>>().default({}).notNull(),
    placeholderData: integer("placeholder_data", { mode: "boolean" }).default(false).notNull(),
    createdBy: text("created_by").default("").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("design_library_site_id_idx").on(t.siteId), index("design_library_kind_idx").on(t.siteId, t.kind, t.updatedAt)]
);

/**
 * MCP istek günlüğü (Pro eklenti `mcp-log`): hangi araç, hangi ajan, ne kadar sürdü. Sır ve istek gövdesi saklanmaz.
 */
export const sqliteMcpRequestLog = sqliteTable(
  "mcp_request_log",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    at: integer("at", { mode: "timestamp_ms" }).notNull(),
    /** Çağrılan araç adı ya da JSON-RPC yöntemi */
    tool: text("tool").notNull(),
    /** User-Agent'ın kısaltılmış hâli (ajan anahtarı ASLA yazılmaz) */
    agent: text("agent").default("").notNull(),
    ok: integer("ok", { mode: "boolean" }).default(true).notNull(),
    durationMs: integer("duration_ms").default(0).notNull(),
  },
  (t) => [index("mcp_request_log_site_at_idx").on(t.siteId, t.at)]
);

/**
 * Kelime ve rakip havuzu. Yalnızca canlı sorgular yazılır; örnek/tohum satır buraya girmez.
 * ctr100: yüzde × 100 (5,92 → 592). position10: sıra × 10 (4,2 → 42).
 */
export const sqliteSeoIntelSignals = sqliteTable(
  "seo_intel_signals",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    /** gsc | bing | yandex | serper */
    source: text("source").notNull(),
    keyword: text("keyword").notNull(),
    clicks: integer("clicks").default(0).notNull(),
    impressions: integer("impressions").default(0).notNull(),
    ctr100: integer("ctr100").default(0).notNull(),
    position10: integer("position10").default(0).notNull(),
    /** Önceki sıra × 10. 0 ise henüz bir değişim yok. */
    prevPosition10: integer("prev_position10").default(0).notNull(),
    detail: text("detail").default("").notNull(),
    capturedAt: integer("captured_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("seo_intel_signals_site_id_idx").on(t.siteId),
    uniqueIndex("seo_intel_signals_site_source_kw_uidx").on(t.siteId, t.source, t.keyword),
  ]
);

/** Küme → taslak bağı. Üyeler yeniden hesaplanır; contentId onay kuyruğundaki taslağı tutar. */
export const sqliteSeoIntelClusters = sqliteTable(
  "seo_intel_clusters",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    label: text("label").notNull(),
    members: text("members", { mode: "json" }).$type<string[]>().default([]).notNull(),
    /** open | draft */
    status: text("status").default("open").notNull(),
    contentId: text("content_id").default("").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("seo_intel_clusters_site_id_idx").on(t.siteId)]
);

/** Dış adresten veya yapıştırılan metinden açılan taslaklar. Yayın, içerik editöründeki onaydır. */
export const sqliteContentImports = sqliteTable(
  "content_imports",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    /** url | paste */
    kind: text("kind").notNull(),
    source: text("source").default("").notNull(),
    title: text("title").default("").notNull(),
    /** draft | failed */
    status: text("status").default("draft").notNull(),
    contentId: text("content_id").default("").notNull(),
    bodyHash: text("body_hash").default("").notNull(),
    error: text("error").default("").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("content_imports_site_id_idx").on(t.siteId, t.fetchedAt)]
);
