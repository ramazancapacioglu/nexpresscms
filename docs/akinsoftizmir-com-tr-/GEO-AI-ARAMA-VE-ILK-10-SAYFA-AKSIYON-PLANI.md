# akinsoftizmir.com.tr — GEO, AI Arama, Tasarım ve İlk 10 Sayfa Aksiyon Planı

**Oluşturulma:** 28 Kasım 2026 · **Canlı Sürüm:** `2bd403b` · **Veritabanı:** PostgreSQL `nexpress_akin`  
**Kapsam:** Bu belge, `akinsoftizmir.com.tr` sitesinin arama motorları (Google, Bing, Yandex) ve yapay zeka arama motorlarında (Google AI Overviews/AI Mode, ChatGPT Search, Microsoft Copilot, Perplexity, Claude Search, Apple Intelligence) kaynak gösterimini, organik trafiğini ve teklif dönüşümünü büyütmek için **canlı operasyon ve takip merkezidir**.

> Genel platform ve bot referansı için bkz. [29-AI-ARAMA-VE-GEO-TRAFIK-REHBERI.md](../29-AI-ARAMA-VE-GEO-TRAFIK-REHBERI.md).

---

## 1. Canlı Teknik & Sinyal Taban Çizgisi (28 Kasım 2026)

### 1.1. Entegrasyonlar ve `robots.txt`
- **Canlı `/robots.txt`:** `Allow: /`, `Allow: /api/mcp`, `Allow: /api/site-icon`, `Content-Signal: search=yes, ai-input=yes, ai-train=yes`, `Sitemap: https://www.akinsoftizmir.com.tr/sitemap.xml` — **Aktif**.
- **Webmaster & IndexNow:** `IndexNow` (`SET`), `Bing Webmaster` (`SET`), `Google Search Console` (`SET`), `Yandex Metrika` (`SET`) — **Aktif**.
- **NexPress Teknik Altyapı:** `0-KB RSC`, `?format=md` + `Vary: Accept`, `llms.txt` / `llms-full.txt`, `ai-sitemap.json`, WebMCP (`/api/mcp` + `nexpress_get_product_pricing`), `Speculation Rules API`, `content-visibility: auto`, `GEO ROI Hunisi` (`/admin/seo/reports?group=geo-roi`) — **Canlıda Aktif**.

### 1.2. Canlı Bot Taramaları (Dönem Özeti)
| Bot | HTML Sayfa | Markdown (`?format=md`) | Diğer (`robots` / `sitemap`) | Durum |
| :--- | ---: | ---: | ---: | :--- |
| `yandexbot` | 215 | — | 20 (`robots`) | Çok aktif |
| `meta-agent` | 84 | **110** | — | Markdown aktif tüketiliyor |
| `bingbot` | 79 | **13** | 15 (`sitemap`) | Copilot temel dizini aktif |
| `googlebot` | 79 | — | 14 (`robots`) | Aktif |
| `bytespider` | 67 | 25 | — | Aktif |
| `perplexitybot` | 38 | — | — | Aktif |
| `gptbot` | 34 | — | — | Aktif |
| `applebot` | 34 | **27** | — | Markdown aktif tüketiliyor |

### 1.3. Canlı AI Yönlendirmeleri ve Form Dönüşümleri
- **AI Kaynaklı Ziyaretler:**
  - `chatgpt`: `/e-fatura-web-socket-indir` (2), `/hakkimizda` (2), `/` (1), `/servis-yonetimi` (1)
  - `gemini`: `/akinsoft-installer-indir` (2)
- **Spam Dışı Form Dönüşümleri:**
  - `/akinsoft-demo-talebi`: **16**
  - `/e-fatura-web-socket-indir`: **7**
  - `/iletisim`: **2**
  - `/akinsoft-wolvox-restoran-yonetimi` (1), `/on-muhasebe-programi` (1), `/octocloud` (1), `/wolvox-erp` (1), `/akinsoft-destek` (1), `/` (1)

---

## 2. Acil Altyapı & Webmaster Kontrol Listesi

- [x] **Kanonik Host Hizalaması (`www` ↔ apeks) [2026-11-28]:** `NEXT_PUBLIC_APP_URL`, `sites.domain`, `robots.txt` Sitemap, Markdown `Link: rel="canonical"` ve `Bing Webmaster → siteUrl` değerlerinin tamamı **`https://www.akinsoftizmir.com.tr`** olarak eşitlendi ve canlıda doğrulandı.
- [x] **Toplu IndexNow Gönderimi & Bingbot Canlı Temizlik Doğrulaması [2026-11-28]:** `Bingbot` User-Agent'ı ile canlı `/otel-yonetimi-programi` yanıtının tamamen temiz Türkçe NexPress HTML olduğu (PHP/hack kalıntısı yok, `httpdocs` boş) doğrulandı; 7 alt site haritasındaki tüm **164** `https://www.akinsoftizmir.com.tr/...` adresi `api.indexnow.org/indexnow` uç noktasına gönderilerek **`HTTP 200 OK`** alındı.
- [x] **WAF / Nginx Bot Kontrolü [2026-11-28]:** Canlı `www.akinsoftizmir.com.tr/wolvox-erp` ve `?format=md` üzerinde `OAI-SearchBot`, `GPTBot`, `Claude-SearchBot`, `ClaudeBot`, `PerplexityBot` ve `Bingbot` tamamı **`HTTP 200`** doğrulandı; 15.584 satırlık Nginx erişim günlüğünde tüm AI/arama botları için **`0` adet `403`/`429`/`5xx`** (yalnızca eski hack spam URL'lerinde `Bingbot 410:4382` ve `Googlebot 410:1382`) teyit edildi.
- [ ] **Bing Webmaster AI Performance İlk Dışa Aktarım:** Bing Webmaster Tools → **AI Performance** → **Cited Pages** & **Grounding Queries** CSV'lerini indirip `/admin/seo/reports?group=geo-roi` ekranından içe aktar; eksik alt başlık taşıyan sorguları aşağıdaki sayfa planına ekle.
- [ ] **Site Dışı Varlık (Off-Site Entity) Tutarlılığı:** Google İşletme Profili, LinkedIn, YouTube ve AKINSOFT resmi bayi profilinde `BA35022`, Konak/İzmir adres, telefon ve ürün adlarının birebir tutarlı ve `Organization.sameAs` ile bağlı olduğunu doğrula.

---

## 3. İlk 10 Yüksek Niyetli Sayfa Aksiyon Planı (Faz 16 Takip Tablosu)

Her sayfa tamamlandığında kutucuk `[x]` işaretlenir, `MarkdownCache` derlenir, **IndexNow** bildirimi yapılır ve `CANLI-OPERASYON-VE-IYILESTIRME-GUNLUGU.md` dosyasına işlenir.

| # | Durum | Sayfa Adresi | Canlı Eksik | Yapılacak Somut İyileştirme | Hedef Sorgu / AI Niyeti |
| :-: | :-: | :--- | :--- | :--- | :--- |
| **1** | `[ ]` | `/servis-yonetimi` | **ChatGPT'den trafik alıyor!** `faq=N`, `tbl=N` | 6 soruluk teknik servis `faq_accordion` (`FAQPage`) + paket/modül `comparison_table` (cihaz takip, garanti, SMS/WhatsApp, barkod) ekle. | teknik servis programı, wolvox servis yönetimi fiyatları |
| **2** | `[ ]` | `/genel-muhasebe-programi` | `27.6 KB`, `card=Y`, **`form=N`, `tbl=N`** | `contact_campaign` teklif/demo formu + **Ön Muhasebe vs Genel Muhasebe** `comparison_table` ekle. | genel muhasebe programı, mali müşavir muhasebe yazılımı |
| **3** | `[ ]` | `/e-ofis` | `22.3 KB`, `card=Y`, **`form=N`, `faq=N`, `tbl=N`** | 5 soruluk `faq_accordion` (`FAQPage`) + `contact_campaign` teklif formu + modül özet tablosu ekle. | akınsoft e-ofis programı, ofis takip yazılımı fiyatları |
| **4** | `[ ]` | `/e-fatura-web-socket-indir` & `/akinsoft-installer-indir` | **En yüksek AI trafiği & 7 form!** | Üst bölüme 1 tıkla **"Ücretsiz Uzaktan Kurulum / Teknik Destek"** CTA + sık karşılaşılan kurulum/port/Windows hata çözümleri `faq_accordion` ekle. | e-fatura web socket indir, akınsoft installer kurulum hatası |
| **5** | `[ ]` | `/super-market-yonetimi` | `17.1 KB`, `card=Y`, `faq=Y`, **`form=N`, `tbl=N`** | `contact_campaign` teklif formu + **ÖKC / Barkod / Terazi Uyumluluk Tablosu** (`comparison_table`) ekle. | market barkod programı, süpermarket pos yazılımı izmir |
| **6** | `[ ]` | `/insan-kaynaklari-yonetimi` | `16.4 KB`, `card=Y`, `faq=Y`, **`form=N`, `tbl=N`** | `contact_campaign` teklif formu (bordro, PDKS, puantaj, SGK entegrasyonu demo çağrısı) ekle. | insan kaynakları programı, bordro puantaj yazılımı |
| **7** | `[ ]` | `/e-defter` & `/e-adisyon` | Yüksek hacimli GİB aramaları; **`form=N`, `tbl=N`** | `contact_campaign` teklif formu + **GİB Geçiş Şartları / Kontör & Lisans Karşılaştırma Tablosu** ekle. | e-defter programı, restoran e-adisyon zorunluluğu ve fiyatı |
| **8** | `[ ]` | `/akinsoft-myfranchise` | `card=Y`, **`form=N`, `faq=N`, `tbl=N`** | 5 soruluk çok şubeli yönetim `faq_accordion` (`FAQPage`) + `contact_campaign` kurumsal demo formu ekle. | franchise yönetim yazılımı, şube takip programı |
| **9** | `[ ]` | `/wolvox-erp` & `/akinsoft-wolvox-restoran-yonetimi` | Amiral gemisi dönüşüm sayfaları; **`tbl=N`** | AI *Query Fan-Out* karşılaştırma sorguları için **`comparison_table`** (Wolvox ERP vs OctoPlus / Restoran Standart vs Kurumsal paket karşılaştırması) ekle. | wolvox erp vs octoplus, en iyi restoran adisyon programı izmir |
| **10** | `[ ]` | `/akinsoft-entegrasyonlar` & `/bulut-yazilim-cozumleri` | Kategori merkezleri (`faq=Y`, `tbl=Y`, **`form=N`**) | Sayfa sonuna `contact_campaign` danışmanlık/teklif formu + en çok sorulan pazaryeri/bulut geçiş çağrısı ekle. | akınsoft pazaryeri entegrasyonu, bulut muhasebe programı |

---

## 4. Diğer Sayfalar İçin Standart Kalite & Genişletme Takip Havuzu (Faz 17+)

Site genelindeki diğer ürün, sektör, ÖKC ve blog/rehber sayfalarında yeni işler açıldıkça aşağıdaki 6 maddelik standart uygulanır ve bu bölüme satır eklenir:

### Standart Sayfa Kabul Ölçütleri (Her Ticari Sayfa İçin)
1. **Answer-First (`tldr_box`):** İlk ekranda 40–70 kelimelik net, alıntılanabilir özet.
2. **Yapısal Ürün Kartı (`software_product_card`):** Doğru para birimi, KDV notu, `lastVerified` / `priceValidUntil` tarihi (HTML = Markdown = JSON-LD `AggregateOffer` = WebMCP `nexpress_get_product_pricing`).
3. **Karşılaştırma Tablosu (`comparison_table`):** Paket/modül veya sürüm karşılaştırması (zero-click koruması + Query Fan-Out).
4. **Tekil SSS (`faq_accordion` → `FAQPage`):** En az 4–6 gerçek müşteri sorusu (çift `faq_accordion` yok).
5. **Dönüşüm Bloğu (`contact_campaign` / `form_block`):** Sayfa içinde ayrılmadan demo/teklif bırakma imkânı + İzmir/Ege yerel otorite sinyali (`BA35022`).
6. **Yayın Sonrası Döngü:** `MarkdownCache` yeniden derleme → **IndexNow** bildirimi → canlı HTTP 200 + `?format=md` + JSON-LD teyidi.

### Haftalık GEO & Tasarım İzleme Rutini
- **Pazartesi:** `/admin/seo/reports?group=geo-roi` (GEO ROI Hunisi) üzerinden son 7–30 günün **Bot → AI Ziyaret → Form Dönüşümü** tablosunu kontrol et.
- **Çarşamba:** Bing Webmaster **AI Performance → Grounding Queries** ve Google Search Console hızlı kazanım sorgularını (4.–15. sıra) inceleyip ilgili sayfalara alt başlık/SSS ekle.
- **Cuma:** Yeni güncellenen sayfalarda mobil (390 px) yatay taşma, ürün kartı klavye/sekme erişilebilirliği ve form gönderim akışını kontrol et.

### Sıradaki Sayfa Adayları (Faz 17 Havuzu)
- [ ] `/bulut-yedekleme-programi` (`form=N`, `tbl=N`)
- [ ] `/surucu-kursu-otomasyonu` (`form=N`, `tbl=N`)
- [ ] `/otel-yonetimi-programi` (`tbl=N` — pansiyon vs otel paket karşılaştırması)
- [ ] `/wolvox-hizli-satis` (`tbl=N` — market/mağaza/barkod karşılaştırması)
- [ ] `/mobil-satis` (`tbl=N` — sıcak satış vs soğuk satış modül karşılaştırması)
- [ ] `/sektorler` altındaki 7 dikey sektör sayfası (teklif formu & sektör bazlı fiyat aralığı özeti teyidi)
