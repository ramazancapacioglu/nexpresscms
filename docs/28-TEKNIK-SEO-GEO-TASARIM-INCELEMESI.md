# NexPress teknik performans, SEO, GEO ve ürün tasarımı incelemesi

28 Kasım 2026 · Yaşayan teknik karar ve denetim raporu

## Tamamlanan iyileştirme paketleri

- **Paket 1 (`ab5a133`):** Markdown önbellek politikası (`private, no-store`), içerik ilişkileri ve kenar çubuğu görünürlük kapısı, çok kiracılı SEO kökeni, ürün kartı fiyat/erişilebilirlik/i18n, gövdesiz özet ve 404 taraması, AI keşif `noIndex` hizalaması, artımlı RAG gömme, `seo-contract.mjs`, `a11y-audit.mjs` ve `docs/19` yönlendirme sözleşmesi.
- **Paket 2 (`82946a4`):** Çekirdek `POST /api/mcp` görünürlük/`noIndex` kapısı + JSON Schema `inputSchema` + rate limit + yapısal fiyat aracı (`nexpress_get_product_pricing`), `/api/search` önekli URL (`contentPath`) ve gövdesiz havuz, kalan ziyaretçi/keşif `siteOriginFor` bağlantıları, `design-context.ts` + `[locale]/layout.tsx` sorgu daraltması ve 0-KB deklaratif **Speculation Rules API** (`prerender: "moderate"`).
- **Paket 3 (bu tur):**
  - `indexnow.ts` ve `scheduler.ts` çok kiracılı `siteOriginFor` geçişi; `design-context.ts` Open-Core temizliği (`sites.brandVoice` + `design:brandContext` kancası).
  - `public.css` içine ekran altı bölümler için 0-KB **`content-visibility: auto`** ve `docs/19-DEPLOYMENT.md` içine Nginx `103 Early Hints` kılavuzu.
  - **GEO ROI Hunisi** (`packages/core/src/geo-roi.ts` + `/admin/seo/reports?group=geo-roi` sekmesi): sayfa bazında `AI Bot Taraması → AI Yönlendirmesi → Teklif/Form Dönüşümü` raporu.
  - **Veritabanı destekli tam metin ön-araması (`searchKeywordDocs`)**: PostgreSQL `to_tsvector('turkish', ...)` + `plainto_tsquery` ve SQLite `LIKE` + `LIMIT` ön-filtresi (`/api/search` ve RAG hibrit araması tüm tabloyu belleğe çekmez).
  - `[slug]/page.tsx` ilişki/kırıntı/benzer içerik mantığı `public-page-relations.ts` yardımcısına ayrılarak sadeleştirildi.

## Uzun vadeli bakım ve saha izleme notları

| Alan | Durum ve sürekli hedef |
| --- | --- |
| Büyük panel bileşenleri (> 400 satır) | `theme-store-tab-layout.tsx`, `widget-studio.tsx`, `theme-store-preview-canvas.tsx`, `campaign-editor-client.tsx` ve `block-general-tab.tsx` üzerinde yeni özellik eklenirken kademeli bölünmeye devam edilir. |
| Saha Core Web Vitals | Canlı sunucularda mobil p75 LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1 ve `perf-budget.json` (108 kB) marjı her sürüm sonrası izlenir. |
