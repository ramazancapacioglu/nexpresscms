# 25 — Kapsamlı Proje İnceleme, Doküman Kıyaslama ve Durum Raporu

> **Tarih:** 2026-11-09  
> **Kapsam:** Monorepo genelindeki tüm paketler (`packages/*`, `plugins-pro/*`, `apps/cms`), veritabanı şemaları ve göçleri (`0000`–`0020`), CI/CD iş akışları ve `docs/01` – `docs/24` dokümantasyon seti.

---

## 1. Yönetici Özeti ve Genel Durum

NexPress CMS; açık çekirdekli (**Open-Core**), hem insan ziyaretçiler (**100/100 RSC, 0-KB sayfa-özel istemci JS**) hem de yapay zeka ajanları (**MCP, `/llms.txt`, `/llms-full.txt`, `?format=md`, `@id` Entity Graph**) için tasarlanmış çift motorlu mimarisini **Faz 0'dan Faz 6'ya kadar %100 tamamlamış**, **Faz 7 – Faz 14** kapsamındaki güvenlik, çok dillilik, eklenti sistemi, tema paketleri, tasarım stüdyosu, e-ticaret, pazar yeri ve canlı WordPress köprüsü hedeflerinin büyük bölümünü canlıya (`ileriseo.com` üzerinde PostgreSQL 16 + `pgvector` ile) almış durumdadır.

### Monorepo Paket ve Eklenti Envanteri
- **Açık Çekirdek Paketleri (`packages/*` — 9 Paket):**
  1. `@nexpress/core` (`packages/core/src/index.ts`): 59 modül — Hook/Slot Bus, Implicit Tenancy, Markdown derleyici, blok stil motoru, AI tasarım sözleşmesi (`AI_BLOCK_CATALOG`), menü, şablon, form, kampanya, medya SEO, içerik ağırlığı (`content-weight`), TOTP ve `secret-box`.
  2. `@nexpress/database` (`packages/database/src/schema/sqlite.ts` & `pg.ts`): LibSQL/SQLite ve PostgreSQL/`pgvector` çift diyalektli **33 tablo**, **21 göç dosyası** (`0000_baseline` – `0020_silent_jackal`), `backendFor(dialect)` ile tek kod yolu ve `upsertScoped` kiracı izolasyonu.
  3. `@nexpress/themes` (`packages/themes/src/registry.ts`): **6 resmi tema** (`corporate-aurora`, `commerce-velocity`, `editorial-pulse`, `ink-grid`, `crimson-erp`, `yazilim-firmasi`), `.nxtheme` veri paketi doğrulayıcısı ve 0-KB RSC blok çizicileri.
  4. `@nexpress/editor` (`packages/editor/src/library.ts`): **77 blok türü** (`BLOCK_TYPES`), **194 hazır tasarım kütüphanesi öğesi**, tam sayfa başlangıç paketleri.
  5. `@nexpress/seo-core` (`packages/seo-core/src/index.ts`): 17 kriterli SEO analizi, parçalı XML Sitemap + Hreflang, RSS/Atom, JSON-LD grafik derleyici & doğrulayıcı, GSC / GA4 / Bing / Yandex API istemcileri.
  6. `@nexpress/rag`: Başlık duyarlı parçalayıcı (`chunker`), yerel sözcüksel + OpenAI anlamsal gömme, BM25 + Vektör **RRF hibrit arama**.
  7. `@nexpress/i18n` (`packages/i18n/src/index.ts`): Derleme zamanı tip güvenli `tr` / `en` mesaj kataloğu (0-KB kuralı gereği yalnızca sunucuda).
  8. `@nexpress/commerce` & `@nexpress/marketplace`: Katalog, varyasyon, sepet, sipariş, kupon, sadakat ve 5 pazaryeri sürücüsü (Trendyol, Hepsiburada, n11, Amazon, Çiçeksepeti).
  9. `@nexpress/wp-importer`: WXR (XML) ayrıştırıcı, canlı HTML kabuk okuyucu (`readPublicShell`) ve WordPress Köprüsü (`0.2.3`) dönüştürücüleri.
- **Kompozisyon Kökü (`apps/cms/src/plugins/register.ts`) — Kayıtlı 9 Eklenti:**
  - **2 Lisanslı Pro Eklenti (`plugins-pro/*`):** `@nexpress-pro/agentic-seo` (v6.0, 33 modül) ve `@nexpress-pro/ai-design`.
  - **7 Ücretsiz/Yerleşik Eklenti (`apps/cms/src/plugins/*`):** `@nexpress/seo-basic`, `@nexpress/plugin-campaigns`, `@nexpress/plugin-design-studio`, `@nexpress/plugin-wp-bridge` (`0.2.3`), `@nexpress/plugin-commerce`, `@nexpress/plugin-marketplaces`, `@nexpress/plugin-perfornext`.

---

## 2. `AGENTS.md` Zorunlu Mimari Kuralları Uyum Denetimi

| Kural | Başlık | Kod Tabanı Durumu | Uyum |
| :--- | :--- | :--- | :--- |
| **Kural 1** | **Eş Zamanlı Dokümantasyon (`docs/` Senkronizasyonu)** | `docs/01`–`docs/24` ve `docs/06-PROGRESS-LOG.md` düzenli güncellenmiş. Küçük birkaç sayısal/liste sapması Aşama 1'de kapatıldı. | ✅ **%100** |
| **Kural 2** | **Örtük Çoklu-Kiracı (`siteId` & `cachedRead`)** | `sqlite.ts` ve `pg.ts` içindeki **33 tablonun tamamında** `siteId` sütunu ve indeksi var (`schema-parity` testiyle zorlanıyor). Tüm yazmalar `upsertScoped` (`setWhere siteId`) kullanıyor. | ✅ **%100** |
| **Kural 3** | **Çift Veritabanı (LibSQL/SQLite & PostgreSQL/pgvector)** | `packages/database` dışında ham SQL yok. Depolar `backendFor(dialect)` üzerinden tek kod yolu kullanıyor; yalnızca vektör araması (`chunk-repository`) motora göre dallanıyor. | ✅ **%100** |
| **Kural 4** | **Open-Core & Pro Eklenti Sınırı (`Slot & Hook Bus`)** | Çekirdek paketlerde `@nexpress-pro/*` importu sıfır. Tek kompozisyon kökü `apps/cms/src/plugins/register.ts`. Kapılar `isPluginModuleEnabled` ve `site_plugins` tablosu ile çalışıyor. | ✅ **%100** |
| **Kural 5** | **Tema Motoru, Görsel Editör ve 0-KB RSC Hızı** | Ziyaretçi sayfalarında `"use client"`, `next/link` veya `next-themes` yok. `perf-budget.json` ile rota kodu ≤ **1.0 kB** (ölçülen 0.70 kB), toplam paylaşılan çalışma zamanı ≤ **108 kB** CI'da denetleniyor. | ✅ **%100** |
| **Kural 6** | **Kurumsal Admin UI/UX & Üçüncü Parti Ad Yasağı** | Attio tarzı keskin `shadcn/ui` arayüz, karanlık/aydınlık mod, `⌘K` komut paleti, axe-core AA erişilebilirlik taraması (`a11y-audit.mjs`) devrede. | ✅ **%100** |
| **Kural 7** | **Dosya Boyutu (~400 Satır Sınırı)** | Büyük dosyalar (`renderer`, `block-inspector`, `repository`, `seed`, `dual-mode-editor-client`) bölünmüş; kalan 400+ satırlık dosyalar Aşama 2'de alt modüllere ayrıldı. | ✅ **%100** |
| **Kural 8** | **Dil ve Tek Dilde Ön Eksiz URL (`localeBase`)** | `middleware.ts` tek dilde `/tr/x` → 308 `/x` yönlendirmesi ve dahili rewrite yapıyor. `@nexpress/i18n` derleme zamanı tip güvenli. | ✅ **%98** |
| **Kural 9** | **Güvenlik (`requireUser`, `secret-box`, `scrypt`, Test)** | Admin server action'larda `requireUser({ audit })` / `requireAdmin()`, 4 katmanlı oturum doğrulaması, RFC 6238 TOTP 2FA, SSRF korumalı `safe-fetch`, sahte veri yasağı ("Demo verisi" etiketi) eksiksiz uygulanmış. | ✅ **%100** |

---

## 3. Doküman Seti (`docs/01` – `docs/24`) ve Kod Tabanı Kıyaslama Matrisi

| Doküman | Kapsam | Kod Tabanındaki Karşılığı | Durum |
| :--- | :--- | :--- | :--- |
| `01-ARCHITECTURE.md` | Monorepo & Çift Motorlu Mimari | `apps/cms`, `packages/*` (9 paket), `plugins-pro/*` (2 paket) | ✅ Tam Uyumlu |
| `02-DATABASE-AND-TENANCY.md` | Drizzle Şeması, Göçler, Tenancy | `sqlite.ts` & `pg.ts` (33 tablo), `0000`–`0020` göçleri | ✅ Tam Uyumlu |
| `03-THEME-STORE-AND-EDITOR.md` | Tema Mağazası, 0-KB RSC Editör, Stüdyo v3 | `packages/themes`, `packages/editor`, `/admin/contents`, `/admin/themes` | ✅ Tam Uyumlu |
| `04-CORE-SEO-AND-GEO.md` | Çekirdek SEO, Sitemap, RAG, Medya Hattı, GSC/GA4 | `packages/seo-core`, `packages/rag` | ✅ Tam Uyumlu |
| `05-PRO-PLUGINS-AND-RAG.md` | `@nexpress-pro/agentic-seo` & `@nexpress-pro/ai-design` | `plugins-pro/agentic-seo-pro`, `plugins-pro/ai-design` | ✅ Tam Uyumlu (33 modül `ready`) |
| `06-PROGRESS-LOG.md` | Canlı Geliştirme Günlüğü | Tüm son commit ve özellikler | ✅ Güncel |
| `07-AI-PAGE-AND-BLOCK-SPEC.md` & `08-AI-CHROME-SPEC.md` | AI Sayfa, Blok, Header/Footer Sözleşmeleri | `packages/core/src/ai-design/catalog.ts`, `header-layout.ts` | ✅ Tam Uyumlu |
| `09-COMMERCE.md` & `10-MARKETPLACES.md` | E-Ticaret ve Sanal Mağaza Eklentileri | `@nexpress/plugin-commerce`, `@nexpress/plugin-marketplaces` | ✅ Tam Uyumlu |
| `11-SECURITY-AND-OPERATIONS.md` | Güvenlik, 2FA, Denetim, Yedekleme, CI, Perfornext | `.github/workflows/ci.yml`, `@nexpress/plugin-perfornext` | ✅ Tam Uyumlu |
| `12-ROADMAP.md` & `13-PLUGINS-AND-THEME-PACKAGES.md` | Yol Haritası, Eklenti & Tema Paketleri, Panel Eksikleri | `site_plugins`, `installed_themes`, 24 panel modülü | 🔄 F8–F12 tamam, F13–F14 son dilimler |
| `14-MULTILINGUAL-PLAN.md` | Çok Dilli Altyapı & Ön Eksiz Tek Dil | `packages/i18n`, `locale-path.ts`, `middleware.ts` | ✅ Tam Uyumlu |
| `15-AGENTIC-PRO-MIGRATION.md` | Agentic Content Ops Taşıma Planı | `plugins-pro/agentic-seo-pro/src/*` | ✅ 33 modül tamamlandı |
| `16-FORMS.md` | Sürükle-Bırak Form Kurucu, `:has()` Koşullu Alan, Webhook | `forms`, `form_submissions`, `rsc-form.tsx` | ✅ Tam Uyumlu |
| `17-WORDPRESS-IMPORT.md` & `24-WP-BRIDGE.md` | WXR İçe Aktarma & Canlı WordPress Köprüsü (`0.2.3`) | `packages/wp-importer`, `@nexpress/plugin-wp-bridge` | ✅ Tam Uyumlu |
| `18-PANEL-AND-AI-DESIGN-PLAN.md` & `19-DEPLOYMENT.md` | Tasarım Stüdyosu (`/admin/studio`) & Dağıtım (`ileriseo.com`) | `@nexpress/plugin-design-studio`, `scripts/install-host.sh` | ✅ Tam Uyumlu |
| `20-REFERENCE-ANALYSIS-AND-EDITOR-PLAN.md` & `21-EDITOR-DIRECTION.md` | Editör Mimari Kararı & Faz 1–5 Zenginleştirme | `packages/editor`, `apps/cms/src/components/admin/editor/*` | ✅ Tam Uyumlu |
| `23-THEME-AND-DESIGN-AUTHORING.md` | Modele Verilecek Tema/Kütüphane/Şablon Sözleşmesi | `types.ts`, `catalog.ts`, `library.ts` | ✅ Tam Uyumlu |

---

## 4. Aşamalı Tamamlama Planı ve Güncel Durum

### Aşama 1 — Doküman ↔ Kod Senkronizasyonunun %100 Hizalanması (✅ Tamamlandı — 2026-11-09)
1. ✅ `docs/02-DATABASE-AND-TENANCY.md`: `0020_silent_jackal` göçü (`comments_reviews.parent_id`, `tags` ve `comments_reviews_parent_idx`) eklendi.
2. ✅ `docs/01-ARCHITECTURE.md` & `pnpm-workspace.yaml`: Klasör haritasına `packages/i18n`, `packages/commerce` ve `packages/marketplace` eklendi; `pnpm-workspace.yaml` içinden kaldırılmış olan `"themes/*"` satırı temizlendi.
3. ✅ `docs/05-PRO-PLUGINS-AND-RAG.md`: §3 tablosundaki `nexpress_create_lead` satırı `agent_requests` tablosu ve `/admin/requests` ile kalıcı olduğunu yansıtacak şekilde güncellendi.
4. ✅ `docs/23-THEME-AND-DESIGN-AUTHORING.md` & `docs/03-THEME-STORE-AND-EDITOR.md`: Kütüphane öğe sayısı (194 öğe), `GLOBAL_COLOR_PALETTES` sayısı (6 palet) ve `vector_mark` katalog dışı blok türü hizalandı.

### Aşama 2 — Dosya Boyutu Kuralı (`AGENTS.md` Kural 7 — ≤400 Satır) Temizliği (✅ Tamamlandı — 2026-11-09)
1. ✅ `apps/cms/src/components/admin/admin-nav.ts` (522 → 384 satır + `admin-nav-meta.ts`).
2. ✅ `packages/core/src/types.ts` (476 → 302 satır + `types-chrome.ts`) ve `packages/core/src/site-settings.ts` (520 → 402 satır + `site-settings-defaults.ts`).
3. ✅ `packages/themes/src/registry.ts` (461 → 296 satır + `palettes.ts`).
4. ✅ `packages/database/src/commerce-repository.ts` (436 → 370 satır + `commerce-mappers.ts`) & `commerce-ops-repository.ts` (412 → 395 satır).

### Aşama 3 — Açık Kalan Özellik ve Altyapı Dilimleri (`F12` – `F14`) (✅ Tamamlandı — 2026-11-09)
1. ✅ **Kısıtlı / Parolalı İçerik (`visibility: "password"` / `"members_only"`) Ziyaretçi Kapısı:** `@nexpress/core/content-access`, `/api/content-access`, 0-KB RSC `<ContentAccessGate>`, `?format=md` 403 koruması ve birim testleri (`packages/core/test/content-access.test.ts`) eklendi.
2. ✅ **Pro Eklenti Lisans Doğrulama (`Ed25519` Çevrimdışı İmza):** `@nexpress/core/plugin-license` (`nxlic_v1...` Ed25519 imza üretimi ve doğrulaması), süresi dolan lisansta veriyi silmeden kapıyı duraklatan `resolvePluginState` entegrasyonu, `/admin/plugins` üzerinde lisans durumu/girişi ve birim testleri (`packages/core/test/plugin-license.test.ts`) eklendi.
3. ✅ **Dil Başına Site Ayarları (`docs/14` L2):** `resolveLocalizedSiteIdentity` ve `/admin/settings` (`LocalesCard`) ile ikincil dillerde site adı, slogan, `titleTemplate` ve `homeTitleTemplate` yönetimi eklendi.
4. ✅ **Tamamlandı (Aşama 4 & Perfornext v1.2.0):**
   - **Perfornext Performans Merkezi v1.2.0 (`/admin/perfornext`):** 5 modül (`budget`, `cache`, `database`, `media`, `content`), çok dilli önbellek ön ısıtma (`warmCacheAction`), veritabanı şişkinlik tablosu izleme + eski revizyon budama (`pruneRevisionsAction`) + 404/çöp temizliği (`clearLogsAndTrashAction`), medya hattı denetimi (`mediaStats` + `findUnusedIds`), Core Web Vitals (CLS/LCP/DOM/HTML KB) analizi ve `markdownCache` yeniden derleme (`recompileMarkdownAction`).
   - **CLI Yedekleme (`pnpm db:export` / `pnpm db:import`):** `packages/database/src/scripts/backup-cli.ts`.
   - **SEO İç Bağlantı Önericisi (`suggestInternalLinks`):** `packages/core/src/internal-links.ts` ve `/admin/seo/audit` entegrasyonu.
   - **Kaynak Atıflı 0-KB RSC Arama Özeti (`synthesizeSearchAnswer`):** `packages/core/src/search.ts` ve `/[locale]/ara` entegrasyonu.
