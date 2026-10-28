/**
 * ESKİ TABAN ŞEMA BETİĞİ — DONDURULDU.
 * Bu dosya artık değiştirilmez. Şema değişiklikleri `packages/database/src/schema/*` içinde yapılır ve
 * `pnpm db:generate` ile `migrations/` altında göç dosyasına dönüşür; `pnpm db:migrate` uygular.
 * Betik yalnızca, göç günlüğü olmayan ESKİ veritabanlarını güncel taban şemaya getirmek için
 * (`migrate.ts` içinden) çağrılır. Taban, `migrations/<motor>/0000_baseline.sql` ile birebir aynıdır
 * (`test/push-parity.test.ts` ve `test/migrate.test.ts` bunu iki motorda doğrular).
 */
import { getDbDialect, getPgClient, getSqliteClient } from "../client";

export async function pushSchema(): Promise<void> {
  const dialect = getDbDialect();
  console.log(`[NexPress DB] Şema senkronizasyonu başlatılıyor (Motor: ${dialect})...`);

  if (dialect === "sqlite") {
    const { client } = getSqliteClient();
    const statements = [
      `CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        name TEXT NOT NULL,
        tagline TEXT,
        domain TEXT NOT NULL,
        subdomain TEXT,
        site_profile TEXT DEFAULT 'corporate' NOT NULL,
        default_locale TEXT DEFAULT 'tr' NOT NULL,
        supported_locales TEXT DEFAULT '["tr"]' NOT NULL,
        active_theme_id TEXT DEFAULT 'corporate-aurora' NOT NULL,
        design_tokens TEXT NOT NULL,
        brand_voice TEXT DEFAULT '{}',
        site_dna TEXT,
        style_examples TEXT DEFAULT '[]',
        local_seo TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS sites_site_id_idx ON sites (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS sites_domain_uidx ON sites (domain)`,

      `CREATE TABLE IF NOT EXISTS navigation_layouts (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        locale TEXT DEFAULT 'tr' NOT NULL,
        header_config TEXT NOT NULL,
        menu_items TEXT NOT NULL,
        footer_config TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS nav_layouts_site_id_idx ON navigation_layouts (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS nav_layouts_site_locale_uidx ON navigation_layouts (site_id, locale)`,

      `CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        type TEXT DEFAULT 'page' NOT NULL,
        status TEXT DEFAULT 'published' NOT NULL,
        importance_score INTEGER DEFAULT 5 NOT NULL,
        schema_type TEXT DEFAULT 'WebPage' NOT NULL,
        schema_attributes TEXT DEFAULT '{}',
        featured_image TEXT,
        author_name TEXT DEFAULT 'Sistem Editörü' NOT NULL,
        published_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS contents_site_id_idx ON contents (site_id)`,
      `CREATE INDEX IF NOT EXISTS contents_site_type_status_idx ON contents (site_id, type, status)`,

      `CREATE TABLE IF NOT EXISTS content_translations (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        locale TEXT DEFAULT 'tr' NOT NULL,
        region TEXT DEFAULT 'TR' NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        tldr TEXT,
        blocks TEXT DEFAULT '[]' NOT NULL,
        markdown_cache TEXT DEFAULT '' NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        canonical_url TEXT,
        no_index INTEGER DEFAULT 0 NOT NULL,
        seo_score INTEGER DEFAULT 85 NOT NULL,
        gap_findings TEXT DEFAULT '[]' NOT NULL,
        description_source TEXT DEFAULT 'human' NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS content_trans_site_id_idx ON content_translations (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS content_trans_site_locale_slug_uidx ON content_translations (site_id, locale, slug)`,
      `CREATE INDEX IF NOT EXISTS content_trans_content_id_idx ON content_translations (content_id)`,

      `CREATE TABLE IF NOT EXISTS content_entity_links (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        source_content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        target_content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        relation_type TEXT DEFAULT 'mentions' NOT NULL,
        anchor_text TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS entity_links_site_id_idx ON content_entity_links (site_id)`,
      `CREATE INDEX IF NOT EXISTS entity_links_source_idx ON content_entity_links (site_id, source_content_id)`,

      `CREATE TABLE IF NOT EXISTS installed_themes (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        theme_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 0 NOT NULL,
        custom_tokens TEXT DEFAULT '{}',
        installed_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS installed_themes_site_id_idx ON installed_themes (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS installed_themes_site_theme_uidx ON installed_themes (site_id, theme_id)`,

      `CREATE TABLE IF NOT EXISTS content_chunks (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        locale TEXT DEFAULT 'tr' NOT NULL,
        chunk_index INTEGER DEFAULT 0 NOT NULL,
        heading_path TEXT,
        chunk_text TEXT NOT NULL,
        embedding_json TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS content_chunks_site_id_idx ON content_chunks (site_id)`,
      `CREATE INDEX IF NOT EXISTS content_chunks_content_idx ON content_chunks (site_id, content_id)`,

      `CREATE TABLE IF NOT EXISTS taxonomies (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        taxonomy_type TEXT DEFAULT 'category' NOT NULL,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        parent_id TEXT,
        color TEXT DEFAULT '#266DF0',
        seo_title TEXT,
        seo_description TEXT,
        item_count INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS taxonomies_site_id_idx ON taxonomies (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS taxonomies_site_type_slug_uidx ON taxonomies (site_id, taxonomy_type, slug)`,

      `CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        mime_type TEXT DEFAULT 'image/webp' NOT NULL,
        width INTEGER DEFAULT 1200 NOT NULL,
        height INTEGER DEFAULT 630 NOT NULL,
        size_bytes INTEGER DEFAULT 84000 NOT NULL,
        alt_text TEXT DEFAULT '' NOT NULL,
        title_text TEXT,
        caption TEXT,
        focal_point TEXT DEFAULT '{"x":50,"y":50}',
        seo_score INTEGER DEFAULT 95 NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS media_assets_site_id_idx ON media_assets (site_id)`,

      `CREATE TABLE IF NOT EXISTS comments_reviews (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        author_email TEXT,
        entry_type TEXT DEFAULT 'review' NOT NULL,
        rating INTEGER DEFAULT 5 NOT NULL,
        title TEXT,
        body TEXT NOT NULL,
        pros TEXT DEFAULT '[]',
        cons TEXT DEFAULT '[]',
        status TEXT DEFAULT 'approved' NOT NULL,
        is_verified INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS comments_reviews_site_id_idx ON comments_reviews (site_id)`,
      `CREATE INDEX IF NOT EXISTS comments_reviews_content_idx ON comments_reviews (site_id, content_id)`,

      `CREATE TABLE IF NOT EXISTS commerce_products (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        content_id TEXT,
        sku TEXT NOT NULL,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        short_description TEXT DEFAULT '' NOT NULL,
        description_html TEXT DEFAULT '' NOT NULL,
        price_cents INTEGER DEFAULT 0 NOT NULL,
        compare_at_cents INTEGER,
        currency TEXT DEFAULT 'TRY' NOT NULL,
        stock_quantity INTEGER DEFAULT 0 NOT NULL,
        stock_status TEXT DEFAULT 'instock' NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        image_url TEXT,
        gallery_urls TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_products_site_id_idx ON commerce_products (site_id)`,
      `CREATE INDEX IF NOT EXISTS commerce_products_slug_idx ON commerce_products (site_id, slug)`,
      `CREATE INDEX IF NOT EXISTS commerce_products_sku_idx ON commerce_products (site_id, sku)`,

      `CREATE TABLE IF NOT EXISTS commerce_orders (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        order_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        billing_address TEXT,
        subtotal_cents INTEGER DEFAULT 0 NOT NULL,
        shipping_cents INTEGER DEFAULT 0 NOT NULL,
        tax_cents INTEGER DEFAULT 0 NOT NULL,
        total_cents INTEGER DEFAULT 0 NOT NULL,
        currency TEXT DEFAULT 'TRY' NOT NULL,
        customer_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_orders_site_id_idx ON commerce_orders (site_id)`,
      `CREATE INDEX IF NOT EXISTS commerce_orders_number_idx ON commerce_orders (site_id, order_number)`,

      `CREATE TABLE IF NOT EXISTS commerce_order_items (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        title TEXT NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        unit_price_cents INTEGER DEFAULT 0 NOT NULL,
        line_total_cents INTEGER DEFAULT 0 NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_order_items_site_id_idx ON commerce_order_items (site_id)`,
      `CREATE INDEX IF NOT EXISTS commerce_order_items_order_idx ON commerce_order_items (site_id, order_id)`,

      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        email TEXT NOT NULL,
        name TEXT DEFAULT '' NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'editor' NOT NULL,
        created_at INTEGER NOT NULL,
        last_login_at INTEGER,
        session_version INTEGER DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        password_changed_at INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS users_site_id_idx ON users (site_id)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS users_site_email_uq ON users (site_id, email)`,
      `CREATE TABLE IF NOT EXISTS bot_daily_stats (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        day TEXT NOT NULL,
        bot_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        trust TEXT NOT NULL,
        hits INTEGER DEFAULT 0 NOT NULL,
        last_seen_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS bot_daily_stats_site_day_idx ON bot_daily_stats (site_id, day)`,
      `CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        at INTEGER NOT NULL,
        actor_id TEXT,
        actor_email TEXT DEFAULT '' NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        detail TEXT DEFAULT '' NOT NULL,
        ip TEXT DEFAULT '' NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS audit_log_site_at_idx ON audit_log (site_id, at)`,
      `CREATE TABLE IF NOT EXISTS marketplace_channels (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        driver_id TEXT NOT NULL,
        label TEXT NOT NULL,
        enabled INTEGER DEFAULT 1 NOT NULL,
        environment TEXT DEFAULT 'sandbox' NOT NULL,
        credentials TEXT DEFAULT '{}' NOT NULL,
        connection_status TEXT DEFAULT 'unknown' NOT NULL,
        last_checked_at INTEGER,
        last_error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS marketplace_channels_site_id_idx ON marketplace_channels (site_id)`,
      `CREATE TABLE IF NOT EXISTS marketplace_jobs (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        channel_id TEXT NOT NULL REFERENCES marketplace_channels(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT DEFAULT '' NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS marketplace_jobs_site_id_idx ON marketplace_jobs (site_id)`,
      `CREATE INDEX IF NOT EXISTS marketplace_jobs_channel_idx ON marketplace_jobs (site_id, channel_id)`,
      `CREATE TABLE IF NOT EXISTS marketplace_orders (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        channel_id TEXT NOT NULL REFERENCES marketplace_channels(id) ON DELETE CASCADE,
        external_id TEXT NOT NULL,
        status TEXT DEFAULT '' NOT NULL,
        buyer_name TEXT DEFAULT '' NOT NULL,
        currency TEXT DEFAULT 'TRY' NOT NULL,
        total_cents INTEGER DEFAULT 0 NOT NULL,
        payload TEXT DEFAULT '{}' NOT NULL,
        ordered_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS marketplace_orders_site_id_idx ON marketplace_orders (site_id)`,
      `CREATE INDEX IF NOT EXISTS marketplace_orders_external_idx ON marketplace_orders (site_id, channel_id, external_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_categories (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0 NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_categories_site_id_idx ON commerce_categories (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_product_categories (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        product_id TEXT NOT NULL,
        category_id TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_product_categories_site_idx ON commerce_product_categories (site_id, product_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_attributes (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_attributes_site_id_idx ON commerce_attributes (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_attribute_values (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        attribute_id TEXT NOT NULL,
        label TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0 NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_attribute_values_site_idx ON commerce_attribute_values (site_id, attribute_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_variants (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        product_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        price_cents INTEGER DEFAULT 0 NOT NULL,
        compare_at_cents INTEGER,
        stock_quantity INTEGER DEFAULT 0 NOT NULL,
        value_ids TEXT DEFAULT '[]' NOT NULL,
        image_url TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_variants_site_product_idx ON commerce_variants (site_id, product_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_customer_groups (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '' NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_customer_groups_site_id_idx ON commerce_customer_groups (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_customers (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        source TEXT DEFAULT 'site' NOT NULL,
        channel_id TEXT,
        external_key TEXT,
        name TEXT NOT NULL,
        email TEXT DEFAULT '' NOT NULL,
        phone TEXT,
        group_id TEXT,
        loyalty_points INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_customers_site_id_idx ON commerce_customers (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_loyalty_entries (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        customer_id TEXT NOT NULL,
        points INTEGER DEFAULT 0 NOT NULL,
        reason TEXT DEFAULT '' NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_loyalty_site_idx ON commerce_loyalty_entries (site_id, customer_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_campaigns (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        name TEXT NOT NULL,
        discount_type TEXT DEFAULT 'percent' NOT NULL,
        value INTEGER DEFAULT 0 NOT NULL,
        audience TEXT DEFAULT 'all' NOT NULL,
        group_id TEXT,
        customer_id TEXT,
        active INTEGER DEFAULT 1 NOT NULL,
        starts_at INTEGER,
        ends_at INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_campaigns_site_id_idx ON commerce_campaigns (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_coupons (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        campaign_id TEXT,
        code TEXT NOT NULL,
        discount_type TEXT DEFAULT 'percent' NOT NULL,
        value INTEGER DEFAULT 0 NOT NULL,
        customer_id TEXT,
        group_id TEXT,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0 NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_coupons_site_id_idx ON commerce_coupons (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_returns (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        source TEXT DEFAULT 'site' NOT NULL,
        order_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        kind TEXT DEFAULT 'return' NOT NULL,
        status TEXT DEFAULT 'requested' NOT NULL,
        reason TEXT DEFAULT '' NOT NULL,
        note TEXT DEFAULT '' NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_returns_site_id_idx ON commerce_returns (site_id)`,
      `CREATE TABLE IF NOT EXISTS commerce_shipping_methods (
        id TEXT PRIMARY KEY NOT NULL,
        site_id TEXT DEFAULT 'default' NOT NULL,
        name TEXT NOT NULL,
        carrier TEXT DEFAULT '' NOT NULL,
        flat_rate_cents INTEGER DEFAULT 0 NOT NULL,
        free_threshold_cents INTEGER DEFAULT 0 NOT NULL,
        enabled INTEGER DEFAULT 1 NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS commerce_shipping_methods_site_id_idx ON commerce_shipping_methods (site_id)`,
    ];

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    // Mevcut veritabanları için geriye dönük uyumlu sütun eklemeleri (idempotent)
    const alters = [
      `ALTER TABLE sites ADD COLUMN settings TEXT DEFAULT '{}'`,
      `ALTER TABLE taxonomies ADD COLUMN image_url TEXT`,
      `ALTER TABLE taxonomies ADD COLUMN sort_order INTEGER DEFAULT 0 NOT NULL`,
      `ALTER TABLE navigation_layouts ADD COLUMN sidebar_config TEXT`,
      `ALTER TABLE commerce_products ADD COLUMN product_kind TEXT DEFAULT 'simple' NOT NULL`,
      `ALTER TABLE commerce_orders ADD COLUMN source TEXT DEFAULT 'site' NOT NULL`,
      `ALTER TABLE commerce_orders ADD COLUMN channel_id TEXT`,
      `ALTER TABLE commerce_orders ADD COLUMN customer_id TEXT`,
      `ALTER TABLE commerce_orders ADD COLUMN coupon_code TEXT`,
      `ALTER TABLE commerce_orders ADD COLUMN discount_cents INTEGER DEFAULT 0 NOT NULL`,
      `ALTER TABLE commerce_orders ADD COLUMN shipping_method_id TEXT`,
      `ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 0 NOT NULL`,
      `ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' NOT NULL`,
      `ALTER TABLE users ADD COLUMN password_changed_at INTEGER`,
      `ALTER TABLE content_chunks ADD COLUMN chunk_hash TEXT`,
      `ALTER TABLE content_chunks ADD COLUMN embedding_model TEXT`,
      `ALTER TABLE content_chunks ADD COLUMN word_count INTEGER DEFAULT 0 NOT NULL`,
    ];
    for (const stmt of alters) {
      try {
        await client.execute(stmt);
      } catch {
        // Sütun zaten mevcut
      }
    }
    await client.execute(
      `CREATE INDEX IF NOT EXISTS content_chunks_model_idx ON content_chunks (site_id, embedding_model)`
    );
    console.log("[NexPress DB] SQLite/LibSQL tabloları ve siteId indeksleri başarıyla oluşturuldu.");
    return;
  }

  const { sql } = getPgClient();
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT,
      domain TEXT NOT NULL,
      subdomain TEXT,
      site_profile TEXT DEFAULT 'corporate' NOT NULL,
      default_locale TEXT DEFAULT 'tr' NOT NULL,
      supported_locales JSONB DEFAULT '["tr"]'::jsonb NOT NULL,
      active_theme_id TEXT DEFAULT 'corporate-aurora' NOT NULL,
      design_tokens JSONB NOT NULL,
      brand_voice JSONB DEFAULT '{}'::jsonb,
      site_dna TEXT,
      style_examples JSONB DEFAULT '[]'::jsonb,
      local_seo JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS sites_site_id_idx ON sites (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sites_domain_uidx ON sites (domain)`;

  await sql`
    CREATE TABLE IF NOT EXISTS navigation_layouts (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      locale TEXT DEFAULT 'tr' NOT NULL,
      header_config JSONB NOT NULL,
      menu_items JSONB NOT NULL,
      footer_config JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS nav_layouts_site_id_idx ON navigation_layouts (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS nav_layouts_site_locale_uidx ON navigation_layouts (site_id, locale)`;

  await sql`
    CREATE TABLE IF NOT EXISTS contents (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      type TEXT DEFAULT 'page' NOT NULL,
      status TEXT DEFAULT 'published' NOT NULL,
      importance_score INTEGER DEFAULT 5 NOT NULL,
      schema_type TEXT DEFAULT 'WebPage' NOT NULL,
      schema_attributes JSONB DEFAULT '{}'::jsonb,
      featured_image TEXT,
      author_name TEXT DEFAULT 'Sistem Editörü' NOT NULL,
      published_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS contents_site_id_idx ON contents (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS contents_site_type_status_idx ON contents (site_id, type, status)`;

  await sql`
    CREATE TABLE IF NOT EXISTS content_translations (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      locale TEXT DEFAULT 'tr' NOT NULL,
      region TEXT DEFAULT 'TR' NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      tldr TEXT,
      blocks JSONB DEFAULT '[]'::jsonb NOT NULL,
      markdown_cache TEXT DEFAULT '' NOT NULL,
      meta_title TEXT,
      meta_description TEXT,
      canonical_url TEXT,
      no_index BOOLEAN DEFAULT FALSE NOT NULL,
      seo_score INTEGER DEFAULT 85 NOT NULL,
      gap_findings JSONB DEFAULT '[]'::jsonb NOT NULL,
      description_source TEXT DEFAULT 'human' NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS content_trans_site_id_idx ON content_translations (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS content_trans_site_locale_slug_uidx ON content_translations (site_id, locale, slug)`;
  await sql`CREATE INDEX IF NOT EXISTS content_trans_content_id_idx ON content_translations (content_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS content_entity_links (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      source_content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      target_content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      relation_type TEXT DEFAULT 'mentions' NOT NULL,
      anchor_text TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS entity_links_site_id_idx ON content_entity_links (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS entity_links_source_idx ON content_entity_links (site_id, source_content_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS installed_themes (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      theme_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT FALSE NOT NULL,
      custom_tokens JSONB DEFAULT '{}'::jsonb,
      installed_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS installed_themes_site_id_idx ON installed_themes (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS installed_themes_site_theme_uidx ON installed_themes (site_id, theme_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS content_chunks (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      locale TEXT DEFAULT 'tr' NOT NULL,
      chunk_index INTEGER DEFAULT 0 NOT NULL,
      heading_path TEXT,
      chunk_text TEXT NOT NULL,
      embedding vector(1536),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS content_chunks_site_id_idx ON content_chunks (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS content_chunks_content_idx ON content_chunks (site_id, content_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS taxonomies (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      taxonomy_type TEXT DEFAULT 'category' NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      color TEXT DEFAULT '#266DF0',
      seo_title TEXT,
      seo_description TEXT,
      item_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS taxonomies_site_id_idx ON taxonomies (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS taxonomies_site_type_slug_uidx ON taxonomies (site_id, taxonomy_type, slug)`;

  await sql`
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT DEFAULT 'image/webp' NOT NULL,
      width INTEGER DEFAULT 1200 NOT NULL,
      height INTEGER DEFAULT 630 NOT NULL,
      size_bytes INTEGER DEFAULT 84000 NOT NULL,
      alt_text TEXT DEFAULT '' NOT NULL,
      title_text TEXT,
      caption TEXT,
      focal_point JSONB DEFAULT '{"x":50,"y":50}'::jsonb,
      seo_score INTEGER DEFAULT 95 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS media_assets_site_id_idx ON media_assets (site_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS comments_reviews (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_email TEXT,
      entry_type TEXT DEFAULT 'review' NOT NULL,
      rating INTEGER DEFAULT 5 NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      pros JSONB DEFAULT '[]'::jsonb,
      cons JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'approved' NOT NULL,
      is_verified BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS comments_reviews_site_id_idx ON comments_reviews (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS comments_reviews_content_idx ON comments_reviews (site_id, content_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS commerce_products (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      content_id TEXT,
      sku TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      short_description TEXT DEFAULT '' NOT NULL,
      description_html TEXT DEFAULT '' NOT NULL,
      price_cents INTEGER DEFAULT 0 NOT NULL,
      compare_at_cents INTEGER,
      currency TEXT DEFAULT 'TRY' NOT NULL,
      stock_quantity INTEGER DEFAULT 0 NOT NULL,
      stock_status TEXT DEFAULT 'instock' NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      image_url TEXT,
      gallery_urls JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS commerce_products_site_id_idx ON commerce_products (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS commerce_products_slug_idx ON commerce_products (site_id, slug)`;
  await sql`CREATE INDEX IF NOT EXISTS commerce_products_sku_idx ON commerce_products (site_id, sku)`;

  await sql`
    CREATE TABLE IF NOT EXISTS commerce_orders (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      order_number TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      shipping_address JSONB NOT NULL,
      billing_address JSONB,
      subtotal_cents INTEGER DEFAULT 0 NOT NULL,
      shipping_cents INTEGER DEFAULT 0 NOT NULL,
      tax_cents INTEGER DEFAULT 0 NOT NULL,
      total_cents INTEGER DEFAULT 0 NOT NULL,
      currency TEXT DEFAULT 'TRY' NOT NULL,
      customer_note TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS commerce_orders_site_id_idx ON commerce_orders (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS commerce_orders_number_idx ON commerce_orders (site_id, order_number)`;

  await sql`
    CREATE TABLE IF NOT EXISTS commerce_order_items (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      title TEXT NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL,
      unit_price_cents INTEGER DEFAULT 0 NOT NULL,
      line_total_cents INTEGER DEFAULT 0 NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS commerce_order_items_site_id_idx ON commerce_order_items (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS commerce_order_items_order_idx ON commerce_order_items (site_id, order_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      email TEXT NOT NULL,
      name TEXT DEFAULT '' NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'editor' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      last_login_at TIMESTAMP,
      session_version INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      password_changed_at TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS users_site_id_idx ON users (site_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_site_email_uq ON users (site_id, email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS bot_daily_stats (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      day TEXT NOT NULL,
      bot_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      trust TEXT NOT NULL,
      hits INTEGER DEFAULT 0 NOT NULL,
      last_seen_at TIMESTAMP NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS bot_daily_stats_site_day_idx ON bot_daily_stats (site_id, day)`;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      at TIMESTAMP DEFAULT NOW() NOT NULL,
      actor_id TEXT,
      actor_email TEXT DEFAULT '' NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT DEFAULT '' NOT NULL,
      ip TEXT DEFAULT '' NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS audit_log_site_at_idx ON audit_log (site_id, at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_channels (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      driver_id TEXT NOT NULL,
      label TEXT NOT NULL,
      enabled BOOLEAN DEFAULT TRUE NOT NULL,
      environment TEXT DEFAULT 'sandbox' NOT NULL,
      credentials JSONB DEFAULT '{}'::jsonb NOT NULL,
      connection_status TEXT DEFAULT 'unknown' NOT NULL,
      last_checked_at TIMESTAMP,
      last_error TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS marketplace_channels_site_id_idx ON marketplace_channels (site_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_jobs (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      channel_id TEXT NOT NULL REFERENCES marketplace_channels(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT DEFAULT '' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS marketplace_jobs_site_id_idx ON marketplace_jobs (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS marketplace_jobs_channel_idx ON marketplace_jobs (site_id, channel_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'default' NOT NULL,
      channel_id TEXT NOT NULL REFERENCES marketplace_channels(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      status TEXT DEFAULT '' NOT NULL,
      buyer_name TEXT DEFAULT '' NOT NULL,
      currency TEXT DEFAULT 'TRY' NOT NULL,
      total_cents INTEGER DEFAULT 0 NOT NULL,
      payload JSONB DEFAULT '{}'::jsonb NOT NULL,
      ordered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS marketplace_orders_site_id_idx ON marketplace_orders (site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS marketplace_orders_external_idx ON marketplace_orders (site_id, channel_id, external_id)`;

  const catalogSql = [
    `CREATE TABLE IF NOT EXISTS commerce_categories (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, parent_id TEXT, name TEXT NOT NULL, slug TEXT NOT NULL, sort_order INTEGER DEFAULT 0 NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_categories_site_id_idx ON commerce_categories (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_product_categories (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, product_id TEXT NOT NULL, category_id TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_product_categories_site_idx ON commerce_product_categories (site_id, product_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_attributes (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_attributes_site_id_idx ON commerce_attributes (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_attribute_values (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, attribute_id TEXT NOT NULL, label TEXT NOT NULL, sort_order INTEGER DEFAULT 0 NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_attribute_values_site_idx ON commerce_attribute_values (site_id, attribute_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_variants (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, product_id TEXT NOT NULL, sku TEXT NOT NULL, price_cents INTEGER DEFAULT 0 NOT NULL, compare_at_cents INTEGER, stock_quantity INTEGER DEFAULT 0 NOT NULL, value_ids JSONB DEFAULT '[]'::jsonb NOT NULL, image_url TEXT)`,
    `CREATE INDEX IF NOT EXISTS commerce_variants_site_product_idx ON commerce_variants (site_id, product_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_customer_groups (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '' NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_customer_groups_site_id_idx ON commerce_customer_groups (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_customers (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, source TEXT DEFAULT 'site' NOT NULL, channel_id TEXT, external_key TEXT, name TEXT NOT NULL, email TEXT DEFAULT '' NOT NULL, phone TEXT, group_id TEXT, loyalty_points INTEGER DEFAULT 0 NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_customers_site_id_idx ON commerce_customers (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_loyalty_entries (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, customer_id TEXT NOT NULL, points INTEGER DEFAULT 0 NOT NULL, reason TEXT DEFAULT '' NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_loyalty_site_idx ON commerce_loyalty_entries (site_id, customer_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_campaigns (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, name TEXT NOT NULL, discount_type TEXT DEFAULT 'percent' NOT NULL, value INTEGER DEFAULT 0 NOT NULL, audience TEXT DEFAULT 'all' NOT NULL, group_id TEXT, customer_id TEXT, active BOOLEAN DEFAULT TRUE NOT NULL, starts_at TIMESTAMP, ends_at TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS commerce_campaigns_site_id_idx ON commerce_campaigns (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_coupons (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, campaign_id TEXT, code TEXT NOT NULL, discount_type TEXT DEFAULT 'percent' NOT NULL, value INTEGER DEFAULT 0 NOT NULL, customer_id TEXT, group_id TEXT, usage_limit INTEGER, used_count INTEGER DEFAULT 0 NOT NULL, active BOOLEAN DEFAULT TRUE NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_coupons_site_id_idx ON commerce_coupons (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_returns (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, source TEXT DEFAULT 'site' NOT NULL, order_id TEXT NOT NULL, order_number TEXT NOT NULL, kind TEXT DEFAULT 'return' NOT NULL, status TEXT DEFAULT 'requested' NOT NULL, reason TEXT DEFAULT '' NOT NULL, note TEXT DEFAULT '' NOT NULL, created_at TIMESTAMP DEFAULT NOW() NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_returns_site_id_idx ON commerce_returns (site_id)`,
    `CREATE TABLE IF NOT EXISTS commerce_shipping_methods (id TEXT PRIMARY KEY, site_id TEXT DEFAULT 'default' NOT NULL, name TEXT NOT NULL, carrier TEXT DEFAULT '' NOT NULL, flat_rate_cents INTEGER DEFAULT 0 NOT NULL, free_threshold_cents INTEGER DEFAULT 0 NOT NULL, enabled BOOLEAN DEFAULT TRUE NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS commerce_shipping_methods_site_id_idx ON commerce_shipping_methods (site_id)`,
  ];
  for (const statement of catalogSql) {
    await sql.unsafe(statement);
  }

  // Mevcut veritabanları için geriye dönük uyumlu sütun eklemeleri (idempotent)
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER DEFAULT 0 NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP`;
  await sql`ALTER TABLE content_chunks ADD COLUMN IF NOT EXISTS chunk_hash TEXT`;
  await sql`ALTER TABLE content_chunks ADD COLUMN IF NOT EXISTS embedding_model TEXT`;
  await sql`ALTER TABLE content_chunks ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0 NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS content_chunks_model_idx ON content_chunks (site_id, embedding_model)`;
  await sql`CREATE INDEX IF NOT EXISTS content_chunks_embedding_hnsw ON content_chunks USING hnsw (embedding vector_cosine_ops)`;
  await sql`ALTER TABLE taxonomies ADD COLUMN IF NOT EXISTS image_url TEXT`;
  await sql`ALTER TABLE taxonomies ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL`;
  await sql`ALTER TABLE navigation_layouts ADD COLUMN IF NOT EXISTS sidebar_config JSONB`;
  await sql`ALTER TABLE commerce_products ADD COLUMN IF NOT EXISTS product_kind TEXT DEFAULT 'simple' NOT NULL`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'site' NOT NULL`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS channel_id TEXT`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS customer_id TEXT`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0 NOT NULL`;
  await sql`ALTER TABLE commerce_orders ADD COLUMN IF NOT EXISTS shipping_method_id TEXT`;

  console.log("[NexPress DB] PostgreSQL 16 + pgvector tabloları ve siteId indeksleri başarıyla oluşturuldu.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pushSchema()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
