# 04 — Çekirdek SEO, Çok Boyutlu GEO ve Temel LLMO Motoru (`@nexpress/seo-core`)

Bu modül **açık kaynaklı çekirdeğin (Free Core)** bir parçasıdır ve herhangi bir eklenti kurmadan sitenin Google, Bing ve temel AI botlarında kusursuz indekslenmesini sağlar.

---

## 1. Teknik SEO Çekirdeği

1. **Dinamik Metadata & OpenGraph Şablonları:**
   - Sayfa bazında `metaTitle`, `metaDescription`, `canonicalUrl`, `noIndex` / `noFollow`.
   - Dinamik `@vercel/og` (`ImageResponse`) ile her yazı ve sayfa için otomatik kurumsal OpenGraph görseli üretimi.
2. **Parçalı XML Sitemap (`/sitemap.xml` indeks + `/sitemaps/{tür}-{sayfa}.xml`):**
   - `/sitemap.xml` yalnızca indekstir; her içerik türü (`page`, `post`, `kb_tech`, `ai_prompt`, `campaign`, `product`) ayrı dosyalara, dosya başına en çok 10.000 adrese (`SITEMAP_PAGE_SIZE`; protokol sınırı 50.000) bölünür. Dosya adı `kb_tech-2.xml` gibidir; geçersiz ad, olmayan tür veya sayfa 404 döner.
   - Yalnızca **yayınlanmış, `noindex` olmayan ve görünürlüğü `public` olan** çeviriler girer. Hangi türlerin basılacağı `/admin/seo` ayarındadır (`sitemapTypes`).
   - Her `<url>` aynı `contentId`'nin tüm dil/bölge çevirilerini karşılıklı `xhtml:link hreflang` ile (kendine dahil) ve `x-default` (site varsayılan dili) ile bağlar; çeviri başka dosyada olsa bile.
   - Adresler slug'ı URL için kodlar; XML kaçışı ayrıca uygulanır. `lastmod` indekste dosyadaki en yeni güncellemedir.
   - Veri `SitemapRepository` (bloksuz, yalnızca gerekli sütunlar) ve `cachedRead` önbelleği üzerinden gelir. Mantık `@nexpress/seo-core/src/sitemap.ts` içinde saf işlevlerdir (9 test). Yanıt `s-maxage=300`.
3. **301 / 302 Akıllı Yönlendirme Yöneticisi:**
   - Bir sayfanın `slug` adresi değiştirildiğinde eski URL otomatik olarak 301 tablosuna kaydedilir (404 kaybı sıfırlanır).

---

## 2. Çok Boyutlu GEO & Hreflang Motoru

1. **Esnek URL Yönlendirme:**
   - Tek dilli sitelerde kök dizin (`/hakkimizda`), çok dilli/bölgeli sitelerde ise `/{locale}-{region}/{slug}` (`/tr-tr/hakkimizda`, `/en-us/about`, `/de-de/uber-uns`).
2. **Otomatik Karşılıklı `Hreflang` Matrisi:**
   - `contentTranslations` tablosundaki aynı `contentId`'ye bağlı tüm dil/bölge varyantları `<head>` içinde karşılıklı (`self-referencing` + `x-default`) olarak basılır.
3. **Bot-Dostu Edge Konum Algılama:**
   - Arama motoru botları (Googlebot, Bingbot, GPTBot) **asla** IP adresine göre zorla yönlendirilmez.
   - Yalnızca gerçek insan ziyaretçilere kendi dil/ülke versiyonuna geçiş öneren hafif bir üst bar gösterilir.

---

## 3. Ücretsiz Çekirdek LLMO (Temel Yapay Zeka Uyumluluğu)

1. **Temel `/llms.txt` Üreticisi:**
   - Sitenin adını, kısa açıklamasını ve yayınlanan ana sayfaların/yazıların Markdown link listesini standart `/llms.txt` formatında sunar.
2. **Sıfır Maliyetli Markdown Müzakeresi (`?format=md` & `Accept: text/markdown`):**
   - Herhangi bir sayfa URL'sine `?format=md` eklendiğinde veya HTTP başlığında `Accept: text/markdown` istendiğinde, veritabanındaki `markdownCache` sütunu 0ms CPU maliyetiyle doğrudan döndürülür. Ara katman isteği `/api/markdown-negotiation` rotasına yazar ve sayfa yolunu `x-nexpress-target-path` başlığında taşır.
3. **Temel Schema.org (JSON-LD) & Otomatik Blok Şema Türetimi (`deriveAutoSchemaNodes`):**
   - `WebSite`, `Organization`, `BreadcrumbList` ve temel `Article` / `WebPage` şemaları otomatik üretilir.
   - İçerikteki `faq_accordion` bloklarından `FAQPage`, `howto_steps` bloklarından `HowTo`, `review_box` bloklarından `Review` ve `video_embed` bloklarından `VideoObject` düğümleri `@graph` içine otomatik eklenir.

---

## 4. Çekirdek Otomatik SEO Motoru (`packages/seo-core/src/engine.ts`)

SEO bir eklenti veya harici araç değil, her `saveContent` / `patchContent` kaydında ve her RSC sayfa render'ında otomatik çalışan çekirdek motordur:
1. **`analyzeSeo(input)`:** Başlık, meta açıklama, URL, Answer-First TL;DR, odak anahtar kelime yoğunluğu/dağılımı, kelime sayısı, H2/H3 hiyerarşisi, görsel `alt` metinleri ve Schema.org uyumluluğunu 17 ağırlıklı kriter üzerinden denetler (`0-100` skor + `A/B/C/D` harf notu).
2. **`resolveSeoMeta(input)`:** Global şablon kurallarına (`%title% | %site%`) ve otomatik açıklama geri dönüşlerine (`TL;DR` -> `ilk paragraf`) göre Next.js `Metadata` nesnesini üretir.
3. **Otomatik 301 Yönlendirme (`slugHistory` & `resolveContentBySlug`):** Bir sayfa veya blog yazısının `slug` adresi değiştirildiğinde eski slug `schemaAttributes.slugHistory` içine kaydedilir; eski adrese gelen istekler `permanentRedirect` ile otomatik olarak yeni adrese yönlendirilir.

---

## 5. SEO sayfası (`/admin/seo`)

Motor ayarları tema özelleştiricisinden ayrıdır. Kayıt `sites.settings.seo` içindedir.

- **Durum:** ortalama skor, harf dağılımı, eksik meta, noindex yayın, görselsiz kayıt, odak kelime ve kısa metin. En zayıf sekiz kayıt stüdyoya bağlanır.
- **Ayarlar:** başlık şablonları, açıklama kaynağı, kurum kimliği, otomatik şema, canonical, slug 301, `/llms.txt`, sitemap türleri ve `robots.txt` ek satırları.
- Sitemap yalnızca seçili içerik türlerini basar. `/llms.txt`, ayar kapalıyken 404 döner. `robots.txt` yönetim ve API yollarını kapatır, ek satırları sona ekler.

---

## 6. Sosyal görsel, IndexNow, başlıklar ve istek önbelleği

- **OG görseli (`/og?title=&site=`):** `next/og` ile 1200×630 PNG. Öne çıkan görseli olmayan içerik `resolveSeoMeta` içinde bu adresi kullanır. Yanıt `s-maxage=604800` ile önbelleğe alınır.
- **IndexNow:** `content:afterPublish` eylemi (`apps/cms/src/lib/indexnow.ts`) yayınlanan adresi `api.indexnow.org`'a bildirir. Yalnızca üretimde, `INDEXNOW_API_KEY` tanımlıyken, `seo.enableIndexNow` açıkken ve genel bir alan adında çalışır; hata yayını bozmaz. Anahtar `/indexnow-key.txt` adresinde sunulur.
- **Güvenlik / önbellek başlıkları:** bkz. `docs/11-SECURITY-AND-OPERATIONS.md` §4.
- **İstekler arası veri önbelleği (`lib/cache.ts`, `lib/public-data.ts`):** ziyaretçi sayfalarının tüm okumaları (site, içerik, gezinme, yorumlar, yayınlanmış liste, varlık bağlantıları) `cachedRead` ile iki katmanda saklanır: `react.cache` (istek içi) ve `unstable_cache` (istekler arası, anahtar = ad + `siteId` + argümanlar, etiket = `site:{siteId}`). Tarihler `stringifyWithDates` / `parseWithDates` ile korunur. Admin eylemleri `revalidatePath` yerine `@/lib/cache` içindeki sarmalayıcıyı çağırır; o da kiracının etiketini düşürür. Yedek süre 120 sn (zamanlanmış yayınlar için). Geçersiz kılma iki mekanizmayla yapılır: etiket (`revalidateTag`) **ve** anahtara giren site başına "dönem" sayacı (her yazmada artar, başlangıçta süreç zamanıdır). Yalnızca etiketle denendiğinde hızlı ardışık kayıtların yaklaşık yarısında bayat okuma görüldü; dönem sayacıyla 10/10 ve 5/5 anında yansıdı. Sayaç süreç başınadır. Ticaret (stok, sepet) bilerek dışarıda.
- **CDN HTML önbelleği (isteğe bağlı):** `PUBLIC_CACHE_SECONDS` > 0 ise `/tr` ve `/tr/{slug}` yanıtlarına `Cache-Control: public, s-maxage=N, stale-while-revalidate=5N` eklenir; `/tr/magaza/*`, `/admin`, `/login` hariçtir. Değer derleme anında okunur. CDN kopyası düzenlemeden sonra en fazla N sn bayat kalır. Sitemap, robots, `llms*.txt` yanıtları her zaman `s-maxage=300`.
- **IndexNow:** yalnızca `published` kayıtlarda tetiklenir; adres `NEXT_PUBLIC_APP_URL` ile mutlak yapılır.
- **Dürüst işaretleme:** değerlendirme yokken ön yüz yapay `5.0` ve yıldız göstermez; kategori / etiket yoksa örnek etiket basılmaz. `AggregateRating` şeması yalnızca onaylı inceleme varken üretilir.
- **Görsel bloğu:** `image_figure` `width`/`height` kabul eder (CLS), `priority: true` ile `eager` + `fetchPriority="high"` (LCP).
- **Bilinmeyen dil kökü:** `/{locale}` yalnızca `sites.supportedLocales` içindeki diller için render olur; diğerleri (`/zzz`) 404 döner (önceden ana sayfayı 200 ile kopyalıyordu).

---

## 7. Bot tarama telemetrisi (çekirdek)

Hangi botların neyi ne sıklıkla çektiğini ölçer; GEO'nun temel geri bildirim döngüsüdür.

- **Algılama:** `@nexpress/core` `ai-bots.ts` (`KNOWN_BOTS`: GPTBot, ClaudeBot, PerplexityBot, Googlebot, Bingbot, Applebot, YandexBot, Meta-ExternalAgent, Amazonbot, CCBot, Bytespider; kategori: AI eğitim / AI arama / arama motoru). Tek düzenli ifadeyle ön süzgeç; insan trafiğine ek maliyet bu kadardır.
- **Kayıt noktaları (`apps/cms/src/lib/bot-log.ts`, `trackBotVisit(kind)`):** ana sayfa, içerik sayfası, `?format=md` (markdown), `llms.txt` / `llms-full.txt`, `ai-sitemap.json`, sitemap indeksi ve parçaları, `robots.txt`, `/api/mcp`. Kayıt `after()` ile yanıttan sonra yapılır; yanıt süresini etkilemez.
- **Dile göre keşif (2026-10-31):** `/{locale}/llms.txt`, `/{locale}/llms-full.txt`, `/{locale}/ai-sitemap.json`; kök adresler varsayılan/`Accept-Language` diline düşer. `ai-sitemap.json` içindeki `localeEndpoints` her dilin üç adresini verir; etkin olmayan dil varsayılana düşer (404 değil).
- **Doğrulama (`lib/bot-verify.ts`):** yalnızca ters DNS sunan sağlayıcılar (Google, Bing, Apple, Yandex) için ileri-doğrulamalı ters DNS (IP → ad → aynı IP). Sonuç `verified`. OpenAI, Anthropic, Perplexity vb. ters DNS sunmaz; onların istekleri dürüstçe `claimed` (yalnızca User-Agent iddiası) kalır ve panelde "UA iddiası" diye görünür. Sahte `Googlebot` UA'sı `claimed` olarak sayılır. IP başına 24 saat önbellek.
- **Veri (`bot_daily_stats`, `siteId` kapsamlı):** gün (UTC) × bot × tür × güven düzeyi başına sayaç ve son görülme. **IP ve User-Agent saklanmaz.** Artış atomik `ON CONFLICT DO UPDATE hits = hits + 1` ile yapılır.
- **Sınırlar:** CDN önbelleğinden dönen HTML uygulamaya ulaşmaz ve sayılmaz (`PUBLIC_CACHE_SECONDS` > 0 iken sayfa istekleri eksik sayılır; llms/sitemap/mcp yanıtları da `s-maxage` ile CDN'e takılabilir). Ters proxy arkasında `X-Forwarded-For` doğru iletilmelidir.
- Pro `agentic-seo` yalnızca bu veriyi kartta gösterir (`dashboard.overview.cards`).

---

## 8. Medya hattı (yükleme, AVIF/WebP türevleri, srcset, LCP)

- **Yükleme (`POST /api/media/upload`):** oturum şart; `Origin` ana makineyle eşleşmeli (ek CSRF savunması); en çok 12 MB; dosya **içeriğe bakılarak** doğrulanır (`sharp` metadata), uzantıya güvenilmez. Kabul: JPEG, PNG, WebP, AVIF. Reddedilir: SVG, animasyonlu görsel, HEIC, metin/bozuk dosya, ~64 MP üstü (sıkıştırma bombası). EXIF yönü uygulanmış boyut kaydedilir.
- **Depolama (`lib/media/storage.ts`):** `{MEDIA_DIR}/{siteId}/{id}/original` ve `.../v/{genişlik}.{biçim}`; kiracı klasörü ayrıdır, kimlik ve dosya adı doğrulanır, yol kök dışına çıkamaz, türevler atomik yazılır. **Özgün dosya hiçbir rotadan sunulmaz** (EXIF/konum yalnızca diskte kalır). `MEDIA_DIR` kalıcı bir birim olmalıdır.
- **Başvuru:** `url = /media/{id}?w={genişlik}&h={yükseklik}[&a=1]` — boyutlar adrese gömülüdür; ön yüz veritabanına gitmeden `width/height` (sıfır CLS) ve saydamlık bilgisini bilir. Dış adresler olduğu gibi çalışır (düz `<img>`).
- **Türevler (`GET /media/{id}/{genişlik}.{biçim}`):** genişlik yalnızca `320, 480, 640, 768, 1024, 1280, 1600, 1920, 2560`, biçim `avif | webp | jpg | png` (başka her şey 404; sınırlı önbellek kümesi, DoS koruması). İlk istekte `sharp` ile üretilir (yön düzeltme, büyütmeden küçültme, sRGB, **tüm EXIF silinir**), diske yazılır; eşzamanlı istekler tek işleme birleşir. Yanıt `Cache-Control: public, max-age=31536000, immutable`; biçim adreste olduğundan CDN'de Accept'e bağlı değildir. `/media/{id}` 1280px WebP'ye yönlendirir.
- **Ön yüz (`ResponsiveImage`, `@nexpress/themes`):** yerel medya için `<picture>` (AVIF → WebP → JPG/PNG yedek), `srcset`, `sizes`, özgün `width/height`. İstemci JS yoktur. `image_figure`, katalog blokları (galeri, kahraman, kartlar) ve öne çıkan görsel bunu kullanır.
- **LCP:** `findLcpImageId` ilk iki üst düzey bloktaki ilk görseli seçer → `loading="eager"` + `fetchpriority="high"`; diğerleri `lazy` + `decoding="async"`. Sayfada öne çıkan görsel varsa o LCP olur ve gövde görselleri öncelik almaz (`lcp={false}`).
- **Odak noktası:** `/admin/media` içindeki ayar (X/Y %) kırpılan (object-cover) görsellerde `object-position` olur: blok görseli, katalog blokları ve öne çıkan görsel. Harita (`getPublicMediaFocal`, yalnızca 50/50 dışındakiler) önbellekten gelir ve görsel kaydedilince düşer; yani değişiklik içeriklere dokunmadan her yerde anında geçerli olur. Yönetimde canlı önizleme vardır.
- **Ön ısıtma:** yüklemeden sonra (`after()`, yanıtı bekletmez) 640 ve 1280 px için AVIF + WebP + JPG/PNG sırayla üretilir; ilk ziyaretçi beklemez.
- **Silme (`deleteMediaAssetAction`, yalnızca `admin`):** görsel içeriklerde (blok ağacı, öne çıkan görsel, yayın öznitelikleri) aranır; kullanımdaysa silmez, içerik listesini döner. İkinci onayla (`force`) kayıt ve tüm dosyalar (özgün + türevler) silinir. Disk önbelleği varlık başına en çok 9 genişlik × 4 biçim ile sınırlıdır; silmede temizlenir.
- **Yönetim:** `/admin/media` içinde yükleme formu, silme, odak önizlemesi; listeler ve seçici 320/480 px WebP küçük resim kullanır.
- **Ölçüm (gürültülü 3000×2000 fotoğraf, 5,07 MB):** 1280 px AVIF 124 KB, JPG 360 KB; 320 px AVIF 1,2 KB.

---

## 9. Arama dizini (RAG): parçalama, gömme, vektör arama

Yapay zeka ajanlarının (MCP) ve editör araçlarının içeriği **anlam/sözcük yakınlığıyla** bulmasını sağlar. Çekirdektedir (`@nexpress/rag`); Pro eklentiler yalnızca tüketir.

- **Parçalama (`@nexpress/core` `chunker.ts`, saf):** `markdownCache` başlık duyarlı bölünür. Başlık yolu (`H1 > H2`) her parçaya bağlam olur; kod çiti/tablo/liste bölünmez; büyük blok cümle sınırında bölünür; küçük bloklar birleşir (varsayılan 40–220 kelime) ve aynı başlık altındaki ardışık parçalar 30 kelime örtüşür. İçerik başlığı ve TL;DR ilk parçadır. Her parçanın FNV-1a özeti vardır.
- **Gömme sağlayıcıları (`providers.ts`):** vektörler **model kimliğiyle** (`openai:text-embedding-3-small:1536`, `local:hash-v1:1536`) saklanır ve arama yalnızca aynı modeli kullanır; modeller karışmaz. Boyut şemada 1536'ya sabittir.
  - `local` (varsayılan, anahtarsız): öznitelik karma (sözcük + Türkçe kök + ikili) ile **sözcüksel** benzerlik; eş anlamlıları yakalamaz. Arayüzde "Sözcüksel (yerel)" diye etiketlenir.
  - `openai`: `OPENAI_API_KEY` varsa otomatik; `OPENAI_BASE_URL` ile OpenAI uyumlu başka sunucu, `EMBEDDING_MODEL` ile model. 64'lük gruplar, 429/5xx'te üstel geri çekilme, yanlış boyut reddi. `EMBEDDING_PROVIDER=local|openai` ile zorlanır.
- **Depolama (`content_chunks`, `ChunkRepository`):** PostgreSQL'de `vector(1536)` + **HNSW** (`vector_cosine_ops`), arama `<=>`; SQLite'ta vektör `f32:<base64>` olarak saklanır, arama süreç içi iç çarpımdır (yaklaşık 20 bin parçaya dek makul; üstünde PostgreSQL önerilir). Yeni sütunlar: `chunk_hash`, `embedding_model`, `word_count` (eski veritabanlarında `db:push` idempotent ekler).
- **Görünürlük:** yalnızca `published`, `noindex` olmayan ve görünürlüğü `public` içeriğin parçaları döner (kural: taslak/gizli içerik asla bir ajana sızmaz).
- **Dizinleme:** `content:afterPublish` kancası (`registerRagIndexing`) içeriği **yanıttan sonra** (`after()`) dizinler; parça özetleri ve model değişmediyse gömme çağrısı yapılmaz. `/admin/seo` içindeki "Dizini yeniden oluştur" tüm içeriği tarar (değişmeyenler atlanır; model değiştiyse hepsi yeniden gömülür). Başarısızlık yayını bozmaz.
- **Tüketiciler:** MCP `nexpress_search_corpus` (parça düzeyinde alıntı + başlık yolu + skor; dizin yoksa veya aktif model için boşsa **anahtar kelime aramasına düşer** ve bunu `retrieval` alanında bildirir); editör yan çekmecesindeki Co-Pilot (kayıtlı vektörlerden benzer içerik / kanibalizasyon / iç bağlantı önerisi; eşik modele bağlıdır: anlamsal 0,82, sözcüksel 0,50).
- **Sınırlar:** yerel model anlamsal değildir (sıralama kaba olabilir); ayrıca sorgu gömmesi için dış sağlayıcıda her aramada bir çağrı yapılır (200 girdilik bellek önbelleği vardır); parça güncellemesi içerik başına tam yenilemedir (kısmi yeniden kullanım yok).


## 10. F11 — Bot politikası, besleme, JSON-LD denetimi, site içi arama, bağlantı denetimi

- **Bot politikası (`robots.txt`):** `seo.botPolicy` (bot kimliği → `allow`/`block`) `/admin/seo` > Ayarlar'da bot başına seçilir; "Eğitim botlarını kapat" kısayolu vardır. `buildRobotsTxt` (`packages/core/src/robots.ts`, testli) engelli botların `robotsTokens` simgelerini tek grupta `Disallow: /` ile yazar; `*` grubu `/admin` ve `/api`'yi her zaman kapatır. **Uyarı:** robots.txt bir rica protokolüdür; uymayan botu durdurmaz (bot telemetrisi `claimed` olarak bunu gösterir).
- **RSS 2.0 ve Atom:** `/feed.xml`, `/atom.xml` (`seo-core/src/feed.ts`, testli). Yalnızca herkese açık, dizine açık `post` içerikleri; en yeni 50 öğe; özet `tldr → excerpt → metaDescription`. Ziyaretçi sayfalarının `<head>`'inde `rel=alternate` keşif bağlantıları vardır.
- **JSON-LD doğrulayıcı:** `validateSchemaGraph` (`seo-core/src/schema-validate.ts`, testli) Article/BlogPosting, FAQPage, HowTo, Product(+Offer), Review, BreadcrumbList, VideoObject, Organization, WebSite için gerekli (hata) ve önerilen (uyarı) alanları denetler. Editörün SEO sekmesinde otomatik düğümlerin altında canlı gösterilir. Tam Schema.org doğrulayıcısı değildir.
- **Hibrit arama:** `searchCorpus` (`packages/rag`) vektör sonuçlarını BM25 (`packages/core/src/search.ts`, Türkçe aksan katlamalı, başlık ×3) ile **RRF** (k=60) kullanarak birleştirir; `hybrid:false` yalnızca vektör. MCP `nexpress_search_corpus` bunu kullanır (`ranking: "hybrid"`). Anahtar kelime tarafı her sorguda yayındaki içerikleri okur (önbellek yok: yayından kaldırma/noindex anında yansımalı).
- **Site içi arama:** `/{locale}/ara?q=` — sunucuda BM25, düz GET formu, istemci JS'i yok, `noindex`. Ücretli gömme çağrısı **yapmaz** (anonim ziyaretçi maliyet saldırısı olmasın). Menüye eklemek için bağlantı `/{locale}/ara` olarak verilir.
- **İç bağlantı denetimi:** `auditLinks` (`core/src/link-audit.ts`, testli) yayındaki içeriklerin Markdown'ındaki iç bağlantıları çözer; kırık ve `slugHistory` ile taşınmış (301) olanları `/admin/seo` kartında listeler. Dış bağlantılar yalnızca sayılır.
- **`Link` başlığı:** içerik sayfaları `Link: <…?format=md>; rel="alternate"; type="text/markdown"` ile Markdown karşılığını bildirir (middleware).


## 11. Site geneli SEO denetimi ve sayfa içi SEO (2026-10-30)

- **`/admin/seo/audit`** (`core/seo-audit`, saf ve testli): yayındaki içerikler için başlık (20–60), meta açıklama (70–160), TL;DR, ince içerik (<150 sözcük; ürünlerde yok), puan (<70 uyarı, <50 hata), alt metni olmayan görsel, odak anahtar kelime, noindex ve aynı dilde **yinelenen başlık/açıklama**. Sayfa başına ağırlıklı sıralama, sorun türüne göre süzgeç, dil sekmeleri, her satır düzenleyiciye gider.
- **Editör SEO sekmesi:** meta açıklama ve TL;DR artık ayrı alanlardır (meta boşsa TL;DR kullanılır; kayıt `metaDescription || tldr`), uzunluk ölçerleri (metinle de durum söyler), gerçek site adresiyle masaüstü/mobil arama sonucu önizlemesi, sosyal paylaşım kartı, **noindex** (yayındaki sayfada uyarı) ve **canonical** (biçim/alan adı uyarısı) alanları. Önceden noindex/canonical için arayüz yoktu.

- **Besleme süzgeçleri (2026-10-31):** `/feed.xml` ve `/atom.xml` için `?category=` ve `?tag=` (ad ya da slug; büyük/küçük harf ve yazım farkı gözetmez, `termMatches`). Başlık ve `self` adresi süzgeci taşır. **Canonical:** `autoCanonical` kapalıysa ve elle adres girilmemişse canonical etiketi yazılmaz (Open Graph adresi sayfa adresidir).
