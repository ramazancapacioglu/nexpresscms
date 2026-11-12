# 04 — Çekirdek SEO, Çok Boyutlu GEO ve Temel LLMO Motoru (`@nexpress/seo-core`)

Bu modül **açık kaynaklı çekirdeğin (Free Core)** bir parçasıdır ve herhangi bir eklenti kurmadan sitenin Google, Bing ve temel AI botlarında kusursuz indekslenmesini sağlar.

---

## 1. Teknik SEO Çekirdeği

0. **Kalıcı bağlantılar** (`/admin/seo/settings` ve motor ayarları): `postname` (varsayılan `/{slug}`), `plain`, `dayname` (`/yıl/ay/gün/slug`), `monthname`, `numeric` (`/arsiv/{sayı}/slug`). Tarih ve sayısal ön ek ara katmanda düşer; asıl sayfa slug adresidir. Kayıt `public/.htaccess` (veya `HTACCESS_PATH`) dosyasını yeniler. Dosyada WordPress `index.php` kuralı yoktur. Nginx bu dosyayı okumaz.

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
   - `/admin/seo/schemas` şema kuralını sayfa, blog veya kategoriye bağlar. İçeriğin kendi özel türü (SSS, yazılım, hakkımızda) kuraldan etkilenmez.
   - İçerikteki `faq_accordion` bloklarından `FAQPage`, `howto_steps` bloklarından `HowTo`, `review_box` bloklarından `Review` ve `video_embed` bloklarından `VideoObject` düğümleri `@graph` içine otomatik eklenir.

---

## 4. Çekirdek Otomatik SEO Motoru (`packages/seo-core/src/engine.ts`)

SEO bir eklenti veya harici araç değil, her `saveContent` / `patchContent` kaydında ve her RSC sayfa render'ında otomatik çalışan çekirdek motordur:
1. **`analyzeSeo(input)`:** Başlık, meta açıklama, URL, Answer-First TL;DR, odak anahtar kelime yoğunluğu/dağılımı, kelime sayısı, H2/H3 hiyerarşisi, görsel `alt` metinleri ve Schema.org uyumluluğunu 17 ağırlıklı kriter üzerinden denetler (`0-100` skor + `A/B/C/D` harf notu).
2. **`resolveSeoMeta(input)`:** Global şablon kurallarına (`%title% | %site%`) ve otomatik açıklama geri dönüşlerine (`TL;DR` -> `ilk paragraf`) göre Next.js `Metadata` nesnesini üretir.
3. **Otomatik 301 Yönlendirme (`slugHistory` & `resolveContentBySlug`):** Bir sayfa veya blog yazısının `slug` adresi değiştirildiğinde eski slug `schemaAttributes.slugHistory` içine kaydedilir; eski adrese gelen istekler `permanentRedirect` ile otomatik olarak yeni adrese yönlendirilir.

---

**Başlık şablonu güvencesi:** `resolveSeoMeta` başka SEO eklentilerinin değişkenlerini (`%sitename%`, `%sitedesc%`, `%%title%%`…) `%site%`, `%tagline%`, `%title%`'a çevirir (`normalizeTitleTemplate`), tanınmayanı atar ve sonuç boş ya da yalnız ayraçsa `başlık | site`'e düşer. Yarıda kesilmiş açıklama (`healCutDescription`) toparlanır. Sayfa şeması yayın tarihi, kırıntı ve görsel taşır; yazar adı yoksa yazar Organization'dır (uydurma kişi yazılmaz); içe aktarma izleri JSON-LD'ye girmez.

**Site simgesi:** `seo.siteIcon` (kitaplıktan yerel görsel). Yayımlanan adresler: `/favicon.ico` (32), `/apple-touch-icon.png` (180), `/api/site-icon/{192|512}`, `/manifest.webmanifest`. Ayar boşsa hiçbiri yayımlanmaz ve `<link>` basılmaz.

**Sözleşme testi:** `pnpm --filter @nexpress/cms seo:contract` çalışan uygulamada her içerik için dolu başlık, tek h1, canonical, og:title, geçerli ve sızıntısız JSON-LD, yazılarda `datePublished`/yazar/`og:type=article` denetler (CI'da koşar).

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
- **CDN HTML önbelleği (isteğe bağlı, çalışma zamanı):** `PUBLIC_CACHE_SECONDS` > 0 ise ara katman (`middleware.ts` → `htmlCacheControl`, `packages/core/src/html-cache.ts`) **çalışma zamanında** uygun ziyaretçi sayfalarına `Cache-Control: public, s-maxage=N, stale-while-revalidate=5N` (en çok 1 gün) koyar; derleme gerekmez, tüm dillerde ve ön eksiz adreslerde çalışır (eski derleme zamanlı kural yalnızca `/tr` yollarını eşliyordu). **Yalnızca herkese aynı çıktı:** GET/HEAD; `nx_*` çerezi (oturum, çerez onayı, içerik parolası, önizleme, oy) taşımayan; yalnızca `sayfa`, `utm_*`, `gclid`, `fbclid`, `msclkid`, `ref` sorgusu olan (`utm_source` hariç: yapay zeka yönlendirmesi izlemesi kaynakta sayılsın); `/magaza`, `/ara`, `/kampanya`, `/api`, `/og` ve dosya uzantılı uç noktalar dışında; taslak/önizleme `private, no-store`; kapalı (noindex) siteler asla. Çerezli istek Next'in `private, no-store` varsayılanında kalır. CDN kopyası düzenlemeden sonra en fazla N sn bayat kalır (önerilen 30–120). Sitemap, robots, `llms*.txt` yanıtları her zaman `s-maxage=300`. CDN/nginx tarafında çerez atlama kuralı için `scripts/nginx-nexpress.conf` sonundaki isteğe bağlı bloğa bakın; Cloudflare'da `nx_` çerezi olan isteklere "Cache bypass" kuralı yazın. **Bedel:** CDN isabetleri uygulamaya ulaşmaz (bot/yapay zeka telemetrisi eksik sayılır).
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

- **Genel indeks (`seo.searchIndexing`):** `/admin/seo` > Ayarlar. Kayıt yoksa açık sayılır. Kapalıyken sayfa meta ve `X-Robots-Tag` `noindex, nofollow` olur, site haritası boş döner, `robots.txt` yalnızca `Disallow: /` yazar. Kopya veya deneme sitesi için kapatılır.
- **Bot politikası (`robots.txt`):** `seo.botPolicy` (bot kimliği → `allow`/`block`) `/admin/seo` > Ayarlar'da bot başına seçilir; "Eğitim botlarını kapat" kısayolu vardır. `buildRobotsTxt` (`packages/core/src/robots.ts`, testli) engelli botların `robotsTokens` simgelerini tek grupta `Disallow: /` ile yazar; `*` grubu `/admin` ve `/api`'yi her zaman kapatır. İndeks kapalıysa bu grupların yerine tüm site kapanır. **Uyarı:** robots.txt bir rica protokolüdür; uymayan botu durdurmaz (bot telemetrisi `claimed` olarak bunu gösterir).
- **RSS 2.0 ve Atom:** `/feed.xml`, `/atom.xml` (`seo-core/src/feed.ts`, testli). Yalnızca herkese açık, dizine açık `post` içerikleri; en yeni 50 öğe; özet `tldr → excerpt → metaDescription`. Ziyaretçi sayfalarının `<head>`'inde `rel=alternate` keşif bağlantıları vardır.
- **JSON-LD doğrulayıcı:** `validateSchemaGraph` (`seo-core/src/schema-validate.ts`, testli) Article/BlogPosting, FAQPage, HowTo, Product(+Offer), Review, BreadcrumbList, VideoObject, Organization, WebSite için gerekli (hata) ve önerilen (uyarı) alanları denetler. Editörün SEO sekmesinde otomatik düğümlerin altında canlı gösterilir. Tam Schema.org doğrulayıcısı değildir.
- **Hibrit arama:** `searchCorpus` (`packages/rag`) vektör sonuçlarını BM25 (`packages/core/src/search.ts`, Türkçe aksan katlamalı, başlık ×3) ile **RRF** (k=60) kullanarak birleştirir; `hybrid:false` yalnızca vektör. MCP `nexpress_search_corpus` bunu kullanır (`ranking: "hybrid"`). Anahtar kelime tarafı her sorguda yayındaki içerikleri okur (önbellek yok: yayından kaldırma/noindex anında yansımalı).
- **Site içi arama:** `/{locale}/ara?q=` — sunucuda BM25, düz GET formu, istemci JS'i yok, `noindex`. Ücretli gömme çağrısı **yapmaz** (anonim ziyaretçi maliyet saldırısı olmasın). Menüye eklemek için bağlantı `/{locale}/ara` olarak verilir.
- **İç bağlantı denetimi:** `auditLinks` (`core/src/link-audit.ts`, testli) yayındaki içeriklerin Markdown'ındaki iç bağlantıları çözer; kırık ve `slugHistory` ile taşınmış (301) olanları `/admin/seo` kartında listeler. Benzersiz dış adresler (en çok 40) sonuçta durur ama sayfa açılışında yoklanmaz.
- **Dış bağlantı denetimi:** yönetici `/admin/seo` içinde "Dış bağlantıları denetle" der. `probeExternalLinks` en çok 30 adresi, dört eşzamanlı, 4 saniyelik zaman aşımıyla yoklar. Yalnızca 80/443 kapılı http(s); kimlik bilgili adres, localhost, `.local`, meta veri adı ve genel olmayan IP (DNS sonucu dahil) istek almaz. Her yönlendirme aynı kapıdan geçer. 401/403 erişim engeli sayılır, kırık sayılmaz.
- **`Link` başlığı:** içerik sayfaları `Link: <…?format=md>; rel="alternate"; type="text/markdown"` ile Markdown karşılığını bildirir (middleware).


## 11. Site geneli SEO denetimi ve sayfa içi SEO (2026-10-30)

- **`/admin/seo/audit`** (`core/seo-audit`, saf ve testli): yayındaki içerikler için başlık (20–60), meta açıklama (70–160), TL;DR, ince içerik (<150 sözcük; ürünlerde yok), puan (<70 uyarı, <50 hata), alt metni olmayan görsel, odak anahtar kelime, noindex ve aynı dilde **yinelenen başlık/açıklama**. Sayfa başına ağırlıklı sıralama, sorun türüne göre süzgeç, dil sekmeleri, her satır düzenleyiciye gider.
- **Editör SEO sekmesi:** meta açıklama ve TL;DR artık ayrı alanlardır (meta boşsa TL;DR kullanılır; kayıt `metaDescription || tldr`), uzunluk ölçerleri (metinle de durum söyler), gerçek site adresiyle masaüstü/mobil arama sonucu önizlemesi, sosyal paylaşım kartı, **noindex** (yayındaki sayfada uyarı) ve **canonical** (biçim/alan adı uyarısı) alanları. Önceden noindex/canonical için arayüz yoktu.

- **Besleme süzgeçleri (2026-10-31):** `/feed.xml` ve `/atom.xml` için `?category=` ve `?tag=` (ad ya da slug; büyük/küçük harf ve yazım farkı gözetmez, `termMatches`). Başlık ve `self` adresi süzgeci taşır. **Canonical:** `autoCanonical` kapalıysa ve elle adres girilmemişse canonical etiketi yazılmaz (Open Graph adresi sayfa adresidir).

- **Medya SEO'su (2026-11-02):** `scoreMediaSeo` (çekirdek, testli) görsel için alt metin (varlığı, 8–125 karakter, "görsel…" önekinden kaçınma), anlamlı dosya adı (IMG_1234 gibi adlar cezalı), başlık, boyut (≥600 px) ve dosya ağırlığını; belge/video/ses için başlık, açıklama ve (video için) özet/alt yazıyı puanlar. **Görsel site haritası:** `<image:image>` (loc, title, caption) sayfa başına en çok 50 görselle; yerel `/media/{id}?…` başvuruları taranabilir `/media/{id}/1280.webp` adresine çevrilir, veri URI'leri atlanır. Video/ses bloğu otomatik `VideoObject`/`AudioObject` şeması üretir (`contentUrl`, `encodingFormat`, `uploadDate`). **Güvenlik düzeltmesi:** sayfa şema grafiği `schemaAttributes` içinden editör iç alanlarını (`_publishing` — yayın parolası dahil —, `seo`, `slugHistory`, `richSchema`, `canvas`) JSON-LD'ye sızdırıyordu; artık `_` ile başlayan ve bu iç alanlar elenir (testli).

- **Ürün şeması (2026-11-03):** ticaret ürün sayfaları `buildProductGraph` ile Product (+Offer/AggregateOffer, onaylı yorumlardan aggregateRating) ve BreadcrumbList JSON-LD'si basar; fiyat yoksa Offer üretilmez. Tüm JSON-LD gömmeleri `jsonLdString` ile `<`, `>`, `&` ve satır ayırıcıları kaçışlar (stored-XSS koruması).
- **Uzmanlaşmış Şema Grafikleri (2026-11-03):**
  - `agentic-seo-gateway` eklentisindeki kurumsal gereksinimlere uygun olarak `SoftwareApplication`, `Offer`, `QAPage` ve `TechArticle` şema yapıları çekirdek grafik derleyicisine (`buildPageSchemaGraph`) eklendi.
  - **Yazılım Ürünleri (`SoftwareApplication`):** `operatingSystem`, `applicationCategory`, `applicationSubCategory`, `softwareVersion`, `device`, `featureList`, `modules`, `requirements`, `demoUrl` ve `offers` (fiyat/para birimi/lisans modeli) alanlarıyla tam Schema.org standartlarında zengin snippet çıktısı verir.
  - **Kampanya & Fırsat Sayfaları (`Offer`):** `price`, `priceCurrency`, `validThrough`, `validStart`, `availability`, `discountBadge`, `gift`, `couponCode` ve `targetProduct` ile arama motorlarına zaman duyarlı kampanya sinyali gönderir.
  - **Soru-Cevap & AI Prompts (`QAPage` / `FAQPage`):** `mainEntity` altında `Question` ve `acceptedAnswer` (uzman yanıtı ve kısa TL;DR) ile Google Featured Snippets ve SGE/AIO motorları için optimize edilmiş doğrudan yanıt grafiği üretir.
  - **Search Console & Arama Performansı Paneli (2026-11-03):**
  - `@nexpress/seo-core` içine `search-console.ts` analiz motoru eklendi: `parseSearchConsoleCsv`, `parseSearchConsoleJson` ve `analyzeSearchPerformance`.
  - Google Search Console (`Top queries.csv`), Bing Webmaster Tools ve Yandex Webmaster sorgu/tıklama/gösterim/TO (CTR)/ortalama pozisyon verilerini çözümler.
  - `/admin/seo` sayfasına `SearchConsolePanel` entegre edildi: 4'lü metrik özeti (Toplam Tık, Gösterim, Ortalama TO, Ortalama Sıralama), ilk sayfaya yükselme fırsatları (Striking Distance: Pozisyon 4-15) ve düşük tıklama oranına sahip başlık optimizasyon fırsatları (Pozisyon 1-5, CTR < %3).
  - `@nexpress/seo-basic` manifestosundaki `search-console` modülü `status: "ready"` durumuna getirildi.

## 10. Webmaster & Analitik API Entegrasyonları (GSC, GA4, Bing, Yandex)

`agentic-content-ops/packages/question-intel` motorundan NexPress CMS `@nexpress/seo-core` paketine uyarlanan tam teşekküllü arama motoru ve analitik API istemcileri:

1. **Google Search Console (GSC):**
   - Google OAuth2 yenileme akışı (`refreshGscAccessToken`)
   - Doğrulanmış mülk listeleme (`fetchGscSiteList`)
   - Tarih aralıklı anahtar kelime, tıklama, gösterim, CTR ve pozisyon analitiği (`fetchGscSearchQueries`)
   - Çarpıcı mesafe (Striking Distance - pozisyon 4-20) ve düşük CTR fırsatı (`classifyQueryOpportunities`) tespiti

2. **Google Analytics 4 (GA4):**
   - Google Analytics Data API v1beta üzerinden organik açılış sayfaları (`fetchGa4LandingPages`)
   - **AI Yönlendirme Trafiği Tespiti (`fetchGa4AiReferrals`):** ChatGPT (`chatgpt.com`), Perplexity (`perplexity.ai`), Google Gemini (`gemini.google.com`), Claude (`claude.ai`) ve Microsoft Copilot (`copilot.microsoft.com`) oturum ve etkileşim dökümü
   - Ön yüzde GA4 ölçüm etiketi enjeksiyonu (`seo.integrations.ga4.measurementId` etkinleştirildiğinde)

3. **Bing Webmaster Tools:**
   - JSON Web Service üzerinden sorgu performans istatistikleri (`fetchBingQueryStats`)
   - Çoklu haftalık veri tekilleştirme ve pozisyon ağırlıklı birleştirme (`aggregateBingQueryStats`)

4. **Yandex Webmaster / Metrika:**
   - Metrika v1 API üzerinden organik arama motoru açılış sayfaları (`fetchYandexOrganicLandings`)

Arama konsolu ve analitik formları yalnızca `/admin/seo/integrations` içindeki `<SeoIntegrationsStudio>` üzerindedir. `/admin/seo` motor ayarı, dizin ve bağlantı denetimidir; entegrasyon sekmelerini tekrar etmez. CSV performans paneli de webmaster sayfasındadır.

---

## 12. Topluluk Tartışması, Çok Seviyeli Yorum Ağacı ve 5 Yıldızlı İnceleme Motoru (0-KB RSC)

Ziyaretçi sayfalarının altındaki tartışma ve değerlendirme bölümü (`PostDiscussion` ve `PostReviewsSection`), **0 KB İstemci JS** kuralını bozmadan zengin etkileşim ve Schema.org `AggregateRating` / `Review` sinyali üretir:

1. **Çok Seviyeli Yorum Ağacı (`packages/core/src/comments-discussion.ts` — `buildCommentTree`):**
   - Kök yorumlar ve yanıtlar `parentId` üzerinden 3 görsel derinliğe kadar iç içe dizilir; 4. seviye ve sonrası mobil taşmayı önlemek için 3. seviyede `@Yazar` (`replyToAuthor`) atfıyla düzleştirilir.
   - **Sıralama Sekmeleri (`?c_sort=popular|newest|oldest`):** Sabitlenen (`_pinned`) kök yorumlar her zaman en üstte yer alır; ardından **En Faydalı** (`upvotes * 2 + totalReplies`), **En Yeni** veya **En Eski** sırasıyla listelenir.
2. **Etiket Tabanlı Zengin Meta (`parseCommentTags` & `serializeCommentTags`):**
   - Veritabanı şeması değiştirmeden `comments_reviews.tags` JSON dizisi içinde `_pinned` (Sabitlendi), `_official` (Ekip / Yazar rozeti), `_up:N` (Faydalı oy sayacı) ve görünür konu etiketleri (`#kurulum`, `#performans`) taşınır.
   - Her yazar adı için deterministik baş harf ve erişilebilir renk paleti (`commentAvatarProps`) üretilir.
3. **5 Yıldızlı Değerlendirme Dağılımı (`computeRatingSummary`):**
   - Onaylı incelemelerden ortalama puan, doğrulanmış deneyim sayısı (`isVerified`) ve 5★–1★ yüzdelik histogram çubukları hesaplanır.
   - İnceleme kartlarında yan yana **+ Artılar (`pros`)** ve **− Eksiler (`cons`)** kutuları gösterilir.
4. **0-KB RSC Formlar, Spam Koruması ve Faydalı Oylaması (`apps/cms/src/app/(public)/comment-reply.ts`):**
   - Ziyaretçiler hem kök yorum/soru hem de (açılır `<details>` çekmecesiyle) 5 yıldızlı artı/eksi değerlendirmesi gönderebilir; her yorum kartındaki **Yanıtla** çekmecesi yalnızca tıklandığında `<details>` ile açılır.
   - Gönderimler IP başına hız sınırından (`createRateLimiter`), honeypot (`company`) kontrolünden, HTML temizliğinden ve bağlantı spam süzgecinden (>2 URL reddi — `validatePublicCommentSubmission`) geçer; `status: "pending"` ve `isVerified: false` olarak kaydedilir.
   - **Faydalı (`👍`) Oyu (`voteCommentHelpfulAction`):** `HttpOnly` çerez (`nx_helpful_votes`) ile mükerrer oylamayı engeller ve `_up:N` sayacını atomik artırır.
5. **Yönetim Moderasyon Stüdyosu (`/admin/comments`):**
   - Durum sekmeleri (`Tümü`, `Beklemede`, `Onaylı`, `Spam`), içerik/etiket/metin arama süzgeci ve toplu işlem çubuğu (`Seçilenleri Onayla`, `Beklemeye Al`, `Spam İşaretle`, `Kalıcı Sil`).
   - Kart üzerinde tek tıkla **Sabitle (`_pinned`)**, **Ekip Rozeti (`_official`)**, **Doğrulanmış (`isVerified`)**, **Hemen Onayla**, **Sil** ve doğrudan kartın altında açılan **Resmi Ekip Yanıtı** çekmecesi.
