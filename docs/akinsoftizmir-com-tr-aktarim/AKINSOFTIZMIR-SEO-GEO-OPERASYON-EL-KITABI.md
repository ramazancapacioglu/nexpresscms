# akinsoftizmir.com.tr — SEO, GEO/LLMO, Tasarım & Dijital Pazarlama Operasyon El Kitabı

> **Amaç:** Bu belge, `https://www.akinsoftizmir.com.tr` web sitesinin SEO, GEO/LLMO, içerik stratejisi, dönüşüm optimizasyonu ve dijital pazarlama çalışmalarını **NexPress CMS çekirdek geliştirmesinden bağımsız** yürütmek üzere ayrı bir ajan veya ekip için hazırlanmış eksiksiz devir-teslim ve operasyon kılavuzudur.  
> **Son Güncelleme:** 2026-11-25 (Faz 1–12 tamamlandı, canlıda doğrulandı)

---

## 1. Kurumsal Kimlik, Yetkili Bayi Ayrımı ve NAP (Tek Doğruluk Kaynağı)

Yapay zeka modelleri (ChatGPT, Gemini, Perplexity) ve Google E-E-A-T sinyalleri için **yazılım üreticisi** ile **yetkili bayi** kimliği her yüzeyde (HTML, JSON-LD, `llms.txt`, `?format=md`) net ayrılır:

- **Yazılım Üreticisi (Vendor):** `AKINSOFT` — 12 Nisan **1995** kuruluşlu (eski `1989` hatası tamamen temizlendi), **150.000+ işletme** ölçeği.
- **Yetkili Çözüm Ortağı (Seller / Bayi):** `Dijital Evre — Akınsoft İzmir Ana Bayi` · **Resmî Bayi Kodu: `BA35022`** · **200+ aktif müşteri**, 30 gün ücretsiz demo, yerinde/uzaktan kurulum, ekip eğitimi ve **4 iş saati içinde teknik destek**.
- **Standart NAP Bilgisi:**
  - **Adres:** `Muciburrahman Sk. No:3/522 Konak / İzmir`
  - **Telefon:** `0232 425 19 88` / `0232 251 82 28`
  - **Çalışma Saatleri:** `Pazartesi–Cuma 08:30–18:00`, `Cumartesi 09:00–16:00` (Pazar ve resmî tatillerde kapalı) — `LocalBusiness` JSON-LD (`Mo-Fr 08:30-18:00`, `Sa 09:00-16:00`), `/iletisim` ve `/llms.txt` %100 eşittir.
- **Google İşletme Profili:** Place ID `ChIJoXu7XeHYuxQRc1v8FNi0hiQ` · Canlı doğrulanan puan **`4.7 / 5.0`** (**`15` değerlendirme**) · `/hakkimizda` sayfasında `google_reviews` bloğuyla yayında.

---

## 2. Altyapı, Sunucu & Güvenli Veritabanı Çalışma Kuralları

| Bileşen | Değer |
| :--- | :--- |
| **Canlı Alan Adı** | `https://www.akinsoftizmir.com.tr` (0-KB RSC, `yazilim-bayi` teması) |
| **Sunucu & Servis** | VPS (`38.210.77.230:4383`), systemd: `nexpress-akinsoft`, port `3001` |
| **Uygulama Dizini** | `/var/www/vhosts/akinsoftizmir.com.tr/nexpress` (sahip: `akinsoftizmir.com.tr_l22jyrq4vu8:psacln`) |
| **Veritabanı** | PostgreSQL 16 + `pgvector` · Veritabanı adı: `nexpress_akin` |
| **Yedekler Dizini** | `/root/backups/nexpress_akin_pre_faz*.sql.gz` (Faz 1, 5, 6, 7, 8, 9, 11, 12 yedekleri mevcut) |
| **Fiyat Kaynağı (Resmî)** | `https://abakus.akinsoft.net/tr/module/elizacore/abakusapi/programmodulliste?prog_kodu=<KOD>&ULKE=tr&islem=1` (`WOL9`, `WPL7`, `IET1`, `WEO3`, `WYS5`, `WSR6`, `WOT5`, `WFE1`, `IWL1`) |

### Kritik Operasyon Kuralları (Asla İhlal Edilmez)
1. **Her toplu DB değişikliğinden önce yedek:** `sudo -u postgres pg_dump nexpress_akin | gzip > /root/backups/nexpress_akin_pre_<ad>_YYYYMMDD.sql.gz`.
2. **JSONB `blocks` yazım kuralı:** `postgres.js` içinde `${JSON.stringify(arr)}::jsonb` **ASLA** kullanılmaz (JSON string scalar'a çift-kodlar ve sayfayı boşaltır). Veritabanına toplu blok yazarken saf PostgreSQL dollar-quoting (`$BK$...$BK$::jsonb`) veya `tx.json(arr)` kullanın ve işlem sonunda `jsonb_typeof(blocks::jsonb) = 'array'` + canlı `curl` ile `<main>` görünür metin uzunluğunu doğrulayın.
3. **Sırlar:** API anahtarları (`OPENAI_API_KEY`, `googlePlacesApiKey`, PageSpeed API) yalnızca sunucudaki `.env` ve şifreli veritabanı alanlarında tutulur; dokümana veya git'e yazılmaz.
4. **İçerik dili:** Kopya içerik ve yapay AI kalıpları yasaktır; sahadan konuşan, net, insan dilinde Türkçe kullanılır. Ön yüzde sahte yorum/puan gösterilmez.
5. **Ön yüz hızı:** Ziyaretçi sayfalarına `"use client"` bileşeni eklenmez (`First Load JS = 103 kB`, `0 KB` sayfaya özel istemci JS).

---

## 3. Tamamlanan Çalışmalar (Faz 1 – Faz 12 Envanteri)

### Teknik SEO, Hız & Canlı Metrikler (25 Kasım 2026)
- **Lighthouse (PageSpeed Insights v5 — Canlı):** Masaüstü **`100/100/100/100`** (`LCP 487 ms`, `TBT 0.5 ms`, `CLS 0.000`, `TTFB 125 ms`), Mobil **`97–99/100/100/100`** (`LCP 1.38 s`, `TBT 0 ms`).
- **Site Haritası & AI Eşitliği:** `sitemap.xml = 153` | `ai-sitemap.json = 153` (**%100 eşit**, tümü `HTTP 200` + self-canonical).
- **RAG Vektör Dizini (`content_chunks`):** **`153/153` içerik (%100 kapsam)**, **`641` vektör parçası** (`openai:text-embedding-3-small:1536`).
- **Medya Hijyeni:** `658` medya taranıp **407 kullanılmayan kayıt (23.3 MB)** silindi; kullanılan **`251/251`** medyanın tamamında SEO `alt_text` mevcut (**`0` eksik**).
- **Kampanya & LLM Tutarlılığı:** `llms.txt`, `llms-full.txt` ve `/kampanya/<slug>?format=md` çıktıları `resolveCampaignData` ile aktif ve süresi dolmuş kampanyaları ayırır, tarih/indirim/hedef kitle bilgisini basar; `Vary: Accept` başlığı eklidir.
- **Yönlendirmeler (301/308):** `/akinsoft-wolvox-erp` → `/wolvox-erp`, `/demo` → `/akinsoft-demo-talebi`, `/contact` ve `/contact-us` → `/iletisim`, `/akinsoft-wolvox-9a-gecis-kampanyasi` → `/kampanya/wolvox-26-gecis-kampanyasi`, `/rss` → `/feed.xml`, `/category/makaleler` → `/kategori/makaleler`.

### İçerik, Ürünler, Soru-Cevap & Araçlar
- **36 Ürün & Ana Kategori Sayfası (6 Üst Kategori + 30 Ürün):**
  - 30 ürün sayfasının tamamında 2026 resmî Abaküs fiyatlı **6 sekmeli `software_product_card`** (`Fiyat Listesi`, `Paketler`, `Özellikler`, `Modüller`, `Sistem Gereksinimleri`, `Uyumlu Entegrasyonlar`), araştırılmış **`sectors_grid` (Sektörler Bloğu)** ve BA35022 CTA mevcuttur.
  - Google Zengin Sonuç JSON-LD denetimi: **`36/36 HTTP 200`**, **`30/30 SoftwareApplication`** (`16 AggregateOffer`, `14 Offer`, görünür HTML ile `%100` eşit — 30 sayfadaki eski gizli JSON-LD fiyatları temizlendi), **`0` hata / `0` uyarı**.
  - 5 üst kategori sayfasında (`kurumsal-kaynak-planlama`, `muhasebe-programlari`, `sektorel-cozumler`, `akinsoft-e-donusum`, `bulut-yazilim-cozumleri`) karşılaştırma tabloları sayfa sonunda SSS bloğunun hemen üstündedir; `/octoplus` eski özellik tablosu kaldırıldı.
- **33 Otorite Soru-Cevap (`ai_prompt`) Rehberi (`33/33` Yayında):**
  - 12 mevcut + 21 eski taslak tamamen 2026 GİB/VUK mevzuatına göre (`VUK 573/589` 1 Ocak 2026 bilanço e-Arşiv sınırı, `12.000 TL` fatura/tevkifat eşiği, `VUK 565` Ba-Bs iptali, 2026 POS/YN ÖKC kuralı, 1 Temmuz 2026 e-Fatura hadleri, `WOLVOX 26`) temiz ASCII URL'lerle, saha değerlendirmeleriyle ve 5 mevzuat sayfasında resmî `gib.gov.tr` kaynak bağlantılarıyla yayınlandı.
- **Kopya SSS Temizliği:** Tüm 153 yayındaki sayfa tarandı; **22 sayfadaki çift `faq_accordion`** bloğu benzersiz sorular birleştirilerek tek temiz SSS + tek `FAQPage` şemasına indirildi.
- **Canlı 0-KB KDV & Tevkifat Hesaplama Aracı (`/kdv-hesaplama-araci`):** 5 modlu, `%1/%10/%20` + özel oranlı, `2/10–10/10` tevkifatlı, 2026 `12.000 TL` uyarılı ve tek tıkla özet kopyalamalı araç yayında.
- **UX & Yasal Sayfalar:** Üst/ana menüde dönen SVG açılır menü okları, `AI Prompts` → `Sorular` etiket düzeltmesi, sol alt kompakt kalıcı çerez kartı (`nx_consent`), 2026 güncel `/gizlilik-politikasi`, sade paylaşım çubuğu ve öne çıkan görselli ilgili içerikler karoseli canlıda.

---

## 4. Yeni Ajan İçin Öncelikli Yol Haritası (Sıradaki Görevler)

Aşağıdaki görevler artık doğrudan **`akinsoftizmir.com.tr` SEO / GEO / Dijital Pazarlama Ajanı** tarafından yürütülmelidir:

1. **Dış Kaynak (Off-Page) NAP & Yerel SEO Temizliği (Yüksek Öncelik):**
   - Yandex Maps'teki eski/başka bayiye ait (`İsmet Kaptan Mah.` ve `AS Bilişim`) kayıtlardan `akinsoftizmir.com.tr` web bağlantısının kaldırtılması.
   - Google İşletme Profili, Yandex, Bing Places, LinkedIn ve Akınsoft resmî bayi dizininde tek NAP (`Muciburrahman Sk. No:3/522 Konak/İzmir`, `0232 425 19 88`, `BA35022`) eşitlemesi ve gerçek müşterilerden yazılı Google yorumu toplama kampanyası.
2. **Özel `/sektorler` Merkezi ve Sektör Açılış Sayfaları:**
   - Ürün sayfalarına eklenen `sectors_grid` kartlarını besleyecek `/sektorler` ana sayfası ve yüksek hacimli sektör sayfalarının (Üretim/OSB, Toptan Ticaret, Restoran/Kafe, E-Ticaret, Otel/Turizm, Teknik Servis, Süpermarket) oluşturulup `sectors_grid` `href` alanlarına bağlanması.
3. **Arama Motoru Sıralama & Dönüşüm Takibi (2–4 Haftalık Döngü):**
   - Google Search Console, Bing Webmaster ve Yandex Webmaster üzerinde 153 URL'nin (özellikle yeni 21 Soru-Cevap ve 30 fiyat tablolu ürün sayfasının) indeks, gösterim, TO (CTR) ve pozisyon artışlarının haftalık izlenmesi.
   - `/admin/seo/reports` ve `/admin/perfornext` (PageSpeed + AI bot telemetrisi) üzerinden düşüş gösteren sorgulara hedefli içerik güncellemesi.
4. **Dönemsel Kampanya & Abaküs Fiyat Senkronizasyonu:**
   - Her ay başında (ör. 1 Aralık 2026) `abakus.akinsoft.net` fiyat ve kampanya oranlarının kontrol edilip 30 ürün kartı + kampanya sayfalarının tek seferde güncellenmesi ve IndexNow bildirimi.
5. **RAG Güncelleme Rutini:**
   - Toplu içerik değişikliklerinden sonra `content_chunks` tablosundaki güncellenmiş içeriklerin `openai:text-embedding-3-small:1536` ile yeniden gömülmesi (`153/153` kapsamın korunması).
