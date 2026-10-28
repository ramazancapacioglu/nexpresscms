# 05 — Pro Eklentiler: Agentic SEO Gateway & RAG İçerik Fabrikası (`plugins-pro/*`)

WSL üzerindeki `agentic-content-ops` (Faz 1–12) ve `agentic-seo-gateway` (v5.8.0) projelerinin tüm ileri düzey yetenekleri iki ticari **Pro Eklenti** olarak çekirdeğin `Slot & Hook` yuvalarına bağlanır.

> [!IMPORTANT]
> **Kural 4:** `packages/*` ve `apps/cms` özellik kodu `@nexpress-pro/*` import etmez. Tek kompozisyon kökü `apps/cms/src/plugins/register.ts` dosyasıdır. Etkileşimin geri kalanı `cmsHooks` ve `<PluginSlot />` üzerindedir.

---

## 1. Pro Eklenti A: `@nexpress-pro/agentic-seo` (`plugins-pro/agentic-seo-pro`)

Çekirdekteki temel SEO ve `/llms.txt` yeteneklerini kurumsal bir **AIO / GEO / Entity Graph** merkezine dönüştürür:

1. **Bağlantılı `@id` Entity Knowledge Graph (`seo:buildSchemaGraph` Hook — `src/index.tsx`):**
   - `SoftwareApplication` (işletim sistemi, lisans, teknik özellikler, `importanceScore` 1-10).
   - `Product` (GTIN/EAN, MPN, SKU, marka, fiyat, stok).
   - `Offer` (`/kampanya/{slug}` kampanyalarını doğrudan ilgili ürünün `#product` veya `#softwareapplication` düğümüne bağlar).
   - `TechArticle` (`kb_tech` makalelerini `mentions` ve `about` ile ürünlere bağlar) ve `FAQPage` (`/soru/{slug}`).
2. **İleri Düzey LLMO & Keşif Beslemeleri (`apps/cms/src/app/`):**
   - **4-Katmanlı `/llms-full.txt`** (Kimlik, Önem skorlu ürünler, Aktif kampanyalar, Bilgi bankası ve tüm `markdownCache` külliyatı).
   - **`/ai-sitemap.json`** (`importanceScore` 1-10 ağırlıklı, `tldr` özetli ve `entityGraphLinks` bağlantılı JSON beslemesi).
   - **`/.well-known/mcp.json`** keşif manifestosu.
3. **Yerleşik WebMCP Sunucusu (`/api/mcp` & `src/mcp-server.ts`):**
   - JSON-RPC 2.0 `tools/list` ve `tools/call` protokolü (`mcp:handleRequest` kancası).
   - Salt-okunur (`nexpress_search_corpus`, `nexpress_fetch_markdown`, `nexpress_ask_site_dna`) ve `X-Agent-Key` korumalı yazma aracı (`nexpress_create_lead`).
4. **Bot Tarama Günlüğü kartı (`src/bot-telemetry-card.tsx`):**
   - Bot imzaları çekirdektedir (`@nexpress/core` `ai-bots.ts`); `src/bot-verifier.ts` eski adlarla yeniden dışa aktarır.
   - `dashboard.overview.cards` yuvasına `bot_daily_stats` tablosundan beslenen kartı enjekte eder (bot başına toplam, tür dağılımı, doğrulama oranı, son görülme).

---

## 2. Pro Eklenti B: `@nexpress-pro/content-ops` (`plugins-pro/content-ops-pro`)

Editörün sağ çekmecesine (`editor.sidebar.tabs`) ve ana panele (`dashboard.overview.cards`) tam kapsamlı bir **İçerik Üretim Fabrikası** ekler:

1. **Site DNA & Guardrail Kalkanı (`src/guardrails.ts`):**
   - `DEFAULT_FORBIDDEN_PHRASES` (*"bu makalede"*, *"sonuç olarak"*, *"özetlemek gerekirse"*, *"günümüzde"* vb.) ile yapay AI klişelerini tespit eder.
   - `content:beforeSave` kancasına bağlanarak Answer-First `tldr` uzunluğunu, kelime derinliğini ve klişe bulunmama durumunu denetleyip dinamik `seoScore` hesaplar (`auditContentGuardrails`).
2. **8 Kaynaklı Hibrit Soru Madenciliği (`src/question-mining.ts`):**
   - Google Search Console (`gsc_pos_4_20`), Serper API (`serper_paa`), Bing Webmaster ve WebMCP sorgu loglarından (`mcp_query_log`) gelen soruları `Cosine > 0.92` eşiğiyle kümeler (`SAMPLE_MINED_QUESTIONS`).
3. **Canlı Editör Co-Pilot (`src/index.tsx` -> `editor.sidebar.tabs`):**
   - Vektör kanibalizasyon denetimi, AI klişe kalkanı ve semantik `@id` iç link önerilerini editör sağ çekmecesinde sunar.

---

> **Güncelleme (2026-10-28):** `content-ops` paketi `agentic-seo` içine birleştirildi (tek Pro eklenti, modül bazlı). Güncel modül durumu ve taşıma planı: `docs/15-AGENTIC-PRO-MIGRATION.md`.

## 3. Mevcut durum (dürüst özet)

| Yetenek | Durum |
| :--- | :--- |
| WebMCP okuma araçları, `llms-full.txt`, `ai-sitemap.json`, entity graph kancası | Çalışır, veritabanından beslenir |
| `nexpress_create_lead` | Anahtar korumalı (`MCP_AGENT_KEY`, bkz. doc 11); kayıt henüz kalıcı değil |
| AI bot paneli (Bot Tarama Günlüğü) | **Gerçek veri** (`bot_daily_stats`, son 30 gün; bkz. `docs/04` §7) |
| Kanibalizasyon / benzer içerik / iç bağlantı (Co-Pilot) | **Gerçek veri** (`@nexpress/rag` dizini, bkz. `docs/04` §9) |
| Soru madenciliği (GSC/Serper/WebMCP kümeleme) | **Demo verisi** (etiketli); gerçek kaynak entegrasyonu: `docs/12` P0-4 |
| MCP `nexpress_search_corpus` | Vektör araması (dizin varsa), yoksa anahtar kelime |
| Klişe kalkanı (`content:beforeSave`) | Çalışır |

