# 02 — Veritabanı, Docker ve Örtük Çoklu-Kiracı (Implicit Tenancy) Mimarisi

## 1. Örtük Çoklu-Kiracı (Implicit Site Scoping)

NexPress CMS iki farklı çalışma modunu **tek bir kod tabanıyla** destekler:

1. **`CMS_MODE=single` (Varsayılan — Hızlı Başlangıç):**
   - Kendi sunucusuna veya bilgisayarına kuran kullanıcılar için.
   - Tüm sorgularda `siteId = 'default'` otomatik kullanılır. Admin panelinde kiracı/subdomain seçimi görünmez; sistem saf bir Single-Tenant CMS gibi davranır.
2. **`CMS_MODE=multi_subdomain` (Canlı Demo / SaaS Modu):**
   - Potansiyel kullanıcıların kurulum yapmadan `firma-adi.demo.nexpress.com` alt alan adıyla 30 saniyede kayıt olup sistemi test edebilmesi için.
   - Next.js Middleware gelen `Host` başlığından subdomain'i (`firma-adi`) çözer ve `AsyncLocalStorage` / Request Context içerisine `siteId` olarak enjekte eder.
   - Tüm veritabanı okuma/yazma işlemleri, medya yolları (`/uploads/{siteId}/`) ve Next.js önbellek etiketleri (`site:{siteId}:*`) birbirinden %100 izole çalışır.

---

## 2. Çift Veritabanı Stratejisi: LibSQL (SQLite) $\leftrightarrow$ PostgreSQL + `pgvector`

Kullanıcıların Docker ile uğraşmadan saniyeler içinde başlayabilmesi, ancak büyüdüklerinde kurumsal PostgreSQL + `pgvector` gücüne geçebilmesi için **Çift Motorlu (Dual-Dialect) Repository Katmanı** kullanılır:

| Özellik | Seçenek A: Hızlı Başlangıç (`DB_DIALECT=sqlite`) | Seçenek B: Geniş Paket (`DB_DIALECT=postgresql`) |
| :--- | :--- | :--- |
| **Motor** | **LibSQL (`@libsql/client`)** — Tek dosya (`./data/nexpress.db`) | **PostgreSQL 16 + `pgvector`** (`docker-compose.yml`) |
| **Docker Gereksinimi** | **Hayır** (Sıfır bağımlılık, `pnpm dev` ile anında çalışır) | **Evet** (`docker compose up -d` ile hazır konteyner) |
| **Vektör / RAG Desteği** | Yerleşik `F32_BLOB(1536)` + `vector_distance_cos()` | Yerleşik `vector(1536)` + `HNSW` indeksleme |
| **Geçiş Komutu** | `pnpm db:migrate-engine --from=sqlite --to=postgresql` komutuyla tek tıkla kayıpsız aktarım | — |

---

## 3. Çekirdek Veritabanı Tabloları (`packages/database`)

Tüm tablolar `siteId` kapsamındadır:

1. **`sites`:**
   - `id` (`'default'` veya subdomain slug), `name`, `domain`, `subdomain`, `siteProfile` (`'corporate' | 'ecommerce' | 'news'`), `activeThemeId` (`'corporate-aurora'`), `designTokens` (JSON), `brandVoice` (JSON), `siteDna` (Text), `styleExamples` (JSON), `localSeo` (JSON).
2. **`locales` ayrı tablo değildir.** Desteklenen diller `sites.supportedLocales` içindedir. Şimdilik arayüz ve varsayılan içerik `tr`dir.
3. **`navigationLayouts` (Header, Footer & Mega-Menü Şeması):**
   - `id`, `siteId`, `locale`, `headerConfig` (3 katmanlı: Top/Main/Bottom bar ve Sol/Orta/Sağ blok dizilimi), `footerConfig` (Çok sütunlu grid ve widget dizilimi), `megaMenus` (Görsel kart ve ürün destekli açılır menü ağacı).
4. **`contents` & `contentTranslations`:**
   - Polimorfik içerik yapısı (`page`, `post`, `kb_tech`, `ai_prompt`, `product`, `campaign`).
   - `tldr` (Answer-First 2-3 cümlelik özet), `blocks` (BlockNode JSON AST; metin bloklarında `props.html`), `markdownCache` (önceden derlenmiş saf Markdown), `schemaType`, `schemaAttributes` (GTIN, MPN, Fiyat, `soft_os`), `seoScore`, `gapFindings`.
5. **`contentEntityLinks`:**
   - Makaleler (`kb_tech`), ürünler (`product`) ve kampanyalar (`campaign`) arasındaki `@id` (`mentions`, `about`, `offer_for`) bağlantıları.
6. **`installedThemes`:**
   - Etkin tema ve token özelleştirmesi. Ayrı bir `installedPlugins` tablosu yoktur; Pro eklentiler `apps/cms/src/plugins/register.ts` ile kaydolur.
7. **`taxonomies` (Hiyerarşik Kategori Ağacı, Etiket, Görsel ve Taksonomi SEO Şeması):**
   - `id`, `siteId`, `taxonomyType` (`'category' | 'tag' | 'product_cat' | 'kb_topic'`), `slug`, `name`, `description`, `parentId` (sınırsız alt/üst kategori ağacı), `imageUrl` (kategori kapak görseli), `sortOrder` (sıralama), `color`, `seoTitle`, `seoDescription`, `itemCount`.
   - Silinen bir üst kategorinin alt kategorileri `deleteTaxonomy()` içinde otomatik olarak bir üst ebeveyne (`parentId`) aktarılır.
8. **`sites.settings` (Tema özelleştirici ve çekirdek SEO ayarları):**
   - `SiteSettings` JSON şeması altında `customizer` (`SiteCustomizerSettings`) ve `seo` (`SeoEngineSettings`) yapılandırmaları saklanır.
9. **`mediaAssets` (Medya Kütüphanesi & Görsel SEO Şeması):**
   - `id`, `siteId`, `filename`, `url`, `mimeType`, `width`, `height`, `sizeBytes`, `altText` (Zorunlu Görsel SEO sinyali), `titleText`, `caption` (`figcaption`), `focalPoint` (`{x, y}`), `seoScore`.
10. **`commentsReviews` (Yorum, 5 Yıldızlı İnceleme & `AggregateRating` Şeması):**
   - `id`, `siteId`, `contentId`, `authorName`, `entryType` (`'comment' | 'review'`), `rating` (`1..5`), `title`, `body`, `pros` (Artılar JSON), `cons` (Eksiler JSON), `status` (`'approved' | 'pending' | 'spam'`), `isVerified`.
11. **`commerceProducts`, `commerceOrders`, `commerceOrderItems` ve katalog genişlemesi:**
   - Ürün: fiyat (kuruş), stok, `productKind` (`simple` | `variable`). Sipariş: `source` (`site` | `marketplace`), kupon, indirim, kargo yöntemi.
   - `commerceCategories`, `commerceAttributes` / `commerceAttributeValues`, `commerceVariants`.
   - `commerceCustomers` (`source`), `commerceCustomerGroups`, `commerceLoyaltyEntries`.
   - `commerceCampaigns`, `commerceCoupons`, `commerceReturns`, `commerceShippingMethods`.
   - Ayrıntı: `docs/09-COMMERCE.md`.
12. **`marketplaceChannels`, `marketplaceJobs`, `marketplaceOrders`:**
   - Kanal başına sürücü kimliği, kimlik bilgisi JSON ve bağlantı durumu. İş günlüğü ve çekilen dış siparişler. Ayrıntı: `docs/10-MARKETPLACES.md`.
13. **`users`:**
   - `id`, `siteId`, `email` (küçük harf, `(siteId, email)` tekil), `name`, `passwordHash` (`scrypt$…`), `role` (`admin` | `editor`), `status` (`active` | `disabled`), `sessionVersion`, `passwordChangedAt`, `createdAt`, `lastLoginAt`, iki adımlı doğrulama: `totpSecret` (`secret-box` şifreli), `totpEnabledAt`, `totpLastStep`, `recoveryCodes` (SHA-256 özetleri, JSON).
   - `audit_log`: `id`, `siteId`, `at` (SQLite'ta ms), `actorId`, `actorEmail`, `action`, `target`, `detail` (≤500), `ip`; indeks `(siteId, at)`; yalnızca eklenir.
   - `sites.settings.general`: `contactEmail`, `timezone`. Ayrıntı: `docs/11-SECURITY-AND-OPERATIONS.md`.
   - Pazar yeri `credentials` alanı değerleri `enc:v1:` önekiyle şifreli saklanır.
14a. **`content_chunks` (RAG dizini):**
   - `siteId`, `contentId`, `locale`, `chunkIndex`, `headingPath`, `chunkText`, `chunkHash`, `embeddingModel`, `wordCount`; vektör PostgreSQL'de `embedding vector(1536)` (HNSW), SQLite'ta `embedding_json` içinde `f32:<base64>`. Ayrıntı: `docs/04` §9.
14. **`bot_daily_stats`:**
   - `id` (`siteId|gün|bot|tür|güven`), `siteId`, `day` (UTC, `YYYY-MM-DD`), `botId`, `kind`, `trust` (`verified` | `claimed`), `hits`, `lastSeenAt`. İndeks `(siteId, day)`. Ayrıntı: `docs/04` §7.

> **Dil listesi (kural 8):** `sites.supportedLocales` varsayılanı ve seed `["tr"]`'dır; listede olmayan dil kökleri (`/en`, `/zzz`) 404 döner. Önceden `["tr","en"]` ile kurulmuş bir veritabanında seed yeniden çalışmaz (site zaten vardır); değeri elle düzeltin:
> `UPDATE sites SET supported_locales = '["tr"]' WHERE site_id = 'default';` (PostgreSQL için `'["tr"]'::jsonb`). İkinci dil eklenirken önce içerik çevirileri, sonra bu liste güncellenir.

## Göçler (migrations) ve şema doğrulama

- **Kaynak şema:** `packages/database/src/schema/{sqlite,pg}.ts` (`content_revisions`, `site_plugins`, `agent_requests`, `ai_referral_daily`, `seo_intel_signals`, `seo_intel_clusters`, `content_imports` dahil). Değişiklik yalnızca burada yapılır.
- **Göç üretimi:** `pnpm db:generate` → `packages/database/migrations/{sqlite,pg}/NNNN_ad.sql` (+ `meta/`). Dosyalar commit edilir; PostgreSQL tabanı `CREATE EXTENSION vector` ile başlar. Taban: `0000_baseline`; ilk gerçek göçler `0001_content_revisions`, `0002_site_plugins`, `0003_agent_requests_ai_referrals`, `0004_translation_status` (`content_translations.translation_status / source_locale / source_hash`), `0005_translation_attributes` (`content_translations.attributes`: çeviriye özgü yayın öznitelikleri), `0006_user_ui_locale` (`users.ui_locale`: panel dili), `0008_redirects_not_found` (`redirects`, `not_found_log`), `0009_form_submissions` (`form_submissions`: form gönderimleri, `status`, `ip_hash`), `0014_two_factor` (`users.totp_secret / totp_enabled_at / totp_last_step / recovery_codes`), `0013_design_library` (`design_library`: AI/elle tasarımlar, `payload` JSON, rapor, yer tutucu bayrağı), `0012_notifications` (`notifications`, `notification_reads`), `0011_media_folders` (`media_folders`: ağaç; `media_assets.folder_id`), `0010_forms_builder` (`forms`: kurucu form tanımları `spec`/`notify` JSON; `form_submissions.notify_status/notify_error`), `0007_theme_packages` (`installed_themes`: `source`, paket meta, `package_tokens`, `css`/`raw_css`, `header`/`footer`, `pages`, `screenshot`, `checksum`), `0018_majestic_thor` / `0018_hesitant_wallflower` (`seo_intel_signals`, `seo_intel_clusters`, `content_imports`: kelime havuzu ve link taslağı), `0019_superb_leech` / `0019_secret_grandmaster` (`prev_position10`, `body_hash`) (`0002`: kiracı başına eklenti durumu: `plugin_id`, `enabled`, `modules`, `settings`, `license_key`); ilk göç `0001_content_revisions` (içerik revizyonları tablosu: `site_id`, `content_id`, `locale`, `snapshot` JSON, `snapshot_hash`, yazar, blok/kelime sayısı).
- **Uygulama:** `pnpm db:migrate` (`db:push` aynı komuta bağlıdır). Çalıştırıcı (`scripts/migrate.ts`): *boş veritabanı* → göçler baştan (`fresh`); *eski/`push.ts` veritabanı, günlük yok* → eski betikle güncel tabana getirir, `0000`'ı "uygulandı" işaretler (`baselined`, **veri korunur**); *günlük var* → yalnızca bekleyenler (`upgraded`/`current`). PostgreSQL'de eşzamanlı çalıştırıcılara karşı `pg_advisory_lock`. `NEXPRESS_MIGRATIONS_DIR` yalnızca testler içindir.
- **`push.ts` dondurulmuştur:** değiştirilmez; yalnızca eski veritabanlarını tabana taşımak için çağrılır.
- **Testler (`packages/database/test`, SQLite + `DB_TEST_PG_URL` ile PostgreSQL; her dosya kendi geçici PG veritabanını açıp siler):**
  - `schema-parity`: iki şema tablo/sütun/NOT NULL/birincil anahtar/indeks adlarında birebir (321 sütun, 48 indeks), her tabloda `site_id` + indeks (kural 2). Bilinen farklar: `content_chunks.embedding_json`↔`embedding`, yalnızca PG'de HNSW.
  - `push-parity`: `push.ts` ile kurulan GERÇEK veritabanı şemayla birebir (test, `push.ts`'te SQLite için eksik iki indeksi buldu ve düzeltildi).
  - `migrate`: boş veritabanı → şemayla aynı; eski veritabanı → baz + veri korunur; **gerçek bir 0001 göçü üretilip mevcut veritabanına uygulanır**; şema değişip göç üretilmemişse (`drizzle-kit generate` "değişiklik yok" demezse) test düşer (bozularak doğrulandı).
- **Tek kod yolu (`src/dialect.ts`):** `backendFor(dialect)` iki motor için tabloları ve istemciyi aynı tipe daraltır; depolar motor dalı içermez. `upsertScoped` ve tüm depolardaki `onConflictDoUpdate({ setWhere siteId })` kiracıya kapalı atomik upsert yapar (`setWhere siteId`; mutasyon testiyle doğrulandı: korumasız hâlde başka kiracının satırı ele geçirilebiliyordu). Önceki kodda SQLite dalı kimliğe göre kiracıdan bağımsız güncelliyor, PostgreSQL dalı `siteId`'yi bile üzerine yazıyordu.
- **Depo yapısı:** `ScopedCmsRepository` = `base → site → navigation → media → comments → taxonomy → content-read → content-write` kalıtım zinciri (`src/cms/*`); genel API ve içe aktarma yolları değişmedi. `test/cms-repository.test.ts` (11) ve `test/commerce-repository.test.ts` (6) iki motorda davranışı sabitler.

## Ek (2026-11-02): medya ve MCP günlüğü tabloları

- `media_assets` (göç `0015_media_seo`): `description` (WordPress "Açıklama"), `kind` (`image` | `document` | `video` | `audio`). `seoScore` artık `scoreMediaSeo` (çekirdek, saf) ile hesaplanır; sabit/uydurma puan yoktur.
- `mcp_request_log` (göç `0016_mcp_log`): `tool`, `agent` (User-Agent, en çok 80 karakter; ajan anahtarı ASLA yazılmaz), `ok`, `duration_ms`, `at`; `(site_id, at)` indeksi. Yalnızca Pro `mcp-log` modülü açıkken yazılır; 90 günden eski kayıtlar kendiliğinden silinir (`McpLogRepository`).

- Göç `0017_taxonomy_template`: `taxonomies.template_id` (kategori/etiket arşivi şablonu; boş = türün varsayılanı). Şablonlar ayrı tablo değildir: `contents` içinde `type: "template"`, ayar `schemaAttributes.template = { kind, isDefault }`, atama `schemaAttributes._template`.

- **Adres benzersizliği (2026-11-03):** `content_translations(site_id, locale, slug)` benzersiz indeksi tüm satırları kapsar. Yeni içerik kaydında dolu adres `saveContent` içinde `-2`, `-3` ile benzersizleşir; mevcut içeriğin adresi değişmez ve çakışırsa veritabanı hatası verir.
