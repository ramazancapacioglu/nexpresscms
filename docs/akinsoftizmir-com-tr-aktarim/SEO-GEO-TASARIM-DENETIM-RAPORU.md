# akinsoftizmir.com.tr — SEO, GEO/LLMO, RAG & Web Tasarım Denetim Raporu

> **İlk Denetim:** 2026-11-23 · **Son Güncelleme:** 2026-11-23 (Faz 1–4 tamamlandı, canlıda doğrulandı)  
> **Kapsam:** Canlı site (`https://www.akinsoftizmir.com.tr`), PostgreSQL üretim veritabanı (`nexpress_akin`), Webmaster verileri (GSC & Bing), RAG vektör dizini (`content_chunks`), bot telemetrisi, medya kitaplığı ve `yazilim-bayi` tema mimarisi.  
> **Alınan Yedek:** `/root/backups/nexpress_akin_pre_faz1_20261123.sql.gz` (7.1 MB)

---

## 1. Yönetici Özeti (Skor Kartı — Öncesi → Sonrası)

| Alan | Önce | Şimdi | Durum Özeti |
| :--- | :---: | :---: | :--- |
| **Teknik Altyapı & Hız** | 🟢 95 | 🟢 **98** | 0-KB RSC, `s-maxage=60`, `HSTS`, `CSP`, `Link: ?format=md`, `robots.txt` + `Content-Signal`, `sitemap.xml`, `llms.txt`, `ai-sitemap.json`, `/.well-known/mcp.json` aktif. |
| **RAG & Vektör Dizini** | 🟢 92 | 🟢 **92** | Yayındaki 132/132 içerik (%100) `openai:text-embedding-3-small:1536` ile dizinli (481 parça). *Kalan:* Yeni eklenen TL;DR/SSS blokları için panelden "Dizini Yeniden Oluştur". |
| **GEO / LLMO & Varlık Grafı** | 🟡 62 | 🟢 **90** | ✅ **4 Şema & Varlık Grafı kuralı** (`SpeakableSpecification` + Akınsoft/ERP/GİB/İzmir `sameAs`) aktif; ✅ **`content_entity_links` 0 → 43**; ✅ 4 büyük ürün sayfasına `FAQPage` eklendi; ✅ editör SEO › Şema sekmesi tam eşitlendi. *Kalan:* 21 taslak `ai_prompt` yayına alınacak. |
| **Webmaster & Organik Dönüşüm** | 🟡 65 | 🟢 **85** | ✅ `proforma-fatura-nedir`, `teblig-ne-demek`, `e-fatura-web-socket-indir` ve `ana-sayfa` başlık/meta/CTA ile güçlendirildi. *Kalan:* 2–4 hafta sonra GSC TO artışı ölçümü + `fiyatmatik`/`akınsoft-installer-indir` gövde zenginleştirme. |
| **İçerik Kalitesi & Tazelik** | 🟡 68 | 🟢 **88** | ✅ **11 eski (2024/2025) yazının tamamı 2026'ya güncellendi (0 eski yıl)**; ✅ 7 yazım hatası/AI klişesi temizlendi; ✅ 9 sayfaya `tldr_box` ve 4 dev sayfaya `faq_accordion` eklendi. *Kalan:* Diğer düz metin sayfaların kademeli `bento_features`/`howto_steps` dönüşümü. |
| **Medya SEO & 404 Hijyeni** | 🟡 70 | 🟢 **86** | ✅ 3 yüksek isabetli 301 eklendi (`/akinsoft-wolvox-erp`, `/demo`, `/contact`), spam 404'ler temizlendi; ✅ `/admin/media` içine **Kullanılmayanlar raporu + toplu silme** eklendi. *Kalan:* 223 eksik alt metin (panelden toplu AI alt metin) + kullanılmayan görsellerin silinmesi. |
| **Tasarım (`yazilim-bayi`)** | 🟡 76 | 🟢 **88** | ✅ `74ch` okuma ölçüsü, `.nx-tldr` kutu tasarımı, kart hover yükseltmesi, `.nx-text-card` üst vurgu şeridi ve altlık telif yazımı canlıda. *Kalan:* `Plus Jakarta Sans` başlık fontu seçimi ve `/demo/yazilim-bayi/logo.webp` yerine gerçek medya logosu. |

---

## 2. Webmaster (GSC & Bing) Fırsatları — Durum

| Sorgu | Kaynak | Gösterim | Pozisyon | Durum & Yapılan İşlem |
| :--- | :---: | ---: | ---: | :--- |
| `proforma fatura örneği` | GSC | 735 | 1.2 | ✅ **Tamamlandı:** 2026 CTR başlık/meta + `tldr_box` + `Ön Muhasebe` `cta_banner` eklendi. |
| `tebliğ mazbatası nedir` | GSC | 1.496 | 4.6 | ✅ **Tamamlandı:** Başlık/meta 2026'ya güncellendi + `tldr_box` eklendi. |
| `e fatura web socket` / `web socket indir` | GSC + Bing | 47.000+ | 3.2–7.8 | ✅ **Tamamlandı:** 2026 başlık/meta + `tldr_box` + `Akınsoft e-Fatura` `cta_banner` + entity bağı eklendi. |
| `akınsoft` / `akınsoft izmir` | GSC / Bing | 8.860+ | 5.6–7.7 | ✅ **Tamamlandı:** Ana sayfa meta başlık/açıklaması İzmir Ana Bayi (BA35022) + 30 gün ücretsiz demo vaadiyle yenilendi. |
| `akınsoft installer` / `wolvox 8 indir` | GSC | 292 | 7.9–8.0 | 🔄 **Kısmi:** `tldr_box` eklendi; *kalan:* `howto_steps` kurulum adımları + sistem gereksinimleri tablosu. |
| `fiyatmatik` | GSC | 27 | 11.4 | ✅ **Meta/TL;DR tamamlandı.** *Kalan:* Sayfa içine özellik kartları + SSS bloğu. |

---

## 3. GEO / LLMO, Şema & RAG — Durum

- [x] **4 Şema & Entity Graph kuralı (`/admin/seo/schemas`):** `BlogPosting + Speakable`, `e-Dönüşüm Service + GİB sameAs`, `WebPage + Speakable + Akınsoft/İzmir sameAs`, `Yazılım Service + ERP sameAs` aktif ve canlıda doğrulandı.
- [x] **`content_entity_links`:** `0` → **`43`** gerçek `@id` bağı (`29 mentions`, `9 offer_for`, `5 about`) canlı `/ai-sitemap.json`'da aktif.
- [x] **Editör SEO › Şema sekmesi eşitleme:** Tüm 19 Schema.org türü + `SoftwareApplication`, `Service`, `Product`, `Article`, `TechArticle`, `Offer`, `QAPage`, `Speakable`, `about` alanları editörde görünür ve canlı JSON-LD'ye doğrudan bağlı.
- [ ] **RAG Dizini Yenileme:** Panelden `/admin/seo/schemas#arama-dizini` → **Dizini Yeniden Oluştur** (yeni TL;DR ve SSS bloklarını vektör dizinine yansıtmak için).
- [ ] **21 Taslak `ai_prompt` (Soru-Cevap):** `/admin/qa` üzerinden gözden geçirilip yayına alınacak.
- [ ] **Kampanya Sayfalarını Zenginleştirme:** Yayındaki 14 kampanyanın ort. 56 kelimelik gövdesine hedef ürün özeti ve 2–3 SSS maddesi eklenecek.

---

## 4. İçerik Kalitesi, Yazım Hataları & Düz Metin Sayfalar — Durum

- [x] **7 Yazım Hatası, AI Klişesi & Yarım TL;DR:** `mobil-satis` (`E-atura`), `wolvox-crm-yonetimi` (`Günümüzde...`), `akinsoft-wolvox-restoran-yonetimi`, `insan-kaynaklari-yonetimi`, `pavo-n86-android-mobil-pos`, `e-arsiv-portal` (`E-Aşiv`), `bagkur-7200` (`Pirim`) **tamamı düzeltildi**.
- [x] **11 Eski Yıl (2024/2025) Yazısı:** Tamamı URL bozulmadan **2026**'ya güncellendi (**yayında 0 eski yıl kaldı**).
- [x] **Düşük Skorlu Ticari Sayfalar (77–84) + 10 ÖKC Sayfası:** `e-mutabakat`, `wolvox-webconnect-e-teklif`, `wolvox-ithalat-yontemi`, `sube-yonetimi`, `stok-depo-yonetimi`, `wolvox-uretim-yontemi`, `fiyatmatik` ve 10 ÖKC sayfasının başlık/meta/TL;DR alanları güçlendirildi.
- [x] **İlk 9 Yoğun Düz Metin Sayfaya `tldr_box` + 4 Dev Ürün Sayfasına `faq_accordion`:** `genel-muhasebe-programi`, `super-market-yonetimi`, `insan-kaynaklari-yonetimi`, `wolvox-crm-yonetimi` artık otomatik `FAQPage` JSON-LD basıyor.
- [ ] **Kalan Düz Metin Sayfaların `bento_features` / `howto_steps` Dönüşümü:**
  - Ürün sayfaları: `/e-ofis`, `/stok-depo-yonetimi`, `/wolvox-uretim-yontemi`, `/qr-menu`, `/hotel-smart`, `/fiyatmatik`, `/prokuafor`, `/octoplus`, `/wolvox-webconnect`, `/akinsoft-installer-indir`.
  - Uzun blog yazıları: `/wolvox-erp-server-client-baglanti-ayarlari-nasil-yapilir`, `/myrezzta-garson-ekran-kullanimi`, `/kalite-kontrol`, `/enflasyon-nedir-nasil-hesaplanir`, `/yazilim-gelistirme-trendleri`, `/akinsoft-musteri-girisi-musteri-paneli`, `/e-arsiv-portal`.

---

## 5. Medya SEO & 404 / Yönlendirme Hijyeni — Durum

- [x] **3 Yüksek İsabetli 301 Yönlendirme:** `/akinsoft-wolvox-erp` → `/wolvox-erp`, `/demo` → `/akinsoft-demo-talebi`, `/contact` → `/iletisim`.
- [x] **Spam 404 Günlüğü Temizliği:** `/ajax/*` ve `/kaden/*` eski kayıtları silindi.
- [x] **Medya Kitaplığı Kullanılmayanlar Raporu & Toplu Silme (`/admin/media`):** Üst barda **Kullanılmayan: N (X MB)** rozeti, rapor şeridi ve sunucu doğrulamalı toplu silme (`bulkDeleteUnusedMediaAction`) eklendi.
- [ ] **223 Eksik Medya Alt Metni:** `/admin/media` → **AI ile Eksik Alt Metin Üret** ile tamamlanacak.
- [ ] **Kullanılmayan Görsellerin Temizlenmesi:** `/admin/media` → **Kullanılmayan** filtresinden incelenip gereksiz dosyalar silinecek.

---

## 6. Web Tasarım (`yazilim-bayi`) — Durum

- [x] **`.nx-rich` 74ch Okuma Genişliği** (`packages/themes/src/yazilim-bayi.ts`)
- [x] **`.nx-tldr` Answer-First Özet Kutusu Tasarımı**
- [x] **`.yf-card` / `.yb-card` Hover Yükseltme + `.nx-text-card` Üst Vurgu Şeridi**
- [x] **Altlık Telif Yazımı (`"Tüm Hakları Saklıdır"`)**
- [ ] **Başlık Tipografisi (`Plus Jakarta Sans`):** `/admin/themes/customize` → Yazı Tipi sekmesinden yerel WOFF2 olarak seçilecek.
- [ ] **Gerçek Medya Logosu:** `/admin/themes/customize` → Logo & Ölçü sekmesinden `/demo/yazilim-bayi/logo.webp` yerine Medya Kitaplığı'ndaki gerçek logo seçilecek.
- [ ] **Ana Sayfa Güven Şeridi (`stats_strip`):** Bayi Kodu BA35022, 30+ Yıl, 81 İl / 150.000+ İşletme, Aynı Gün Kurulum şeridi eklenecek.
