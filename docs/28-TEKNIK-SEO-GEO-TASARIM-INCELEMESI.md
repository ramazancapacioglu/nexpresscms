# NexPress teknik performans, SEO, GEO ve ürün tasarımı incelemesi

28 Kasım 2026 · Yaşayan teknik karar ve fırsat raporu

> **Kapatılan paketler:**
> - **Paket 1 (`ab5a133`):** Markdown önbellek politikası (`private, no-store`), içerik ilişkileri ve kenar çubuğu görünürlük kapısı, çok kiracılı SEO kökeni, ürün kartı fiyat/erişilebilirlik/i18n, gövdesiz özet ve 404 taraması, AI keşif `noIndex` hizalaması, artımlı RAG gömme, `seo-contract.mjs`, `a11y-audit.mjs` ve `docs/19` yönlendirme sözleşmesi.
> - **Paket 2 (bu tur):** Çekirdek `POST /api/mcp` görünürlük/`noIndex` kapısı + JSON Schema `inputSchema` + rate limit + yapısal fiyat aracı (`nexpress_get_product_pricing`), `/api/search` önekli URL (`contentPath`) ve gövdesiz arama havuzu (`listPublicKeywordDocs`), kalan tüm ziyaretçi/keşif `siteOriginFor` bağlantıları, `design-context.ts` + `[locale]/layout.tsx` sorgu daraltması ve 0-KB deklaratif **Speculation Rules API** (`prerender: "moderate"`).

## Kalan açık teknik borçlar

| Öncelik | Bulgu ve etki | Hedeflenen iyileştirme |
| --- | --- | --- |
| P2 · Büyük panel dosyaları (> 400 satır) | `theme-store-tab-layout.tsx` (1.153), `widget-studio.tsx` (1.060), `theme-store-preview-canvas.tsx` (917), `campaign-editor-client.tsx` (839), `block-general-tab.tsx` (780) ve `[slug]/page.tsx` (761) 400 satır kuralını aşıyor. | Yeni özellik eklenirken bu dosyaları alt bileşen ve yardımcılara bölerek bakım maliyetini düşürmek. |
| P2 · Open-Core sınır temizliği (`design-context.ts`) | [design-context.ts](../packages/database/src/design-context.ts) içinde marka ayarları doğrudan `@nexpress-pro/agentic-seo` eklenti kimliğiyle okunuyor. | Marka/sektör/ton alanlarını çekirdek `sites.brandVoice` veya kanca (`cmsHooks`) üzerinden okumak. |

## 2026+ ileri aşama fırsatları (Ölçek ve ticari gözlemlenebilirlik)

1. **GEO ROI Hunisi Ekranı:** Mevcut `bot_page_daily`, `ai-referral`, Search Console/Bing Webmaster ve form dönüşüm verilerini sayfa bazında tek raporda birleştirip hangi rehberin hangi AI kaynağından teklif getirdiğini izlemek.
2. **Saha Core Web Vitals & JS Bütçesi Takibi:** Canlı mobil p75 LCP (≤ 2,5 sn), INP (≤ 200 ms), CLS (≤ 0,1) takibi; Nginx `103 Early Hints` (hero LCP görseli + woff2 font) ve uzun sayfalarda CSS `content-visibility: auto`.
3. **Ölçeklenebilir Tam Metin Arama (FTS5 / PostgreSQL `tsvector`):** 5.000+ içerikli sitelerde süreç içi BM25 yerine PostgreSQL `GIN(to_tsvector('turkish', ...))` ve SQLite FTS5 ile arama gecikmesini `< 3 ms` altına indirmek.
