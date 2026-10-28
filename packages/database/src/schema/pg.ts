import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";
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
 * PostgreSQL pgvector (1536 boyutlu OpenAI / BGE-M3 uyumlu vektör sütunu)
 */
const pgVector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .filter(Boolean)
      .map(Number);
  },
});

/**
 * 1. SITES — Tekil Site ('default') ve Subdomain Multi-Tenant Siteler
 */
export const pgSites = pgTable(
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
    supportedLocales: jsonb("supported_locales").$type<string[]>().default(["tr"]).notNull(),
    activeThemeId: text("active_theme_id").default("corporate-aurora").notNull(),
    designTokens: jsonb("design_tokens").$type<DesignTokens>().notNull(),
    brandVoice: jsonb("brand_voice").$type<Record<string, unknown>>().default({}),
    siteDna: text("site_dna"),
    styleExamples: jsonb("style_examples").$type<Array<Record<string, unknown>>>().default([]),
    localSeo: jsonb("local_seo").$type<Record<string, unknown>>().default({}),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("sites_site_id_idx").on(t.siteId),
    uniqueIndex("sites_domain_uidx").on(t.domain),
  ]
);

/**
 * 2. NAVIGATION LAYOUTS — 3 Katmanlı Görsel Header, Footer ve Mega-Menü Şeması
 */
export const pgNavigationLayouts = pgTable(
  "navigation_layouts",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    locale: text("locale").default("tr").notNull(),
    headerConfig: jsonb("header_config").$type<HeaderConfig>().notNull(),
    menuItems: jsonb("menu_items").$type<NavigationMenuItem[]>().notNull(),
    footerConfig: jsonb("footer_config").$type<FooterConfig>().notNull(),
    sidebarConfig: jsonb("sidebar_config").$type<SidebarConfig | null>(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("nav_layouts_site_id_idx").on(t.siteId),
    uniqueIndex("nav_layouts_site_locale_uidx").on(t.siteId, t.locale),
  ]
);

/**
 * 3. CONTENTS — Polimorfik Ana İçerik Kaydı (page, post, kb_tech, ai_prompt, product, campaign)
 */
export const pgContents = pgTable(
  "contents",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    type: text("type").$type<ContentType>().default("page").notNull(),
    status: text("status").$type<ContentStatus>().default("published").notNull(),
    importanceScore: integer("importance_score").default(5).notNull(),
    schemaType: text("schema_type").default("WebPage").notNull(),
    schemaAttributes: jsonb("schema_attributes").$type<Record<string, unknown>>().default({}),
    featuredImage: text("featured_image"),
    authorName: text("author_name").default("Sistem Editörü").notNull(),
    publishedAt: timestamp("published_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("contents_site_id_idx").on(t.siteId),
    index("contents_site_type_status_idx").on(t.siteId, t.type, t.status),
  ]
);

/**
 * 4. CONTENT TRANSLATIONS — Çok Dilli / Çok Bölgeli İçerik, 0-KB RSC Blok AST ve Markdown Cache
 */
export const pgContentTranslations = pgTable(
  "content_translations",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => pgContents.id, { onDelete: "cascade" }),
    locale: text("locale").default("tr").notNull(),
    region: text("region").default("TR").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    tldr: text("tldr"),
    blocks: jsonb("blocks").$type<BlockNode[]>().default([]).notNull(),
    markdownCache: text("markdown_cache").default("").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: boolean("no_index").default(false).notNull(),
    seoScore: integer("seo_score").default(85).notNull(),
    gapFindings: jsonb("gap_findings").$type<string[]>().default([]).notNull(),
    descriptionSource: text("description_source").default("human").notNull(),
    translationStatus: text("translation_status").default("published").notNull(),
    sourceLocale: text("source_locale"),
    sourceHash: text("source_hash"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("content_trans_site_id_idx").on(t.siteId),
    uniqueIndex("content_trans_site_locale_slug_uidx").on(t.siteId, t.locale, t.slug),
    index("content_trans_content_id_idx").on(t.contentId),
  ]
);

/**
 * 5. CONTENT ENTITY LINKS — Makale <-> Ürün <-> Kampanya (@id Knowledge Graph Bağlantıları)
 */
export const pgContentEntityLinks = pgTable(
  "content_entity_links",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    sourceContentId: text("source_content_id")
      .notNull()
      .references(() => pgContents.id, { onDelete: "cascade" }),
    targetContentId: text("target_content_id")
      .notNull()
      .references(() => pgContents.id, { onDelete: "cascade" }),
    relationType: text("relation_type").default("mentions").notNull(), // 'mentions' | 'about' | 'offer_for'
    anchorText: text("anchor_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("entity_links_site_id_idx").on(t.siteId),
    index("entity_links_source_idx").on(t.siteId, t.sourceContentId),
  ]
);

/**
 * 6. INSTALLED THEMES — Tema Mağazası Kurulumları ve Site Bazlı Özelleştirmeler
 */
export const pgInstalledThemes = pgTable(
  "installed_themes",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    themeId: text("theme_id").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    customTokens: jsonb("custom_tokens").$type<Partial<DesignTokens>>().default({}),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
  },
  (t) => [
    index("installed_themes_site_id_idx").on(t.siteId),
    uniqueIndex("installed_themes_site_theme_uidx").on(t.siteId, t.themeId),
  ]
);

/**
 * 7. CONTENT CHUNKS — RAG & Vektör Arama İndeksi (pgvector 1536d)
 */
export const pgContentChunks = pgTable(
  "content_chunks",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => pgContents.id, { onDelete: "cascade" }),
    locale: text("locale").default("tr").notNull(),
    chunkIndex: integer("chunk_index").default(0).notNull(),
    headingPath: text("heading_path"),
    chunkText: text("chunk_text").notNull(),
    chunkHash: text("chunk_hash"),
    embeddingModel: text("embedding_model"),
    wordCount: integer("word_count").default(0).notNull(),
    embedding: pgVector("embedding"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("content_chunks_site_id_idx").on(t.siteId),
    index("content_chunks_content_idx").on(t.siteId, t.contentId),
    index("content_chunks_model_idx").on(t.siteId, t.embeddingModel),
    // Yaklaşık en yakın komşu araması (kosinüs); yalnızca PostgreSQL + pgvector
    index("content_chunks_embedding_hnsw").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ]
);

/**
 * 8. TAXONOMIES — Kategoriler, Etiketler, Ürün Kategorileri ve KB Konuları (Hiyerarşik + SEO)
 */
export const pgTaxonomies = pgTable(
  "taxonomies",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    taxonomyType: text("taxonomy_type").default("category").notNull(), // 'category' | 'tag' | 'product_cat' | 'kb_topic'
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    color: text("color").default("#266DF0"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    itemCount: integer("item_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("taxonomies_site_id_idx").on(t.siteId),
    uniqueIndex("taxonomies_site_type_slug_uidx").on(t.siteId, t.taxonomyType, t.slug),
  ]
);

/**
 * 9. MEDIA ASSETS — Medya Kütüphanesi ve Görsel SEO Yönetimi
 */
export const pgMediaAssets = pgTable(
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
    focalPoint: jsonb("focal_point").$type<{ x: number; y: number }>().default({ x: 50, y: 50 }),
    seoScore: integer("seo_score").default(95).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("media_assets_site_id_idx").on(t.siteId)]
);

/**
 * 10. COMMENTS & REVIEWS — Yorum, İnceleme ve Yıldızlı Değerlendirme (AggregateRating Schema)
 */
export const pgCommentsReviews = pgTable(
  "comments_reviews",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id")
      .notNull()
      .references(() => pgContents.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    entryType: text("entry_type").default("review").notNull(), // 'comment' | 'review'
    rating: integer("rating").default(5).notNull(), // 1..5
    title: text("title"),
    body: text("body").notNull(),
    pros: jsonb("pros").$type<string[]>().default([]),
    cons: jsonb("cons").$type<string[]>().default([]),
    status: text("status").default("approved").notNull(), // 'approved' | 'pending' | 'spam'
    isVerified: boolean("is_verified").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("comments_reviews_site_id_idx").on(t.siteId),
    index("comments_reviews_content_idx").on(t.siteId, t.contentId),
  ]
);

/**
 * 11. COMMERCE — Ürün kataloğu, siparişler ve kalemler
 */
export const pgCommerceProducts = pgTable(
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
    galleryUrls: jsonb("gallery_urls").$type<string[]>().default([]),
    productKind: text("product_kind").default("simple").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("commerce_products_site_id_idx").on(t.siteId),
    index("commerce_products_slug_idx").on(t.siteId, t.slug),
    index("commerce_products_sku_idx").on(t.siteId, t.sku),
  ]
);

export const pgCommerceOrders = pgTable(
  "commerce_orders",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    orderNumber: text("order_number").notNull(),
    status: text("status").default("pending").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),
    shippingAddress: jsonb("shipping_address").$type<Record<string, string>>().notNull(),
    billingAddress: jsonb("billing_address").$type<Record<string, string> | null>(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("commerce_orders_site_id_idx").on(t.siteId),
    index("commerce_orders_number_idx").on(t.siteId, t.orderNumber),
  ]
);

export const pgCommerceOrderItems = pgTable(
  "commerce_order_items",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    orderId: text("order_id")
      .notNull()
      .references(() => pgCommerceOrders.id, { onDelete: "cascade" }),
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

export const pgCommerceCategories = pgTable(
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

export const pgCommerceProductCategories = pgTable(
  "commerce_product_categories",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    productId: text("product_id").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (t) => [index("commerce_product_categories_site_idx").on(t.siteId, t.productId)]
);

export const pgCommerceAttributes = pgTable(
  "commerce_attributes",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [index("commerce_attributes_site_id_idx").on(t.siteId)]
);

export const pgCommerceAttributeValues = pgTable(
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

export const pgCommerceVariants = pgTable(
  "commerce_variants",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull(),
    priceCents: integer("price_cents").default(0).notNull(),
    compareAtCents: integer("compare_at_cents"),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    valueIds: jsonb("value_ids").$type<string[]>().default([]).notNull(),
    imageUrl: text("image_url"),
  },
  (t) => [index("commerce_variants_site_product_idx").on(t.siteId, t.productId)]
);

export const pgCommerceCustomerGroups = pgTable(
  "commerce_customer_groups",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
  },
  (t) => [index("commerce_customer_groups_site_id_idx").on(t.siteId)]
);

export const pgCommerceCustomers = pgTable(
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("commerce_customers_site_id_idx").on(t.siteId)]
);

export const pgCommerceLoyaltyEntries = pgTable(
  "commerce_loyalty_entries",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    customerId: text("customer_id").notNull(),
    points: integer("points").default(0).notNull(),
    reason: text("reason").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("commerce_loyalty_site_idx").on(t.siteId, t.customerId)]
);

export const pgCommerceCampaigns = pgTable(
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
    active: boolean("active").default(true).notNull(),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
  },
  (t) => [index("commerce_campaigns_site_id_idx").on(t.siteId)]
);

export const pgCommerceCoupons = pgTable(
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
    active: boolean("active").default(true).notNull(),
  },
  (t) => [index("commerce_coupons_site_id_idx").on(t.siteId)]
);

export const pgCommerceReturns = pgTable(
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("commerce_returns_site_id_idx").on(t.siteId)]
);

export const pgCommerceShippingMethods = pgTable(
  "commerce_shipping_methods",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    name: text("name").notNull(),
    carrier: text("carrier").default("").notNull(),
    flatRateCents: integer("flat_rate_cents").default(0).notNull(),
    freeThresholdCents: integer("free_threshold_cents").default(0).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
  },
  (t) => [index("commerce_shipping_methods_site_id_idx").on(t.siteId)]
);

/**
 * 12. MARKETPLACE — Pazar yeri kanalları, iş günlüğü ve dış siparişler
 */
export const pgMarketplaceChannels = pgTable(
  "marketplace_channels",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    driverId: text("driver_id").notNull(),
    label: text("label").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    environment: text("environment").default("sandbox").notNull(),
    credentials: jsonb("credentials").$type<Record<string, string>>().default({}).notNull(),
    connectionStatus: text("connection_status").default("unknown").notNull(),
    lastCheckedAt: timestamp("last_checked_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("marketplace_channels_site_id_idx").on(t.siteId)]
);

export const pgMarketplaceJobs = pgTable(
  "marketplace_jobs",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    channelId: text("channel_id")
      .notNull()
      .references(() => pgMarketplaceChannels.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    message: text("message").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("marketplace_jobs_site_id_idx").on(t.siteId),
    index("marketplace_jobs_channel_idx").on(t.siteId, t.channelId),
  ]
);

export const pgMarketplaceOrders = pgTable(
  "marketplace_orders",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    channelId: text("channel_id")
      .notNull()
      .references(() => pgMarketplaceChannels.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    status: text("status").default("").notNull(),
    buyerName: text("buyer_name").default("").notNull(),
    currency: text("currency").default("TRY").notNull(),
    total: integer("total_cents").default(0).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    orderedAt: timestamp("ordered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("marketplace_orders_site_id_idx").on(t.siteId),
    index("marketplace_orders_external_idx").on(t.siteId, t.channelId, t.externalId),
  ]
);

export const pgUsers = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    email: text("email").notNull(),
    name: text("name").default("").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"admin" | "editor">().default("editor").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at"),
    sessionVersion: integer("session_version").default(0).notNull(),
    status: text("status").$type<"active" | "disabled">().default("active").notNull(),
    passwordChangedAt: timestamp("password_changed_at"),
  },
  (t) => [
    index("users_site_id_idx").on(t.siteId),
    uniqueIndex("users_site_email_uq").on(t.siteId, t.email),
  ]
);

export const pgBotDailyStats = pgTable(
  "bot_daily_stats",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    day: text("day").notNull(),
    botId: text("bot_id").notNull(),
    kind: text("kind").notNull(),
    trust: text("trust").$type<"verified" | "claimed">().notNull(),
    hits: integer("hits").default(0).notNull(),
    lastSeenAt: timestamp("last_seen_at").notNull(),
  },
  (t) => [index("bot_daily_stats_site_day_idx").on(t.siteId, t.day)]
);

export const pgAuditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    at: timestamp("at").defaultNow().notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email").default("").notNull(),
    action: text("action").notNull(),
    target: text("target"),
    detail: text("detail").default("").notNull(),
    ip: text("ip").default("").notNull(),
  },
  (t) => [index("audit_log_site_at_idx").on(t.siteId, t.at)]
);

export const pgContentRevisions = pgTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    contentId: text("content_id").notNull(),
    locale: text("locale").default("tr").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    authorId: text("author_id"),
    authorEmail: text("author_email").default("").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
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
export const pgSitePlugins = pgTable(
  "site_plugins",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    pluginId: text("plugin_id").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    modules: jsonb("modules").$type<Record<string, boolean>>().default({}).notNull(),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
    licenseKey: text("license_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("site_plugins_site_id_idx").on(t.siteId),
    uniqueIndex("site_plugins_site_plugin_uidx").on(t.siteId, t.pluginId),
  ]
);

/**
 * AJAN TALEPLERİ — yapay zeka ajanlarının MCP üzerinden bıraktığı teklif / destek / demo talepleri.
 * Kişisel veri içerir (e-posta, telefon): yönetici panelinden yönetilir, ön yüzde gösterilmez.
 */
export const pgAgentRequests = pgTable(
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("agent_requests_site_id_idx").on(t.siteId),
    index("agent_requests_status_idx").on(t.siteId, t.status, t.createdAt),
  ]
);

/** YAPAY ZEKA YÖNLENDİRMELERİ — ChatGPT, Perplexity vb. kaynaklardan gelen insan ziyaretlerinin günlük sayacı (IP/UA saklanmaz). */
export const pgAiReferralDaily = pgTable(
  "ai_referral_daily",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").default("default").notNull(),
    day: text("day").notNull(),
    source: text("source").notNull(),
    path: text("path").default("/").notNull(),
    hits: integer("hits").default(0).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (t) => [
    index("ai_referral_daily_site_id_idx").on(t.siteId),
    index("ai_referral_daily_day_idx").on(t.siteId, t.day),
  ]
);
