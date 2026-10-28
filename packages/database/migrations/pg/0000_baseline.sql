CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"actor_id" text,
	"actor_email" text DEFAULT '' NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"detail" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_daily_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"day" text NOT NULL,
	"bot_id" text NOT NULL,
	"kind" text NOT NULL,
	"trust" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_seen_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"content_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text,
	"entry_type" text DEFAULT 'review' NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"pros" jsonb DEFAULT '[]'::jsonb,
	"cons" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'approved' NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_attribute_values" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"attribute_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"group_id" text,
	"customer_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "commerce_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"campaign_id" text,
	"code" text NOT NULL,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"customer_id" text,
	"group_id" text,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_customer_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_customers" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"source" text DEFAULT 'site' NOT NULL,
	"channel_id" text,
	"external_key" text,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text,
	"group_id" text,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_loyalty_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"customer_id" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"line_total_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"customer_note" text,
	"source" text DEFAULT 'site' NOT NULL,
	"channel_id" text,
	"customer_id" text,
	"coupon_code" text,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"shipping_method_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_product_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"product_id" text NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_products" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"content_id" text,
	"sku" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"description_html" text DEFAULT '' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"compare_at_cents" integer,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"stock_status" text DEFAULT 'instock' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"image_url" text,
	"gallery_urls" jsonb DEFAULT '[]'::jsonb,
	"product_kind" text DEFAULT 'simple' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_returns" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"source" text DEFAULT 'site' NOT NULL,
	"order_id" text NOT NULL,
	"order_number" text NOT NULL,
	"kind" text DEFAULT 'return' NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_shipping_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"carrier" text DEFAULT '' NOT NULL,
	"flat_rate_cents" integer DEFAULT 0 NOT NULL,
	"free_threshold_cents" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"compare_at_cents" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"value_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "content_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"content_id" text NOT NULL,
	"locale" text DEFAULT 'tr' NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"heading_path" text,
	"chunk_text" text NOT NULL,
	"chunk_hash" text,
	"embedding_model" text,
	"word_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_entity_links" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"source_content_id" text NOT NULL,
	"target_content_id" text NOT NULL,
	"relation_type" text DEFAULT 'mentions' NOT NULL,
	"anchor_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"content_id" text NOT NULL,
	"locale" text DEFAULT 'tr' NOT NULL,
	"region" text DEFAULT 'TR' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"tldr" text,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"markdown_cache" text DEFAULT '' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text,
	"no_index" boolean DEFAULT false NOT NULL,
	"seo_score" integer DEFAULT 85 NOT NULL,
	"gap_findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description_source" text DEFAULT 'human' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"type" text DEFAULT 'page' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"importance_score" integer DEFAULT 5 NOT NULL,
	"schema_type" text DEFAULT 'WebPage' NOT NULL,
	"schema_attributes" jsonb DEFAULT '{}'::jsonb,
	"featured_image" text,
	"author_name" text DEFAULT 'Sistem Editörü' NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installed_themes" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"theme_id" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"custom_tokens" jsonb DEFAULT '{}'::jsonb,
	"installed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"driver_id" text NOT NULL,
	"label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"connection_status" text DEFAULT 'unknown' NOT NULL,
	"last_checked_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"channel_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"channel_id" text NOT NULL,
	"external_id" text NOT NULL,
	"status" text DEFAULT '' NOT NULL,
	"buyer_name" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ordered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text DEFAULT 'image/webp' NOT NULL,
	"width" integer DEFAULT 1200 NOT NULL,
	"height" integer DEFAULT 630 NOT NULL,
	"size_bytes" integer DEFAULT 84000 NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"title_text" text,
	"caption" text,
	"focal_point" jsonb DEFAULT '{"x":50,"y":50}'::jsonb,
	"seo_score" integer DEFAULT 95 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_layouts" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"locale" text DEFAULT 'tr' NOT NULL,
	"header_config" jsonb NOT NULL,
	"menu_items" jsonb NOT NULL,
	"footer_config" jsonb NOT NULL,
	"sidebar_config" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"domain" text NOT NULL,
	"subdomain" text,
	"site_profile" text DEFAULT 'corporate' NOT NULL,
	"default_locale" text DEFAULT 'tr' NOT NULL,
	"supported_locales" jsonb DEFAULT '["tr"]'::jsonb NOT NULL,
	"active_theme_id" text DEFAULT 'corporate-aurora' NOT NULL,
	"design_tokens" jsonb NOT NULL,
	"brand_voice" jsonb DEFAULT '{}'::jsonb,
	"site_dna" text,
	"style_examples" jsonb DEFAULT '[]'::jsonb,
	"local_seo" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomies" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"taxonomy_type" text DEFAULT 'category' NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" text,
	"color" text DEFAULT '#266DF0',
	"seo_title" text,
	"seo_description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"session_version" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"password_changed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "comments_reviews" ADD CONSTRAINT "comments_reviews_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commerce_order_items" ADD CONSTRAINT "commerce_order_items_order_id_commerce_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_entity_links" ADD CONSTRAINT "content_entity_links_source_content_id_contents_id_fk" FOREIGN KEY ("source_content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_entity_links" ADD CONSTRAINT "content_entity_links_target_content_id_contents_id_fk" FOREIGN KEY ("target_content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_jobs" ADD CONSTRAINT "marketplace_jobs_channel_id_marketplace_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."marketplace_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_channel_id_marketplace_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."marketplace_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_site_at_idx" ON "audit_log" USING btree ("site_id","at");--> statement-breakpoint
CREATE INDEX "bot_daily_stats_site_day_idx" ON "bot_daily_stats" USING btree ("site_id","day");--> statement-breakpoint
CREATE INDEX "comments_reviews_site_id_idx" ON "comments_reviews" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "comments_reviews_content_idx" ON "comments_reviews" USING btree ("site_id","content_id");--> statement-breakpoint
CREATE INDEX "commerce_attribute_values_site_idx" ON "commerce_attribute_values" USING btree ("site_id","attribute_id");--> statement-breakpoint
CREATE INDEX "commerce_attributes_site_id_idx" ON "commerce_attributes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_campaigns_site_id_idx" ON "commerce_campaigns" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_categories_site_id_idx" ON "commerce_categories" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_coupons_site_id_idx" ON "commerce_coupons" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_customer_groups_site_id_idx" ON "commerce_customer_groups" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_customers_site_id_idx" ON "commerce_customers" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_loyalty_site_idx" ON "commerce_loyalty_entries" USING btree ("site_id","customer_id");--> statement-breakpoint
CREATE INDEX "commerce_order_items_site_id_idx" ON "commerce_order_items" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_order_items_order_idx" ON "commerce_order_items" USING btree ("site_id","order_id");--> statement-breakpoint
CREATE INDEX "commerce_orders_site_id_idx" ON "commerce_orders" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_orders_number_idx" ON "commerce_orders" USING btree ("site_id","order_number");--> statement-breakpoint
CREATE INDEX "commerce_product_categories_site_idx" ON "commerce_product_categories" USING btree ("site_id","product_id");--> statement-breakpoint
CREATE INDEX "commerce_products_site_id_idx" ON "commerce_products" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_products_slug_idx" ON "commerce_products" USING btree ("site_id","slug");--> statement-breakpoint
CREATE INDEX "commerce_products_sku_idx" ON "commerce_products" USING btree ("site_id","sku");--> statement-breakpoint
CREATE INDEX "commerce_returns_site_id_idx" ON "commerce_returns" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_shipping_methods_site_id_idx" ON "commerce_shipping_methods" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "commerce_variants_site_product_idx" ON "commerce_variants" USING btree ("site_id","product_id");--> statement-breakpoint
CREATE INDEX "content_chunks_site_id_idx" ON "content_chunks" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "content_chunks_content_idx" ON "content_chunks" USING btree ("site_id","content_id");--> statement-breakpoint
CREATE INDEX "content_chunks_model_idx" ON "content_chunks" USING btree ("site_id","embedding_model");--> statement-breakpoint
CREATE INDEX "content_chunks_embedding_hnsw" ON "content_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "entity_links_site_id_idx" ON "content_entity_links" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "entity_links_source_idx" ON "content_entity_links" USING btree ("site_id","source_content_id");--> statement-breakpoint
CREATE INDEX "content_trans_site_id_idx" ON "content_translations" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_trans_site_locale_slug_uidx" ON "content_translations" USING btree ("site_id","locale","slug");--> statement-breakpoint
CREATE INDEX "content_trans_content_id_idx" ON "content_translations" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "contents_site_id_idx" ON "contents" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "contents_site_type_status_idx" ON "contents" USING btree ("site_id","type","status");--> statement-breakpoint
CREATE INDEX "installed_themes_site_id_idx" ON "installed_themes" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "installed_themes_site_theme_uidx" ON "installed_themes" USING btree ("site_id","theme_id");--> statement-breakpoint
CREATE INDEX "marketplace_channels_site_id_idx" ON "marketplace_channels" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "marketplace_jobs_site_id_idx" ON "marketplace_jobs" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "marketplace_jobs_channel_idx" ON "marketplace_jobs" USING btree ("site_id","channel_id");--> statement-breakpoint
CREATE INDEX "marketplace_orders_site_id_idx" ON "marketplace_orders" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "marketplace_orders_external_idx" ON "marketplace_orders" USING btree ("site_id","channel_id","external_id");--> statement-breakpoint
CREATE INDEX "media_assets_site_id_idx" ON "media_assets" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "nav_layouts_site_id_idx" ON "navigation_layouts" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nav_layouts_site_locale_uidx" ON "navigation_layouts" USING btree ("site_id","locale");--> statement-breakpoint
CREATE INDEX "sites_site_id_idx" ON "sites" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_domain_uidx" ON "sites" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "taxonomies_site_id_idx" ON "taxonomies" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomies_site_type_slug_uidx" ON "taxonomies" USING btree ("site_id","taxonomy_type","slug");--> statement-breakpoint
CREATE INDEX "users_site_id_idx" ON "users" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_site_email_uq" ON "users" USING btree ("site_id","email");