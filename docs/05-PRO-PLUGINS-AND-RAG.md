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



## AI Tasarım Pro (`@nexpress-pro/ai-design`, `plugins-pro/ai-design`)

Prompt ile **bölüm, sayfa ve tema jetonu** tasarlar. Kompozisyon: `apps/cms/src/plugins/register.ts` → `registerAiDesignProPlugin()`; eylem `ai-design.generate` (`pluginActions`, panelde `requireUser` + denetim günlüğü `design.generate`).

- **CMS bilgisi tek kaynaktır:** `@nexpress/core/ai-design` — `AI_BLOCK_CATALOG` (AI'a açık 21 blok, alan türleri, uzunluk/adet sınırları, değişkenler), `lintDesign` (temizler + SEO/GEO denetler), `lintThemeTokens` (WCAG kontrastı, yazı tipi ve geometri sınırları), `buildDesignSystemPrompt` (komut katalogtan ve kural listesinden üretilir). `packages/editor/test/library-contract.test.ts` gerçek tasarım kütüphanesinin katalogla ayrışmadığını doğrular.
- **Site bağlamı:** `loadDesignSiteContext` (database): var olan herkese açık sayfa yolları, medya kimlikleri + alt metinleri, aktif formlar, marka alanları ve Site DNA. Model yalnızca bunları bilir; olmayan yol/görsel/form uyarı veya hata olur.
- **Hat:** komut → model (OpenAI uyumlu, `OPENAI_API_KEY`; model `designModel` → `AI_DESIGN_MODEL` → `AI_WRITER_MODEL`) → doğrulama → hata varsa hata listesi + önceki çıktıyla **tek onarım turu** → en az hatalı sonuç. Hız sınırı 10 dakikada 8 üretim. Anahtar yoksa `unconfigured`; "Komutu kopyala" ve JSON yapıştırma yolu anahtarsız çalışır (aynı doğrulama).
- **Yazmaz:** çıktı panelde önizlenir (skor, hata/uyarı, yapı, tema renkleri + kontrast tablosu) ve kullanıcı onayıyla `design_library` tablosuna (göç `0013`) kaydedilir. Kayıtta tasarım **sunucuda yeniden doğrulanır**; hatalı olan kaydedilmez. Sayfa tasarımı yalnızca **taslak** sayfa olur; tema yalnızca **kurulur** (etkinleştirme ayrı).
- Tema üretimi şimdilik yalnızca **tasarım jetonlarıdır**; üst/alt bilgi şablonlarına ve özel CSS'e dokunulmaz.

## Ek (2026-11-02): Agentic SEO Pro — "Yakında" modüllerinden tamamlananlar

- **Zengin şema (4 modül):** `faq-qa` (QAPage: başlık soru, TL;DR ≥ 20 karakter cevap; oylama yok), `campaign-offer` (fiyat, ISO para birimi, bitiş günü; bitiş günü geçince düğüm kendiliğinden kalkar), `tech-article` (`proficiencyLevel`, `dependencies`), `software-app` (kategori + işletim sistemi zorunlu; sürüm, fiyat, özellik listesi). Editör SEO sekmesindeki "Gelişmiş şema (Pro)" paneli `schemaAttributes.richSchema` yazar; sunucuda her değer doğrulanır (bozuk fiyat/para birimi/tarih/adres düğüm üretmez). `seo:buildSchemaGraph` kancası artık `content` (başlık, TL;DR, öznitelikler) taşır — ek veritabanı sorgusu yok.
- **`merchant-feed`:** `/merchant-feed.xml` (RSS 2.0 + `g:`); yalnızca yayındaki ürünler; fiyatı, görseli veya açıklaması eksik/geçersiz olanlar beslemeye girmez; indirimli üründe `price` = eski, `sale_price` = güncel.
- **`gap-analysis`:** panel kartı; TL;DR eksik/kısa, 180+ gün bayat, iç bağlantı almayan, 150 sözcükten ince ve benzer (Jaccard ≥ 0.6) içerikler.
- **`mcp-log`:** `/api/mcp` istekleri (araç, ajan, sonuç, süre) → panel kartı (30 gün).
- **Hâlâ "Yakında" (dış servis/anahtar gerektirir; manifestte nedeni yazılı):** citations, serper-intel, decay, kb-transform, google-reviews, catalog-ai, support-hub, ve SEO Temel'deki search-console.

- **`ai-compose` (2026-11-02):** `ai-writer.compose` eylemi (`registerAiCompose`): `write|rewrite|expand|shorten|fix`; girdi sınırları (istek 600, metin 4000, bağlam 3000), çıktı en çok 6 paragraf × 1200 karakter (başlıkta tek, 90). `findClaims` / `findUnverifiedNumbers` uydurma riskini işaretler. Testli (`test/compose.test.ts`, sahte model).
