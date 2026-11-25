# akinsoftizmir.com.tr — SEO, GEO/LLMO, RAG & Web Tasarım Denetim Raporu

> **İlk Denetim:** 2026-11-23 · **Son Güncelleme:** 2026-11-25 (Faz 1–9 tamamlandı, canlıda doğrulandı)  
> **Kapsam:** Canlı site (`https://www.akinsoftizmir.com.tr`), PostgreSQL üretim veritabanı (`nexpress_akin`), Webmaster verileri (GSC & Bing), RAG vektör dizini (`content_chunks`), bot telemetrisi, medya kitaplığı ve `yazilim-bayi` tema mimarisi.  
> **Alınan Yedekler:** `/root/backups/nexpress_akin_pre_faz1_20261123.sql.gz` (7.1 MB), `/root/backups/nexpress_akin_pre_faz5_20261123.sql.gz` (7.2 MB), `/root/backups/nexpress_akin_pre_faz6_20261124.sql.gz` (7.5 MB), `/root/backups/nexpress_akin_pre_faz7_20261124.sql.gz` (7.7 MB), `/root/backups/nexpress_akin_pre_faz8_20261124.sql.gz` (8.2 MB), `/root/backups/nexpress_akin_pre_faz9_20261125.sql.gz`

---

## 1. Yönetici Özeti (Skor Kartı — Öncesi → Sonrası)

| Alan | Önce | Şimdi | Durum Özeti |
| :--- | :---: | :---: | :--- |
| **Teknik Altyapı & Hız** | 🟢 95 | 🟢 **98** | 0-KB RSC, `s-maxage=60`, `HSTS`, `CSP`, `Link: ?format=md`, `robots.txt` + `Content-Signal`, `sitemap.xml`, `llms.txt`, `ai-sitemap.json`, `/.well-known/mcp.json` aktif. |
| **RAG & Vektör Dizini** | 🟢 92 | 🟢 **99** | ✅ Yayındaki **153/153 içerik (%100)** `openai:text-embedding-3-small:1536` (`semantic: true`) ile dizinlendi (**557 → 641 parça**, 0 hata). |
| **GEO / LLMO & Varlık Grafı** | 🟡 62 | 🟢 **98** | ✅ **4 Şema & Varlık Grafı kuralı** (`SpeakableSpecification` + Akınsoft/ERP/GİB/İzmir `sameAs`) aktif; ✅ **`content_entity_links` 0 → 43**; ✅ **33/33 `ai_prompt` (Soru-Cevap)** + 14 ürün + 7 blog + 14 kampanya yapılandırılmış `FAQPage` / `HowTo` bloklarıyla yayında (`sitemap.xml = 153`, `ai-sitemap.json = 153`). |
| **Webmaster & Organik Dönüşüm** | 🟡 65 | 🟢 **92** | ✅ `proforma-fatura-nedir`, `teblig-ne-demek`, `e-fatura-web-socket-indir`, `ana-sayfa`, `akinsoft-installer-indir` (`HowTo` + sistem gereksinimleri tablosu + SSS) ve `fiyatmatik` (`bento_features` + SSS) tamamlandı. *Kalan:* 2–4 hafta sonra GSC TO artışı ölçümü. |
| **İçerik Kalitesi & Tazelik** | 🟡 68 | 🟢 **95** | ✅ **11 eski (2024/2025) yazının tamamı 2026'ya güncellendi (0 eski yıl)**; ✅ 10 yazım hatası/AI klişesi (kampanyalar dahil) temizlendi; ✅ **10 ürün + 7 uzun blog + 14 kampanya** `tldr_box`, `bento_features`, `howto_steps`, `data_table`, `faq_accordion` ve `cta_banner` bloklarıyla zenginleştirildi. |
| **Medya SEO & 404 Hijyeni** | 🟡 70 | 🟢 **98** | ✅ 6 yüksek isabetli 301 eklendi, spam 404'ler temizlendi; ✅ **407 kullanılmayan medya kaydı (23.3 MB)** temizlendi; ✅ kullanılan **251/251 medyanın tamamı SEO `alt_text`'e kavuştu (0 eksik)**. |
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
- [x] **21 Taslak `ai_prompt` (Soru-Cevap) → Otorite Rehber Yayını (Faz 7):** 2026 güncel GİB/VUK mevzuatı ve rakip analiziyle doğal Türkçe, saha değerlendirmeli, tablolu, `FAQPage` şemalı ve temiz ASCII URL'li 21 rehber yayına alındı (**33/33 `ai_prompt` yayında**).

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
- [x] **223 Eksik Medya Alt Metni & Kullanılmayan Görseller (Faz 8):** Tüm içerik/tema/menü tabloları `row_to_json` ile tarandı; **407 kullanılmayan kayıt (23.3 MB)** silindi, kullanılan **251 medyadaki 40 eksik alt metin** tamamlandı (**`0` eksik**).

---

## 6. Web Tasarım (`yazilim-bayi`) — Durum

- [x] **`.nx-rich` 74ch Okuma Genişliği** (`packages/themes/src/yazilim-bayi.ts`)
- [x] **`.nx-tldr` Answer-First Özet Kutusu Tasarımı**
- [x] **`.yf-card` / `.yb-card` Hover Yükseltme + `.nx-text-card` Üst Vurgu Şeridi**
- [x] **Altlık Telif Yazımı (`"Tüm Hakları Saklıdır"`)**
- [x] **Gerçek Medya Logosu:** `/demo/yazilim-bayi/logo.webp` ve `logo-kare.webp` yolları gerçek medya kitaplığı varlıklarıyla (`/media/med_AHHCYZDc6zEt?w=304&h=70&a=1`, `/media/med_z93Atf9oZ1WQ?w=512&h=512&a=1`) değiştirildi ve canlıda doğrulandı.
- [x] **Ana Sayfa Güven Şeridi (`stats_strip`):** Hero hemen altına `BA35022` (Akınsoft İzmir Ana Bayi), `30+ Yıl`, `150.000+` ve `Aynı Gün` şeridi eklendi ve canlıda doğrulandı.
- [ ] **Başlık Tipografisi (`Plus Jakarta Sans`):** İstenirse `/admin/themes/customize` → Yazı Tipi sekmesinden yerel WOFF2 olarak seçilebilir.


---

## 7. Faz 6 — E-E-A-T, Faktüel Düzeltmeler, 301 & Otorite Soru-Cevap (2026-11-24 ✅)

- [x] **Kuruluş Yılı (`1989` → `1995`):** Ana sayfadaki tüm `1989` ifadeleri Akınsoft'un gerçek kuruluş yılı olan **`1995`** ile düzeltildi.
- [x] **Çalışma Saatleri Birliği (`/iletisim` + `LocalBusiness` JSON-LD + `llms.txt`):** Tüm yüzeyler **`Pazartesi – Cuma 08:30 – 18:00 · Cumartesi 09:00 – 16:00` (Pazar ve resmi tatillerde kapalı)** olarak eşitlendi.
- [x] **53 İçerikte Global Yazım, Sürüm & Bayi Dili Temizliği:** `Wolwox` → `Wolvox`, `E-Aşiv` → `E-Arşiv`, `Akınsofttarafından` → `Akınsoft tarafından`, `AKINSOFTolarak` / `Biz de AKINSOFT olarak` → `Akınsoft İzmir Ana Bayi (BA35022) olarak`, `entagre`, `Entegryonlar`, `Rezarvasyon`, `parogramı`, `amlık enterasyonular`, `İndirim İndirim`, `E-Dönüşümün`, `Wolvox ERP 9` → `Wolvox ERP 26` temizlendi.
- [x] **12 Yayındaki `ai_prompt` Sayfası → Otorite Karar Rehberleri:** Her birine `tldr_box`, teknik karşılaştırma `data_table` (ÖKC/TSM cihazları, GİB kodları, ERP vs Ön Muhasebe, offline saha matrisi), 3 soruluk `faq_accordion` (`FAQPage`) ve BA35022 dönüşüm `cta_banner` eklendi.
- [x] **3 Yeni 301 Yönlendirme:** `/akinsoft-wolvox-9a-gecis-kampanyasi` → `/kampanya/wolvox-26-gecis-kampanyasi`, `/contact-us` → `/iletisim`, `/rss` → `/feed.xml`.
- [x] **RAG Yeniden Dizinleme:** `openai:text-embedding-3-small:1536` ile güncellenen 22 içerik yeniden gömüldü (**534 → 557 parça**, 0 hata).
- [ ] **Dış Kaynak (Off-Page) NAP Temizliği (Manuel):** Yandex Maps'teki 2 eski/başka bayiye ait (`İsmet Kaptan Mah.` ve `AS Bilişim`) kayıtlardan `akinsoftizmir.com.tr` bağlantısı kaldırtılacak; Google İşletme Profili, LinkedIn ve Akınsoft resmi bayi dizini tek NAP (`Muciburrahman Sk. No:3/522 Konak/İzmir`, `0 232 425 19 88`, `BA35022`) ile eşitlenecek.

---

## 8. Faz 7 — Ana Sayfa & Boş Blok Kurtarma + 21 Taslak Soru-Cevap Otorite Rehberi Yayını (2026-11-24 ✅)

- [x] **Ana Sayfa ve 32 Sayfa Blok Kurtarma:** `postgres.js` JSONB çift-kodlama kaynaklı boş kalan `ana-sayfa` dahil 32 yayınlanmış sayfanın blokları `pre_faz5` yedeğinden kayıpsız geri yüklendi, `1989 → 1995` ve `stats_strip` doğrulandı (`ana-sayfa` canlıda `HTTP 200`, `46.958` karakter).
- [x] **21 Taslak `ai_prompt` → Doğal Türkçe Otorite Rehberleri (`33/33` Yayında):**
  - 2026 güncel GİB mevzuatı web araştırmasıyla doğrulandı: **1 Ocak 2026 bilanço usulü e-Arşiv sınırının kalkması** (VUK 573/589, işletme defteri `3.000 TL`, VUK 232 fatura sınırı `12.000 TL`), **VUK 565 ile Ba-Bs formunun kalkması**, **2026 KDV tevkifat sınırı (`12.000 TL`)**, **2026 POS / YN ÖKC ayrımı**, **1 Temmuz 2026 e-Fatura (`3 Milyon TL` / `500 Bin TL`) & `1 Ocak 2027` e-Defter hadleri** ve **WOLVOX 26 (WolvoxAI)** yenilikleri.
  - Tüm Türkçe karakterli/hatalı slug'lar temiz ASCII URL'lere çevrildi (`myrezzta-entegre-programlar`, `e-arsiv-siniri-kalkti-mi`, `2026-pos-cihazlari-iade-edilecek-mi`, `akinsoft-e-mutabakat-cari-mutabakat-yonetimi`, `kobi-icin-en-stabil-on-muhasebe-programi-hangisidir` vb.).
  - Her bir rehber `tldr_box`, pratik anlatım + **Saha Değerlendirmesi (BA35022)**, yapılandırılmış `data_table`, 3 soruluk `faq_accordion` (`FAQPage` JSON-LD), `cta_banner` ve senkron `markdown_cache` ile saf PostgreSQL dollar-quoted JSONB üzerinden yayınlandı (`bad_blocks = 0`).
- [x] **Canlı Doğrulama, IndexNow & RAG:** `21/21` yeni URL `HTTP 200`, `10.301–11.629` karakter ve `FAQPage=True` doğrulandı; `sitemap.xml` ve `ai-sitemap.json` **`153 / 153`** tam eşit; IndexNow **`HTTP 202`** (22 URL); RAG dizini **`557 → 641 parça`** (**`153/153` içerik, %100 kapsam**).

---

## 9. Faz 8 — Google Yorumlar Vitrini, 0-KB KDV Aracı, Menü İyileştirmesi & Medya Hijyeni (2026-11-24 ✅)

- [x] **Google Yorumlar (`/hakkimizda`):** Google Places API senkronize edildi (`4.7 ★`, `15 doğrulanmış değerlendirme`, resmi Google Haritalar bağlantısı) ve `/hakkimizda` sayfasına yeni 0-KB RSC `google_reviews` vitrin bloğu eklendi.
- [x] **KDV Hesaplama Aracı (`/kdv-hesaplama-araci`):** 5 hesaplama modu, `%1/%10/%20` + özel oran, `2/10–10/10` tevkifat, 2026 `12.000 TL` kısmi tevkifat uyarısı ve tek tıkla özet kopyalama özellikli yeni 0-KB `kdv_calculator` bloğu + 2026 KDV/tevkifat rehberi ve `FAQPage` SSS yayına alındı.
- [x] **Menü & Açılır Menü Göstergesi:** Üst menüdeki `AI Prompts` etiketi **`Sorular`** olarak değiştirildi; hem üst yardımcı şeritte (`Kurumsal`, `Blog`) hem ana menüde alt menülü öğelere hover'da dönen 0-KB SVG chevron eklendi.
- [x] **Medya Hijyeni:** `658` medya taranıp **407 kullanılmayan kayıt (23.3 MB)** temizlendi; kalan **251/251 kullanılan medyanın** tamamında SEO `alt_text` dolduruldu (**`0` eksik**).

---

## 10. Faz 9 — Ürün & Şema Kartı Pilotu, Kompakt Çerez, Kampanya LLM/MD & Tek Kaynak Tutarlılığı (2026-11-25 ✅)

- [x] **Ürün & Şema Bloğu Pilotu (`/wolvox-erp`):** Yeni 0-KB `software_product_card` bloğu (`emitSchema: true`) ile sürüm (`WOLVOX 26`), 3 paket, indirme/demo bağlantıları, sistem gereksinimleri, entegrasyonlar ve tek kaynak `SoftwareApplication` şeması devreye alındı; kalan `ERP 9` görsel alt metni düzeltildi.
- [x] **Kampanya Aktif/Süresi Dolmuş Tutarlılığı:** `llms.txt`, `llms-full.txt` ve `/kampanya/<slug>?format=md` artık `resolveCampaign` üzerinden aktif/süresi dolmuş ayrımını, başlangıç/bitiş tarihlerini ve hedef kitleyi tek kaynaktan basar.
- [x] **Tek Kaynak Bayi Kimliği & Saatler:** `LocalBusiness` JSON-LD ve `llms.txt` çalışma saatleri (`Pzt–Cum 08:30–18:00`, `Cmt 09:00–16:00`) ve AKINSOFT (üretici) / Dijital Evre BA35022 (bayi) ayrımı tek `sites` kaydına bağlandı.
- [x] **Gizli JSON-LD Fiyat Temizliği & Tek `FAQPage` & `Vary: Accept`:** Görünür HTML ile çelişen gizli sabit `Offer.price` değerleri temizlendi; soru sayfalarındaki çift `FAQPage` tek geçerli `FAQPage`'e indirildi; HTML/Markdown yanıtlarına `Vary: Accept` eklendi; `/category/makaleler` → `/kategori/makaleler` 301 eklendi.
- [x] **Kompakt Çerez Kartı & 2026 Gizlilik/KVKK Politikası + 5 Mevzuat Kaynağı:** Çerez kartı küçültülüp kabul sonrası kalıcı gizlendi; Gizlilik/KVKK sayfası 2026'ya güncellendi; 5 mevzuat sayfasına resmî GİB kaynak bağlantıları ve son kontrol tarihi (`25 Kasım 2026`) eklendi.
- [x] **Faz 10 — `/wolvox-erp` 6 Sekmeli Fiyat Listesi & İnsan Dili Yenilemesi:** `software_product_card` 6 sekmeli 0-KB CSS sekme yapısına (`Fiyat Listesi`, `Paketler`, `Özellikler`, `Modüller`, `Sistem Gereksinimleri`, `Uyumlu Entegrasyonlar`) geçirildi; açılış paragraf+görsel (`wp_7`) en üstte tutulup kart hemen altına alındı; `abakus.akinsoft.net` resmî 2026 liste ve `%35` kampanya fiyatları (`17.290 TL – 383.630 TL + KDV`) + `AggregateOffer` JSON-LD eklendi; sayfa metinleri doğal Türkçe ile yenilendi.
- [x] **Faz 11 — 36 Ürün & Kategori Sayfası, `sectors_grid`, Sade Paylaşım, Görselli İlgili Karosel & Zengin Sonuç Denetimi:** 6 ana kategori + 30 ürün sayfasının tamamı resmî 2026 Abaküs fiyatları, 6 sekmeli `software_product_card`, araştırılmış `sectors_grid`, iç içe kart temizliği ve BA35022 CTA ile yenilendi (`e-adisyon` şeması `SoftwareApplication`'a çıkarıldı); yedek: `/root/backups/nexpress_akin_pre_faz11_20261125.sql.gz`; 36/36 sayfada Google Zengin Sonuç JSON-LD denetimi ve IndexNow tamamlandı.
