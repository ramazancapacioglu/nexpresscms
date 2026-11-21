# 17 — WordPress İçe Aktarma

Dosya (WXR) aktarımı bu sayfadadır. Sayfa düzeni, yorum, form, şema, menü ve medya dosyasını da taşıyan köprü `docs/24-WP-BRIDGE.md` içindedir. E-ticaret her iki yolda da yoktur.

Yönetim: `/admin/migration` (yalnızca admin). API: `POST /api/admin/wp-import` (`mode=analyze|run`), `POST /api/admin/wp-shell` (tek sayfa, yazmaz). Paket: `packages/wp-importer` (saf mantık); yazma: `apps/cms/src/lib/wp-import.ts`.

## Akış
1. WordPress'te **Araçlar → Dışa Aktar → Tüm içerik** ile `.xml` (WXR 1.x) alınır.
2. Dosya yüklenir; **çözümleme** hiçbir şey yazmaz: kaç yazı/sayfa/ürün/taslak, kategori-etiket, görsel adresi, temizlenen kısa kod, atlananlar, uyarılar ve örnek liste gösterilir.
3. Seçenekler: türler, taslaklar, 301 yönlendirmesi, görsel indirme, mevcutları güncelle. **İçe aktar** aynı dosya ve seçeneklerle yazar.
4. Aynı dosya tekrar yüklenebilir: içerik kimliği `cnt_wp_<wpId>` (başka kiracıda `cnt_wp_<site>_<wpId>`); varsayılan olarak mevcut atlanır.

## Eşleme
- `post→post`, `page→page`, `product→product` (yalnızca metin). Diğer türler (menü, özel türler, çöp…) atlanır ve raporlanır. `publish→published`; `draft/pending/future→draft` (+ uyarı); `private→published` + görünürlük `private`.
- Slug: `post_name` (yüzde kodlu çözülür) → `slugify`; çakışmada `-2`, `-3`.
- SEO: `_yoast_wpseo_title/metadesc/focuskw/noindex`, `rank_math_*`; `%%başlık%%` gibi şablon değişkenli değerler alınmaz.
- Kategori/etiket oluşturulur (üst-alt ilişkisi korunur), içeriğe `_publishing.categories/tags` olarak bağlanır; `uncategorized` atlanır. Öne çıkan görsel `_thumbnail_id` → ek öğenin adresi. Özgün yayın tarihi (`post_date_gmt`) yeni içerikte `publishedAt` olur.
- Yönlendirme: eski bağlantının yolu → `/{dil}/{slug}` (301; yalnızca herkese açık yayındakiler; `?p=ID` biçimi yönlendirilemez).

## HTML → blok
Başlık (h1–h2→h2, h3, h4–h6→h4), paragraf (satır içi biçim `props.html`, düz metin `props.text`), liste (`list_element`), alıntı, kod (`language-*`), tablo (`data_table`), görsel/şekil (`image_figure`, alt yazı), YouTube/Vimeo (`video_embed`), ayraç. Klasik editör metni (boş satırla paragraf) ve Gutenberg yorumları işlenir. Dosya aktarımında sayfa oluşturucu kısa kodu (`vc_*`, `et_pb_*` ve benzeri) atılır; bilinmeyen kısa kod uyarı olur.

Canlı köprü bu kısa kod yolunu kullanmaz. WordPress eklentisi işlenmiş HTML gönderir; `compileRichWpHtml` satır, sütun, kart, liste, akordeon, form ve haritayı blok ağacına çevirir. Ayrıntı `docs/24`. Taban adres verilmezse göreli görsel yolu durur.

## Görseller
Köprü 0.3.1, WordPress okuma ayarındaki ana sayfayı (`page_on_front`) öne çıkan sayfa, yazı sayfasını (`page_for_posts`) blog sayfası yapar. Blog sayfasının gövdesi boş olsa da ziyaretçi yazı listesini görür. Veri kümesinde ayrı ana sayfa kaydı yoktur; `blog` adresi yazı sayfası olur. Öne çıkan sayfa `/admin/pages` üzerinden seçilir.

Varsayılan: görsel adresleri eski sitede kalır. Seçenek açıksa en çok 400 görsel indirilip medya kitaplığına alınır (bloklarda ve öne çıkan görselde adresler yeniden yazılır); indirilemeyen görselin adresi olduğu gibi kalır. Güvenlik için bkz. `docs/11` §8a.

## Görünüm (canlı sayfadan yeniden çizim)

WXR dosyası renk, menü ve sayfa düzenini taşımaz. Yayımlanmış HTML'den kabuk okunur (`readPublicShell`, `blocksFromPublicHtml`): Kadence paleti tasarım jetonuna, ilk başlık vitrine, bilgi kutuları kart ızgarasına, akordeon SSS'ye çevrilir. Uzak CSS ve JavaScript kopyalanmaz. Görseller eski adreste kalır. Paneldeki **Sayfayı oku** (`/api/admin/wp-shell`) aynı okuyucuyu tek adres için çalıştırır ve veritabanına dokunmaz. Adres, görsel indirmedeki genel internet kuralından geçer.

Toplu deneme: `apps/cms/scripts/redraw-public-site.ts`. Klasördeki her `*.txt` iki satırdır (tür ve adres); aynı adlı `*.html` gövdedir. Ana sayfa ve en az 40 başarılı dönüşüm yoksa hiçbir kayıt silinmez. Yeterliyse yalnızca `page` ve `post` silinir, jetonlar ve üst/alt şerit yazılır. Ürün, şablon, medya ve kullanıcı durur.

## Herkese açık tarama

`/admin/wp-bridge` adresindeki **Siteyi tara ve aktar**, `https` kök adresini ister. WordPress eklentisi kurulmadan sayfa, yazı, blog, herkese açık özel içerik, kategori, etiket, yorum, yazar adı, SEO başlığı, açıklama, noindex ve JSON-LD şema okunur. Yerleşim `compileRichWpHtml` ile satır ve sütun bozulmadan çizilir. Menü alt öğeleri ve telefon ana sayfadan gelir. Palet yalnızca kaynakta renk değişkeni varsa yazılır. Kullanılan görsellerin ilk 80 tanesi medya kitaplığına alınır. E-ticaret, form gelen kutusu, e-posta ve parola gelmez; giriş hesabı açılmaz. Şablon ve tasarım kütüphanesi silinmez. Onay sözcüğü `SIFIRLA` değilse hiçbir kayıt silinmez. Site geneli arama indeksi bu işlemle açılmaz. Canonical eski alan adına yazılmaz.

## Canlı genel aktarım

`apps/cms/scripts/import-live-akinsoft.ts` yalnızca `https://www.akinsoftizmir.com.tr` adresini okur. Yönetim paneline girmez. Sayfa, yazı, soru kaydı, kategori ve etiket REST’ten gelir. Başlık, açıklama, noindex ve JSON-LD şema (SSS, yazılım, kuruluş) yayımlanmış HTML başlığından yazılır. Sayfa yerleşimi zengin blok derleyicisinden kurulur; birebir kopya değildir. Görsel adresi kaynak sitede kalır, iç bağlantı yerel yola döner. Şablon ve tasarım kütüphanesi silinmez. Site geneli arama indeksi bu betikle açılmaz. Canonical eski alan adına yazılmaz; bu sitenin kendi adresi üretilir.

## Yönetici verisi aktarımı (`import-wp-extras.ts`)

Herkese açık tarama ve köprünün taşımadığı veriyi, WordPress yönetici hesabıyla **yalnızca okuyarak** aktarır. Çalıştırma (sunucuda, site kullanıcısıyla, `apps/cms` içinde):

```bash
WP_ADMIN_USER=… WP_ADMIN_PASS=… tsx scripts/import-wp-extras.ts --origin https://www.ornek.com [--only users,forms,content,entries,redirects,drafts,comments,reviews,seo,media] [--dry-run]
```

| Adım | Ne yapar |
| :-- | :-- |
| `users` | Kullanıcılar listesinden (REST kapalıdır) kayıt açar: rol `editor`, durum `disabled`, parola özeti rastgele ve kullanılamaz. Giriş yapan teknik hesap alınmaz. |
| `forms` | `kadence_form` yazıları → `forms` tablosu (`frm_wp_<id>`): alan türü, zorunluluk, seçenek, alıcı e-posta, konu, başarı iletisi. Abonelik/kopya formlar `paused`. |
| `content` | Yayındaki içeriğe yazar adı; sayfadaki `form_block` doğru forma bağlanır; SSS listeli sayfa `WebPage` olur. |
| `entries` | Kadence form girdileri → gelen kutusu. Bot yığını `spam`, gerisi `read`. 365 günden eski girdi yazılmaz (zamanlayıcı siler). Yalnızca panelde görünür. |
| `redirects` | Rank Math yönlendirmeleri (tam eşleşme) + arşiv adresleri. Kalıp (regex, içerir) olanlar yazılmaz, sayılır. |
| `drafts` | Taslak, bekleyen, zamanlanmış sayfa/yazı/soru `draft` olarak gelir; başlığı boş olanlar atlanır. SEO başlığı önizleme sayfasından okunur. |
| `comments` | Özgün tarih; yıldızlı yorum kartı `review` (puan + başlık), site yanıtı ve düz yorum `comment`. Spam ve çöp alınmaz. |
| `reviews` | Google yorumları (`aseo_review`) ana sayfaya `google` etiketli yorum olarak; kaynakta puan olmadığından yıldız yazılmaz. |
| `seo` | Ana sayfanın JSON-LD'sinden `seo.organizationSchema`, sameAs ve logo. |
| `featured` | Kaynaktaki öne çıkan görsel → yerel kopya (`featuredImage` ve yayın meta'sı). |
| `files` | Belge/arşiv dosyaları (PDF, ZIP, DOCX…) `WP_UPLOADS_DIR` altına özgün yolla iner. |
| `uploads` | Bloklarda kalan `wp-content/uploads` adresleri yerele alınır; boyutlu kopya özgün dosyaya eşlenir; kaynakta 404 olan görsel/galeri öğesi atılır. |
| `campaigns` | "Kampanya" kategorisindeki yazılar `campaign` türüne çevrilir (indirim ve tarih metinden), eski kök adres 301; ana sayfadaki kampanya yazı listesi `campaign_showcase` atlıkarıncası olur. |
| `theme` | Yazılım Bayi temasını yayına alır (başlık, menü, altlık, 1280 px). |
| `design` | Palet dışı renkleri kaldırır, SSS metnini temizler, çapa menüsü / içindekiler ekler (tekrar çalıştırılabilir). |
| `dates` | Güncelleme tarihini kaynaktaki `modified_gmt` değerine geri yazar. Diğer adımların yeniden yazımları tarihi bozduğundan EN SON çalıştırılır. |
| `layout` | İçerik kendi başlığıyla açılıyorsa sayfa başlık satırını gizler. |
| `media` | Kitaplığın tamamı (görseller); daha önce inenlerin boş alt metni/başlığı doldurulur. |

Her adım yeniden çalıştırılabilir (kimlikler `cnt_wp_<id>`, `cmt_wp_<id>`, `frm_wp_<id>`). Çıktı yalnızca sayıdır; girdi içeriği günlüğe yazılmaz.

**Yeni adımlar (2026-11-16).** `campaigns` adımı kaynak düzenleme ekranındaki `camp_*` alanlarını (indirim, hediye, ürün adı/sayfası, tarihler, şartlar) okur. `models`: `[akin_kampanyalar urun=…]` + Kadence formu olan satırı `contact_campaign` bloğuna çevirir. `quick`: hızlı iletişim formu ve WhatsApp numarasını ayarlara yazar. `forms`: iki sütunlu görünüm, kısa alanlar yan yana.

**Model düzeltmesi ve kartlar (2026-11-16).** `models` adımı artık formu taşıyan bandın tamamını değil yalnızca form bloğunu `contact_campaign` ile değiştirir; band kaynak sayfadan yeniden derlenir (önceki sürümde gövdesi aynı bantta olan sayfalarda, örn. `on-muhasebe-programi`, metin kayboluyordu). `design` adımı düz metin sayfalara kart yerleşimi uygular (`cardifyPlainBlocks`, hukuki sayfalar hariç). İçerik kapsama taraması: kaynak ve NexPress kelime karşılaştırması ile eksik sayfa bulunur.

`design` adımı ayrıca `<br>` ile satırlanmış uzun paragrafları liste kartlarına böler (`explodeLineParagraphs`); `theme` adımı başlık ön ayarını (mobil simgeler dahil) yeniden yazar.
Kadence satırları, kartlaştırma ve sayfa toparlama (`kadence`, `cardify`, `page-tidy`, `campaign-text`) çözüm sayfasındaki formu `contact_campaign` modeline bağlar. Eski `wp-content/uploads` adresi `apps/cms/src/app/wp-content/uploads/[...path]/route.ts` üzerinden yerel dosyaya düşer. Hızlı arama formu ve WhatsApp numarası site ayarının `general` alanına yazılır.

## Sınırlar
REST ile canlı site çekme, WooCommerce fiyat/stok/varyasyon, yorumlar, kullanıcılar/yazar eşleme, menüler, özel alanlar, galeri/slider kısa kodları ve resim alt metni ekleri aktarılmaz. İstek tek parçadır (`maxDuration` 300 sn): çok büyük dosya + görsel indirme için dosyayı bölün.

- **Dosya boyutu (2026-11-03):** sınır 64 MB'tır; Next'in middleware gövde kesmesi (varsayılan 10 MB) `middlewareClientMaxBodySize: "70mb"` ile yükseltildi. Daha büyük dışa aktarmalar WordPress'te türe göre bölünmelidir.

## Soru-cevap (AI Prompt) sayfaları — eksik alan onarımı (2026-11-21)

Aktarım, soru-cevap sayfasını yalnızca soru + kısa cevap olan tek bir SSS akordeonuna indirgiyordu. Kaybolanlar: kısa soru metni, **ayrıntılı cevap** (ikinci sütun), **künye** (Hizmet bölgesi, Hedef kitle, Hakkında, Hizmet tipi), **ürün bağlantısı** ("Ürünü İncele"), **faydalı oyu** ve cevaplanmış ziyaretçi soruları; şema da FAQPage + uydurma QAPage çiftiydi.
- `packages/wp-importer/src/qa-page.ts` (`parseQaPage`, testli): REST `content.rendered` (3 metin bloğu) + herkese açık sayfa HTML'i.
- `apps/cms/src/lib/wp-bridge/qa-pages.ts` (`repairQaPages`) + `apps/cms/scripts/repair-qa-pages.ts [--dry] [--origin=https://kaynak]`: yayındaki kayıtları kaynaktan tamamlar; gövdeyi görünür bloklara (soru, kısa cevap, ayrıntı, künye listesi, ürün düğmesi → markdown'a da yazılır), alanları `schemaAttributes.richSchema.qa`'ya, oyu/cevaplanan soruları `_qa`'ya yazar; şemayı `QAPage` yapar. Özgün güncelleme tarihi korunur. Taslaklar kaynakta herkese açık olmadığı için atlanır (WordPress oturumlu içe aktarma gerekir). Çalıştırmadan önce `contents` + `content_translations` yedeği alın.
