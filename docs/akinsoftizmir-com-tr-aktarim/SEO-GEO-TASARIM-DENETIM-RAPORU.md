# akinsoftizmir.com.tr — SEO, GEO/LLMO, RAG & Web Tasarım Denetim Raporu

> **Tarih:** 2026-11-23  
> **Kapsam:** Canlı site (`https://www.akinsoftizmir.com.tr`), PostgreSQL üretim veritabanı (`nexpress_akin` — salt okunur denetim), Webmaster verileri (GSC & Bing), RAG vektör dizini (`content_chunks`), bot telemetrisi, medya kitaplığı ve `yazilim-bayi` tema mimarisi.

---

## 1. Yönetici Özeti (Skor Kartı)

| Alan | Durum | Özet Bulgu |
| :--- | :---: | :--- |
| **Teknik Altyapı & Hız** | 🟢 **95/100** | 0-KB RSC, `Cache-Control: s-maxage=60`, `HSTS`, `CSP`, `Link: ?format=md`, `robots.txt` + `Content-Signal`, `sitemap.xml`, `llms.txt`, `ai-sitemap.json`, `/.well-known/mcp.json` eksiksiz çalışıyor. |
| **RAG & Vektör Dizini** | 🟢 **92/100** | Yayındaki **132/132 içeriğin tamamı (%100)** `openai:text-embedding-3-small:1536` ile dizinli (**481 parça**, ort. 170 kelime). |
| **GEO / LLMO & Varlık Grafı** | 🟡 **62/100** | Altyapı hazır ama **`schema_rules_count = 0`** (Speakable ve Entity Graph `about`/`mentions` tanımlı değil), **`content_entity_links = 0`** (içerikler arası `@id` bağı kurulmamış) ve **21 adet `ai_prompt` (soru-cevap) taslakta bekliyor**. |
| **Webmaster & Organik Dönüşüm** | 🟡 **65/100** | Bing'de **75.225 gösterim / 6.668 tık**, Google'da **12.916 gösterim / 123 tık (%0.95 TO!)**. Trafik ağırlıklı olarak `web socket` / `tebliğ mazbatası` gibi destek sorgularında; ticari sorgular (`akınsoft`, `akınsoft izmir`, `fiyatmatik`) 6–11. sırada. |
| **İçerik Kalitesi & Tazelik** | 🟡 **68/100** | **11 yayındaki yazı** hâlâ `2024/2025` tarihli; `llms.txt` ve başlıklarda yazım hataları (`E-atura`, `E-Aşiv`, `Pirim`) ve yapay zekâ klişesi (`Günümüzde...`) var; **25+ sayfa/yazı yoğun düz metin duvarı** halinde (22.654 karaktere kadar). |
| **Medya SEO & 404 Hijyeni** | 🟡 **70/100** | 660 görselin **223'ünde alt metin eksik (%33.8)**. Gerçek kullanıcı/bot trafiği alan `/akinsoft-wolvox-erp` (78 isabet), `/demo` (19), `/contact` (17) 404 dönüyor. |
| **Tasarım (`yazilim-bayi`)** | 🟡 **76/100** | Kurumsal renk paleti (`#0c644e`, `#042646`, `#0b4f8a`) ve hız çok iyi; ancak tipografi tek aile (`Inter`), 1290px genişlikte uzun düz metin blokları okunabilirliği düşürüyor, ürün sayfalarında standart görsel dönüşüm şablonu eksik. |

---

## 2. Webmaster (GSC & Bing) Gerçek Veri Analizi

### 2.1. Mevcut Sinyal Özeti (`seo_intel_signals`)
- **Bing Webmaster:** 206 sorgu · **75.225 gösterim** · **6.668 tıklama** · Ort. pozisyon **5.2**
- **Google Search Console:** 50 sorgu · **12.916 gösterim** · **123 tıklama** · Ort. pozisyon **7.5** (Ort. TO: **%0.95** — ciddi iyileştirme alanı)
- **Bağlı Entegrasyonlar:** GSC (`true`), GA4 (`true`), Bing (`true`), Yandex (`true`) — 4 kaynak da aktif.

### 2.2. En Yüksek Fırsat Taşıyan Sorgular (Hemen Aksiyon)

| Sorgu | Kaynak | Gösterim | Tıklama | Pozisyon | Sorun & Aksiyon |
| :--- | :---: | ---: | ---: | ---: | :--- |
| `proforma fatura örneği` | GSC | 735 | **2** | **1.2** | **1. sırada %0.27 TO!** Başlık ve meta açıklaması tıklamaya davet etmiyor; sayfaya indirilebilir/kopyalanabilir örnek tablo + "Ön Muhasebe ile tek tıkla proforma kes" çağrısı eklenmeli. |
| `tebliğ mazbatası nedir` | GSC | 1.496 | 7 | **4.6** | Başlıkta hâlâ **2025** yazıyor (`Tebliğ Ne Demek ? ... 2025`). 2026'ya güncellenip ilk 2 sıraya çıkıldığında ayda +150–250 ek organik tık gelir. |
| `e fatura web socket` / `web socket indir` | GSC + Bing | **47.000+** | **3.250+** | 3.2 – 7.8 | Sitenin en büyük trafik mıknatısı. Bu sayfalara doğal dille **Akınsoft e-Fatura / Wolvox e-Dönüşüm** geçiş köprüsü (`callout` + `contact_campaign`) eklenerek destek trafiği satış lead'ine çevrilmeli. |
| `akınsoft` | GSC / Bing | 464 / 8.353 | 1 / 12 | 7.7 / 5.6 | Ana marka sorgusunda tıklama çok düşük; ana sayfa meta başlığı/açıklaması "İzmir Yetkili Ana Bayi — 30 Gün Ücretsiz Demo & Aynı Gün Kurulum" vaadiyle güçlendirilmeli. |
| `akınsoft izmir` | GSC | 43 | 2 | **6.0** | **En yüksek ticari niyetli yerel sorgu!** İlk 3'e çıkmak için ana sayfa + `/iletisim` + `/hakkimizda` sayfalarında İzmir yerel güven sinyalleri, `LocalBusiness` + `areaServed: İzmir` şeması ve müşteri vakaları güçlendirilmeli. |
| `akınsoft installer` / `wolvox 8 indir` | GSC | 292 | 7 | 7.9 – 8.0 | `/akinsoft-installer-indir` düz metin duvarı (4.008 krk, 3 blok). Adım adım `howto_steps` + sürüm tablosu + destek çağrısı ile ilk 3'e taşınabilir. |
| `fiyatmatik` | GSC | 27 | 1 | **11.4** | 2. sayfa sınırında (Striking Distance). `/fiyatmatik` sayfası zenginleştirilip (özellik kartları + SSS + iç bağlantılar) 1. sayfaya çıkarılmalı. |

---

## 3. GEO / LLMO, RAG & Bot Telemetrisi Analizi

### 3.1. Bot Tarama & Yapay Zekâ Trafiği
- **Doğrulanmış Tarayıcılar:** `googlebot` (**344.387**), `bingbot` (**103.307**), `gptbot` (**564 verified**), `yandexbot` (364), `applebot` (215).
- **Diğer AI Botları:** `meta-agent` (572), `bytespider` (324), `amazonbot` (266), `claudebot` (242), `perplexitybot` (35).
- **AI Yönlendirmeleri (`ai_referral_daily`):** `gemini` (2), `chatgpt` (1) — ilk organik AI yönlendirmeleri başlamış durumda.
- **MCP Kullanımı (`mcp_request_log`):** 12 başarılı çağrı (`nexpress_search_corpus`, `nexpress_ask_site_dna`, `nexpress_fetch_markdown`, `ask`).

### 3.2. RAG (`content_chunks`) Durumu
- **Toplam:** 481 parça / 132 içerik (%100 kapsama), model `openai:text-embedding-3-small:1536`.
- **Tür Dağılımı:** `page` (274 parça, ort. 170 kelime), `post` (169 parça, ort. 188 kelime), `ai_prompt` (24 parça, ort. 97 kelime), `campaign` (14 parça, ort. 56 kelime).
- **Eksik:**
  1. **21 adet `ai_prompt` (Soru-Cevap) taslakta bekliyor** (yayında sadece 12 adet var). Bunlar doğal dille tamamlanıp yayınlandığında AI motorlarının (ChatGPT, Perplexity, Google AIO) doğrudan alıntılayacağı Q&A havuzu **3 katına** çıkar.
  2. **Kampanya sayfaları çok ince** (ort. 56 kelime / 14/14'ü <800 krk). Kampanyalara hedef ürün özeti, kimler yararlanabilir ve sık sorulan 2–3 kısa madde eklendiğinde RAG ve Google Offer gücü artar.

### 3.3. Şema & Varlık Grafı (Acil GEO Kazancı)
- **`/admin/seo/schemas` kural sayısı: `0`!** Yeni kurduğumuz Şema & Varlık Grafı Stüdyosu henüz hiç yapılandırılmamış. Önerilen 4 temel kural:
  1. **Tüm Yazılım Ürün Sayfaları (`SoftwareApplication` + `Speakable` + Entity Graph):** `about`: *Akınsoft* (Wikidata `Q6090032` / resmi site), *ERP* (`https://tr.wikipedia.org/wiki/Kurumsal_kaynak_planlamas%C4%B1`); `Speakable`: `h1, .nx-tldr, h2`.
  2. **Tüm Blog Yazıları (`BlogPosting` + `Speakable`):** `author` (Person) + `Speakable` (`h1, .nx-tldr`) + `mentions` (ilgili yazılım kavramları).
  3. **E-Dönüşüm Sayfaları (`Service` ek `@graph` düğümü):** `areaServed: Türkiye, İzmir`, `about`: *E-Fatura* / *Gelir İdaresi Başkanlığı*.
  4. **Sektörel Çözüm Sayfaları (`Service` + `FAQPage`):** Yerel kurulum & eğitim hizmeti sinyali.
- **`content_entity_links = 0`:** Blog yazıları, Q&A sayfaları ve kampanyalar ile ana yazılım sayfaları (`wolvox-erp`, `on-muhasebe-programi`, `akinsoft-wolvox-restoran-yonetimi`, `e-fatura` vb.) arasında `mentions` / `about` / `offer_for` bağları oluşturulmalı.

---

## 4. İçerik Kalitesi, Yazım Hataları & Düz Metin Sayfalar

### 4.1. Hemen Düzeltilmesi Gereken Yazım Hataları, AI Klişeleri & Eskimiş Yıllar
1. **Yazım Hataları & AI Klişeleri (`llms.txt` ve SERP'e doğrudan yansıyor!):**
   - `/mobil-satis` TL;DR: `"E-atura E-irsaliye kesebilir"` → `"e-Fatura ve e-İrsaliye kesebilir"`
   - `/wolvox-crm-yonetimi` TL;DR: `"Günümüzde müşteri memnuniyeti tüm işletmeler için ilk sırada yer alır."` → Klişeyi kaldırıp doğrudan ürün faydasıyla başla.
   - `/akinsoft-wolvox-restoran-yonetimi` TL;DR: `"yönetimi ile ... yönetimini kolayca yönetin"` → Doğal, tekrarsız cümle.
   - `/e-arsiv-portal` Başlık: `"E-Arşiv Portal Giriş ve E-Aşiv Fatura"` → `"E-Arşiv Fatura"`
   - `/bagkur-7200` Başlık: `"Bağ-Kur Pirim 2025..."` → `"Bağ-Kur Primi..."`
   - `/insan-kaynaklari-yonetimi` TL;DR: `"çok kolay ."` → noktalama ve doğal akış düzeltmesi.
   - `/pavo-n86-android-mobil-pos` TL;DR: sadece 35 karakter (`seo_score: 77`) → 140–160 karakterlik net özet.
2. **2024 / 2025 Yılı Kalan 11 Yayındaki Yazı (2026'ya güncellenmeli):**
   - `guncel-kdv-oranlari-2024`, `tevkifat-nedir-2024-tevkifat-oranlari`, `e-imza` (2024), `teblig-ne-demek` (2025 — **1.496 Google gösterimi!**), `dijital-vergi-dairesi-nedir` (2025), `bagkur-7200` (2025), `kumulatif-vergi-matrahi-nedir` (2025), `tahakkuk-ne-demek` (2025), `vergi-affi` (2025), `merkez-bankasi-faiz-karari-2025`, `ilac-ve-tibbi-cihaz` (2025).

### 4.2. En Düşük SEO Skorlu Ticari Sayfalar (77–84 Puan)
- `e-mutabakat` (77 puan, 974 krk — ince içerik, kısa 23 krk meta başlık)
- `pavo-n86-android-mobil-pos` (77 puan, 35 krk TL;DR)
- `wolvox-ithalat-yontemi` (79 puan, 874 krk)
- `wolvox-webconnect-e-teklif` (79 puan)
- `sube-yonetimi` (82 puan), `stok-depo-yonetimi` (83 puan), `wolvox-uretim-yontemi` (84 puan)
- **9 adet ÖKC Entegrasyon Sayfası** (`beko`, `hugin`, `perkon`, `enpos`, `inpos`, `olivetti`, `profilo`, `verifone`, `inter-mpos` — hepsi 84 puan; 30–36 krk kısa meta başlıklar ve şablon metinler, marka-özel model listesi + kurulum adımları + SSS eklenmeli).

### 4.3. Yoğun Düz Metin Duvarı Olan Sayfalar (Görsel Bloklara Dönüştürülmeli)
Aşağıdaki sayfalarda hiç `bento_features`, `faq_accordion`, `howto_steps`, `comparison_table`, `stats_strip` veya `contact_campaign` bloğu bulunmuyor — uzun düz metin olarak akıyorlar:

| Öncelik | Tür | Slug | Karakter | Blok | Önerilen Görsel Düzen |
| :---: | :---: | :--- | ---: | ---: | :--- |
| **P0** | Sayfa | `/genel-muhasebe-programi` | **22.654** | 2 | Üst özet + `anchor_nav` + Modül `bento_features` + `comparison_table` (Ön vs Genel Muhasebe) + `faq_accordion` + `contact_campaign` |
| **P0** | Sayfa | `/e-ofis` | **19.437** | 4 | Modül kartları (`bento_features`) + Kimler için (`icon_list`) + `faq_accordion` + Demo CTA |
| **P0** | Sayfa | `/super-market-yonetimi` | **12.811** | 3 | Barkod/ÖKC/Terazi `bento_features` + `stats_strip` + `faq_accordion` + `contact_campaign` |
| **P0** | Sayfa | `/insan-kaynaklari-yonetimi` | **11.840** | 5 | Bordro/Puantaj/İzin `bento_features` + `faq_accordion` + `contact_campaign` |
| **P0** | Sayfa | `/wolvox-crm-yonetimi` | **9.783** | 5 | Satış/Teklif/Takip `bento_features` + `faq_accordion` + `contact_campaign` |
| **P1** | Sayfa | `/stok-depo-yonetimi`, `/wolvox-uretim-yontemi`, `/qr-menu`, `/hotel-smart`, `/fiyatmatik`, `/prokuafor`, `/octoplus`, `/wolvox-webconnect` | 2.330 – 4.118 | 2–6 | Standart Yazılım Ürün Sayfası İskeleti (TL;DR + Özellik Kartları + SSS + `contact_campaign`) |
| **P1** | Sayfa | `/akinsoft-installer-indir` | 4.008 | 3 | İndirme adımları (`howto_steps`) + Sistem gereksinimleri (`data_table`) + `callout` |
| **P1** | Yazı | `/wolvox-erp-server-client-baglanti-ayarlari-nasil-yapilir`, `/myrezzta-garson-ekran-kullanimi` | 3.094 – 4.426 | 19–21 | Adım adım kurulum (`howto_steps`) + Uyarı kutuları (`callout`) + SSS (`faq_accordion`) |
| **P2** | Yazı | `/kalite-kontrol`, `/enflasyon-nedir-nasil-hesaplanir`, `/yazilim-gelistirme-trendleri`, `/akinsoft-musteri-girisi-musteri-paneli`, `/e-arsiv-portal` | 4.228 – 7.903 | 21–41 | Özet kutusu (`tldr_box`) + Önemli noktalar (`callout` / `icon_list`) + İlgili ürün bağlantısı |

---

## 5. Medya SEO & 404 / Yönlendirme Hijyeni

1. **Medya Alt Metinleri:** 660 görselin **223'ünde `alt_text` boş** (ort. medya SEO skoru 85). `/admin/media` ekranındaki toplu AI alt metin önerisiyle eksikler hızla tamamlanabilir.
2. **Gerçek 404 → 301 Yönlendirmeleri (Hemen Eklenmeli):**
   - `/akinsoft-wolvox-erp` (**78 isabet**) → 301 `/wolvox-erp`
   - `/demo` (**19 isabet**) → 301 `/akinsoft-demo-talebi`
   - `/contact` (**17 isabet**) → 301 `/iletisim`
3. **Spam 404 Günlüğü Temizliği:** `crawlHygiene.goneRules` zaten `/ajax/*` ve `/kaden/*` kurallarını 410'a çekiyor; eski birikmiş 269.594 satırlık 404 günlüğü `/admin/perfornext` → Veritabanı Bakımı üzerinden temizlenebilir.

---

## 6. Web Tasarım & `yazilim-bayi` Teması İyileştirme Planı

`packages/themes/src/yazilim-bayi.ts` ve canlı site özelleştiricisi incelendiğinde, **0-KB RSC hızını koruyarak** tasarımı bir üst segmente taşıyacak 6 somut iyileştirme:

1. **Tipografi Eşleştirmesi (Başlık + Gövde Ayrımı):**
   - Şu an başlık ve gövde aynı `Inter` fontunda. Başlıklarda karakterli bir geometrik sans (**`Plus Jakarta Sans`** — yerel self-hosted WOFF2, `/admin/themes/customize`), gövdede `Inter` kullanılması B2B yazılım güvenini ve okunabilirliği belirgin artırır.
2. **Uzun Metin Okunabilirliği (`articleWidth` & Satır Uzunluğu):**
   - Canlıda `articleWidth: "1290px"` açık; düz metin paragrafları geniş ekranda 110+ karaktere yayılıyor. Blog ve düz metin bölümlerinde `.nx-rich` metin sütununa `max-width: 72ch` sınırı getirilmeli; geniş alanlar yalnızca `bento_features`, `comparison_table` ve `contact_campaign` gibi çok sütunlu bloklarda kullanılmalı.
3. **Demo Logo Yolundan Çıkış:**
   - `customizer.header.logoImage` hâlâ `/demo/yazilim-bayi/logo.webp` gösteriyor (bu yüzden `<link rel=preload>` de `/demo/...` basıyor). Gerçek logo Medya Kitaplığı'ndan seçilip bağlanmalı.
4. **Görsel Kart & Bant Ritmi (`yazilim-bayi.ts`):**
   - `.yb-card` / `.nx-text-card` kartlarına ince üst vurgu şeridi, daha dengeli iç boşluk (`24px`), hover'da hafif yükselme (`translateY(-2px)`) ve bölümler arası net `#ffffff` ↔ `#eef5f8` ritmi eklenmeli.
   - Footer telif metnindeki `"tüm Hakları Saklıdır"` yazım hatası `"© 2026 Akınsoft İzmir Ana Bayi — Tüm Hakları Saklıdır"` olarak düzeltilmeli.
5. **Standart Ürün Sayfası Dönüşüm İskeleti:**
   - Her yazılım ürün sayfası şu 6 katmanlı akışla standartlaştırılmalı:
     1. **Kısa Değer Önerisi + Hızlı Özet (`tldr_box`)**
     2. **Yapışkan Bölüm Gezgini (`anchor_nav`)**
     3. **Öne Çıkan Modüller / Özellikler (`bento_features`, 3 sütun)**
     4. **Kimler İçin / Kullanım Senaryoları (`icon_list` veya `comparison_table`)**
     5. **Sıkça Sorulan Sorular (`faq_accordion` → otomatik `FAQPage` şeması)**
     6. **Hizalanmış `contact_campaign` (solda ürüne bağlı kampanya, sağda demo formu)**
6. **Güven Şeridi (Social Proof):**
   - Ana sayfa ve kritik ürün sayfalarında `stats_strip` ile Akınsoft İzmir Ana Bayi'nin gerçek güven rakamları (**Bayi Kodu BA35022**, **30+ Yıl Akınsoft Güvencesi**, **81 İl / 150.000+ İşletme**, **Aynı Gün Kurulum & Yerinde Eğitim**) vurgulanmalı.

---

## 7. Önerilen Uygulama Sırası (4 Faz)

| Faz | Kapsam | Tahmini Etki |
| :--- | :--- | :--- |
| **Faz 1 — Hızlı Kazanımlar (Teknik + GEO + 301)** | 4 Şema & Entity Graph kuralı (`/admin/seo/schemas`), 3 adet 301 yönlendirme (`/akinsoft-wolvox-erp`, `/demo`, `/contact`), 223 eksik medya alt metni, `llms.txt` yazım/klişe temizliği, 404 günlüğü temizliği | 🟢 Anında GEO + Tarama + CTR artışı |
| **Faz 2 — `yazilim-bayi` Tema & Tipografi Cilası** | Başlık fontu (`Plus Jakarta Sans`), `.nx-rich` 72ch okuma genişliği, kart/bant ritmi, gerçek logo, footer telif düzeltmesi | 🟢 Kurumsal algı & okunabilirlik artışı |
| **Faz 3 — Webmaster Odaklı İçerik & Tazelik Güncellemesi** | `proforma-fatura`, `teblig-ne-demek` + 11 adet 2024/2025 yazısının 2026'ya doğal dille güncellenmesi; `web socket` sayfalarına e-Dönüşüm dönüşüm köprüsü; 77–84 puanlı düşük skorlu ticari sayfaların güçlendirilmesi; 21 taslak Q&A'nın yayına hazırlanması | 🟢 Yüksek organik tık & lead artışı |
| **Faz 4 — Düz Metin Sayfaların Görsel Dönüşümü & Entity Bağları** | İlk 5 dev düz metin ürün sayfası (`genel-muhasebe-programi`, `e-ofis`, `super-market-yonetimi`, `insan-kaynaklari-yonetimi`, `wolvox-crm-yonetimi`) ve en uzun blog yazılarının `bento_features` + `howto_steps` + `faq_accordion` + `contact_campaign` ile yeniden düzenlenmesi + `content_entity_links` bağlarının kurulması | 🟢 Sayfada kalma süresi, dönüşüm ve AI alıntı liderliği |

---

## 8. Uygulama Günlüğü (2026-11-23 — Tamamlananlar)

- **Yedek:** `/root/backups/nexpress_akin_pre_faz1_20261123.sql.gz` (7.1 MB).
- ✅ **Faz 1:** 4 Şema & Varlık Grafı kuralı (`/admin/seo/schemas`: `BlogPosting + Speakable`, `e-Dönüşüm Service + GİB`, `WebPage + Speakable + Akınsoft/İzmir`, `Yazılım Service + ERP`), 3 adet 301 yönlendirme (`/akinsoft-wolvox-erp`, `/demo`, `/contact`), 7 yazım/klişe/kısa TL;DR düzeltmesi (`mobil-satis`, `wolvox-crm-yonetimi`, `akinsoft-wolvox-restoran-yonetimi`, `insan-kaynaklari-yonetimi`, `pavo-n86-android-mobil-pos`, `e-arsiv-portal`, `bagkur-7200`) ve spam 404 temizliği tamamlandı.
- ✅ **Faz 2 (`04eb95e`):** `packages/themes/src/yazilim-bayi.ts` içinde `.nx-rich` 74ch okuma ölçüsü, `.nx-tldr` Answer-First kutusu, `.yf-card`/`.yb-card` hover yükseltmesi, `.nx-text-card` üst vurgu şeridi ve altlık telif yazımı güncellenip her iki sitede canlıya alındı.
- ✅ **Faz 3:** 30 sayfa/yazı güncellendi — `proforma-fatura-nedir`, `teblig-ne-demek`, `e-fatura-web-socket-indir`, `ana-sayfa`, tüm **2024/2025 tarihli 10 yazı (0 eski yıl kaldı)**, 7 düşük skorlu ticari sayfa ve 10 ÖKC entegrasyon sayfasının başlık/meta/TL;DR alanları doğal Türkçe ile yenilendi.
- ✅ **Faz 4:** `content_entity_links` **0 → 43** anlamsal `@id` bağı (`29 mentions`, `9 offer_for`, `5 about`), 9 yoğun sayfaya Answer-First `tldr_box`, `e-fatura-web-socket-indir` ve `proforma-fatura-nedir` sayfalarına dönüşüm `cta_banner` bloğu, 4 büyük düz metin ürün sayfasına (`genel-muhasebe-programi`, `super-market-yonetimi`, `insan-kaynaklari-yonetimi`, `wolvox-crm-yonetimi`) otomatik `FAQPage` üreten `faq_accordion` bloğu eklendi.
- **Sonraki Opsiyonel Adımlar (Panelden 1 Tıkla):**
  1. `/admin/media` → **AI ile Eksik Alt Metin Üret** (223 görsel).
  2. `/admin/seo/schemas#arama-dizini` → **Dizini Yeniden Oluştur** (yeni eklenen TL;DR ve SSS bloklarını RAG'a işlemek için).
  3. `/admin/qa` → Taslaktaki 21 soru-cevap sayfasını gözden geçirip yayına almak.
