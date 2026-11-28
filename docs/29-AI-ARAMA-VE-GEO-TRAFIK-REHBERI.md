# 29 — AI Arama Motorları, Kaynak Gösterme (GEO) ve Trafik Artırma Rehberi

28 Kasım 2026 · NexPress CMS Yayın, SEO ve Büyüme Ekipleri İçin Başvuru Kılavuzu

Bu doküman; Google AI Overviews / AI Mode, ChatGPT Search, Microsoft Bing & Copilot, Perplexity, Anthropic Claude, Yandex Neuro ve Apple Intelligence gibi modern yapay zeka arama motorlarının bir web sitesine **nasıl ulaştığını**, **hangi ölçütlerle kaynak gösterdiğini** ve **organik/AI trafiğini gerçek müşteri dönüşümüne nasıl çevireceğimizi** resmi belgelere ve NexPress CMS mimarisine göre özetler.

---

## 1. Platform Bazlı Resmi Bot ve Keşif Haritası

Modern AI ekosisteminde **arama/kaynak gösterme (grounding) botları** ile **temel model eğitimi botları** birbirinden ayrılmıştır. Arama botunu engellemek, o platformda tamamen görünmez olmak ve atıf trafiğini rakiplere bırakmak anlamına gelir.

| Platform | Arama & Kaynak Botu (**Açık Tutulmalı**) | Eğitim Botu (İsteğe Bağlı) | Anlık Kullanıcı Botu | Keşif ve Dizin Mekanizması | Resmi Ölçüm / Trafik Sinyali |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google** (AI Overviews & AI Mode) | `Googlebot` | `Google-Extended` | — | Ana Google arama dizini + **Query Fan-Out** (karmaşık soruyu alt sorgulara bölüp canlı çekme) | Google Search Console (Web Performansı içine dahil) |
| **OpenAI** (ChatGPT Search) | `OAI-SearchBot` | `GPTBot` | `ChatGPT-User` | Kendi arama dizini + web arama ortaklığı; **JS çalıştırmaz**, saf SSR HTML okur | `utm_source=chatgpt.com` |
| **Microsoft** (Bing & Copilot) | `Bingbot` | — | — | Bing arama dizini + **IndexNow** anlık bildirimi (Bing'de yoksa Copilot'ta da yok) | **Bing Webmaster Tools → AI Performance** (*Total Citations*, *Grounding Queries*) |
| **Perplexity** | `PerplexityBot` | *(Eğitimde kullanmıyor)* | `Perplexity-User` | Gerçek zamanlı kendi web dizini; resmi IP listesi JSON ile doğrulanır | `referrer: perplexity.ai` / `utm_source=perplexity` |
| **Anthropic** (Claude Search) | `Claude-SearchBot` | `ClaudeBot` | `Claude-User` | Canlı web araması + kullanıcı tetiklemeli anlık sayfa okuma | `referrer: claude.ai` |
| **Yandex** (Yandex Neuro / Alisa) | `YandexBot` | — | — | Yandex dizini + **IndexNow** anlık bildirimi | Yandex Webmaster & Yandex Metrika |
| **Apple** (Siri / Spotlight / Apple Intelligence) | `Applebot` | `Applebot-Extended` | — | Apple web dizini + Schema.org yapısal verileri | Sunucu erişim ve bot günlüğü |

### Önerilen `robots.txt` Bot Politikası

Amaç **AI görünürlüğü, kaynak gösterimi ve nitelikli trafik** ise tüm arama botlarına kapı açık bırakılır; yalnızca model eğitimine içerik vermek istemeyen yayınlar eğitim botlarını kapatabilir:

```text
# Arama ve AI kaynak gösterme botları (AÇIK)
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: YandexBot
Allow: /
User-agent: Applebot
Allow: /

# İsteğe bağlı: Yalnızca model eğitimini kapatmak isterseniz
# User-agent: GPTBot
# Disallow: /
# User-agent: ClaudeBot
# Disallow: /
# User-agent: Google-Extended
# Disallow: /
```

> **WAF / Cloudflare / Nginx Uyarısı:** `robots.txt` izin verse bile agresif güvenlik duvarı kuralları (`Bot Fight Mode`, hız sınırları) `OAI-SearchBot`, `PerplexityBot` ve `Claude-SearchBot` isteklerini `403` ile kesebilir. Sunucu günlükleri ve NexPress **AI Bot Taramaları** ekranı (`/admin/seo/reports?group=bots`) düzenli kontrol edilmelidir.

---

## 2. AI Modeller Bizi Nasıl Seçip Kaynak Gösteriyor?

### 2.1. Query Fan-Out (Sorgu Dallandırma)
Kullanıcı tek bir karmaşık soru sorduğunda (ör. *"İzmir'de üretim firması için ERP yazılımı ve 2026 fiyatları"*), Google AI Mode, ChatGPT Search ve Copilot bu soruyu arka planda 5–10 alt sorguya böler (*"üretim ERP modülleri"*, *"Wolvox ERP fiyat listesi"*, *"İzmir yetkili ERP kurulum"*).
- **Kazanım kuralı:** Tek bir genel sayfa yerine **konu merkezi (pillar) + alt teknik rehber + yapısal ürün fiyat sayfası + yerel/sektörel çözüm sayfası** kümesi kuran siteler birden fazla alt sorguda seçilir.

### 2.2. Passage-Level Grounding (Pasaj Düzeyinde Alıntı)
AI modelleri sayfanın tamamını değil, alt soruya en net ve çelişkisiz yanıt veren **40–80 kelimelik tek bir pasajı veya tabloyu** çıkarır.
- Sayfanın en üstünde **Answer-First (`tldr_box`)** özeti,
- Soru biçiminde net `H2` / `H3` başlıkları,
- Karşılaştırma ve fiyat tabloları,
- Görünür soru-cevapla birebir örtüşen `FAQPage` ve `SpeakableSpecification` işaretlemesi alıntı olasılığını katlar.

### 2.3. SSR HTML + Sıfır Çelişki + E-E-A-T
- `OAI-SearchBot`, `PerplexityBot` ve `Claude-SearchBot` istemci JavaScript'i çalıştırmaz; tüm içerik, tablolar ve fiyatlar ilk sunucu HTML yanıtında (`0-KB RSC`) hazır olmalıdır.
- Görünür HTML, Markdown (`?format=md`), `llms.txt`, WebMCP (`/api/mcp`) ve JSON-LD (`Offer`/`AggregateOffer`, `SoftwareApplication`, `Person`, `Organization`) arasında **sıfır veri çelişkisi** olmalıdır.
- Güncelleme tarihi (`dateModified`, `lastVerified`), gerçek yazar/uzman profili (`Person` + `knowsAbout`), yerel işletme bilgileri ve doğrulanmış dış profiller (`sameAs`) güven eşiğini belirler.

---

## 3. Trafiği ve Teklif Dönüşümünü Artıran 6 Strateji

1. **Zero-Click Tuzağından Çık, Derinlik İçeriği Üret:**
   - *"X nedir?"* gibi tek paragraflık tanım aramaları AI özetinde biter.
   - Tıklama ve teklif getiren sayfalar: **güncel fiyat & modül tabloları**, **ürün karşılaştırmaları (X vs Y)**, **sektöre/şehre özel çözüm sayfaları**, **hata/kurulum rehberleri**, **canlı demo / teklif talebi akışları**.
2. **Bing Webmaster "AI Performance" + IndexNow Döngüsü:**
   - Bing Webmaster **AI Performance** raporu, AI'ın siteni bulmak için arka planda ürettiği gerçek **Grounding Queries** (temellendirme sorguları) listesini verir.
   - Bu sorgulardaki eksik açıları ilgili sayfalara yeni H2 + SSS olarak eklemek hem Copilot hem ChatGPT hem Google AI Overviews görünürlüğünü hızla artırır.
   - Her içerik veya fiyat güncellemesinde **IndexNow** bildirimi (otomatik veya toplu) tetiklenmelidir.
3. **Site Dışı Marka ve Varlık Sinyalleri (Off-Site Entity Co-occurrence):**
   - LLM'ler bir markayı güvenilir kaynak sayarken yalnızca kendi sitesine değil; **Google İşletme Profili yorumlarına, YouTube eğitim videolarına, LinkedIn teknik paylaşımlarına, resmi iş ortağı/bayi dizinlerine ve sektörel rehberlere** bakar.
   - Marka adı, yetkili bayi kodu, telefon, adres ve ürün adları tüm platformlarda birebir tutarlı olmalı ve `Organization.sameAs` ile bağlanmalıdır.
4. **Bilgi Rehberlerinden Ticari Sayfalara Köprü Kur:**
   - AI trafiği çoğu zaman ana sayfaya değil, doğrudan teknik rehbere veya fiyat sayfasına iner.
   - Her rehberin içinde ilgili ürün kartına doğal iç bağlantı, net **Ücretsiz Demo / Teklif** çağrısı ve `contact_campaign` bloğu bulunmalıdır.
5. **Tazelik (Freshness) Disiplini:**
   - Fiyat, mevzuat (e-Fatura, e-Arşiv, ÖKC) ve sürüm sayfaları düzenli güncellenmeli; `lastVerified`, `priceValidUntil` ve `dateModified` alanları gerçek kontrol tarihini yansıtmalıdır.
6. **Ölçümü "Atıf" Değil "GEO ROI Hunisi" Üzerinden Yönet:**
   - NexPress panelindeki **`/admin/seo/reports?group=geo-roi`** ekranı sayfa bazında `AI Bot Taraması → AI Yönlendirmesi → Teklif/Form Dönüşümü` verisini birleştirir.
   - Haftalık rutin: En çok AI botu ve AI ziyareti alıp düşük form dönüşümü üreten ilk 5 sayfaya daha net fiyat özeti, karşılaştırma tablosu ve yukarıda görünür teklif CTA'sı eklemek.

---

## 4. NexPress CMS Teknik Hazırlık Kontrol Listesi

| Yetenek | NexPress Durumu | Konum |
| :--- | :--- | :--- |
| 0-KB SSR HTML + Speculation Rules + `content-visibility: auto` | ✅ Aktif | `[locale]/layout.tsx`, `public.css` |
| `?format=md` + `Accept: text/markdown` + `Vary: Accept` + `Link: rel="canonical"` | ✅ Aktif | `api/markdown-negotiation/route.ts`, `next.config.ts` |
| `llms.txt`, `llms-full.txt`, `ai-sitemap.json` (`noIndex` uyumlu) | ✅ Aktif | `apps/cms/src/lib/llms-*.ts`, `ai-sitemap-response.ts` |
| WebMCP (`/api/mcp` + `inputSchema` + `nexpress_get_product_pricing` + rate limit) | ✅ Aktif | `apps/cms/src/app/api/mcp/route.ts` |
| Otomatik & Toplu IndexNow | ✅ Aktif | `apps/cms/src/lib/indexnow.ts` |
| `SpeakableSpecification`, `knowsAbout`, `@id` Entity Graph, `AggregateOffer` | ✅ Aktif | `packages/seo-core/src/index.ts`, `engine.ts` |
| AI Bot Taramaları + **GEO ROI Hunisi** | ✅ Aktif | `/admin/seo/reports?group=bots`, `?group=geo-roi` |

---

## 5. Resmi Kaynaklar

- Google Search Central — *Yapay Zeka Özellikleri ve Web Siteniz*: https://developers.google.com/search/docs/appearance/ai-features?hl=tr
- OpenAI — *Overview of OpenAI Crawlers (`OAI-SearchBot`, `GPTBot`, `ChatGPT-User`)*: https://platform.openai.com/docs/bots
- Microsoft Bing Webmaster — *AI Performance & Webmaster Guidelines*: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
- Perplexity — *Perplexity Crawlers (`PerplexityBot`, `Perplexity-User`)*: https://docs.perplexity.ai/guides/bots
- Anthropic — *Claude Crawlers (`ClaudeBot`, `Claude-SearchBot`, `Claude-User`)*: https://support.anthropic.com
- IndexNow Protocol: https://www.indexnow.org/documentation
