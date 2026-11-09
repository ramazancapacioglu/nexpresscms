# 24 — WordPress Köprüsü (panel eklentisi + site eklentisi)

> Durum: **0.3.0 (2026-11-09).** Zengin blok ve satır içi `<style>` derleyicisi (`compileRichWpHtml`), 350 KB HTML sınırı, iç içe sütun düzleştirme (`kt-has-1-columns` / tek sütunlu dış sarmalayıcıları soyma), masaüstü/mobil CSS ızgara ayrımı (`8+4`, `4+8`, `6+6`, `4+4+4`, `3+3+3+3`), çoklu bilgi kartlarından `bento_features` (2/3/4 sütun, görsel ve bağlantı destekli), çok sütunlu `icon_list`, 3'lü asimetrik görsel kolajı (`gallery` `variant: "collage"`), `faq_accordion`, `form_block`, `map_embed` (`embedUrl`), `cta_banner` ve kategori vitrini (`dynamic_list`) sentezi. Panelde `/admin/wp-bridge` altında tek tıkla **Tüm sayfaları zengin yerleşimle derle** (`reconstructRichSiteDataset`) eklendi.

## 1. Neden ayrı eklenti

Dosya aktarımı yazı, sayfa ve bir kısım SEO alanını taşır. Şunlar dosyada yok ya da HTML içinde kaybolur: menü, üst/alt şerit, palet, form alanları, yorumlar, şema şablonları, site geneli SEO, medya dosyasının kendisi, satır genişliği ve zemin. Canlı sayfayı okumak da aynı yerleşimi kurmaz.

Köprü iki parçadır:

| Parça | Nerede | Görevi |
| :--- | :--- | :--- |
| Panel eklentisi | NexPress `/admin/wp-bridge` | Eşleştirme, sıfırlama, indirme, paketleri yazma, iç bağlantı tarama |
| Site eklentisi | WordPress `nexpress-bridge` | `parse_blocks()`, menü, form, yorum, şema, SEO ve dosyayı JSON olarak gönderme |

WordPress kodu NexPress çekirdeğine girmez. Site eklentisi orada kalır; bize yalnızca JSON gelir. Sürüm iki tarafta aynıdır (`WP_BRIDGE_VERSION` ve eklenti başlığı). Panel, o sürümün zip'ini indirir.

## 2. Kapsam

**Gelir**

- Sayfa, yazı ve blog dışı içerik türleri (kampanya yazısı, bilgi bankası). Ürün ve sipariş gelmez.
- Kategori ve etiket, üst-alt ilişki, açıklama.
- Yorumlar (durumlarıyla). Ziyaretçi yazma ucu bu işte açılmaz; kayıt panelde durur.
- Form tanımları (alan, zorunluluk, seçenek, bildirim). Gönderim arşivi ilk dilimde yok.
- Sayfa SEO'su: başlık, açıklama, odak kelime, canonical, noindex, Open Graph, şema.
- Site geneli SEO: başlık şablonu, sitemap, robots, kuruluş şeması.
- Menü ve konumları, logo, palet, kap genişliği, üst ve alt şerit.
- Sayfa oluşturucunun blok ağacı (satır, sütun, genişlik, zemin, örtü, kart, düğme, görsel, akordeon). Sınıf adı ve uzak CSS kopyalanmaz; NexPress blok stiline çizilir.
- Medya dosyası, alt metin, başlık.
- Kalıcı bağlantıdan 301. Eski yol yeni yola gider.
- İç bağlantı taraması: kaynak sitenin mutlak adresi (`https://site/...` ve `www`) yerel yola çevrilir. `mailto:` ve `tel:` durur. Başka alan adları durur.

**Gelmez**

- E-ticaret: fiyat, stok, varyasyon, sepet, sipariş, kupon.
- Kullanıcı ve parola.
- Eklenti PHP'si, tema PHP'si, uzak CSS ve JavaScript.

## 3. Akış

1. Yönetici panelden site eklentisini indirir, WordPress'e kurar.
2. Panel tek kullanımlık eşleştirme kodu üretir. Eklenti site adresi ve kodu kaydeder; iki taraf birbirini doğrular.
3. İsteğe bağlı sıfırlama: şablon ve tasarım kütüphanesi kalır. Sayfa, yazı, diğer içerik, yorum ve medya silinir. Tema, menü, kullanıcı, form tanımı ve site ayarı bu kapıda silinmez. Onay sözcüğü `SIFIRLA` (ayarlar sayfasındaki içerik sıfırlamasıyla aynı).
4. Eklenti paketleri sırayla iter: site, görünüm, taksonomi, medya, içerik, yorum, form, SEO, yönlendirme.
5. NexPress yazar. Aynı WordPress kimliği `cnt_wp_<id>` ile güncellenir, ikinci aktarım çift kayıt açmaz.
6. İç bağlantı taraması her metin, HTML ve düğme adresinde çalışır. Rapor kaç bağlantının çevrildiğini yazar.
7. Tanımayan blok atılmaz: düz metne düşer ve sayfa sayfa raporda görünür.

## 4. Çizim

Eşleme `packages/wp-importer` içinde testli saf fonksiyondur.

| Kaynak | NexPress |
| :--- | :--- |
| Satır, eşit / sol altın (`65%/35%`) / sağ altın (`35%/65%`) | `section` + `columns` (`6+6`, `8+4`, `4+8`, `4+4+4`, `3+3+3+3`) |
| Tek sütunlu dış satır sarmalayıcı (`1-column` veya `minmax(0, 1fr)`) | İç içe sütun kırılmasını önlemek için düz `section` olarak açılır |
| Tam genişlik bant / koyu zemin (`--global-palette*`) | `blockWidth: full`, koyu zeminde otomatik `textColor: "#ffffff"` |
| Sütun arka plan görseli (`background-image: url(...)`) | Doğrudan `image_figure` bloğuna dönüştürülür |
| Çoklu bilgi kutusu ızgarası (2–12 kart) | `bento_features` (`columns: 2\|3\|4`, `image`, `title`, `description`, `href`) |
| Tekil bilgi kutusu | `info_box` (`image`, `title`, `text`, `href`, `tel:` / `mailto:` dahil) |
| İkonlu kontrol listesi | `icon_list` (`columns: 1\|2\|3`, `title`, `href`) |
| 3'lü iç içe görsel kolajı | `gallery` (`variant: "collage"`) |
| Akordeon / SSS panelleri | `faq_accordion` (iki sütunlu akordeonlar tek blokta birleştirilir) |
| Gelişmiş form bloğu | `form_block` (`formId: "frm_wp_1"`) |
| Harita bloğu | `map_embed` (`embedUrl`, Google Maps `<iframe>`) |
| Senkronize alt çağrı bandı | `cta_banner` (`variant: "dark-contrast"`) |
| Başlık, paragraf, düğme, görsel | aynı tür |
| Kapak (başlık, kısa açıklama, öne çıkan görsel) | `tpl_post_title` (`showTldr`) + `tpl_featured_image` |
| Üst / alt şerit | header ve footer yapılandırması |

## 5. Dilimler

| Dilim | İş | Durum |
| :--- | :--- | :--- |
| 0 | Panel eklentisi, sürüm, indirme, sıfırlama kapısı, iç bağlantı fonksiyonu, bu plan | Bitti |
| 1 | Eşleştirme kodu, sayfa/yazı/taksonomi/SEO/yorum/medya yazma, iç bağlantı tarama | **0.2.0** |
| 2 | Satır ve sütun çizimi, kapak bandı, menü, üst şerit telefonu ve alt kart | **0.2.0** |
| 3 | Form tanımları, sayfa ve site SEO'su, 301 | **0.2.0** |
| 4 | Zengin HTML + satır içi `<style>` derleyicisi (`compileRichWpHtml`), birleşik kart/kolaj/liste/harita/form sentezi, 350 KB HTML sınırı, tam veri kümesi yeniden derleyici | **0.3.0** |

## 6. Güvenlik

- Panel uçları `requireAdmin` / `requireAdminApi`. İndirme ve sıfırlama denetime yazılır.
- Eşleştirme kodu tek kullanımlık, süresi dolan, veritabanında düz durmaz (`secret-box`).
- WordPress yalnızca kendi dosyasını gönderir. NexPress keyfi adres çekmez.
- Medya bugünkü güvenli indirme kurallarına uyar (`docs/11`).
