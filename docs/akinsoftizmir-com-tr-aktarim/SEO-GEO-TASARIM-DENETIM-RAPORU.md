# akinsoftizmir.com.tr — SEO, GEO/LLMO, RAG & Web Tasarım Denetim Raporu

> **İlk Denetim:** 2026-11-23 · **Son Güncelleme:** 2026-11-23 (Faz 1–5 tamamlandı, canlıda doğrulandı)  
> **Kapsam:** Canlı site (`https://www.akinsoftizmir.com.tr`), PostgreSQL üretim veritabanı (`nexpress_akin`), Webmaster verileri (GSC & Bing), RAG vektör dizini (`content_chunks`), bot telemetrisi, medya kitaplığı ve `yazilim-bayi` tema mimarisi.  
> **Alınan Yedekler:** `/root/backups/nexpress_akin_pre_faz1_20261123.sql.gz` (7.1 MB), `/root/backups/nexpress_akin_pre_faz5_20261123.sql.gz` (7.2 MB)

---

## 1. Yönetici Özeti (Skor Kartı — Öncesi → Sonrası)

| Alan | Önce | Şimdi | Durum Özeti |
| :--- | :---: | :---: | :--- |
| **Teknik Altyapı & Hız** | 🟢 95 | 🟢 **98** | 0-KB RSC, `s-maxage=60`, `HSTS`, `CSP`, `Link: ?format=md`, `robots.txt` + `Content-Signal`, `sitemap.xml`, `llms.txt`, `ai-sitemap.json`, `/.well-known/mcp.json` aktif. |
| **RAG & Vektör Dizini** | 🟢 92 | 🟢 **98** | ✅ Yayındaki **132/132 içerik (%100)** `openai:text-embedding-3-small:1536` (`semantic: true`) ile yeniden dizinlendi (**481 → 534 parça**, 0 hata). |
| **GEO / LLMO & Varlık Grafı** | 🟡 62 | 🟢 **95** | ✅ **4 Şema & Varlık Grafı kuralı** (`SpeakableSpecification` + Akınsoft/ERP/GİB/İzmir `sameAs`) aktif; ✅ **`content_entity_links` 0 → 43**; ✅ 14 ürün + 7 blog + 14 kampanya sayfasında yapılandırılmış `FAQPage` / `HowTo` blokları aktif; ✅ editör SEO › Şema sekmesi tam eşitlendi. *Kalan:* 21 taslak `ai_prompt` gözden geçirilip yayına alınacak. |
| **Webmaster & Organik Dönüşüm** | 🟡 65 | 🟢 **92** | ✅ `proforma-fatura-nedir`, `teblig-ne-demek`, `e-fatura-web-socket-indir`, `ana-sayfa`, `akinsoft-installer-indir` (`HowTo` + sistem gereksinimleri tablosu + SSS) ve `fiyatmatik` (`bento_features` + SSS) tamamlandı. *Kalan:* 2–4 hafta sonra GSC TO artışı ölçümü. |
| **İçerik Kalitesi & Tazelik** | 🟡 68 | 🟢 **95** | ✅ **11 eski (2024/2025) yazının tamamı 2026'ya güncellendi (0 eski yıl)**; ✅ 10 yazım hatası/AI klişesi (kampanyalar dahil) temizlendi; ✅ **10 ürün + 7 uzun blog + 14 kampanya** `tldr_box`, `bento_features`, `howto_steps`, `data_table`, `faq_accordion` ve `cta_banner` bloklarıyla zenginleştirildi. |
| **Medya SEO & 404 Hijyeni** | 🟡 70 | 🟢 **86** | ✅ 3 yüksek isabetli 301 eklendi (`/akinsoft-wolvox-erp`, `/demo`, `/contact`), spam 404'ler temizlendi; ✅ `/admin/media` içine **Kullanılmayanlar raporu + toplu silme** eklendi. *Kalan:* 223 eksik alt metin (panelden toplu AI alt metin) + kullanılmayan görsellerin panelden silinmesi. |
| **Tasarım (`yazilim-bayi`)** | 🟡 76 | 🟢 **94** | ✅ `74ch` okuma ölçüsü, `.nx-tldr`, kart hover yükseltmesi, `.nx-text-card`, altlık telif yazımı, **ana sayfa `stats_strip` güven şeridi** (BA35022, 30+ Yıl, 150.000+, Aynı Gün) ve **gerçek medya logosu** (`/media/med_AHHCYZDc6zEt`) canlıda. *Kalan:* İstenirse `Plus Jakarta Sans` başlık fontu seçimi. |

---

## 2. Webmaster (GSC & Bing) Fırsatları — Durum

| Sorgu | Kaynak | Gösterim | Pozisyon | Durum & Yapılan İşlem |
| :--- | :---: | ---: | ---: | :--- |
| `proforma fatura örneği` | GSC | 735 | 1.2 | ✅ **Tamamlandı:** 2026 CTR başlık/meta + `tldr_box` + `Ön Muhasebe` `cta_banner` eklendi. |
| `tebliğ mazbatası nedir` | GSC | 1.496 | 4.6 | ✅ **Tamamlandı:** Başlık/meta 2026'ya güncellendi + `tldr_box` eklendi. |
| `e fatura web socket` / `web socket indir` | GSC + Bing | 47.000+ | 3.2–7.8 | ✅ **Tamamlandı:** 2026 başlık/meta + `tldr_box` + `Akınsoft e-Fatura` `cta_banner` + entity bağı eklendi. |
| `akınsoft` / `akınsoft izmir` | GSC / Bing | 8.860+ | 5.6–7.7 | ✅ **Tamamlandı:** Ana sayfa meta başlık/açıklaması İzmir Ana Bayi (BA35022) + 30 gün ücretsiz demo vaadiyle yenilendi + `stats_strip` güven şeridi eklendi. |
| `akınsoft installer` / `wolvox 8 indir` | GSC | 292 | 7.9–8.0 | ✅ **Tamamlandı:** `tldr_box` + 5 adımlı `howto_steps` (`HowTo` JSON-LD) + sistem gereksinimleri `data_table` + 4 soruluk `faq_accordion` (`FAQPage`) canlıda doğrulandı. |
| `fiyatmatik` | GSC | 27 | 11.4 | ✅ **Tamamlandı:** Meta/TL;DR + 4 kartlı `bento_features` + 3 soruluk `faq_accordion` (`FAQPage`) canlıda doğrulandı. |

---

## 3. GEO / LLMO, Şema & RAG — Durum

- [x] **4 Şema & Entity Graph kuralı (`/admin/seo/schemas`):** `BlogPosting + Speakable`, `e-Dönüşüm Service + GİB sameAs`, `WebPage + Speakable + Akınsoft/İzmir sameAs`, `Yazılım Service + ERP sameAs` aktif ve canlıda doğrulandı.
- [x] **`content_entity_links`:** `0` → **`43`** gerçek `@id` bağı (`29 mentions`, `9 offer_for`, `5 about`) canlı `/ai-sitemap.json`'da aktif.
- [x] **Editör SEO › Şema sekmesi eşitleme:** Tüm 19 Schema.org türü + `SoftwareApplication`, `Service`, `Product`, `Article`, `TechArticle`, `Offer`, `QAPage`, `Speakable`, `about` alanları editörde görünür ve canlı JSON-LD'ye doğrudan bağlı.
- [x] **RAG Dizini Yenileme:** `openai:text-embedding-3-small:1536` (`semantic: true`) ile **132/132 içerik** yeniden dizinlendi (**481 → 534 parça**, 0 hata).
- [x] **Kampanya Sayfalarını Zenginleştirme:** Yayındaki **14/14 kampanya** 3 yazım hatası düzeltmesi (`Wolwox` → `Wolvox`, `%35 İndirim`, `kapsamındaki`), 3'lü avantaj `bento_features` ve 3'er soruluk `faq_accordion` ile zenginleştirildi.
- [ ] **21 Taslak `ai_prompt` (Soru-Cevap):** `/admin/qa` üzerinden insan gözüyle gözden geçirilip uygun olanlar yayına alınacak.

---

## 4. İçerik Kalitesi, Yazım Hataları & Düz Metin Sayfalar — Durum

- [x] **10 Yazım Hatası, AI Klişesi & Yarım TL;DR:** `mobil-satis` (`E-atura`), `wolvox-crm-yonetimi` (`Günümüzde...`), `akinsoft-wolvox-restoran-yonetimi`, `insan-kaynaklari-yonetimi`, `pavo-n86-android-mobil-pos`, `e-arsiv-portal` (`E-Aşiv`), `bagkur-7200` (`Pirim`) + 3 kampanya yazım hatası **tamamı düzeltildi**.
- [x] **11 Eski Yıl (2024/2025) Yazısı:** Tamamı URL bozulmadan **2026**'ya güncellendi (**yayında 0 eski yıl kaldı**).
- [x] **Düşük Skorlu Ticari Sayfalar (77–84) + 10 ÖKC Sayfası:** `e-mutabakat`, `wolvox-webconnect-e-teklif`, `wolvox-ithalat-yontemi`, `sube-yonetimi`, `stok-depo-yonetimi`, `wolvox-uretim-yontemi`, `fiyatmatik` ve 10 ÖKC sayfasının başlık/meta/TL;DR alanları güçlendirildi.
- [x] **İlk 9 Yoğun Düz Metin Sayfaya `tldr_box` + 4 Dev Ürün Sayfasına `faq_accordion`:** `genel-muhasebe-programi`, `super-market-yonetimi`, `insan-kaynaklari-yonetimi`, `wolvox-crm-yonetimi` artık otomatik `FAQPage` JSON-LD basıyor.
- [x] **Kalan 10 Ürün Sayfası & 7 Uzun Blog Yazısının Yapılandırılmış Blok Dönüşümü (Faz 5):**
  - 10 ürün sayfası (`/akinsoft-installer-indir`, `/fiyatmatik`, `/e-ofis`, `/stok-depo-yonetimi`, `/wolvox-uretim-yontemi`, `/qr-menu`, `/hotel-smart`, `/prokuafor`, `/octoplus`, `/wolvox-webconnect`): `tldr_box`, `bento_features`, `howto_steps`, `data_table` ve `faq_accordion` (`FAQPage` / `HowTo` JSON-LD) eklendi.
  - 7 uzun blog yazısı (`/wolvox-erp-server-client-baglanti-ayarlari-nasil-yapilir`, `/myrezzta-garson-ekran-kullanimi`, `/akinsoft-musteri-girisi-musteri-paneli`, `/e-arsiv-portal`, `/kalite-kontrol`, `/enflasyon-nedir-nasil-hesaplanir`, `/yazilim-gelistirme-trendleri`): `tldr_box`, `howto_steps` (4 teknik rehberde `HowTo` JSON-LD), `faq_accordion` (`FAQPage`) ve dönüşüm `cta_banner` eklendi.

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
- [x] **Gerçek Medya Logosu:** `/demo/yazilim-bayi/logo.webp` ve `logo-kare.webp` yolları gerçek medya kitaplığı varlıklarıyla (`/media/med_AHHCYZDc6zEt?w=304&h=70&a=1`, `/media/med_z93Atf9oZ1WQ?w=512&h=512&a=1`) değiştirildi ve canlıda doğrulandı.
- [x] **Ana Sayfa Güven Şeridi (`stats_strip`):** Hero hemen altına `BA35022` (Akınsoft İzmir Ana Bayi), `30+ Yıl`, `150.000+` ve `Aynı Gün` şeridi eklendi ve canlıda doğrulandı.
- [ ] **Başlık Tipografisi (`Plus Jakarta Sans`):** İstenirse `/admin/themes/customize` → Yazı Tipi sekmesinden yerel WOFF2 olarak seçilebilir.
