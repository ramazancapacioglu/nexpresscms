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
    focalPoint: text("focal_point", { mode: "json" })
      .$type<{ x: number; y: number }>()
      .default({ x: 50, y: 50 }),
    seoScore: integer("seo_score").default(95).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("media_assets_site_id_idx").on(t.siteId)]
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("comments_reviews_site_id_idx").on(t.siteId),
    index("comments_reviews_content_idx").on(t.siteId, t.contentId),
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
    role: text("role").$type<"admin" | "editor">().default("editor").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    sessionVersion: integer("session_version").default(0).notNull(),
    status: text("status").$type<"active" | "disabled">().default("active").notNull(),
    passwordChangedAt: integer("password_changed_at", { mode: "timestamp" }),
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
