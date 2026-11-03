# 17 — WordPress İçe Aktarma

Yönetim: `/admin/migration` (yalnızca admin). API: `POST /api/admin/wp-import` (`mode=analyze|run`). Paket: `packages/wp-importer` (saf mantık); yazma: `apps/cms/src/lib/wp-import.ts`.

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
Başlık (h1–h2→h2, h3, h4–h6→h4), paragraf (satır içi biçim `props.html`, düz metin `props.text`), liste (`list_element`), alıntı, kod (`language-*`), tablo (`data_table`), görsel/şekil (`image_figure`, alt yazı), YouTube/Vimeo (`video_embed`), ayraç. Klasik editör metni (boş satırla paragraf) ve Gutenberg yorumları işlenir. Sayfa oluşturucu kodları (`vc_*`, `et_pb_*`, `elementor*`…) atılır; bilinmeyen kısa kodlar atılır ve uyarı olur.

## Görseller
Varsayılan: görsel adresleri eski sitede kalır. Seçenek açıksa en çok 400 görsel indirilip medya kitaplığına alınır (bloklarda ve öne çıkan görselde adresler yeniden yazılır); indirilemeyen görselin adresi olduğu gibi kalır. Güvenlik için bkz. `docs/11` §8a.

## Sınırlar
REST ile canlı site çekme, WooCommerce fiyat/stok/varyasyon, yorumlar, kullanıcılar/yazar eşleme, menüler, özel alanlar, galeri/slider kısa kodları ve resim alt metni ekleri aktarılmaz. İstek tek parçadır (`maxDuration` 300 sn): çok büyük dosya + görsel indirme için dosyayı bölün.

- **Dosya boyutu (2026-11-03):** sınır 64 MB'tır; Next'in middleware gövde kesmesi (varsayılan 10 MB) `middlewareClientMaxBodySize: "70mb"` ile yükseltildi. Daha büyük dışa aktarmalar WordPress'te türe göre bölünmelidir.
