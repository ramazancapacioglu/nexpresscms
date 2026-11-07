# 05 — Pro Eklentiler: Agentic SEO Gateway & RAG İçerik Fabrikası (`plugins-pro/*`)

Kaynak projeler `agentic-content-ops` ve `agentic-seo-gateway` (v5.8.0). Canlı Pro paketler ikidir: `@nexpress-pro/agentic-seo` (içerik operasyonları bunun içindedir) ve `@nexpress-pro/ai-design`. İkisi de çekirdeğin `Slot & Hook` yuvalarına bağlanır.

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

## 2. İçerik operasyonları (`plugins-pro/agentic-seo-pro/src/content-ops`)

Ayrı `@nexpress-pro/content-ops` paketi yok. 2026-10-28'de `agentic-seo` içine birleşti. Eski kaynak `.archive/content-ops-pro` altındadır ve derlemeye girmez. Kayıt `registerAgenticSeoProPlugin()` → `registerContentOps()`. Modül durumu: `docs/15`.

1. **Site DNA ve klişe kalkanı (`src/content-ops/guardrails.ts`):**
   - `DEFAULT_FORBIDDEN_PHRASES` (*"bu makalede"*, *"sonuç olarak"*, *"özetlemek gerekirse"*, *"günümüzde"* vb.) ile yapay AI klişelerini tespit eder.
   - `content:beforeSave` kancasına bağlanarak Answer-First `tldr` uzunluğunu, kelime derinliğini ve klişe bulunmama durumunu denetleyip dinamik `seoScore` hesaplar (`auditContentGuardrails`).
2. **Kelime havuzu:** canlı GSC, Bing, Yandex ve Serper kayıtları `seo_intel_signals` tablosundadır. Küme sözcük örtüşmesidir (Jaccard). Örnek dizi artık kartta basılmaz.
3. **Editör Co-Pilot (`editor.sidebar.tabs`):**
   - Vektör kanibalizasyon denetimi ve iç bağlantı önerisi editör sağ çekmecesindedir. Soru havuzu `seo.reports.queries`, içerik açığı `seo.reports.content` yuvasındadır.

## 3. Mevcut durum (dürüst özet)

| Yetenek | Durum |
| :--- | :--- |
| WebMCP okuma araçları, `llms-full.txt`, `ai-sitemap.json`, entity graph kancası | Çalışır, veritabanından beslenir |
| `nexpress_create_lead` | Anahtar korumalı (`MCP_AGENT_KEY`, bkz. doc 11); kayıt henüz kalıcı değil |
| AI bot paneli (Bot Tarama Günlüğü) | **Gerçek veri** (`bot_daily_stats`, son 30 gün; bkz. `docs/04` §7) |
| Kanibalizasyon / benzer içerik / iç bağlantı (Co-Pilot) | **Gerçek veri** (`@nexpress/rag` dizini, bkz. `docs/04` §9) |
| Soru havuzu (GSC/Bing/Yandex/Serper) | **Canlı kayıt** kümelenir ve taslak açar. Tohum yazılmaz. Gömme kümesi yok |
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
- **Destek arama günlüğü** sonuçsuz site aramasını yazar. Kaynak denetimi elle ve `CRON_SECRET` ile çalışır. Anlam kümesi yalnız gerçek gömme sağlayıcısında ve en çok 24 sorguda açıktır.

- **`ai-compose` (2026-11-02):** `ai-writer.compose` eylemi (`registerAiCompose`): `write|rewrite|expand|shorten|fix`; girdi sınırları (istek 600, metin 4000, bağlam 3000), çıktı en çok 6 paragraf × 1200 karakter (başlıkta tek, 90). `findClaims` / `findUnverifiedNumbers` uydurma riskini işaretler. Testli (`test/compose.test.ts`, sahte model).
- **Agentic SEO Pro Tam Modül Genişlemesi (2026-11-03):**
  - **`citations`:** hazırlık puanı (TL;DR + şema) ve kayıtlı yönlendirme. Uydurma motor satırı yok.
  - **`google-reviews`:** ayardaki puan ve yorum şemaya girer. Places anahtarı varsa çekilir. Boş ayar örnek isim basmaz.
  - **`serper-intel`:** canlı sorgu havuza yazılır. Anahtarsız liste demo diye işaretlenir ve kaydedilmez.
  - **`decay`:** yaş, sözcük ve kayıtlı sıra düşüşü (`DecayCard`).
  - **`kb-transform`:** adres veya yapıştırılan metin taslak açar. Denetle değişeni işaretler, yayınlamaz.
  - **`catalog-ai`:** uzunluk denetimi ve yeniden yazma. Uygula ürün kaydını yazar.
  - **`support-hub`:** sonuçsuz site aramalarını listeler. Yüzde uydurulmaz.
  - Rapor kartları `seo.reports.queries`, `seo.reports.content` ve `seo.reports.visibility` yuvalarındadır. Ayarlar `/admin/seo/settings` altındadır.
