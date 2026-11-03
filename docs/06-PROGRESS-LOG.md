# 06 — Canlı Geliştirme ve İlerleme Günlüğü (`@progress`)

> **Kural:** Projede tamamlanan her adım, oluşturulan her paket ve veritabanı değişikliği anında bu tabloya işlenir.

---

## 📊 Faz Özeti

| Faz | Başlık | Durum | İlerleme |
| :--- | :--- | :--- | :--- |
| **Faz 0** | **Mimari Planlama, Kurallar (`AGENTS.md`) ve `@docs` Altyapısı** | ✅ Tamamlandı | %100 |
| **Faz 1** | **Monorepo İskeleti, Docker (`pgvector` + `Redis`) ve Çift Motorlu DB (`@nexpress/database` & `@nexpress/core`)** | ✅ Tamamlandı | %100 |
| **Faz 2** | **Kurumsal `shadcn/ui` Admin Paneli & Tema Motoru / Tema Mağazası (`@nexpress/themes`)** | ✅ Tamamlandı | %100 |
| **Faz 3** | **Çift Modlu 0-KB RSC Görsel Editör & Header/Footer/Mega-Menü Stüdyosu** | ✅ Tamamlandı | %100 |
| **Faz 4** | **Çekirdek SEO, Çok Boyutlu GEO/Hreflang ve 100/100 RSC Vitrin (`@nexpress/seo-core`)** | ✅ Tamamlandı | %100 |
| **Faz 5** | **Pro Eklentiler: `@nexpress-pro/agentic-seo` & `@nexpress-pro/content-ops` Entegrasyonu** | ✅ Tamamlandı | %100 |
| **Faz 6** | **WordPress 1-Dakika Göç Aracı (`@nexpress/wp-importer` & `/admin/migration`) ve Canlı Test** | ✅ Tamamlandı | %100 |
| **Faz 7** | **Güvenlik sertleştirme, testler, dosya bölme, SEO/GEO/hız temelleri** | 🔄 Sürüyor | Bkz. aşağıdaki kayıt ve `12-ROADMAP.md` |

---

## 📝 Detaylı Günlük

### [2026-11-03] — Editör yönü kararı (docs/21) ve Tuval v2 adım 1–3
- 📄 `docs/21-EDITOR-DIRECTION.md`: WordPress blok editörünü (`@wordpress/block-editor`) ve Puck'u araştırdım. Gutenberg paketlerinin hepsi **GPL-2.0-or-later** (açık çekirdek + kapalı Pro modeliyle çakışır), 50 MB+ bağımlılık, HTML-yorum içerik modeli, PHP'ye bağlı bloklar → **benimsenmedi**; Puck (MIT) 1.0 öncesi ve ~70 blok oluşturucusunun yeniden yazımını gerektirir → şimdilik benimsenmedi. Karar: kendi yığınımızda "Tuval v2".
- ✅ **Satır içi metin düzenleme (her blokta):** blok `props` metinleri render edilmiş DOM'daki yaprak metin öğeleriyle eşleştirilir (`collectEditableStrings` / `assignStringsToTexts` / `patchAtPath`, çekirdekte saf, 3 test); eşleşen öğe `contenteditable="plaintext-only"` olur, Enter/blur'da yola (`items.0.title`) geri yazılır, Esc iptal eder. Render koduna dokunulmadı: vitrin, istatistik şeridi, özellik ızgarası, ürün kartı, SSS… **30 metin düğümü** tuvalde doğrudan düzenlenebiliyor (tarayıcıda doğrulandı). Önizlemedeki bağlantı/düğme/form editörden ayırmaz.
- ✅ **Sade tuval:** sayfa, sitenin arka plan/yazı rengiyle "sayfa yüzeyi" olarak çizilir; blok kartı/başlık çubuğu yalnızca üzerine gelince ya da seçiliyken görünür (yüzen etiket + araç çubuğu); bloklar arasında üzerine gelince beliren **"+"** ile arama kutulu hızlı ekleme.
- Kalan (Tuval v2): site CSS'li gerçek önizleme çerçevesi (iframe) ve gerçek medya sorgulu cihaz genişlikleri, `/` komutu, sayfa başlığının tuval içine alınması.
- Testler: çekirdek 186. axe (editör, zengin sayfa) ihlalsiz.

### [2026-11-03] — Kategori/etiket indeks sayfaları (404 düzeltmesi)
- 🐛 `/{dil}/kategori` ve `/{dil}/etiket` (tüm kategori/etiket listesi) yoktu ve 404 veriyordu; yalnızca tekil arşivler (`/{dil}/kategori/{slug}`) vardı. İndeks sayfaları eklendi: kategoriler üst/alt ağacıyla, etiketler bulut olarak; yalnızca en az bir herkese açık yayını olan terimler listelenir, sayımlarla; hiç terim yoksa 200 + `noindex`. Arşiv sayfalarının kırıntı yoluna "Kategoriler/Etiketler" basamağı eklendi (indeks sayfasına bağlanır). Metinler `taxonomy.*` i18n anahtarlarıdır (tr/en).
- Doğrulama: kullanıcının çalışan geliştirme örneğinde (PostgreSQL verisi) tekil arşivler zaten 200 dönüyordu; indeks adresleri 404'tü. Yeni sürümde ikisi de 200.

### [2026-11-03] — Kalan bölümlerin toplanması (Faz 2/3/4 artıkları) ve CI düzeltmeleri
- 🐛 **CI (axe) düzeltildi:** blok başlık çubuğu düğmeleri 24 px altındaydı ve kayan araç çubuğu onlarla çakışıyordu (`target-size`). Düğmeler 24×24 yapıldı, araç çubuğu başlık satırının içine alındı (çakışma yok). Yerelde axe ile editör sayfasında ihlal kalmadığı doğrulandı.
- 🐛 **Blok türleri tek kaynağa bağlandı:** `BLOCK_TYPES` (çekirdek) artık hem `BlockType` birleşimini hem içe aktarma şeması `BlockNodeSchema`'yı besler. Şemadaki liste 33 türü eksik tutuyordu (tabs, data_table, info_box, single_icon, marquee…); bu türleri içeren şablon paketleri içe aktarılırken reddediliyordu. Test: katalogdaki her tür şemadan geçer.
- ✅ **SEO — sayfalı/süzgeçli görünüm:** sorgu döngüsü parametresi (`q…_q|_cat|_sort|_page|_min|_max`) taşıyan adresler `noindex,follow` alır; canonical parametresiz sayfa (`hasDynamicQueryParams`, ana sayfa ve içerik sayfası). Parametresiz sayfa indekslenir (tarayıcıda doğrulandı).
- ✅ **Gelişmiş tablo:** `<caption>`, `scope="col"`/`scope="row"` (ilk sütun satır başlığı), çizgili satır, yapışkan başlık, sıkı yoğunluk, sayısal hücreler sağa hizalı; kaydırılabilir bölge klavyeyle odaklanır.
- ✅ **Gradyan oluşturucu** (Stil › Renk): tür, açı, 2–3 durak; çıktı `buildGradient` ile doğrulanır (geçersiz renk atılır). **Bölüm arka plan videosu:** `bgVideo` (mp4/webm, yalnızca site içi ya da https) + `bgPoster`; sessiz/döngülü/otomatik, mobilde ve "hareketi azalt" ayarında gizlenir (kapak görseli kalır), `preload="none"`. Bölüm için denetçi alanları eklendi (başlık, genişlik, video).
- ✅ **Sorgu döngüsü:** `carousel` düzeni (CSS scroll-snap, klavyeyle odaklanır, JS yok), kart stilleri (klasik/sade/görsel üstü/ilk kart büyük), ürünlerde **fiyat aralığı süzgeci** (`_min`/`_max`, listedeki gerçek sınırlar placeholder); başlık artık denetimlerin üstünde. Kitaplığa "Ürün atlıkarıncası".
- ✅ **Üst bilgi başlangıçları:** çağrı düğmeli, üst şeritli, arama kutulu header şablonları (üst bilgi oluşturucunun şablon+sütun tabanlı karşılığı). `search_box` bloğu artık `/{dil}/ara` adresine gider, erişilebilir etiket ve i18n metni kullanır.
- Karar (yapılmadı): referans şeması — kendi sitesinin yorumlarını Review şemasıyla işaretlemek arama motoru kurallarına aykırı (kendi kendine yorum); bu yüzden `testimonial_grid` şema üretmez. Vektör bloğu — kullanıcı SVG'si saldırı yüzeyi taşıdığı için yerleşik simge/şekil kümeleriyle sınırlı kalır.
- Testler: çekirdek 183, tema 17, editör 6. Tarayıcıda hepsi ve önceki editör akışları (araç çubuğu, ön ayar, sürükle-bırak) yeniden doğrulandı.

### [2026-11-03] — Faz 5: stil ön ayarları ve kayan blok araç çubuğu
- ✅ **Stil ön ayarları:** bir bloğun görsel stilini adlandırıp kaydet, başka bloğa uygula, sil. Çekirdekte saf `style-presets.ts` (`extractPresetStyle`, `applyStylePreset`, `sanitizeStylePresets`, en çok 50): ön ayar yalnızca görsel stili (cihaz kuralları, hover, animasyon) taşır; bağlantı çapası, CSS sınıfı, özel CSS, gizleme ve tam genişlik bloğa özel kalır. Depolama `sites.settings.customizer.stylePresets` (şema/göç gerekmedi; site başına). Sunucu eylemleri `style-preset.list|save|delete` denetim kaydıyla (`requireUser`). Aynı adlı ön ayar güncellenir.
- 🐛 `saveSiteSettings` birleştirmesi dizileri nesneye çeviriyordu (`{...dizi, ...dizi}`); dizi değerleri artık olduğu gibi yazılır.
- ✅ **Kayan blok araç çubuğu:** seçili bloğun üstünde başlık düzeyi (H1–H4), hizalama, stil ön ayarı uygulama ve Stil sekmesine kısayol. Ön ayar listesi Stil sekmesiyle paylaşılan tek kopyadan gelir (`use-style-presets`).
- Testler: çekirdek 180 (4 yeni). Tarayıcıda: araç çubuğu, düzey/hizalama, ön ayar kaydet → ikinci bloğa araç çubuğundan uygula, veritabanında dizi olarak kalıcılık doğrulandı. CI 98ed0da'da dört iş de yeşil (Faz 2'den beri süren kırmızı CI düzelmişti).
- Kalan (Faz 5): A/B testi ve açılır pencere (Pro eklenti adayı), desen kitaplığı paylaşımı (içe/dışa aktarma mevcut), kayan araç çubuğunda yapay zekâ ve dinamik içerik kısayolları.

### [2026-11-03] — Faz 4b: karanlık mod, palet değişkenleri, şeffaf header, şablon içerik genişliği
- ✅ **Palet değişkenleri:** ziyaretçi yüzeyi renkleri artık `var(--nx-*)` okur (`toCssVarTokens`; blok/şablon kodu `tokens.colors.x` yazmaya devam eder, yedek değer açık palettir). Sabit yazılmış Tailwind renkleri (`text-slate-*`, `bg-white`, `border-slate-*`, `text-blue-*`; 14 dosyada ~220 kullanım) anlamsal sınıflara taşındı: `text-nx-fg|soft|muted|link`, `bg-nx-card|subtle`, `border-nx-line` (`globals.css` `@theme`). Açık modda görünüm aynı kaldı (tarayıcıda karşılaştırıldı).
- ✅ **Karanlık mod (CSS-only):** `customizer.darkMode: "off" | "auto"` (varsayılan kapalı) + elle ezilebilen `darkColors`. `deriveDarkColors` açık paletten WCAG AA (4.5) okunaklı karanlık palet türetir (bağlantı/düğme renkleri gerekirse açılır, ön plan renkleri en iyi kontrastla seçilir); `@media (prefers-color-scheme: dark)` altında yalnızca değişkenler değişir, **JS yok**. Yönetim: Tema › Renkler › "Karanlık mod" (önizleme renkleri, kontrast uyarısı, otomatiğe sıfırla). Mevcut `contrastRatio` (theme-lint) yeniden kullanıldı.
- ✅ **Şeffaf header:** `behavior.transparent` + `tone` (açık/koyu yazı); header içeriğin üstüne biner, ana içeriğin üst boşluğu kalkar. Sayfa adresi koşuluyla yalnızca hero ile başlayan sayfalara bağlanması önerilir.
- ✅ **İçerik genişliği (sayfa/yazı/ürün şablonu):** dar (720px) / varsayılan / geniş (1400px) / tam ekran (`contentWidthStyle`); tür başına yerleşim ihtiyacı şablon türü + koşullarla karşılanır.
- Testler: çekirdek 176 (karanlık palet 4, davranış 1 yeni). Tarayıcıda: karanlık/açık tercihle arka plan/yazı/header renkleri ve ekran görüntüleri, dar genişlik, şeffaf header (yalnızca koşullu sayfada) doğrulandı.
- Bilinen: ana sayfada konsolda "aynı key" React uyarısı var (bu değişiklikten bağımsız, önceden mevcut; izlenecek). Kalan Faz 4: üst bilgi oluşturucu (satır/öğe düzeni; şimdilik şablon + sütun/blok ile kuruluyor), site genelinde manuel tema anahtarı (JS gerektirir, bilerek yok).

### [2026-11-03] — Faz 4a: şablon görüntüleme koşulları ve header davranışı
- ✅ **Görüntüleme koşulları** (çekirdek, saf: `template-conditions.ts`): şablon, atama olmasa da koşula uyan sayfalarda kendiliğinden devreye girer. Kural türleri: sayfa adresi, kategori, etiket, içerik türü, dil; "kullan" ve "kullanma" listeleri (en çok 20 kural). Çözümleme: **atama → en özgül eşleşen koşul (slug 100 > kategori 80 > etiket 70 > tür 50 > dil 30) → türün varsayılanı → yerleşik görünüm**; eşitlikte kimlik sırası (kararlı). Oturum/rol koşulu bilerek yok: ziyaretçi sayfaları önbelleklenir. Bu, "dil başına header/footer" ve "kategoriye özel yazı şablonu" ihtiyaçlarını karşılar.
- ✅ Çağrı noktaları bağlam verir: sayfa/yazı (tür, slug, kategori/etiketler), arşivler, ürün/mağaza, header/footer/kenar çubuğu (dil + sayfa adresi).
- ✅ **Header davranışı:** yapışkan ve buzlu cam açılıp kapanır (`meta.behavior`).
- ✅ Yönetim: Şablonlar sayfasında her şablonda **Ayarlar** paneli (kurallar + header davranışı), "N KOŞUL" rozeti; sunucu eylemi `updateTemplateSettingsAction` (`template.settings` denetim kaydı, koşullar doğrulanır).
- Testler: çekirdek 171 (4 yeni). Tarayıcıda: iki header şablonu, birine slug koşulu + yapışkan kapalı → koşula uyan sayfada o header (relative), diğer sayfada varsayılan (sticky) doğrulandı.
- Ertelendi (Faz 4b): üst bilgi oluşturucu, tür başına yerleşim, karanlık mod — nedenleri docs/12'de.

### [2026-11-03] — Faz 3: sorgu döngüsü (arama, kategori süzgeci, sıralama, sayfalama)
- ✅ `dynamic_list` bloğu ziyaretçi denetimleri kazandı (hepsi kapalı varsayılır; mevcut bloklar değişmez): arama kutusu (başlık+özet, Türkçe i/ı ve aksan duyarsız), kategori süzgeci (sayımlı bağlantılar), sıralama seçimi, sayfalama (`adet` = sayfa başına). Denetimler **URL parametreleriyle** çalışır (`q{blokKimliği}_q|_cat|_sort|_page`), düz `<form method="get">` ve bağlantılardır: **istemci JS'i yok**, bloklar birbirinin parametresini okumaz, diğer parametreler korunur, tüm değerler doğrulanır (geçersiz kategori/sıralama yok sayılır, sayfa aralığa sıkıştırılır).
- ✅ Çekirdekte saf `resolveDynamicBlock` + `DynamicMeta`/`DynamicResult`; `DynamicDataMap` artık `{items, meta?}` taşır. Ön yüz metinleri `query.*` i18n anahtarlarıdır (tr/en). Kitaplığa "Sorgu döngüsü" eklendi; inspector'a dört anahtar.
- Testler: çekirdek 167 (4 yeni: eski davranış, süzgeç+sayım, arama/sıralama/sayfalama, parametre yalıtımı). Tarayıcıda: form, sayfalama bağlantıları, 2. sayfa, sonuçsuz not doğrulandı.
- Bilinen: sayfalı görünümler (`?..._page=2`) için canonical/noindex henüz eklenmedi; kalan Faz 3 maddesi ürün atlıkarıncası ve kart şablonu seçimi.

### [2026-11-03] — Faz 2: yeni bloklar (simge, sayaç, kayan şerit, şekil ayırıcı), düğme simgesi, satır yığılma seçenekleri
- ✅ Yeni bloklar (hepsi HTML+CSS, istemci JS'i yok): `single_icon` (24 yerleşik çizgi simgesi, `ICON_PATHS` çekirdekte), `countup` (nihai değer metinde; sayma animasyonu `@property` + `animation-timeline: view()` ile `@supports` altında), `marquee` (CSS kayan şerit, `prefers-reduced-motion` desteği, ikinci kopya `aria-hidden`), `shape_divider` (dalga/eğim/eğri/üçgen/yamuk). Renk/simge/şekil girdileri izin listesi ve düzenli ifadeyle doğrulanır.
- ✅ Düğmeye simge (ad + yön); satıra "tablette de alt alta geçir" (`stackAt`) ve "alt alta geçince sırayı ters çevir" (`mobileReverse`).
- ✅ Kitaplık (+ Blok & Satır) ve AI kataloğu yeni bloklarla genişledi (kitaplık 50 blok); `icon` alanı denetçide açılır liste.
- Testler: çekirdek 163, tema paketi 10 (yeni `blocks-motion.test.tsx`; `test` betiği `.tsx` dosyalarını da kapsıyor). Tarayıcıda yeni blokların eklenmesi, satır seçenekleri, düğme simgesi ve yayındaki çıktı doğrulandı.

### [2026-11-03] — Referans incelemesi, plan (docs/20) ve Faz 1: stil motoru
- ✅ Referans paketler (blok paketi, tema, Pro modülleri, yaratıcı paket) kaynak + canlı editör olarak incelendi; bulgular, boşluk matrisi ve 5 fazlı plan `docs/20-REFERENCE-ANALYSIS-AND-EDITOR-PLAN.md`'de.
- ✅ **Faz 1 — stil motoru:** `BlockStyleValues` tipografi (aile, kalınlık, satır yüksekliği, harf aralığı, harf düzeni), metin gölgesi, sol/sağ dış boşluk, kenarlık biçimi, arka plan boyut/konum/sabit, dönüşüm (kaydır/ölçek/döndür) ile genişledi; `hover` (hover:hover ortamında, geçişli) ve CSS-only **giriş animasyonu** (`animation-timeline: view()`, `@supports` altında, JS yok) eklendi. Tüm değerler `cssSafe`/izin listesinden geçer.
- ✅ **Denetçi Stil sekmesi** katlanır panellere bölündü (Renk, Boşluk, Tipografi, Kenarlık, Arka plan görseli, Dönüşüm, Hover, Animasyon); her denetimde "düzenlendi" noktası ve tek tıkla sıfırlama (`style-controls.tsx`).
- Testler: çekirdek 163 (yeni `block-style-v2.test.ts`: derleme, güvenlik, anahtar kare tekilliği). Tarayıcıda paneller, sıfırlama, kanvas CSS'i ve yayındaki sayfa çıktısı doğrulandı.

### [2026-11-03] — Yerel WordPress referans ortamı (araç)
- ✅ `tools/wp-reference/`: Docker Compose (MariaDB + WordPress + wp-cli) ve `setup.sh`; lisanslı referans paketleri `docs/kadence-referans-eklentiler/` altından salt okunur bağlanır, depoya girmez (`.gitignore`). Amaç: eklenti davranışını canlı inceleyip kendi editörümüzü buna göre geliştirmek.

### [2026-11-03] — WordPress içe aktarma: büyük dosyada "Dosya bulunamadı" düzeltmesi
- 🐛 Next, middleware'den geçen isteklerin gövdesini 10 MB'ta kesiyordu; 10 MB üstü WXR dosyası çözülemeyip "Dosya bulunamadı" dönüyordu. `next.config.ts` `experimental.middlewareClientMaxBodySize: "70mb"` ile 64 MB sınırına uyduruldu (23 MB'lık dosya tarayıcıda doğrulandı). Rota artık "yükleme okunamadı/sınır aşıldı" ile "dosya seçilmedi" hatalarını ayırıyor.

### [2026-11-03] — Editör: Önizle/Göster, zengin blok kitaplığı, sürükle-bırak, geniş sahne
- ✅ "Önizleme bağlantısı oluştur" kaldırıldı. Üst çubukta **Önizle** (son kaydedilmiş taslağı süreli, imzalı bağlantıyla yeni sekmede açar) ve Yayınla'nın yanında **Göster** (ziyaretçinin gördüğü gerçek, yayındaki sayfayı yeni sekmede açar; yayında değilken pasif) var. Şablon düzenlerken ikisi de gizli.
- ✅ **+ Blok & Satır** yeniden yazıldı (`@nexpress/editor` `block-catalog.ts`): 8 kategoride 46 blok (düzen, temel, medya, içerik, pazarlama, etkileşim, veri, ticaret), 10 hazır satır düzeni (boş sütunlar ve kartlı/CTA'lı), arama (Türkçe i/ı, aksan duyarsız). Her blok eklenince düzenlenebilir props taşır; denetçi alanları bu props'tan çıkar.
- ✅ **Sürükle-bırak:** kitaplıktan tuvale/gezgine, tuvaldeki blokların başlık çubuğundan ve gezgin satırlarından; kapsayıcılara (bölüm/sütun) ve bloklar arasına. Gezginde üst/orta/alt bölge = önce/içine/sonra. Uygunsuz hedefler (örn. satıra sütun dışı blok) `canInsertInto` ile reddedilir; çekirdekte `placeNewBlock` eklendi.
- ✅ Sahne genişliği `max-w-4xl` → `1400px` ve kenar boşlukları azaltıldı; denetçi `xl:w-80`.
- Testler: editör paketi 9 (katalog, satır, arama, sürükle-bırak kuralları). Tarayıcıda (Playwright) Önizle/Göster, sürükleyerek ekleme ve gezginde yeniden sıralama doğrulandı.

### [2026-11-03] — Ürün şeması (Product JSON-LD) ve güvenli JSON-LD serileştirme
- ✅ `@nexpress/seo-core` `commerce-schema.ts`: `buildProductGraph` (Product + Offer/AggregateOffer + BreadcrumbList, onaylı yorumlardan aggregateRating; fiyatsız/geçersiz para biriminde Offer yok), `schemaImageUrl` (yerel medya taranabilir türeve çevrilir) ve `jsonLdString` (`<`, `>`, `&`, U+2028/2029 kaçışlı).
- ✅ `/{locale}/magaza/{ürün}` hem şablonlu hem yerleşik görünümde Product şeması basar.
- 🔒 Ana sayfa, `[slug]` ve ürün sayfasındaki tüm JSON-LD gömmeleri `jsonLdString` kullanır (başlıkta `</script>` ile betik enjeksiyonu kapatıldı). Testler: seo-core 29.

### [2026-11-03] — Ürün ve mağaza şablonları
- ✅ `tpl_product_buy` / `tpl_cart_link`; `/magaza` ve `/magaza/{ürün}` ticaret sayfaları şablonla çizilir, satın alma kutusu eksikse yerleşik görünüme düşer; 4 hazır şablon; doğrulama kuralları (testli). Tarayıcıyla doğrulandı: şablonlu mağaza listesi (başlık, kartlar, fiyatlar, sepet bağlantısı), şablonlu ürün sayfası (breadcrumb, tek h1, sepete ekle formu, benzer ürünler) ve **şablonlu ürün sayfasından sepete ekleme → sepet** çalıştı.

### [2026-11-03] — Şablon dışa/içe aktarma (`.nxtemplates.json`)
- ✅ `@nexpress/core/template-package` (saf, 7 test): paket üretme/ayrıştırma, medya boşaltma, güvensiz adres ve CSS temizliği, boyut/derinlik sınırları, özet doğrulaması. API + yönetim arayüzü. Tarayıcıyla doğrulandı: 9 şablonluk paket indirildi ve geri alındı (ad çakışması `(2)`, varsayılan değil), kötü niyetli paket uyarılarla temizlendi, bozuk dosya reddedildi, oturumsuz 401.

### [2026-11-03] — Tema oluşturucu: şablonlar, şema tabanlı denetçi, şema kütüphanesi
- ✅ **Kök neden (kütüphane tasarımları düzenlenemiyordu):** denetçi yalnızca üst düzey metin alanlarını ve "başlık | açıklama" satırlarını gösteriyordu; fiyat planı, özellik kartı, SSS gibi iç içe öğeler alansızdı. `buildEditorFields` + `SchemaFields` ile her blok tam düzenlenebilir (liste ekle/sil/sırala, bağlantı seçici, görsel seçici). Tarayıcıyla doğrulandı (fiyat planı düzenleme → tuval güncellendi, 4 plan sınırı, silme).
- ✅ **Şablon sistemi:** 9 tür, 15 hazır şablon, `tpl_*` yuva blokları, atama (içerik/terim/varsayılan), header/footer/kenar çubuğu/sayfa/yazı/kategori/etiket/ürün-içerik uygulaması, doğrulama. Göç `0017`. Şablonlar taslak kalır ve hiçbir yüzeye sızmaz (depo testi + tarayıcı: site haritası, llms.txt, slug 404).
- ✅ İçerik SEO sekmesi 5 alt sekme. ✅ Şema kütüphanesi: `schema_card` (yazılım/kampanya/QA/teknik); tek kaynak `richSchema`; JSON-LD ile aynı veri (SoftwareApplication ana varlıkla birleşir, yinelenen düğüm yok).
- Doğrulama: çekirdek 151 (blok alanları, şablonlar, sayfa şeması), eklenti 34, tarayıcı e2e (şablon oluştur → stüdyo → varsayılan → ziyaretçi sayfası; kategori şablonu; şema kütüphanesi → ziyaretçi + JSON-LD).

### [2026-11-02] — Dil başına menü, arşiv sayfalaması, revizyon sıralama düzeltmesi
- ✅ Menüler dil başına (`navigation_layouts` zaten dil başına tekildi): menü editöründe dil sekmeleri, kayıt yoksa varsayılan dil gösterilir/ziyaretçide kullanılır, yeni dilin ilk kaydında header/footer devralınır. İkinci dilli sitede tarayıcıyla doğrulandı (/en kendi menüsü, /tr değişmedi).
- ✅ Kategori/etiket arşivleri sayfalı (`paginate`, testli).
- 🐞 Revizyon kayıtları aynı milisaniyede ardışık kaydedilince sıralama/budama belirsizdi (kararsız test): zaman damgası artık bir öncekinden kesin ileri.

### [2026-11-02] — Mega menü konumu, AI yazım güvenlik ağı, arşiv site haritası
- ✅ Mega panel header kapsayıcısına ortalandı (sağdan taşıyordu) ve menü öğesi header yüksekliğine uzatıldı (fare öğeden panele inerken kapanmıyor; tarayıcıyla doğrulandı).
- ✅ AI yazım **gerçek modelle denendi** (yaz, yeniden yaz, düzelt, başlık). Bulgu: düzenleme görevlerinde model yeni cümle ekliyordu → bağlam yalnızca yaz/genişlette verilir, istemde "yeni içerik ekleme" yasağı, `guardEdit` (paragraf sayısı kırpma + uzunluk uyarısı). Testli.
- ✅ Kategori/etiket arşivleri site haritasına (`archive-1.xml`); `SitemapEntry.pathPrefix`.

### [2026-11-02] — Panel düzeni, menü ağacı + mega menü, dinamik içerik, AI yazım
- ✅ Kenar çubuğu 6 daraltılabilir gruba indi; SEO ve Görünüm tek öğe + sekme çubuğu; yazı ölçeği/renk katmanı (`.nx-admin`).
- ✅ **Menü ağacı:** WordPress benzeri ekleme paneli (sayfa/yazı/kategori/etiket/ürün listesi + arama + özel bağlantı), 3 düzey, kimlikle bağlama, kırık hedef uyarısı, sunucuda temizleme; **mega menü** (alt öğelerden / elle kartlar, genişlik, tanıtım şeridi); ziyaretçi menüsü RSC + JS'siz mobil menü. Saf mantık `@nexpress/core/menu` (testli).
- ✅ Ziyaretçi header/footer `site-chrome.tsx`'e taşındı; **geliştirme artıkları temizlendi** (NX rozeti, tema adı, "Tema değiştir", /admin düğmesi, tür/şema rozeti, herkese açık "Editörde düzenle").
- ✅ **Dinamik liste bloğu** + kategori/etiket arşiv sayfaları; **AI ile yaz/düzenle** (`ai-compose`; onaylı, geri alınabilir, uyarı bayraklı).
- Doğrulama: çekirdek 140, eklenti 31, tarayıcı e2e (kenar çubuğu, sekmeler, menü ekleme/girinti/mega/javascript: reddi, genel menü hover + mobil, arşiv, dinamik sayfa, AI paneli sahte modelle). Gerçek OpenAI ile AI yazım denenmedi.

### [2026-11-02] — Yayın öncesi: CSP, zamanlanmış yedek, kontrast düzeltmesi
- ✅ **CSP** (üretim): bkz. `docs/11`; CI axe taraması üretim derlemesinde CSP ihlallerini yakalar. Yerelde üretim derlemesiyle 76/76 tarama, **0 CSP ihlali**.
- ✅ **Zamanlanmış yedek:** `/api/cron/backup` (`CRON_SECRET`, 0600 dosya, son `BACKUP_KEEP` tutulur); üretilen yedek `parseBackup` ile doğrulandı; *Sistem durumu*'nda son yedek yaşı. `.env.example` ve `docs/19` güncellendi.
- 🐞 Eklenti kartlarında/kenar çubuğunda WCAG kontrast hatası (`#8C9099` açık zeminde) düzeltildi (üretim derlemesindeki taramada 34 sayfada yakalandı).

### [2026-11-02] — Elle meta, WordPress benzeri medya, medya SEO'su, Pro modüller, yayına hazırlık
- ✅ **Elle meta:** başlığın altında "Arama sonucu" şeridi (Otomatik/Elle etiketi, "Otomatiğe dön"); kayıtta başlık/TL;DR artık meta alanlarına kopyalanmıyor (eski kayıtlar otomatik sayılır); SEO denetimi "uzun meta başlık / eksik açıklama" ölçer.
- ✅ **Medya kitaplığı:** ızgara/liste, arama (Türkçe I/İ duyarlı), tür / sorun / sıralama süzgeçleri, ayrıntı paneli (başlık, alt metin, alt yazı, açıklama, odak, canlı SEO denetimi); sahte URL ile ekleme formu kaldırıldı. **Medya seçici** (kitaplık + yükleme + bilgi düzenleme + "Kaydet ve ekle") öne çıkan görsel, görsel bloğu ve yeni `media_file` bloğu için. Göç `0015_media_seo` (`description`, `kind`).
- ✅ **Görsel olmayan medya:** PDF / MP4 / WebM / MP3 / OGG / WAV (içerik başlığından tanınır, 40 MB), `/media/{id}/{seo-adı}.{ext}` ile `Range` destekli sunum; `VideoObject`/`AudioObject` şeması; Markdown bağlantısı.
- ✅ **Medya SEO'su:** `scoreMediaSeo` (alt metin, dosya adı, başlık, boyut / belge-video için başlık-açıklama), görsel site haritası (`image:image`).
- 🔒 **Düzeltme:** sayfa JSON-LD'si `schemaAttributes._publishing` (yayın parolası dahil) ve diğer iç alanları sızdırıyordu — elendi, testli.
- ✅ **Pro modüller ("Yakında" → hazır):** faq-qa (QAPage), campaign-offer (süre dolunca kalkar), tech-article, software-app (editörde "Gelişmiş şema" paneli), merchant-feed (`/merchant-feed.xml`), gap-analysis (panel kartı), mcp-log (göç `0016_mcp_log` + kart). Kalan 8 modül dış servis/anahtar gerektirdiği için "Yakında" ve nedeni manifestte yazılı.
- ✅ **Yayına hazırlık:** `GET /api/health`, `docs/19-DEPLOYMENT.md` (ortam, kurulum, zamanlayıcı, yedek, güvenlik listesi).
- Doğrulama: çekirdek 131, seo-core 24, eklenti 27, veritabanı (SQLite + PostgreSQL), tarayıcı e2e (medya yükleme/Range/seçici, meta → `<title>`/açıklama, JSON-LD, kimlik akışları), axe 76/76.

### [2026-10-31] — Düzeltme: aynı saniyede parola değişiminde bağlantı tek kullanımlıktı değil
- 🐞 CI'daki yeni `auth:e2e` gerçek bir hata yakaladı: hesap oluşturulduktan aynı saniye içinde parola belirlenirse `passwordChangedAt` (saniye çözünürlüğü) değişmiyor, davet bağlantısı yeniden kullanılabiliyordu. `UserRepository.setPassword` zaman damgasını her zaman önceki saniyeyi geçecek şekilde yazar; test (SQLite + PostgreSQL) eklendi.

### [2026-10-31] — Besleme süzgeçleri, canonical düzeltmesi, yedek testi, temizlik
- ✅ `/feed.xml|atom.xml?category=|tag=` (testli `termMatches`). `autoCanonical` artık etkili. `lib/backup.ts` saf `backup-package.ts` + sunucu tarafı olarak bölündü; ayrıştırıcı için 6 test eklendi (F14'ten kalan borç). Kökteki kalıntı dosyalar silindi. Speakable/Person/`sameAs`(yazar) yapılmadı: ziyaretçi sayfasında tldr gösterilmediği ve yazar profili verisi olmadığı için eksik işaretleme üretirdi.

### [2026-10-31] — 2FA: QR kodu ve yönetici zorunluluğu
- ✅ Kurulumda QR kodu (sunucuda SVG, `qrcode-generator`). `REQUIRE_ADMIN_2FA=1`: 2FA'sı olmayan yönetici girişten sonra `/admin/profile?2fa=required` sayfasına düşer; diğer admin sayfaları/eylemleri oraya yönlendirir (`SessionUser.twoFactor`, `mustSetUpTwoFactor`, middleware `x-nexpress-pathname`). Tarayıcıyla doğrulandı; QR bir okuyucuyla çözülerek denenmedi.

### [2026-10-31] — llms ve ai-sitemap dile göre
- ✅ `/{locale}/ai-sitemap.json` ve `/{locale}/llms-full.txt` eklendi (mantık `lib/ai-sitemap-response.ts`, `lib/llms-full-response.ts`); `ai-sitemap.json` artık `localeEndpoints` ile tüm dillerin adreslerini verir. Hata düzeltildi: `llms-full.txt` bağlantıları dilden bağımsız `/tr/` yazıyordu. Etkin olmayan dil, mevcut `llms.txt` gibi varsayılana düşer. Yalnızca `tr` etkin olan seed sitede elle doğrulandı; ikinci dilli site denenmedi.

### [2026-10-31] — Kimlik akışları için CI uçtan uca testi
- ✅ `apps/cms/scripts/auth-e2e.mjs` (`auth:e2e`): davet → parola → tek kullanımlık bağlantı → unuttum yanıtı → 2FA kurulum/giriş/yeniden kullanım/kurtarma kodu/kapatma (20 doğrulama, yerelde geçti); CI `a11y` işinde axe taramasından sonra koşar. Yorum/inceleme için herkese açık uç olmadığı görüldü; roadmap düzeltildi.

### [2026-10-31] — Denetim günlüğü: CSV dışa aktarma ve elle temizleme
- ✅ `/admin/audit`: başlangıç/bitiş günü süzgeçleri; `GET /api/admin/audit/export` CSV (BOM, CRLF, formül enjeksiyonuna karşı kaçış — mevcut `toCsv` yeniden kullanıldı; 50.000 satır üst sınırı). `AuditRepository`: `until` süzgeci ve `purgeOlderThan` (kiracıya kapalı). `@nexpress/core`: `auditCsvRow`, `auditPurgeCutoff` (en az 30 gün).
- ✅ Temizleme `audit.purged` olarak günlüğe yazılır. Testler: çekirdek (CSV, sınır), depo (SQLite + PostgreSQL, kiracı yalıtımı). Tarayıcıyla doğrulandı (401, CSV, süzgeç, 400, temizleme). Zamanlanmış saklama yok.

### [2026-10-31] — İki adımlı doğrulama (TOTP) ve kurtarma kodları
- ✅ `@nexpress/core/totp`: RFC 6238 (SHA-1/6/30), base32, ±1 adım penceresi, yeniden kullanım engeli, `otpauth` adresi, kurtarma kodları (özet + tek kullanım). RFC test vektörleriyle testli. `account-token`a 5 dakikalık `mfa` amacı eklendi (parola belirlemede geçmez).
- ✅ Göç `0014_two_factor` (`users`: `totp_secret`, `totp_enabled_at`, `totp_last_step`, `recovery_codes`); `UserRepository`: `setTotpPending / enableTotp / disableTotp / advanceTotpStep / replaceRecoveryCodes` (atomik, kiracıya kapalı). Test: SQLite + PostgreSQL.
- ✅ Giriş: parola doğruysa `nx_mfa` çerezi + `/login/verify`; sıfırlama bağlantısı 2FA'lı hesapta oturum açmaz. Profilde "İki adımlı doğrulama" kartı (kur / kapat / kodları yenile); yönetici "2FA'yı sıfırla".
- ✅ Doğrulama: gerçek tarayıcıyla (yanlış parola/kod reddi, kod girilmeden /admin kapalı, doğru kodla giriş, aynı kod ikinci kez reddi, kurtarma kodu bir kez, kapatma). QR kodu yok (anahtar elle girilir).

### [2026-10-30] — E-postayla davet ve parola sıfırlama
- ✅ `@nexpress/core/account-token` (Node'a özgü alt yol): durumsuz HMAC belirteç `amaç.kullanıcı.parolaZamanı.bitiş.imza`; imzaya site ve amaç girer, sıfırlama 1 saat / davet 7 gün, **tek kullanım** = kullanıcının `passwordChangedAt` değeri (saniye çözünürlüğü) belirteçle eşleşmeli; parola değişince eski bağlantı bayatlar. Ek tablo/göç yok. Testli (süre, kurcalama, başka site/amaç, tek kullanım).
- ✅ `/forgot-password` (yanıt hesap varlığını sızdırmaz; e-posta `after()` ile yanıttan sonra; e-posta + IP başına saatte 5 istek), `/reset-password?t=…` (`referrer: no-referrer`, parola politikası, başarıda oturum açılır, eski oturumlar kapanır), giriş sayfasında "Parolamı unuttum".
- ✅ Yönetici: Kullanıcılar sayfasında "E-postayla davet et" (rastgele kullanılamaz parola, kişi kendi parolasını belirler) ve satırda "Bağlantı gönder". SMTP kapalı/başarısızsa bağlantı yalnızca yöneticinin ekranında gösterilir. Denetim: `user.invited`, `user.invite_accepted`, `user.reset_link`, `auth.reset_requested`, `auth.password_reset_done`.
- ✅ Doğrulama: gerçek tarayıcı + SMTP kabul sunucusuyla uçtan uca (davet → parola → giriş, kullanılmış bağlantı reddi, kayıtlı/kayıtsız e-posta aynı yanıt, kayıtsıza e-posta gitmez, zayıf parola reddi, sıfırlamada eski oturum kapanır, kurcalanmış belirteç reddi).

### [2026-10-30] — Dokunma hedefleri (WCAG 2.2 AA)
- ✅ axe `target-size` kuralı CI taramasına açıldı (varsayılan kapalıdır). Ölçüm: 17 sayfa mobilde yalnızca 6 ihlal (medya kartı onay kutusu 20 px, stüdyo cihaz düğmeleri); düzeltildi (24 px, `aria-pressed`/ad eklendi). 72 tarama 0 hata. Ham sayım (24 px altı eleman) ~25–39 görünse de çoğu aralık istisnası kapsamındadır.
- ⚠️ AAA 44 px hedeflenmedi; gerçek dokunmatik cihazda elle kullanılabilirlik testi yapılmadı.

### [2026-10-30] — Stüdyo/tema özelleştirici dar ekran incelemesi
- ✅ Playwright 390 px: tema özelleştirici ve tema paketleri sorunsuz; **stüdyo kullanılamıyordu** (sol 255 px + denetçi + kanvas yan yana). Düzeltme: <1024 px'te paneller varsayılan kapalı çekmece (yapı sol, denetçi sağ, arka plan tıklamasıyla kapanır), üst çubuk yatay kaydırma, kanvas tam genişlik. Ayrıca `setRightSidebarOpen` denetçi API'sine eklendi.
- ✅ a11y CI listesine `/admin/contents?type=page&new=1` ve `/admin/themes/packages` eklendi; yeni sayfalar 5 gerçek ihlal buldu (isimsiz TipTap alanı/slug/simge düğmeleri, renge dayalı bağlantı) ve düzeltildi: 72 tarama 0 hata.
- ✅ `OPENAI_API_KEY` kullanıcının isteğiyle yerel `.env`'e (git dışı) yazıldı.
- ⚠️ Stüdyo mobilde gözle kontrol edildi (kanvas, çekmeceler); blok sürükle-bırak ve dokunmatik düzenleme ayrıca denenmedi; dokunma hedefleri (24 px altı) hâlâ ölçülüp düzeltilmedi.

### [2026-10-30] — Panel düzenlemesi, eksik sayfalar, AI Tasarım Pro, sayfa içi SEO
- ✅ **Plan:** `docs/18`. **AI altyapısı:** ortak sohbet istemcisi ve hız sınırı çekirdeğe taşındı (`@nexpress/core`); `core/ai-design` (blok kataloğu, `lintDesign`, `lintThemeTokens`, `buildDesignSystemPrompt`, ayrıştırıcı) + kütüphane sözleşme testi; `design_library` (göç `0013`, iki motor, yedeğe girer); `loadDesignSiteContext`; tema çıktısı doğrulayıcısı `@nexpress/themes/package`.
- ✅ **Eklenti:** `@nexpress-pro/ai-design` (`plugins-pro/ai-design`): üretim hattı + tek onarım turu + hız sınırı, 5 test (sahte sohbet istemcisi).
- ✅ **Sayfalar:** `/admin/design-library`, `/admin/seo/audit`, `/admin/integrations`, `/admin/help`; editörde "Benim tasarımlarım" + doğrulamalı JSON aktarma; ⌘K ve menü girdileri.
- ✅ **Sayfa içi SEO:** meta/TL;DR ayrıldı, uzunluk ölçerleri, gerçek adresli SERP + mobil, sosyal kart, noindex ve canonical (öncesinde arayüzü yoktu).
- ✅ **Genel:** Türkçe/menüden türetilen üst çubuk yolu, en uzun eşleşmeli etkin menü, `loading`/`error`/`not-found`, başlangıç kontrol listesi, panoda sahte varsayılan puan (95) kaldırıldı, plugin kartlarında kontrast.
- ✅ Sonradan **gerçek OpenAI anahtarıyla** uçtan uca doğrulandı (gpt-4o-mini): iki gerçek hata bulunup düzeltildi (model alanları `props` dışına yazıyordu; tema kontrastı) ve geçersiz dil parçasında public sayfa 500'ü giderildi. Ayrıntı: `docs/18` "Gerçek modelle doğrulama".

### [2026-10-28] — Erişilebilirlik taraması CI'da
- ✅ `apps/cms/scripts/a11y-audit.mjs` (axe-core 4.10 + playwright-core 1.49, devDependency) ve CI işi `a11y` (tohumlu SQLite, üretim derlemesi, Chromium önbelleği, rapor çıktısı). Yerel CI benzeri koşuda ilk tarama gerçek bulgular çıkardı (tohum verisinde yorum durumu seçicileri etiketsiz, yıldız metni kontrastı, okunmamış noktası geçersiz `aria-label`) ve düzeltildi; sonunda 60 tarama (30 sayfa × 2 görünüm) 0 hata.
- ✅ Betik düzeltmesi: `axe.run` hariç tutma bağlamı (`data-axe-skip`) ilk sürümde seçenek olarak geçilip yok sayılıyordu.
- ⚠️ Yeni CI işi ilk kez gerçek CI ortamında çalışıyor (Chromium kurulumu, ubuntu-latest); sonucu bu satırın altındaki kayıtla birlikte izleyin.

### [2026-10-28] — Mobil ve erişilebilirlik turu
- ✅ Panel kabuğu: dar ekranda kenar çubuğu çekmece (arka plan, Esc, sayfa değişince kapanır), üst çubuk sıkışması giderildi, "İçeriğe geç" + `main#main-content`.
- ✅ Ölçülen: axe-core (4.10) ile 31 sayfa × mobil/masaüstü (yerel Chromium + `playwright-core`, test sitesi): başlangıçta kritik `button-name`/`label`/`select-name` ve ~30 sayfada renk kontrastı; sonunda kritik 0, ciddi yalnızca tema önizleme çipi (kullanıcı rengi) ve içerik kaynaklı başlık sırası. Yatay taşma tüm sayfalarda 0.
- ✅ Kod: ikincil metin `#8C9099`→`#5F6570` (açık kipte; koyu kip aynı), marka mavisi/amber/yeşil metinler koyulaştırıldı, 41 etiketsiz kontrol `aria-label` aldı, simge düğmeleri adlandırıldı, kaydırılabilir bölgeler odaklanabilir, form kurucu kartı iç içe etkileşimsiz, ziyaretçi formunda başlık düzeyleri (h2/h3).
- ⚠️ Tarama CI'da değil; stüdyo (`/admin/contents`) ve tema özelleştirici dar ekranda ayrıca incelenmedi; dokunma hedefleri elle ölçülmedi. Dönüştürmeler (sed/regex) geniş olduğundan görsel gerileme için panelin ana sayfaları gözle kontrol edildi (mobil ekran görüntüleri: medya, form kurucu).

### [2026-10-28] — ⌘K komut paleti veri araması
- ✅ `core/admin-search` (normalleştirme + sıralama, test edilir), `AdminSearchRepository` (yalnızca başlık düzeyi sütunlar, kiracı ve rol kapsamlı), `GET /api/admin/search`, yeni `CommandPalette` (sayfalar + veri grupları, combobox/listbox ARIA, klavye, odak iadesi, hata durumu). Gerçek derlemede denendi: "iletisim" → "İletişim formu"; kısayol ve sonuçlar çalışıyor. DB testi iki motorda.

### [2026-10-28] — Bildirim merkezi
- ✅ `notifications` + `notification_reads` (göç `0012`, iki motor), `core/notifications` (türetilmiş uyarılar: sağlık, yedek hatırlatması, giriş hatası), `NotificationRepository` (tekrar toplama penceresi/"open", kullanıcıya özel okundu, kitle, çözme, budama).
- ✅ Kaynaklar: form yeni gönderim / e-posta hatası, zamanlanmış yayın, IndexNow hatası, WordPress içe aktarma, sistem sağlığı (10 dk'da bir `syncSystemNotifications`; zamanlayıcıdan ve sayfadan). Zil + açılır panel + `/admin/notifications`, nav "Bildirimler" (G U).
- ✅ Gerçek derlemede doğrulandı: gerçek ortam uyarıları (AUTH_SECRET yer tutucusu kritik), form gönderimi → bildirim, kapalı SMTP → "e-posta gönderilemedi", okundu/tümünü okundu, yetkisiz 401, geçersiz eylem 400. Testler: core (3), database (iki motor).
- ⚠️ Sistem uyarılarının "çözüldü" geçişi ve yedek hatırlatması gerçek ortamda uçtan uca izlenmedi (depo ve saf mantık testleri kapsıyor). Zamanlanmış yayın ve IndexNow bildirimleri canlı denenmedi.

### [2026-10-28] — Medya klasörleri, toplu/sürükle-bırak yükleme, kullanılmayanlar
- ✅ `media_folders` + `media_assets.folder_id` (göç `0011`, iki motor; push-parity testi sonradan eklenen indeksleri de tabandan sayar). Saf kurallar `core/media-folders` (ad, en çok 3 düzey, döngü, aynı kardeş adı, ağaç) ve `MediaFolderRepository` (kiracıya kapalı; silince içerik/alt klasör üste). Klasörler yedeğe girer.
- ✅ `/admin/media`: klasör ağacı, `MediaBulkUpload` (çoklu + sürükle-bırak, `/api/media/upload` `folderId`), `MediaGrid` toplu seçim, taşıma, "Kullanılmayanlar" (`findUnusedIds`). Gerçek derlemede doğrulandı (klasör oluşturma, 3 dosya yükleme klasöre, toplu taşıma). Testler: core (klasör kuralları), database (iki motor).
- ⚠️ Sürükle-bırak yalnızca dosya seçiciyle denendi (OS dosya sürüklemesi otomatikleştirilemedi). Alt klasör oluşturma/silme arayüzü elle denenmedi (depo testleri kapsıyor).

### [2026-10-28] — Gerçek WordPress (WXR) içe aktarma
- ✅ `packages/wp-importer` yeniden yazıldı: `parseWxr` (fast-xml-parser, ENTITY reddi), `convertWpHtml` (htmlparser2, Gutenberg/klasik/sayfa oluşturucu), `buildPlan` (eşleme, SEO, slug, yönlendirme yolu), `isPublicIp` (SSRF). Önceki **örnek veri simülasyonu ve `runWpMigrationAction` kaldırıldı**.
- ✅ `lib/wp-import.ts` + `lib/safe-fetch.ts` + `/api/admin/wp-import` + yeni `/admin/migration` arayüzü (çözümle → seçenekler → içe aktar). `SaveContentInput.publishedAt` eklendi (yalnızca yeni içerik).
- ✅ Gerçek derlemede doğrulandı: çözümleme, yazma, gerçek bir genel görselin indirilmesi, loopback ve bulut meta verisi adreslerinin engellenmesi, eski adresin 301/308 ile yeni adrese gitmesi, kategori üst-alt ilişkisi, özgün tarih, taslağın ziyaretçiye 404, tekrar yüklemede idempotent atlama. 11 birim testi (HTML, WXR, plan, IP).
- ⚠️ Gerçek bir WordPress/WooCommerce dışa aktarma dosyasıyla denenmedi (yalnızca el yapımı örnek); WooCommerce fiyat/stok aktarılmaz.

### [2026-10-28] — Paylaşılabilir taslak önizleme bağlantısı
- ✅ `@nexpress/core/draft-preview` (HMAC belirteç, test edilir), `?nx_draft=` ile `/{dil}/{slug}` sayfasında yayında olmayan içeriği oturumsuz gösterme, `private, no-store` + noindex, sayfada bant, editörde `PreviewLinkButton` + `createDraftPreviewLinkAction` (denetim günlüğü). Gerçek derlemede doğrulandı: belirtecsiz/bozuk/başka içeriğe ait belirteç 404, geçerli belirteç 200.

### [2026-10-28] — Form modülü: sürükle-bırak kurucu, şablonlar, e-posta bildirimi, analiz
- ✅ **Kurucu:** `/admin/forms/[id]` (`@dnd-kit`), 15 alan türü, 8 şablon, genişlik (tam/yarım), seçenek/sınır/yardım alanları; `form_block` denetçisinde form seçici (`/api/admin/forms/options`).
- ✅ **Şema:** `forms` tablosu + `form_submissions.notify_*` (göç `0010_forms_builder`, iki motor); `forms` yedeğe girer; SMTP parolası yedeğe girmez.
- ✅ **E-posta:** `lib/mailer.ts` (nodemailer), `lib/form-notify.ts`, `/admin/forms/email`; `after()` ile yanıttan sonra gönderim, sonuç gönderimde saklanır. Yerel SMTP alıcısıyla doğrulandı (bildirim + otomatik yanıt, Reply-To, HTML kaçışı).
- ✅ **Analiz:** `analyzeSubmissions` + `/admin/forms/[id]/analytics`; gelen kutusu `/admin/forms/inbox` (form süzgeci, e-posta durumu).
- ✅ Testler: core (doğrulama, normalleştirme, şablonlar, analiz), database (tanım deposu, özet, yedek/SMTP) — SQLite ve PostgreSQL. Ziyaretçi bütçesi (≈101 kB) korundu. Ayrıntı: `docs/16-FORMS.md`.
- ⚠️ Sürükle-bırak yalnızca sentetik işaretçi olaylarıyla doğrulandı (paletten ekleme, yeniden sıralama); gerçek fare/dokunmatik ve klavye sürüklemesi elle denenmeli.

### [2026-10-28] — F14 (2): formlar + gelen kutusu, yedekleme / geri yükleme
- ✅ **Formlar:** `form_submissions` (göç `0009`), `form_block` JS'siz POST, `/api/forms/submit` (bal küpü, HMAC zaman belirteci, hız sınırı, spam sezgisi), `/admin/forms` gelen kutusu ve CSV, 365 gün saklama. Uçtan uca doğrulandı (hızlı/bozuk belirteç hata, bal küpü sessiz, 5. sonrası hız sınırı, spam işareti).
- ✅ **Yedek:** `BackupRepository` (iki motor, tek işlem), `lib/backup.ts` paketleme/doğrulama, `/admin/backup` arayüzü; kuru doğrulama, birleştir/değiştir, onay metni, bozuk/sahte paket reddi doğrulandı.
- ⚠️ Kalan: form e-posta bildirimi, CLI yedek, zamanlanmış yedek; `lib/backup.ts` için ayrı birim testi yok (sunucuya özel içe aktarmalar nedeniyle uçtan uca doğrulandı).

### [2026-10-28] — F14 (1): çöp kutusu, zamanlanmış yayın, yönlendirme + 404 izleyici, sistem durumu
- ✅ **Çöp kutusu:** `ContentStatus` `trashed`; toplu silme çöpe taşır; hiçbir yüzeyde görünmez (liste/ziyaretçi/sitemap/RAG); geri yükleme **taslak**; 30 gün sonra otomatik silinir; kalıcı silme ve boşaltma yalnızca yönetici.
- ✅ **Zamanlanmış yayın:** saat dilimli tarih çözümü (`zonedLocalToUtc`, yaz saati dahil, testli), editörde tarih seçici, tarihsiz/geçmiş reddi (kayıtta ve toplu işlemde), `publishDue` (+afterPublish kancaları), `/admin/schedule` takvimi, `/api/cron/scheduled` (`CRON_SECRET`, sabit zamanlı karşılaştırma) ve ziyaretçi trafiğiyle dakikada bir.
- ✅ **Yönlendirmeler + 404:** göç `0008`; doğrulama/döngü reddi/zincir çözümü; uygulama 308/307; 404 izleyici (tek segmentli bilinmeyen yollar dahil `[locale]` yerleşiminde yakalanır); `/admin/redirects`.
- ✅ **Sistem durumu:** `/admin/system`; ortam denetimi sır değeri sızdırmaz (testli).
- 🐞 Doğrulamada bulundu: tek segmentli bilinmeyen adresler (`/eski-adres`) `[locale]` yerleşimine düşüp izleyiciye yazılmıyordu → düzeltildi. Sistem durumu bu makinede `apps/cms/.env` içindeki `AUTH_SECRET`'in örnek yer tutucu olduğunu doğru şekilde kırmızı işaretledi.
- Doğrulama: HTTP + tarayıcıda uçtan uca (cron 401/200, gecikmiş içerik yayınlandı, gelecek bekledi, çöp 404, geri yüklenen taslak 404, redirect 308, döngü/rezerve reddi). Testler: core 79, database 49 (SQLite+PG).

### [2026-10-28] — F13 (temalar): tema paketleri v1
- ✅ `.nxtheme` biçimi ve doğrulayıcı (`@nexpress/themes/package`): zip sınırları (8 MB / 200 dosya / 30 MB açılmış, **zip bombası** şişirmeden önce reddedilir), yol gezinmesi ve izinsiz uzantı reddi, zod şemaları (tema, token, üst/alt şablon, başlangıç sayfaları), **CSS temizleyici + kapsamlayıcı** (postcss: @import/expression/dış url/@font-face yasak, her seçici `[data-nx-skin]` altına alınır), screenshot sihirli bayt denetimi, SHA-256 özet.
- ✅ Göç `0007` + `CmsThemeRepository`: kur/güncelle, resmi kimlik çakışması reddi, etkin tema silinemez, kiracıya kapalı (SQLite + PG testli).
- ✅ Çalışma zamanı: etkin veri temasının skin CSS'i ve `data-nx-skin` ön yüzde; `?nx_preview=` önizleme yalnızca geçerli oturumda (middleware başlığı ezer, `no-store`).
- ✅ Yönetim: `/admin/themes/packages` (sürükle-bırak yükleme + doğrulama raporu, kartlar, önizle / etkinleştir [şablon ve sayfa seçenekleriyle] / dışa aktar / sil), `/api/admin/themes/{upload,export}` (yönetici + aynı-kaynak denetimi, denetim kaydı), **mevcut tasarımı dışa aktar**.
- Doğrulama: HTTP ve tarayıcıda uçtan uca (bozuk dosya 422, kurulum, güncelleme, önizleme yalnızca oturumlu, anonim 401, etkinleştirme + şablon + taslak sayfa, skin ziyaretçide, dışa aktarma aynı bayt). Testler: themes 5, database 46 (SQLite+PG).
- Açık: eklenti lisansı ve `plugin_migrations`, tema yazı tipi dosyaları, tema ayarı geçmişi.

### [2026-10-28] — F12 tamamlandı: tema metinleri, SEO dil profilleri, eksik çeviri raporu, çeviriye özgü öznitelikler, panel dili
- ✅ Tema blok metinleri ve ana sayfa/üstbar/altbilgi sabitleri kataloğa taşındı (`RscBlockRenderer locale`); arama sayfası başlığı dilli.
- ✅ `seoLanguageProfile`: İngilizce `INTERNET`≠`ınternet` hatası (Türkçe küçük harf kuralı her dile uygulanıyordu) giderildi; okunabilirlik eşiği dile göre; analiz içerik dilini kullanıyor.
- ✅ `/admin/translations` eksik çeviri raporu (matris + toplamlar + tek tıkla oluştur); editörler de görebilir.
- ✅ Göç `0005`: öne çıkan görsel alt/alt yazı, odak anahtar kelime ve **slug geçmişi** çeviri başına (eskiden diller arası ortak slug geçmişi; testli).
- ✅ Göç `0006` + panel dili: profilde seçici, menü/bölüm/hesap `admin.*` kataloğu, `<html lang>` panelde kullanıcının dili. Tarayıcıda doğrulandı (İngilizce menü, `lang="en"`, PUBLISHING büyük harf doğru).
- Doğrulama: testler core 71, seo-core 20, database 45 (SQLite+PG), i18n 4, cms 5, agentic-seo 16; JS bütçesi içinde.
- Bilerek yapılmayanlar ve gerekçeleri: `docs/14` §0.

### [2026-10-28] — F12: çok dilli altyapı (L1–L4 çekirdeği) + ziyaretçi içerik sızıntısı düzeltmesi
- ✅ `@nexpress/i18n` (tip güvenli katalog tr/en, çoğul, testli); ziyaretçi sayfaları (içerik, arama, mağaza) anahtara taşındı.
- ✅ Göç `0004`: çeviri durumu/kaynak özeti; `createTranslation`, `translationOverview`, `deleteTranslation`, `saveSupportedLocales`; ikincil dil kaydı içerik satırını ezmez; RAG ve sitemap yalnızca yayındaki çevirileri alır.
- ✅ Editörde **Diller** şeridi, `?locale=` ile çeviri düzenleme, dile özel yerel taslak anahtarı; Ayarlar'da **Site dilleri** kartı.
- ✅ Ziyaretçi: dil başına canonical + karşılıklı hreflang + x-default, `<html lang dir>`, dil değiştirici, `/{locale}/llms.txt`, `?locale=` (llms-full, ai-sitemap, RSS, ai-feed), MCP `locale`. `slugify(text, locale)`.
- 🐞 **Güvenlik:** taslak/zamanlanmış/arşiv/`private` içerik ziyaretçiye adresle açılıyordu → `publicOnly` ile düzeltildi (+test); `listPublishedContents` `private`'ı hiçbir yüzeye vermiyor.
- Doğrulama: `en` ile uçtan uca (tarayıcıda dil ekleme/doğrulama, çeviri oluşturma, taslak 404, yayın, hreflang karşılıklı, sitemap `en`, `/{locale}/llms.txt`, `/zzz` 404). Testler: core 70, seo-core 19, database 42 (SQLite+PG), i18n 3.
- Açık: tema blok metinleri, SEO dil profilleri, eksik çeviri raporu, medya çevirisi, panel dili, ticaret çevirisi, `password/members_only` erişim denetimi.

### [2026-10-28] — Ajan talepleri, AI yönlendirme izleme ve bot IP doğrulama
- ✅ **agent-actions:** MCP `nexpress_create_lead|ticket|book_demo` (anahtarlı, doğrulamalı, hız sınırlı) → `agent_requests`; yönetici **Talepler** sayfası + nav.
- ✅ **ai-referrals:** `Referer`/`utm_source` ile ChatGPT, Perplexity, Gemini, Copilot, Claude… yönlendirmesi (`ai_referral_daily`), panel kartı, JS yok.
- ✅ **Bot doğrulama:** CIDR (IPv4/IPv6) eşleştirme + OpenAI/Perplexity'nin yayımladığı IP listeleri (gerçek listeler indirilip biçim doğrulandı); `bot_daily_stats` `verified/claimed`.
- Migrasyon `0003_agent_requests_ai_referrals` (SQLite + PG). Doğrulama: HTTP ile uçtan uca (anahtarsız/yanlış anahtar/geçersiz e-posta reddedildi, geçerli talep kaydedildi, referral sayaçları, listedeki IP `verified`, 8.8.8.8 `claimed`) ve tarayıcıda Talepler sayfası + panel kartı. Testler: core 63, agentic-seo 16, database 40 (SQLite+PG). Modül kataloğu 33, hazır 19.
- ⚠️ Talep e-posta bildirimi yok (SMTP altyapısı yok); saklama süresi tanımlı değil.

### [2026-10-28] — Marka profili & Site DNA (`ai-brand`)
- ✅ `saveSiteDna` (kiracıya kapalı, SQLite+PG testli); Pro: stil örneği seçici, Site DNA istemi/doğrulayıcı, `ai-brand.generate|save` eylemleri; AI yazım asistanı marka bağlamını kullanıyor. Eklentiler › Ayarlar: Marka profili alanları + Site DNA kartı (öner → düzenle → kaydet).
- Doğrulama: sahte OpenAI sunucusuyla tarayıcıda uçtan uca (DNA üretildi, `sites.site_dna`'ya yazıldı; öneri isteminde DNA, stil örneği ve sektör göründü). Testler: agentic-seo 15, database 38. Modül kataloğu 34, hazır 17.
- ⚠️ Gerçek OpenAI anahtarıyla denenmedi.

### [2026-10-28] — AI yazım asistanı (`ai-writer`)
- ✅ `plugin-actions.ts` (çekirdek eylem kaydı), `runPluginAction` server action; Pro: OpenAI sohbet istemcisi (zaman aşımı, 429/5xx yeniden deneme), istem üretici, çıktı doğrulayıcı, 2 geçişli yasak kalıp düzeltmesi, kullanıcı başına hız sınırı, ayarlar (model/ton/yasak kalıp/kurallar).
- ✅ Editör SEO sekmesinde "AI yazım asistanı": TL;DR, meta başlık/açıklama (Uygula) ve SSS önerisi.
- Doğrulama: sahte OpenAI sunucusuyla tarayıcıda uçtan uca (öneri geldi, uygula alanı doldurdu, "Kaydedilmedi" açıldı); anahtarsızken açık hata mesajı. Testler: agentic-seo 12, core 60. Modül kataloğu 34, hazır 16.
- ⚠️ **Gerçek OpenAI anahtarıyla denenmedi** (`OPENAI_API_KEY` boş). Çıktı kalitesi ve maliyet ölçümü anahtar gelince yapılacak.

### [2026-10-28] — Eklenti sistemi v1, Temel SEO / Agentic SEO Pro ayrımı ve `agentic-content-ops` taşıması başladı
- ✅ **Eklentiler sayfası** yeniden tasarlandı: kurulu eklentiler, modül anahtarları (Hazır / Yakında), arama + filtre, manifestten ayar formu, Geliştirici sekmesi. Tarayıcıda doğrulandı (modül/eklenti aç-kapa kalıcı; eklenti kapalıyken `/llms-full.txt` 404, llms.txt Pro satırları kalkıyor; ayar doğrulama hatası + kayıt).
- ✅ Altyapı: `plugins.ts` (manifest, durum, kapı, ayar normalleştirme), `plugin-routes.ts`, `site_plugins` tablosu + `0002` göçü + `CmsPluginRepository` (SQLite + PG testli), `robots:buildTxt` kancası.
- ✅ **Temel SEO** (ücretsiz, gömülü manifest) + Google/Bing/Yandex doğrulama etiketleri (`seo.verification`, SEO sayfasında).
- ✅ **Agentic SEO Pro 6.0:** `content-ops` paketi birleştirildi; 33 modüllük katalog (`docs/15`), 15'i hazır: `ai-feed.json`, `.well-known/{nlweb,ai-plugin,openapi}`, robots Content-Signal, LocalBusiness + geo meta, Speakable, NLWeb `ask`, tazelik kartı; mevcutlar modül kapısına bağlandı.
- 🐞 `nexpress_create_lead` MCP aracı hiçbir şey kaydetmeden "accepted" dönüyordu → kaldırıldı. MCP anahtar kelime yedeği noindex/özel içeriği süzmüyordu → düzeltildi.
- ⚠️ `OPENAI_API_KEY` boş (iki projede de); `ai-writer` ve gerçek gömme ölçümü anahtara bağlı.
- Doğrulama: typecheck 11/11; testler core 59, seo-core 17, agentic-seo 7, rag 13, database 37 (SQLite+PG), cms 5; JS bütçesi içinde.

### [2026-10-28] — F11: bot politikası, RSS/Atom, JSON-LD doğrulayıcı, hibrit/site içi arama, bağlantı denetimi
- ✅ `seo.botPolicy` + `buildRobotsTxt`; `/admin/seo`'da bot başına izin/engel ve "Eğitim botlarını kapat". Tarayıcıda kaydedilip `robots.txt`'te doğrulandı.
- ✅ `/feed.xml` (RSS 2.0), `/atom.xml`; `<head>` keşif bağlantıları.
- ✅ `validateSchemaGraph`; editör SEO sekmesinde canlı hata/uyarı listesi.
- ✅ Hibrit arama: BM25 (Türkçe katlama) + vektör, RRF; `searchCorpus` `ranking` alanı; noindex/özel içerik anahtar kelime tarafında da süzülür (testle).
- ✅ `/{locale}/ara` site içi arama (0 KB sayfa koduna dokunmadan, `noindex`).
- ✅ `auditLinks` + `/admin/seo` bağlantı denetim kartı; `Link: rel=alternate text/markdown` başlığı.
- Doğrulama: typecheck 12/12, testler (core 53, seo-core 17, rag 13, database 36, cms 5) yeşil, JS bütçesi 101,1 kB / rota kodu 0,55 kB (bütçe içinde).
- ⚠️ Gerçek OpenAI anahtarıyla kalite ölçümü yapılmadı (anahtar yok); site içi arama bilerek yalnızca anahtar kelimedir.

### [2026-10-28] — Editör güvenlik ağı ve içerik revizyonları
- ✅ **Revizyonlar:** `content_revisions` tablosu + `0001_content_revisions` göçü (SQLite ve PG), `CmsRevisionRepository` (kayıt/dedupe/50 sınır/liste/getir, kiracıya kapalı); `saveContent` her kayıtta yazar, yazar bilgisini `saveContentAction` iletir; `listRevisionsAction` / `getRevisionAction`. Testler: kayıt, tekrarsızlık, sıra, kiracı, silme, 50 sınırı (SQLite + PG).
- ✅ **Editör güvenlik ağı:** `@nexpress/core/editor-draft` (imza, yerel taslak kararı, snapshot→alan); kanca zincirine **Dirty** ve **Safety** aşamaları; "Kaydedilmedi" rozeti, `beforeunload` uyarısı, Ctrl/Cmd+S, yerel taslak ve kurtarma çubuğu, Yayın sekmesinde Sürüm Geçmişi paneli; kayıt başarısızlığında artık hata bildirimi.
- ✅ Tarayıcıda doğrulandı (rozet, sekme kapatma engeli, Ctrl+S, yerel taslak yazma/silme, sürüm yükleme, kurtarma çubuğu → geri yükle).
- 🐞 Doğrulamada bulundu ve düzeltildi: SQLite budama sorgusu `OFFSET`'i `LIMIT`'siz kullanıyordu (hata yutuluyordu, 50 sınırı SQLite'ta işlemiyordu).
- ℹ️ SQLite için bağlantı `SQLITE_URL` ile verilir (`DATABASE_URL` yalnızca PG).

### [2026-10-23] — Stüdyo çubuğu ve kategorili tasarım kütüphanesi
- ✅ Görünüm modları ve masaüstü / tablet / mobil önizleme sağ denetçinin üstüne alındı. Belge kartındaki hızlı ekle şeridi kaldırıldı. Stüdyo, üst menü çubuğunun altına oturuyor.
- ✅ Tasarım kütüphanesi kategori rayı, arama ve tel kafes önizleme ile açılıyor. Bilgi kutusu, liste, sekme, akordeon, galeri, slayt, form, yazı ızgarası, ürün şeridi, geri sayım ve tablo blokları ön yüzde sunucu bileşeni olarak basılıyor.
- ✅ Editör açılınca sol menü gizleniyor. Geri dönüş üst şeritte duruyor. Kütüphane ile geri-ileri, yapı gezgininin üstünde. Başlık tuvalin üst kenarına yaslı.
- ✅ Yapı paneli kütüphanenin solunda ikonla açılıp kapanıyor. Görünüm ve cihaz seçimi stüdyo çubuğunda.
- ✅ Sol ekleme panelindeki tekrarlayan kütüphane düğmesi kaldırıldı. Sağ denetçi biraz daraltıldı. Metin biçim çubuğu seçim yapılınca seçimin üstünde açılıyor.
- ✅ Biçim çubuğuna paragraf, başlık, div ve bağlantı seçenekleri eklendi. Görünüm düğmeleri SEO skorunun yanında. Yeni sayfa ve yazı boş paragrafla açılıyor. Yeni belgenin adresi ilk boyamadan sonra üretiliyor.
- ✅ Ink Grid teması eklendi. Siyah ızgara vitrin, örnek ürün, geliştirici, kurumsal, doküman, fiyat ve çalışma sayfalarıyla birlikte gelir. Tema etkinleşince ana sayfa bu vitrini basar.
- ✅ Header, menü, footer ve kenar çubuğu ayrı düzenleyicilere alındı. Hazır header ve footer şablonları kayda kopyalanıp düzenlenir. Menü sürükle-bırak sıralanır.
- ✅ Header ve footer tasarım kütüphanesi eklendi. Kategorili hazır yerleşimler ve JSON aktarımı sayfa kütüphanesiyle aynı düzendedir. AI sözleşmesi `docs/08-AI-CHROME-SPEC.md`.
- ✅ `/admin/seo` site skor özetini ve motor ayarlarını tek ekranda toplar. Sitemap tür filtresi, `/llms.txt` anahtarı ve `robots.txt` bu ayarlardan okunur.
- ✅ **E-Ticaret modülü (`@nexpress/commerce`)**: `commerce_*` tabloları, `/admin/commerce` (ürün/sipariş/ayar), RSC mağaza (`/tr/magaza`, sepet, ödeme), HTTP-only sepet çerezi. Bkz. `docs/09-COMMERCE.md`.
- ✅ **Pazar yeri katmanı (`@nexpress/marketplace`)**: sürücü kaydı; Trendyol, Hepsiburada, n11, Amazon, Çiçeksepeti. Kanal, bağlantı testi, stok/fiyat itme, sipariş çekme. Bkz. `docs/10-MARKETPLACES.md`.
- ✅ **E-ticaret operasyon ekranları:** kategori, nitelik, varyasyon sihirbazı, kaynaklı sipariş ve iade/değişim, müşteri grubu, sadakat, kampanya/kupon, kargo yöntemi.

### [2026-10-23] — TipTap metin motoru, yerleşim denetçisi, eklenti kaydı
- ✅ Metin alanları (başlık, paragraf, kısa yanıt, alıntı) TipTap ile düzenleniyor. HTML `props.html` alanında, düz metin mevcut alanda duruyor. Ön yüz `sanitizeInlineHtml` ile RSC basıyor; `markdownCache` bu HTML'den üretiliyor.
- ✅ Alıntı bloklarının markdown derlemesi `quote` alanını kaçırıyordu; `heading_element` / `paragraph_element` de derlemeye alındı.
- ✅ Stüdyo `editor/canvas-block.tsx`, `editor/prose-field.tsx`, `editor/block-inspector.tsx` ve `editor/studio-model.ts` olarak bölündü. Yerleşim denetçisi Genel / Stil / Gelişmiş katmanlarını koruyor.
- ✅ Pro eklentiler `apps/cms/src/plugins/register.ts` kompozisyon kökünden kanca ve yuvalara bağlanıyor.
- ✅ Geri al yığını her tuş vuruşunda değil, yapı değişiminde ve metin duraksamasında yazılıyor.
- ✅ `?format=md` yeniden yazımı sayfa yolunu `x-nexpress-target-path` başlığında taşıyor; aksi halde her adres ana sayfanın markdown önbelleğini döndürüyordu.

### [2026-10-23] — Sayfa/Blog/Kategori/Etiket Mimarisi, Yapışkan Sekmeli Sağ Sidebar, Medya & Görsel SEO, Atomik Elementler ve Yorum/İnceleme/Paylaşım Sistemi
- ✅ **Çift Motorlu Veritabanı Genişlemesi (`packages/database`):**
  - Hem PostgreSQL (`pg.ts`) hem SQLite (`sqlite.ts`) şemalarına `siteId` kapsamlı `taxonomies` (Kategori & Etiket + Arşiv SEO), `media_assets` (Medya Kütüphanesi & Görsel SEO: `altText`, `titleText`, `caption`, `focalPoint`, `seoScore`) ve `comments_reviews` (Yorum, 5 Yıldızlı İnceleme, Artılar/Eksiler & `AggregateRating`) tabloları eklendi ve her iki veritabanı motoruna tohumlandı (`pnpm db:seed`).
- ✅ **Yapışkan (Sticky) ve 3 Sekmeli Sağ Denetçi Sidebar (`/admin/contents`):**
  - İçerik stüdyosunun sağ kenar çubuğu `sticky top-12 max-h-[calc(100vh-56px)] overflow-y-auto` ile ekrana sabitlendi; sayfa aşağı kaydırıldığında yukarı çıkma zorunluluğu ortadan kaldırıldı.
  - **`Belge & Yayın` Sekmesi:** Taslak (`draft`), Yayında (`published`), Zamanlanmış (`scheduled`) ve Kısıtlı/Şifreli (`restricted`) yayınlama seçenekleri; Kategori & Etiket çoklu seçimi ve satır içi hızlı oluşturma; Öne Çıkan Görsel ve Görsel SEO (`altText`, `titleText`, `caption`, LCP `eager/lazy`); Yorum, 5 Yıldızlı İnceleme ve Sosyal Paylaşım izinleri.
  - **`SEO & GEO` Sekmesi:** Canlı Google SERP snippet önizlemesi, `metaTitle`, `metaDescription`, `canonicalUrl`, `noindex` anahtarı, `Schema @type`, `AI Önem Puanı (1-10)` ve `<PluginSlot name="editor.sidebar.tabs" />`.
  - **`Blok & Element` Sekmesi:** Aktif blok veya atomik element için canlı özellik denetçisi.
- ✅ **Atomik Elementler Hızlı Ekleme Çubuğu (`@nexpress/editor` & `@nexpress/themes`):**
  - Editör kanvasının üstüne tek tıkla eklenebilen **Başlık (`heading`)**, **Paragraf (`paragraph`)**, **Buton (`button_element`)**, **SEO Görsel (`image_figure`)**, **İnceleme & Puan Kutusu (`review_box`)** ve **Ayırıcı (`divider_spacer`)** elementleri eklendi; hem 0-KB RSC ön yüz (`RscBlockRenderer`) hem de sıfır kayıplı `markdownCache` derleyicisi (`compileBlocksToMarkdown`) güncellendi.
- ✅ **Yeni Attio-Tarzı Yönetim Modülleri & Ön Yüz Etkileşimi:**
  - `/admin/taxonomies`: Kategoriler, Etiketler & Taksonomi SEO Merkezi.
  - `/admin/media`: Medya Kütüphanesi & Görsel SEO Denetçisi (eksik `altText` tespiti, odak noktası kontrolü ve editör içi Medya Seçici Modal).
  - `/admin/comments`: Yorum, 5 Yıldızlı İnceleme & `AggregateRating` Moderasyon Merkezi.
  - Ön yüz sayfalarına (`/[locale]/[slug]`) Kategori/Etiket rozetleri, SEO uyumlu Öne Çıkan Görsel (`figure` + `figcaption`), Sosyal Paylaşım Çubuğu ve 5 Yıldızlı Müşteri Değerlendirmeleri bölümü eklendi.

### [2026-10-23] — Görsel tuval, blok kütüphanesi, AI sayfa şeması ve gizlenebilir kenar çubuğu
- ✅ **`@nexpress/editor` (`packages/editor/src/index.ts`) oluşturuldu:**
  - 13+ görsel önizlemeli hazır blok/bölüm (`NEXPRESS_DESIGN_LIBRARY`), 2 tam sayfa başlangıç paketi (`NEXPRESS_STARTER_PAGE_PACKS`) ve kopyalanabilir AI Sistem Promptu (`NEXPRESS_AI_DESIGN_SYSTEM_PROMPT`) tanımlandı.
- ✅ **Görsel editör stüdyosu (`apps/cms/src/components/admin/editor/`):**
  - **Canlı Görsel Düzenleme (WYSIWYG):** Bloklar artık ham JSON textarea olarak değil, doğrudan kanvas üzerinde satır içi (inline) düzenlenebilir görsel bileşenler olarak çalışıyor (`4/12`, `6/12`, `8/12`, `12/12` grid span, yukarı/aşağı taşıma, çoğaltma, Masaüstü/Tablet/Mobil önizleme).
  - **Tasarım & Blok Kütüphanesi Dialog Modalı:** Görsel minyatür önizlemeli (Live Wireframe) blok kütüphanesi, tam sayfa şablon paketleri ve **"+ Yeni Tasarım Ekle"** (kanvastaki bir bloğu veya özel/AI JSON şemasını kütüphaneye kaydetme) özelliği eklendi.
  - **Kod & AI AST Aktarım Görünümü:** Kullanıcıların Claude / ChatGPT / Gemini'ye ürettirdiği sayfa veya blok JSON AST kodunu yapıştırıp tek tıkla görsel kanvasa uygulayabilmesi sağlandı.
- ✅ **AI Sayfa ve Blok Tasarım Rehberi (`docs/07-AI-PAGE-AND-BLOCK-SPEC.md`):**
  - Harici AI modellerine sayfa ve blok tasarlatmak için tam JSON AST spesifikasyonu ve sistem promptu dokümante edildi.
- ✅ **Sıfır Gereksiz Boşluk & Gizlenebilir Sidebar (`admin-shell-client.tsx`):**
  - Sol menüye ve üst bara **Menüyü Gizle/Göster (`Ctrl+B`)** ve sağ denetçi çekmecesini gizle/göster düğmeleri eklendi; çalışma alanı tam genişlikli hale getirildi.

### [2026-10-23] — Attio CRM Tasarım Sistemi Yenilemesi, Canlı Navigasyon Stüdyosu ve Slot/Hook Veriyolu Ekranı
- ✅ **Attio CRM Precision UI/UX Yenilemesi (`/admin/*`):**
  - Tüm yönetim paneli (`admin-shell-client.tsx`, `admin/page.tsx`, `dual-mode-editor-client.tsx`, `theme-store-client.tsx`, `wp-migration-client.tsx`) kaba gradyan ve emojilerden arındırılarak **Attio CRM** tasarım sistemine (`#FBFBFB` / `#F4F5F6` monokrom yüzeyler, `1px` `divide-x divide-y` hücre ızgaraları, `44px` üst breadcrumb bar, `28px` kompakt butonlar ve `grid-cols-[96px_1fr]` sağ özellik çekmecesi) geçirildi.
- ✅ **Etkileşimli 3 Katmanlı Navigasyon & Mega-Menü Stüdyosu (`/admin/appearance/navigation`):**
  - `packages/database/src/repository.ts` içerisine `saveNavigationLayout` metodu ve `saveNavigationLayoutAction` Server Action eklendi; TopBar, MainBar (Sticky/Glassmorphism) ve Mega-Menü öğeleri doğrudan veritabanına kaydedilebilir hale getirildi.
- ✅ **Open-Core Slot & Hook Veriyolu Ekranı (`/admin/plugins`):**
  - Kayıtlı yaşam döngüsü kancalarını (`cmsHooks`), görsel `<PluginSlot />` yuvalarını ve canlı Agentic Web uç noktalarını (`/llms.txt`, `/llms-full.txt`, `/ai-sitemap.json`, `/api/mcp`) tek tabloda denetleyen yönetim ekranı eklendi.

### [2026-10-28] — Faz 10: Göçler, Şema Paritesi, Tek Kod Yolu, Dosya Bölme
- ✅ **Şema paritesi:** iki Drizzle şeması + `push.ts` ile kurulan gerçek veritabanları iki motorda testle birebir (321 sütun, 48 indeks). Bulgular: SQLite `push.ts` iki indeksi hiç oluşturmuyordu; `content_chunks` model/HNSW indeksleri şemada tanımsızdı → düzeltildi.
- ✅ **Göç sistemi:** `drizzle-kit` yapılandırmaları, `0000_baseline` (iki motor), `scripts/migrate.ts` (fresh/baselined/upgraded/current), `db:generate`, `db:migrate`. Gerçek 0001 göçü üretilip eski veritabanına uygulama testi; "göçsüz şema değişikliği" koruması (bozularak doğrulandı).
- ✅ **Tek kod yolu:** `dialect.ts` (`backendFor`, `Tables`, `upsertScoped`); `repository.ts`, `commerce-repository`, `commerce-ops-repository`, `marketplace-repository`, `site-identity`, `sitemap`, `media-admin`, `bot-stats` ve `seed.ts`'te toplam ~70 motor dalı mekanik dönüştürücüyle (yalnızca iki blok normalize edilince birebir aynıysa) tek yola indi; farklı olanlar elle birleştirildi.
- 🔒 **Güvenlik bulgusu (kiracı ele geçirme):** id'ye göre upsert'te SQLite dalı kiracıdan bağımsız güncelliyor, PostgreSQL dalı `siteId`'yi üzerine yazıyordu. `upsertScoped` (`setWhere siteId`) ile kapatıldı; mutasyon testi korumasız hâlde ele geçirmenin gerçekten mümkün olduğunu gösterdi. Aynı sınıfın kalan örnekleri roadmap'te.
- ✅ **Testler:** karakterizasyon (CMS 11, ticaret/pazar yeri 6) iki motorda refactor öncesi yazıldı; veritabanı paketi 33 test SQLite ve PostgreSQL'de yeşil. Seed çıktısı eski ve yeni kodla **iki motorda da birebir aynı** (31 tablo, 56 satır).
- ✅ **Dosya bölme:** `repository.ts` 1528 → 18 + 7 dosya (≤290); `seed.ts` 1346 → 231 + 4 veri modülü; `editor/src/index.ts` 870 → 14 + 5 modül (dışa aktarılan veriler derin eşit doğrulandı); `admin-shell` nav ayrıldı; `content-list`, `theme-store`, `taxonomy-studio` istemci bileşenleri kanca + alan bileşenleri. 12 yönetim sayfasının SSR HTML'i bölme öncesi/sonrası **birebir aynı**.
- ✅ **Tarayıcıda doğrulama:** sayfa listesi (hızlı düzenleme, toplu çubuk, arama), tema özelleştirici (4 sekme), taksonomi düzenleme ve içerik editörü denetçisi (4 sekme) gerçek tarayıcıda denendi.
- 🐞 Doğrulama sırasında `ChunkLoadError`: `.next` klasörü, aynı dizinde çalışan başka bir `next dev` tarafından ezilmişti (kod hatası değil). `NEXT_DIST_DIR` ile izole derleme eklendi (`docs/11` §9).
- 🔒 Aynı sınıf açık taksonomi, medya, yorum ve içerik (içerik + çeviri) yazmalarında da bulundu (mutasyon testi: korumasız hâlde ele geçirme başarılı) ve `setWhere siteId` ile kapatıldı; tek test 4 tabloyu kapsıyor.
- 📋 Açık: `dual-mode-editor-client.tsx` (1390), dondurulmuş `push.ts`.

### [2026-10-28] — Faz 9: Hesaplar, Oturum İptali, Denetim Günlüğü, Ayarlar
- ✅ `users` genişledi (`status`, `sessionVersion`, `passwordChangedAt`), yeni `audit_log` (SQLite'ta ms), `sites.settings.general`; eski veritabanları için idempotent geçiş (eski bir SQLite veritabanında doğrulandı: mevcut yönetici `active`, `sv=0` ile korundu; oturumlar `sv` olmadığından bir kez yeniden giriş ister).
- ✅ Saf kurallar (`@nexpress/core`): `validatePassword`, `wouldRemoveLastAdmin`; oturum belirtecine `sv`.
- ✅ `dialect.ts` adaptörü: kullanıcı ve denetim depoları motor dalı olmadan tek kodla iki motorda çalışır (F10 için örnek kalıp).
- ✅ Veritabanı doğrulamalı oturum (`getSession`: etkin mi, sürüm eşleşiyor mu, rol veritabanından), `requireUser({audit})`/`requireAdmin(name)`, `requireAdminPage`, ara katmanda editör için yönetici yollarına anında 307.
- ✅ Sayfalar: `/admin/users` (oluştur, rol, devre dışı, parola sıfırla, oturumları kapat), `/admin/profile` (ad, parola değiştir, her yerden çıkış), `/admin/audit` (süzme + sayfalama), `/admin/settings`; "Sistem" navigasyon bölümü (yönetici dışına gizli).
- ✅ 60 admin eylemi günlüğe adıyla bağlandı; kullanıcı/oturum/ayar eylemleri kesin sonuç yazar.
- ✅ Testler: `accounts.test.ts` (4) SQLite ve **gerçek PostgreSQL**'de (kiracı yalıtımı, atomik oturum sürümü, LIKE kaçışı, sayfalama); core +6; CI'a PostgreSQL adımı. Uçtan uca (üretim derlemesi): bkz. `docs/11` §1.
- 🐞 Testle bulunan: SQLite zaman damgası saniye hassasiyetindeydi (aynı saniyedeki denetim kayıtlarının sırası belirsiz); `audit_log.at` ms'ye alındı. Yönetici sayfalarında `redirect()` akış başladığından 200 dönüyordu (içerik sızmıyordu, doğrulandı); ara katmana 307 kuralı eklendi.
- 📋 Açık: davet e-postası, 2FA, Redis hız sınırı, eylem sonucu kaydı (roadmap P1).

### [2026-10-28] — Faz 8: Performans Bütçesi ve CI + Plan Dokümanları
- ✅ Plan: `docs/13-PLUGINS-AND-THEME-PACKAGES.md` (eklenti sistemi, tema paketleri, 20 maddelik panel eksikleri) ve `docs/14-MULTILINGUAL-PLAN.md` (L1–L5); `docs/12` içine yürütme sırası (F8–F14). Denetim bulguları: `/admin/plugins` sabit "Ready" envanteri, temalar kodda sabit 4 tema, revizyon/otomatik kayıt/kullanıcı yönetimi/ayarlar/denetim günlüğü yok, WP göçü simülasyon.
- ✅ Ölçüm ve iyileştirme: ziyaretçi JS 105,6 → **101,1 kB gzip**, rota/düzen kodu ~2 → **0,53 kB** (`next-themes` yalnızca yönetimde, düz `<a>` bağlantılar). Önce "0 KB" iddiasının gerçek anlamı ölçülüp dokümana yazıldı.
- ✅ `apps/cms/scripts/budget-lib.mjs` + `check-budget.mjs` + `perf-budget.json` (+5 test), `.github/workflows/ci.yml` (verify, pgvector, audit). Yerelde: `pnpm typecheck` 12/12, `pnpm test` 63 test, üretim derlemesi, bütçe geçti; sıkı bütçede başarısız olduğu doğrulandı.
- 📋 Açık: iş akışının GitHub'da ilk çalıştırması, Lighthouse CI, CSS bütçesi.

### [2026-10-28] — Faz 7g: Gerçek RAG (Arama Dizini)
- ✅ `@nexpress/core`: `chunker.ts` (başlık duyarlı parçalama, örtüşme, özet) ve `vector.ts` (yerel öznitelik-karma gömme, birim vektör, `f32:` kodlama); 11 test.
- ✅ `@nexpress/database`: `content_chunks` yeni sütunlar + idempotent geçiş + HNSW indeksi; `ChunkRepository` (pgvector `<=>` ve SQLite iç çarpım, görünürlük süzgeci, `similarContents`, `stats`).
- ✅ Yeni paket `@nexpress/rag`: sağlayıcılar (yerel, OpenAI uyumlu), `indexContent` / `reindexSite` / `searchCorpus` / `similarityReport`, `registerRagIndexing` kancası; 12 test (sağlayıcı sahte `fetch`; hizmet hem SQLite hem **gerçek pgvector** üzerinde geçici veritabanıyla).
- ✅ Uygulama: yayın kancası (`after()`), `/admin/seo` "Arama dizini" kartı + `reindexSearchAction` (admin), MCP `nexpress_search_corpus` vektör araması (+anahtar kelime yedeği), Co-Pilot kartı gerçek kanibalizasyon/benzer içerik; `.env.example` değişkenleri.
- ✅ Doğrulama (üretim derlemesi, SQLite): dizin yokken anahtar kelime yedeği; yeniden dizinleme 15 içerik / 23 parça; ikinci çalıştırma 15 değişmedi; başlık değişince otomatik dizinleme (arama 2 sn içinde yeni başlığı buldu); anonim yeniden dizinleme 307; Co-Pilot kartı mevcut içerikte gerçek benzer listesi, yeni içerikte yönlendirme; sahte OpenAI sunucusu: `Bearer`, `dimensions:1536`, model değişince tam yeniden gömme, `retrieval: semantic`.
- ⚠ Not: yerel model sözcüksel; kısa seed içeriğinde sıralama kaba (ör. "WordPress hız" sorgusunda ilk iki skor neredeyse eşit). Anlamsal kalite için gerçek bir gömme sağlayıcısı gerekir; test edilmedi (roadmap P0-4a).

### [2026-10-28] — Faz 7f: Medya Tamamlayıcıları ve Önbellek Düzeltmesi
- ✅ Odak noktası → `object-position` (`MediaFocalMap` renderer boyunca, `getPublicMediaFocal`); yönetimde canlı önizleme. Silme: `MediaAdminRepository.findUsage/deleteAsset`, `deleteMediaAssetAction` (yalnızca admin, kullanımdaysa reddeder, `force` ile siler, dosyaları temizler), `MediaDelete` arayüzü. Ön ısıtma (`prewarm.ts`, `after()`).
- 🐞 **Önbellek hatası bulundu ve düzeltildi:** yalnızca `revalidateTag` ile hızlı ardışık yazmalarda her ikinci okuma bayat kalıyordu (önceki "doğrulandı" notum tek yazmalık denemeye dayanıyordu). Anahtara site başına dönem sayacı eklendi; 10/10 odak güncellemesi ve 5/5 başlık güncellemesi anında yansıdı.
- ✅ Doğrulama (üretim derlemesi): ön ısıtma 6 türev ürettirdi; kullanımdaki görsel zorlamasız silinemedi (içerik başlığı döndü), zorla silinince dizin ve türev adresi 404, sayfa 200; anonim silme 307.

### [2026-10-28] — Faz 7e: Medya Hattı
- ✅ `@nexpress/core` `media.ts` (başvuru biçimi, güvenli türev adı ayrıştırma, genişlik basamakları, `<picture>` belirtimi; 6 test). `lib/media/{storage,process}.ts` (`sharp` 0.35, yerel disk), rotalar `POST /api/media/upload`, `GET /media/[id]/[file]`, `GET /media/[id]`. `sharp` `apps/cms` bağımlılığına eklendi.
- ✅ `ResponsiveImage` (`@nexpress/themes`): AVIF/WebP/JPG-PNG `<picture>`, srcset, sizes, width/height; blok görseli, katalog blokları ve öne çıkan görsel geçirildi; LCP seçimi (`findLcpImageId`).
- ✅ `/admin/media` yükleme formu ve küçük resimler.
- ✅ Doğrulama (üretim derlemesi): anonim yükleme 401, çapraz köken 403, sahte `.jpg` ve SVG 415; 3000×2000 JPEG -> türevler doğru boyut/biçim/başlık; tüm türevlerde EXIF yok (özgünde var, sunulmaz); EXIF yönü 6 → 200×400; saydam PNG yedek biçim PNG; izinsiz genişlik/biçim/yol gezinmesi 404; sayfa çıktısında `<picture>`, ilk görsel eager+yüksek öncelik, ikincisi lazy, dış görsel düz `<img>`.
- 📋 Açık: odak noktası, silme/temizlik, S3 sürücüsü, ön ısıtma (roadmap P0-3).

### [2026-10-28] — Faz 7d: Gerçek Bot Telemetrisi
- ✅ `@nexpress/core` `ai-bots.ts` (11 bot, kategori, `detectBot`, `hostMatchesSuffix`, `classifyRequestKind`; 3 test). `bot_daily_stats` tablosu (iki motor + `push.ts`), `BotStatsRepository` (atomik artış, `summarizeBotRows`; 3 test), `lib/bot-log.ts` (`after()` ile kayıt), `lib/bot-verify.ts` (FCrDNS + önbellek). 11 kayıt noktası.
- ✅ Pro `agentic-seo` kartı artık gerçek veriden beslenir (`bot-telemetry-card.tsx`); sabit sayılar ve "Demo verisi" rozeti bu kart için kaldırıldı. `bot-verifier.ts` çekirdeğe yönlendirildi.
- ✅ Doğrulama (üretim derlemesi): gönderilen bot istekleri sayaçlarla birebir eşleşti (GPTBot sayfa 3 / llms 1 / markdown 1 / mcp 1, ClaudeBot llms+sitemap, Googlebot); 5 insan isteği kaydedilmedi; sahte Googlebot `claimed`; panel kartı doğru render etti. Üretimde varsayılan `Admin123!` ile ilk yönetici oluşmaması da doğrulandı.
- 📋 Açık: IP aralığı doğrulaması, yol bazlı istatistik, saklama süresi (roadmap P0-2).

### [2026-10-28] — Faz 7c: Parçalı Site Haritası ve Karşılıklı hreflang
- ✅ `@nexpress/seo-core/src/sitemap.ts` (saf: bölme, indeks, urlset, dosya adı ayrıştırma, kaçış; 9 test), `SitemapRepository` (bloksuz okuma, iki motor), `lib/sitemap-source.ts`, rotalar `/sitemap.xml` (indeks) ve `/sitemaps/[file]`.
- ✅ Doğrulama (üretim derlemesi): indeks ve parçalar geçerli XML; ek çeviri `hreflang` ile karşılıklı bağlandı; `noindex` kayıt dışarıda; geçersiz/olmayan dosya adları 404; slug URL kodlaması (hata bulunup düzeltildi).
- ✅ Hata: bilinmeyen dil kökü (`/zzz`) ana sayfayı 200 ile basıyordu; artık 404.
- ✅ Seed, şema varsayılanları ve `push.ts` `supportedLocales = ["tr"]` yapıldı (AGENTS.md kural 8); taze veritabanında `/en` ve `/zzz` 404, `/tr` 200 doğrulandı. Eski veritabanları için SQL notu: `docs/02`.
- 📋 Açık: `ai-sitemap.json`/`llms*.txt` çok dilli bölümler (roadmap P0-5).

### [2026-10-28] — Faz 7b: İstekler Arası Önbellek
- ✅ `lib/cache.ts` (`cachedRead`, `invalidateSite`, `revalidatePath` sarmalayıcısı) ve `lib/public-data.ts`; `@nexpress/core` içine `stringifyWithDates` / `parseWithDates` (2 test).
- ✅ Ön yüz sayfaları, layout, sitemap, robots, `llms*.txt`, `ai-sitemap.json` ve markdown müzakeresi önbellekten okur; tüm `admin/actions.ts` yazmaları kiracı etiketini düşürür.
- ✅ Doğrulama (üretim derlemesi, SQLite): veritabanı doğrudan değiştirilince sayfa eski kaldı (önbellek isabeti); anonim eylem çağrısı 307; yetkili `patchContentAction` sonrası sayfa yeni başlığı gösterdi.
- ✅ İsteğe bağlı CDN HTML önbelleği (`PUBLIC_CACHE_SECONDS`), yol bazında doğrulandı. IndexNow yalnızca yayınlanmış kayıtta ve mutlak adresle tetiklenir (hata düzeltildi).
- 📋 Bulgu: ilk `next build` başarıyla tamamlandı; ön yüz rotaları 106 kB First Load JS (bkz. roadmap P0-6).

### [2026-10-28] — Faz 7: Güvenlik, Testler, Bölme ve SEO/GEO/Hız Temelleri
- ✅ **Kimlik doğrulama:** `users` tablosu (iki motor + `push.ts`), `UserRepository`, `scrypt` parola, HMAC imzalı `nx_session` çerezi, `/login`, middleware koruması, tüm admin server action'larında `requireUser` / `requireAdmin`, çıkış. Ayrıntı: `docs/11`.
- ✅ **Sırlar:** pazar yeri kimlik bilgileri AES-256-GCM ile şifreli; MCP yazma anahtarı `MCP_AGENT_KEY` (varsayılan yok, sabit zamanlı karşılaştırma); üretimde zayıf `AUTH_SECRET` reddedilir.
- ✅ **Testler:** `packages/core/test` (11) ve `packages/seo-core/test` (3), `pnpm test`.
- ✅ **Dürüstlük:** Pro paneldeki sabit veriler "Demo verisi" etiketli; ön yüzde yapay `5.0` puan ve örnek kategori/etiket kaldırıldı.
- ✅ **Dosya bölme (kural 7):** `renderer.tsx` 1109 → 102 satır (`blocks-marketing|content|layout.tsx`, `rich-block.tsx`, `column-layout.ts`, `block-context.ts`); `block-inspector.tsx` 1262 → 134 satır (altı sekme dosyası). Ön yüz DOM çıktısı bölme öncesi/sonrası birebir aynı doğrulandı.
- ✅ **SEO/GEO/hız:** güvenlik başlıkları, `/og` sosyal görsel rotası, gerçek IndexNow bildirimi + `/indexnow-key.txt`, istek başına veri tekilleştirme, `image_figure` boyut/öncelik öznitelikleri. Ayrıntı: `docs/04` §6.
- 📋 **Açık:** istekler arası önbellek, gerçek bot günlüğü, medya hattı, gerçek RAG, parçalı sitemap, migration, kalan büyük dosyalar. Bkz. `docs/12-ROADMAP.md`.

### [2026-10-23] — Faz 6: WordPress → NexPress 1-Dakika Göç Aracı (`@nexpress/wp-importer`)
- ✅ **`@nexpress/wp-importer` (`packages/wp-importer/src/index.ts`) oluşturuldu:**
  - `convertWpHtmlToNexPressBlocks`: Elementor (`[elementor-template]`), WPBakery (`[vc_row]`), Divi (`[et_pb_*]`) ve Gutenberg (`<!-- wp:* -->`) kısa kodlarını temizleyip saf 0-KB RSC `BlockNode[]` AST'ye, otomatik Answer-First `tldr` özetine ve `markdownCache` çıktısına dönüştürür.
  - `convertWpPostsToNexPress` & `executeWpMigrationToDatabase`: Eski WordPress URL'lerini otomatik 301 yönlendirme haritasıyla birlikte `siteId` kapsamındaki veritabanına aktarır.
- ✅ **Admin WordPress Göç Stüdyosu (`/admin/migration`) oluşturuldu:**
  - Tek tıkla örnek WordPress + Elementor + WooCommerce paketini veritabanına aktarma simülasyonu ve canlı HTML/Shortcode $\rightarrow$ 0-KB RSC AST dönüştürücü laboratuvarı eklendi.

### [2026-10-23] — Faz 5: Pro Eklentiler (`@nexpress-pro/*`) ve Agentic Web Uç Noktaları
- ✅ **`@nexpress-pro/agentic-seo` (`plugins-pro/agentic-seo-pro`) oluşturuldu:**
  - `src/bot-verifier.ts`: GPTBot, ClaudeBot, PerplexityBot ve Google-Extended için Reverse-DNS ve User-Agent doğrulayıcı.
  - `src/mcp-server.ts`: JSON-RPC 2.0 WebMCP sunucusu (`nexpress_search_corpus`, `nexpress_fetch_markdown`, `nexpress_ask_site_dna`, `nexpress_create_lead`).
  - `src/index.tsx`: `seo:buildSchemaGraph`, `llms:buildTxt` ve `mcp:handleRequest` kancaları ile `dashboard.overview.cards` ve `admin.sidebar.nav` yuvalarına bağlantı (`registerAgenticSeoProPlugin`).
- ✅ **`@nexpress-pro/content-ops` (`plugins-pro/content-ops-pro`) oluşturuldu:**
  - `src/guardrails.ts`: `DEFAULT_FORBIDDEN_PHRASES` ve `auditContentGuardrails` ile kayıt anında (`content:beforeSave`) AI klişe ve `tldr` denetimi.
  - `src/question-mining.ts`: 8 kaynaklı Soru Madenciliği (`gsc_pos_4_20`, `serper_paa`, `mcp_query_log`) ve `Cosine > 0.92` kümeleme modelleri.
  - `src/index.tsx`: Editör sağ çekmecesi (`editor.sidebar.tabs`) Co-Pilot bileşeni ve ana panel soru madenciliği kartı (`registerContentOpsProPlugin`).
- ✅ **Agentic Web Keşif ve Protokol Rotaları (`apps/cms/src/app/`) eklendi:**
  - `/llms-full.txt`: 4-Katmanlı tam Markdown bilgi bankası beslemesi.
  - `/ai-sitemap.json`: `importanceScore` (1-10), `tldr` ve `entityGraphLinks` içeren yapılandırılmış AI site haritası.
  - `/api/mcp` & `/.well-known/mcp.json`: JSON-RPC 2.0 WebMCP sunucusu ve keşif manifestosu.

### [2026-10-23] — Faz 1, 2, 3 ve 4 Çekirdek Paketlerin ve `apps/cms` Uygulamasının Kodlanması
- ✅ **`@nexpress/core` (`packages/core`) oluşturuldu.**
- ✅ **`@nexpress/database` (`packages/database`) oluşturuldu ve hem PostgreSQL (`pgvector`) hem SQLite (`LibSQL`) tohumlandı.**
- ✅ **`@nexpress/themes` (`packages/themes`) ve `@nexpress/seo-core` (`packages/seo-core`) oluşturuldu.**
- ✅ **`@nexpress/cms` (`apps/cms` — Next.js 15 App Router) oluşturuldu.**
- ✅ **Faz 5 — Ağaç yapılı kategoriler, ayrıştırılmış sayfa/blog yönetimi, görsel stüdyo ve çekirdek SEO motoru tamamlandı:**
  - `taxonomies` şemasına `parentId`, `imageUrl` ve `sortOrder` eklendi; `/admin/taxonomies` altında sınırsız alt/üst kırılımlı Kategori Ağacı, görsel seçici, düzenleme ve güvenli silme (alt kategorileri üst ebeveyne taşıma) devreye alındı.
  - `/admin/pages` (Sayfalar) ve `/admin/posts` (Blog Yazıları) ekranları oluşturuldu: durum/kategori/etiket filtreleme, **Satır İçi Hızlı Düzenleme (Inline Quick Edit)**, **Toplu İşlem Çubuğu (Bulk Edit: Yayına Al, Taslağa Çek, Kategori/Etiket Ata, Sil)** ve Çoğaltma eklendi.
  - Görsel editör bağlam kilitli hale getirildi ve yerleşim stüdyosuna yükseltildi: iç içe `section` / `columns` / `column`, sol yapı gezgini, geri al/yinele ve Genel / Stil / Gelişmiş denetçi.
  - `/admin/themes` ekranı tema özelleştirici ve çekirdek SEO motoru stüdyosuna dönüştürüldü.
  - `@nexpress/seo-core` içine 17-noktalı `analyzeSeo()`, `resolveSeoMeta()`, `deriveAutoSchemaNodes()` ve `slugHistory` tabanlı otomatik 301 yönlendirme motoru (`resolveContentBySlug`) gömüldü.
