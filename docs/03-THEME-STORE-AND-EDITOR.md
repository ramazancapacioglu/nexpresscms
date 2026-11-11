# 03 — Tema Motoru, Tema Mağazası (Theme Store), Görsel Editör ve Admin UX

Yüklenebilir tema bir kod klasörü değildir. Paket `.nxtheme` veri dosyasıdır (jeton, üst/alt şerit, başlangıç sayfası, kapsamlı CSS). Resmi temaların vitrin demosu paketten ayrıdır: tema etkinleşince gelmez, mağazadaki **Demo veriyi aktar** ile düzenlenebilir sayfa ve yazı olarak eklenir. Bir modele tema, kütüphane bölümü veya şablon ürettirmek için sözleşme `docs/23-THEME-AND-DESIGN-AUTHORING.md` dosyasıdır. Bu belgedeki klasör anlatımı resmi tema kodunun tarihi tarifidir; yeni tema yazarken 23 esas alınır.

## 1. Tema Motoru ve Tema Mağazası (`@nexpress/themes` & `themes/*`)

WordPress'te tema değiştirmek genellikle tüm sayfa tasarımlarını ve kısa kodları (shortcodes) bozar. NexPress'te **Veri ile Görsel Tema birbirinden tamamen ayrılmıştır:**

```mermaid
flowchart LR
    subgraph ThemeStore [Admin: Tema Mağazası (/admin/themes)]
        T1["Corporate Aurora (Kurumsal / B2B)"]
        T2["Commerce Velocity (E-Ticaret / Katalog)"]
        T3["Editorial Pulse (Haber / Bilgi Bankası)"]
        T4["Ink Grid (Siyah ürün vitrini)"]
        T5["Crimson ERP & Muhasebe (Kurumsal ERP & Yazılım)"]
        T6["Yazılım Firması Teması (cam şerit, siyah vitrin, mega menü, dizin footer, sağ form)"]
    end

    subgraph ThemeContract [Tema Paketi Yapısı (theme.json)]
        Tokens["1. Design Tokens (Renk, Font, Radius, Gölgeler)"]
        Skins["2. Block Skins (Hero, Kart, Tablo, SSS Varyantları)"]
        Presets["3. Header / Footer / Sayfa Şablonları"]
    end

    subgraph Renderer [100/100 RSC Tema Motoru]
        CSSVars["Dinamik CSS Değişkenleri (:root)"]
        BlockMap["Aktif Temanın RSC Bileşen Haritası"]
    end

    T1 & T2 & T3 & T4 & T5 --> Tokens & Skins & Presets
    Tokens --> CSSVars
    Skins & Presets --> BlockMap
```

### 1.1. Bir Tema Paketi Nelerden Oluşur? (`themes/<theme-slug>/`)
Her tema kendi klasöründe bağımsız bir pakettir ve şu 4 bileşeni içerir:
1. **`theme.json` (Manifesto):** Tema adı, açıklaması, versiyonu, ekran görüntüleri, önerilen `siteProfile` (`corporate` | `ecommerce` | `news`) ve renk paleti önizlemeleri.
2. **`tokens.ts` (Tasarım Tokenları):**
   - Tipografi (Başlık ve gövde font ailesi, akışkan font ölçeği).
   - Renk Sistemi (`primary`, `secondary`, `accent`, `surface`, `muted` — Açık ve Koyu tema karşılıkları).
   - Geometri (`borderRadius`, `containerWidth`, `sectionSpacing`, `cardShadow`).
3. **`layouts/` (Varsayılan Header, Footer ve Sayfa Şablonları):**
   - Temanın kendine özgü 3 katmanlı Header ve Footer varsayılan dizilimi (kullanıcı isterse Görsel Layout Stüdyosunda özelleştirebilir).
4. **`blocks/` (Blok Görünüm Varyantları — Block Skinning):**
   - İçerik verisi (Örn: `HeroBlock`, `PricingBlock`, `ProductGridBlock`, `FaqBlock`) sabit kalır; ancak tema değiştiğinde blokların görsel sunumu anında yeni temanın estetiğine bürünür.

### 1.2. Admin Tema Mağazası (`/admin/themes`) Deneyimi
- **Canlı Önizleme (Live Preview):** Mağazadaki **Önizle** yeni sekmede `?nx_preview=<tema>` açar. Oturum gerekir; kayıt yazılmaz. Resmi tema manifestodan, yüklenen tema satırından okunur. Tek dilde adres ön eksizdir (`/?nx_preview=`). Yazılım Firması açılmadan önce menü, üst şerit, alt bilgi ve yerleşim saklanır. Başka temaya geçince bu kabuk geri gelir; renkler yeni temanın jetonudur. Saklanan kabuk yoksa şerit sade düzene, alt bilgi sade telife döner; menü öğeleri ve sayfalar durur. Veri kümesini yeniden derlemek o anki menüyü saklar.
- **Tek Tıkla Etkinleştirme & Token Özelleştirici:** Temayı etkinleştirdikten sonra sağ çekmeceden temanın ana rengini, font ikilisini ve köşe yuvarlaklığını kod yazmadan değiştirebilir.

---

## 2. Çift Modlu 0-KB RSC Editör

Sayfa yerleşimi NexPress blok ağacıdır. Metin alanlarının motoru **TipTap**'tir (`props.html` + düz `props.text`). TipTap ön yüze çıkmaz; ön yüz RSC kalır.

### Mod A: Doküman
- Yazılar (`post`), teknik rehberler (`kb_tech`) ve sorular (`ai_prompt`) için.
- Başlık, paragraf, div, kısa yanıt ve alıntı TipTap ile düzenlenir. İki ayrı araç çubuğu yerine seçili bloğun üstündeki **tek birleşik kayan araç çubuğu** (`FloatingToolbar` + `ToolbarProseAndAi`) üzerinden etiket/başlık dönüşümü (`P | H1 | H2 | H3 | H4 | Div`), hizalama, zengin metin biçimleri (kalın, italik, altı çizili, üstü çizili, kod, liste, biçimi temizle), satır içi bağlantı açılır penceresi (iç/dış adres, yeni sekme, dofollow/nofollow) ve **`✨ AI Yaz / Düzenle`** açılır penceresi (`AiComposePanel`) tek noktadan yönetilir.
- Answer-First özet, adım adım prosedür, ürün kartı, SSS ve karşılaştırma blokları aynı tuvalde durur.

### Mod B: Görsel kanvas
- Ana sayfa, hizmet ve kampanya sayfaları için.
- Satır ve sütun oranları, masaüstü / tablet / mobil stil, kenarlık ve boşluk.
- Hazır bölüm kütüphanesi (180+ öğe; kartlarda bloğun gerçek çıktısı küçültülmüş önizleme olarak görünür) Türkçe kategorilere ayrılır (İçerik: metin, vitrin, sayfa başlığı, akordeon, konum, abonelik formu, yorumlar, sayaç, liste, kişiler, ürün, kartlar, iletişim formu, yazılar, fiyat, çağrı, zaman çizelgesi, veri tablosu, karşılaştırma, restoran menüsü, sekmeler; Medya: görsel & metin, galeri, video & metin, logolar; Gelişmiş: şablon yuvaları, şema, benim tasarımlarım). Tam sayfa paketleri sayfa türüne göre süzülür (Ana sayfa, Hakkında, İletişim, Hizmetler, Portfolyo, Ekip, Galeri). Görünüm ve cihaz seçimi SEO skorunun yanındadır. Yeni sayfa ve yazı boş bir paragrafla açılır.
- **Ink Grid** siyah, tam genişlik bir ürün vitrinidir. Etkinleşince ana sayfa örnek vitrini basar. Örnek sayfalar: `/tr/vitrin`, `/tr/urun`, `/tr/gelistiriciler`, `/tr/kurumsal`, `/tr/dokuman`, `/tr/fiyatlandirma`, `/tr/ornek-calismalar`. Bu sayfalar belge başlığı olmadan tuval olarak açılır.
- Kütüphane öğeleri bilgi kutusu, ikonlu liste, sekmeler, akordeon, galeri, slayt, form, yazı ızgarası, ürün şeridi, geri sayım ve tablo gibi bölümleri kapsar. Ön yüz bunları sunucu bileşeni olarak basar.
- **Yapışkan HTML Çapa Gezgini (`anchor_nav`):** Kategori ve ürün vitrini sayfalarında hero'nun hemen altına yerleşir. Sayfa kaydırıldıkça ekranda `sticky top-16 z-30` olarak sabitlenir; `Genel Bakış #genel-bakis`, `Ürünler & Çözümler #urunler`, `Detaylı İncele #detayli-incele`, `Sıkça Sorulan Sorular #sss`, `Referanslar #referanslar`, `Teklif Formu #teklif-formu` bağlantılarına tıklandığında `scroll-behavior: smooth` ile yumuşak kaydırır ve `scroll-mt-32` ile sabit başlığın altına temizce oturur.
- **Tek Tıkla Çapa Kimliği (#id) ve Otomatik Haritalama:** Bölüm ve satır blokları denetçisinde `#id` önayarları (`genel-bakis`, `urunler`, `sss` vb.) hazır çiplerle sunulur; `anchor_nav` denetçisindeki **"⚡ Sayfadaki Bölümlerden Çapaları Otomatik Oluştur"** düğmesi sayfadaki tüm bölümleri tarayıp otomatik olarak sekme listesine bağlar. Ön yüzde sıfır istemci JS (0-KB RSC) çalışır.

---

## 3. Header, menü, footer ve kenar çubuğu

Bu dört parça sayfa bloklarından ayrıdır. Kayıt `navigation_layouts` satırındadır (`siteId` + `locale`). Şablon seçmek formu doldurur; yayın için Kaydet gerekir.

- **Header** (`/admin/appearance/header`): sürükle-bırak **yerleşim kurucusu** (`header-builder.tsx`): üç şerit × sol/orta/sağ bölge, masaüstü/mobil geçişi, her öğenin ayarı sağ panelde. Öğeler şeritler arasında sürüklenir, bölgedeki + ile eklenir, okla sıralanır. Sitede varsayılan bir header şablonu (Şablonlar) açıksa sayfa bunu uyarır; ziyaretçiye o şablon gösterilir. Ayrıntı: `docs/08`. Eski anlatım: üst duyuru, yapışkan ana şerit, çağrı ve alt şerit. Her şeridin öğeleri sol / orta / sağ bölgelerine dizilir (`resolveHeaderZones`); eski kimlikler (`mega_menu`, `cta_button`, `contact_info`) kanonik öğeye çevrilir. Boş dizi varsayılan düzene düşer. Ana şeridin ayrı mobil dizisi vardır (`mobileLeftWidgets` ve kardeşleri). Yazılmazsa logo solda, diğer öğeler sağda türetilir; menü öğesi küçük ekranda `<details>` düğmesi olur. Üst ve alt şerit de aynı üç alanı taşıyabilir; yazılırsa küçük ekran o diziyi basar, bağlantı kalkarsa alt şerit telefonda gizlenir. Tasarım kütüphanesi kategorileri: Sade, Duyuru, Vitrin, Katalog, Modern (6 yeni header, hepsinde mobil dizi). Her hazır header'ın mobil dizisi kartta görünür; seçilince forma alınmadan düzenlenir. JSON aktarımı `docs/08-AI-CHROME-SPEC.md` sözleşmesidir.
- **Sayfa görünümü** (editör › Sayfa Ayarları › Görünüm): bu sayfaya özel header (site ayarı/şeffaf/gizli), footer gizleme, genişlik, kenar çubuğu, boşluk ve başlık gizleme; `schemaAttributes._page`.
- **Yazı tipi** (Özelleştirici › Yazı Tipi): katalogdan başlık/gövde/kod yazı tipi; dosyalar sunucuya indirilip `/api/fonts/{dosya}` ile sunulur (`docs/11` §4). Mobil menü yandan açılan paneldir (`.nx-offcanvas`, popover).
- **Menü** (`/admin/appearance/menus`): dil başına birden çok kayıt. Biri header’da basılır (`header`). Diğerleri footer sütunundaki ve kenar çubuğundaki `nav_menu` bileşeninde seçilir. Ağaçta onay kutusuyla çoklu silme ve girinti yapılır. Mega menüde alt öğe varsa panelin altında listelenir; torun varsa sütun olur.
- **Footer** (`/admin/appearance/footer`): kolonlar, bülten ve telif. Tasarım kütüphanesi kategorileri: Sade, Kolon, Bülten, Vitrin, Modern (5 yeni footer; çağrı bandı, güven rozetleri, işletme kartı).
- **Kenar çubuğu** (`/admin/appearance/sidebar`): içeriğin solu veya sağı. Örnek şablon Doküman kenarı. Kapalıyken ön yüzde yer kaplamaz.

---

## 4. Kurumsal Admin Paneli UI/UX Standartları (Attio CRM & `shadcn/ui` Precision)

- **Attio CRM Tasarım Dili:** Yönetim paneli (`/admin`), klasik yapay zeka şablonlarından (kalın gradyanlar, emoji rozetler ve kaba boşluklar) tamamen arındırılmış olup **Attio CRM** kalitesinde ultra-keskin bir mühendislik arayüzü sunar:
  - **Yüzey Hiyerarşisi:** `#FBFBFB` çalışma alanı, `#F4F5F6` sol kenar çubuğu (`236px`) ve `#E6E7EA` (`dark:#23262E`) `1px` ince hücre çizgileri (`divide-x divide-y`).
  - **44px (`h-11`) Breadcrumb & Görünüm Çubuğu:** Üst barda aktif çalışma alanı yolu (`NexPress / Objects / Contents Studio`), veritabanı/kiracı telemetrisi ve `28px` (`h-7`) kompakt aksiyon butonları yer alır.
  - **Spreadsheet Kayıt Tablosu (`Record Grid`):** Sütun başlıklarında veri tipi sembolleri (`Aa`, `🔗`, `◎`, `@`, `#`), `6px` durum noktaları (`●`) ve `tabular-nums` metrik hizalaması kullanılır.
- **Global Komut Paleti (`Cmd+K` / `Ctrl+K`):** Paneldeki herhangi bir nesneye, tema tokenına, göç aracına veya Agentic beslemeye (`?format=md`, `/llms-full.txt`, `/api/mcp`) anında ulaşım.
- **Yapışkan (Sticky) ve 3 Sekmeli Sağ Denetçi Çekmecesi (`sticky top-12 max-h-[calc(100vh-56px)] overflow-y-auto`):**
  - Uzun sayfalarda veya blog makalelerinde aşağı kaydırırken sağ kenar çubuğu ekrana yapışık kalır; kullanıcı tekrar yukarı çıkmak zorunda kalmaz.
  - **Sekme 1 (`Belge & Yayın`):** Taslak (`draft`), Yayında (`published`), Zamanlanmış (`scheduled`) ve Kısıtlı/Şifreli (`restricted`) yayınlama; Kategori & Etiket seçimi (ve satır içi hızlı oluşturma); Öne Çıkan Görsel (`featuredImage`) & Görsel SEO (`altText`, `titleText`, `caption`, `fetchPriority`); Yorum/İnceleme/Sosyal Paylaşım anahtarları.
  - **Sekme 2 (`SEO & GEO`):** Canlı Google SERP önizlemesi, `metaTitle`, `metaDescription`, `canonicalUrl`, `noindex`, `Schema @type`, `AI Önem Puanı (1-10)` ve `<PluginSlot name="editor.sidebar.tabs" />`.
  - **Sekme 3 (`Blok & Stil`):**
    - **`Genel`:** Blok içeriği, sütun oranı (`12`, `6+6`, `4+8`, `8+4`, `4+4+4`, `3+6+3`, `3+3+3+3`), tablo satırları, liste maddeleri, medya seçici.
    - **`Stil (CSS)`:** Masaüstü / Tablet / Mobil (`DeviceKey`) duyarlı `BlockStyle` kontrolleri; arka plan rengi/gradyanı, metin rengi, iç boşluk (`padding`), dış boşluk (`margin`), kenarlık (`border`), köşe yuvarlaklığı (`borderRadius`) ve gölge (`boxShadow`). Tüm bu stiller `compileBlockStylesToCss(blocks)` ile sıfır-JS saf CSS olarak derlenir.
    - **`Gelişmiş`:** HTML Çapa ID (`anchorId`), Cihaz Görünürlüğü (`hideOn`: Masaüstü/Tablet/Mobil gizleme) ve kapsamlı özel CSS (`selector { ... }`).

---

## 7. Bağlam Kilitli Sayfa (`/admin/pages`) ve Blog (`/admin/posts`) Yönetimi

1. **Ayrıştırılmış Yönetim Ekranları:**
   - **Sayfalar (`/admin/pages`)** yalnızca `type === 'page'` kayıtlarını, **Blog Yazıları (`/admin/posts`)** ise blog/makale kayıtlarını listeler (`product` şimdilik yalnızca veritabanı şemasında korunur).
   - Her iki ekranda da durum/kategori/etiket filtreleme, **Satır İçi Hızlı Düzenleme (Inline Quick Edit)**, **Toplu İşlem Çubuğu (Bulk Publish, Draft, Kategori/Etiket Atama, Toplu Silme)** ve **Çoğaltma (Duplicate)** bulunur.
2. **Bağlam Kilitli (Context-Locked) Editör (`/admin/contents`):**
   - Editör üst barında karışık tür değiştiriciler veya "+ Yeni Sayfa / + Yeni Blog" düğmeleri yer almaz; kullanıcı Sayfalardan geldiyse editör **Sayfa Düzenleyici** (`← Sayfalara Dön`), Bloglardan geldiyse **Blog Yazısı Düzenleyici** (`← Blog Yazılarına Dön`) olarak kilitlenir.
3. **Tema özelleştirici (`/admin/themes`):**
   - 6 adet tek tıkla Global Renk Paleti (`GLOBAL_COLOR_PALETTES`), 4 adet Global Tipografi Çifti (`GLOBAL_TYPOGRAPHY_PAIRS`), kapsayıcı/makale genişliği, buton geometrisi, yapışkan header/breadcrumb kontrolleri ve canlı önizleme kanvası içerir.

## Ek (2026-11-02): Medya kitaplığı, medya seçici ve elle meta alanları

- **Medya kitaplığı (`/admin/media`)**: ızgara/liste görünümü, arama (ad, başlık, alt metin, alt yazı, açıklama — Türkçe i/ı/İ/I farkı gözetmez), tür (görsel/belge/video/ses), sorun (alt metni eksik, SEO < 80) ve sıralama süzgeçleri, klasör ağacı (korundu), toplu taşıma, ayrıntı paneli (başlık, alt metin, alt yazı, açıklama, odak noktası, canlı SEO denetimi, adres kopyalama). Tarayıcıda "sahte URL ile medya ekleme" formu kaldırıldı; her kayıt gerçek bir yüklemedir.
- **Yükleme**: görsel (JPEG/PNG/WebP/AVIF, 12 MB; EXIF atılır), PDF, MP4/WebM video, MP3/OGG/WAV ses (40 MB). Tür **dosya içeriğinden** tanınır (`sniffFileMime`; uzantıya güvenilmez, AVIF görsel kalır). Görsel olmayanlar `/media/{id}/{seo-adı}.{uzantı}` ile sunulur: tür kayıttan gelir, `nosniff`, `Range` (206/416) desteği, değişmez önbellek.
- **Medya seçici (`MediaPickerDialog`)**: editördeki öne çıkan görsel, görsel bloğu ve yeni **Dosya / Video / Ses** bloğu (`media_file`) aynı pencereyi kullanır: kitaplık + aynı pencerede yükleme + seçilen dosyanın başlık / alt metin / alt yazı / açıklama alanları. "Kaydet ve ekle" önce bilgileri kitaplığa yazar, sonra bloğa aktarır. Görsel bloğunda `title` alanı da girilebilir.
- **Elle meta başlık ve açıklama**: başlığın hemen altındaki "Arama sonucu" şeridi (ve SEO sekmesi) alanları gösterir. Boş = **Otomatik** (başlık / TL;DR), dolu = **Elle**; elle yazılan değer başlık değişince kendiliğinden değişmez ("Otomatiğe dön" düğmesi). Eskiden kayıt sırasında başlık meta başlığa kopyalanıyordu; başlıkla aynı olan eski kayıtlar otomatik sayılır.

## Ek (2026-11-02): Panel düzeni, menü ağacı, mega menü, dinamik içerik, AI yazım

- **Kenar çubuğu:** daraltılabilir gruplar (Genel, İçerik, Etkileşim & Satış, Görünüm, Tasarım, SEO, Sistem). **Tasarım** tek gruptur ve tek sekme çubuğunu paylaşır: Temalar, Özelleştirici, Header, Footer, Menüler, Kenar çubuğu, Şablonlar, Kütüphane & AI (eski adıyla tasarım stüdyosu; `/admin/design-library` buraya yönlenir). **SEO** motor & dizin, webmaster & analitik, site denetimi, yönlendirmeler & 404. Her ailenin sekme çubuğu yalnız kendi sayfalarını gösterir. İçerik editörü (`/admin/contents`) tasarım stüdyosundan ayrıdır. Mağaza kuponu `Kupon ve indirim` adındadır; vitrin fırsatları `Kampanyalar` sayfasındadır. Ortam anahtarları Sistem → Entegrasyonlar; Search Console formları SEO → Webmaster.
- **Menü ağacı (`/admin/appearance/menus`):** soldan WordPress gibi **sayfa / yazı / kategori / etiket / ürün listesinde ara-işaretle-ekle** ya da özel bağlantı; ağaçta yukarı/aşağı, girinti/girinti azalt (klavyeyle de), en çok **3 düzey**, 200 öğe. Öğeler **kimlikle** bağlanır (`source: {kind, refId}`): slug değişince bağlantı kendiliğinden güncellenir, hedef silinir/taslağa dönerse öğe yayında **gizlenir** ve panelde uyarı gösterilir. Kayıtta sunucu temizler (`sanitizeMenu`): `javascript:`/`data:` adresleri reddedilir. Menü yalnızca `tr` dil kaydına yazılır (dil başına menü yok).
- **Mega menü:** kök öğede açılır; kaynak = alt öğelerden (sütun = alt öğe, torunlar bağlantı) ya da elle kartlar; 1–4 sütun, dar/geniş/tam genişlik, isteğe bağlı tanıtım şeridi. CSS ile (hover + klavye odağı), istemci JS'i yok. Mobilde `<details>` ile iç içe liste.
- **Ziyaretçi header/footer:** `components/public/site-chrome.tsx`. Geliştirme artıkları kaldırıldı (NX rozeti, "Tema: …", "Tema değiştir", varsayılan "Yönetim" düğmesi, sayfada tür/şema rozeti; "Editörde düzenle" yalnızca oturumlu editöre). Logo/CTA/hizalama `customizer.header` ayarından; CTA `/admin` adresine verilemez.
- **Kategori/etiket arşivi:** `/{locale}/kategori/{slug}`, `/{locale}/etiket/{slug}` (yalnızca herkese açık, dizine açık yazı/sayfa; boş arşiv `noindex`). Sitemap'e henüz eklenmedi.
- **Dinamik liste bloğu (`dynamic_list`):** kaynak (yazı/sayfa/ürün), kategori, etiket, sıralama, adet (1–24), kart/liste, görsel/özet/tarih, "bu sayfayı çıkar" (ilgili içerik). Ziyaretçiye her istekte güncel veriden çizilir (`loadDynamicData`, sayfada blok yoksa veritabanına dokunmaz); Markdown önbelleğine ve `?format=md`'ye **girmez**. Saf mantık: `selectDynamicItems` (testli).
- **AI ile yaz / düzenle (Pro `ai-compose`):** paragraf/başlık bloğu seçiliyken Blok sekmesinde: yaz, yeniden yaz, genişlet, kısalt, düzelt. **Düzen:** model yalnızca öneri üretir (önizleme), editör "Bloğa uygula" der, "Geri al" vardır, kaydetme ayrıdır; çıktı düz metindir (HTML/Markdown/bağlantı atılır); marka yasak kalıpları kontrol edilip bir kez otomatik düzeltilir; kaynakta olmayan rakamlar ve doğrulanması gereken iddialar (yüzde, yıl, "en iyi/tek/lider"…) işaretlenir; 5 dakikada 20 istek. OpenAI anahtarı gerekir.

## Ek (2026-11-03): Tema oluşturucu (şablonlar), şema tabanlı blok denetçisi, şema kütüphanesi

- **Her blok düzenlenebilir:** denetçi artık alanlarını `buildEditorFields` (çekirdek, saf) ile üretir: AI kataloğundaki alan sözleşmesi (etiket, sınır, tür) + katalogda olmayan blokların mevcut değerlerinden çıkarım. Metin, uzun metin, bağlantı (sayfa/yazı/kategori/etiket/ürün **arayıp seçme**), görsel (medya kitaplığı), seçenek, sayı, onay kutusu, renk, metin listesi, tablo ve **tekrarlayan öğe listeleri** (ekle/sil/sırala, iç içe) desteklenir. Yeni blok türü eklemek ek arayüz kodu gerektirmez. Kendi özel arayüzü olan bloklar (hero, görsel, sütunlar, medya dosyası, dinamik liste, şema kartı) korunur.
- **Şablon sistemi (`/admin/appearance/templates`):** 9 tür — header, footer, kenar çubuğu, sayfa, blog yazısı, kategori, etiket, ürün, mağaza. Şablon `type: "template"` bir içeriktir: mevcut stüdyo, revizyon, otomatik kayıt ve kütüphane aynen kullanılır; **her zaman taslaktır** (depo düzeyinde zorlanır) ve genel listelerden, site haritasından, llms.txt'ten, aramadan **hiç görünmez** (`listContents` varsayılan olarak şablonu dışlar). 15 hazır şablon (`STARTER_TEMPLATES`) → "Hazır şablondan oluştur" → stüdyoda düzenle → "Varsayılan yap" (türde tek; zorunlu yuvası eksik şablon varsayılan yapılamaz).
- **Yuva blokları (`tpl_*`):** başlık, içerik, öne çıkan görsel, bilgi satırı, breadcrumb, arşiv başlığı, arşiv listesi + sayfalama, site logosu, menü, telif. Yayında gerçek veriyle, stüdyoda örnek içerikle çizilir (RSC, istemci JS'i yok). Şablon doğrulaması (`validateTemplate`): sayfa/yazı şablonunda tam bir içerik yuvası, arşivde tam bir arşiv listesi, header/footer/kenar çubuğunda içerik yuvası yasak, tek h1 uyarısı.
- **Atama sırası:** içerikte/terimde seçilen şablon → türün varsayılanı → yerleşik görünüm. Sayfa/yazı düzenlerken *Yayın & Kat.* sekmesinde "Görünüm şablonu"; kategori/etiket düzenlerken "Arşiv sayfası şablonu"; `none` = yerleşik görünüm. Tam genişlik tuval sayfalarında şablon uygulanmaz. Header/footer/kenar çubuğu varsayılan şablonu varsa yerleşik olanın yerine geçer.
- **İçerik SEO sekmesi alt sekmelere ayrıldı:** Genel (odak, SERP, meta, TL;DR, AI), Şema (tür, gelişmiş şema, algılanan düğümler), Sosyal, Gelişmiş (dizinleme, canonical), Denetim.
- **Şema kütüphanesi (kütüphane › Şema):** SoftwareApplication, Kampanya (Offer), QAPage ve TechArticle için hazır tasarımlı **şema kartı** (`schema_card`). Kart, SEO › Şema sekmesindeki `richSchema` verisini gösterir ve düzenler (tek kaynak): bilgi bir yerde girilir, hem sayfada hem JSON-LD'de görünür. Eklenirken şema türü ve boş şema verisi hazır başlangıç değerleriyle dolar; veri eksikse (ya da kampanya bittiyse) kart ziyaretçiye çizilmez, sahte değer yoktur.
- **Şablon paketi (2026-11-03):** `Görünüm → Şablonlar`'da "Tümünü dışa aktar", şablon başına "Dışa aktar" ve "Paketi içe aktar" (yalnızca yönetici; `GET /api/admin/templates/export`, `POST /api/admin/templates/import`). Paket `.nxtemplates.json` = `{ format: "nexpress-templates", version, templates[], checksum }`: **yalnızca veri**, kod yok. Dışa aktarmada yerel medya başvuruları (`/media/…`) boşaltılır (başka sitede çalışmaz) ve sayısı bildirilir. İçe aktarmada her şey yeniden doğrulanır (`parseTemplatePackage`, testli): ≤ 2 MB, ≤ 100 şablon, ≤ 600 blok / 12 düzey, yalnızca bilinen blok türleri ve türler, `javascript:`/`data:` adresleri ve **özel CSS** (`customCss`, `@import`, `expression()`, güvensiz `url()`) kaldırılır, özet (checksum) uyuşmazlığı reddedilir; geçersiz şablon uyarıyla atlanır. İçe aktarılan şablon yeni kimlikli, **taslak ve varsayılan değildir**; aynı ada `(2)` eki gelir; mevcut şablonlara dokunulmaz. Denetim: `template.export`, `template.import`.
- **Ürün ve mağaza şablonları (2026-11-03):** `tpl_product_buy` (fiyat, indirim, stok, varyasyon, adet, **sepete ekle** — sunucu eylemiyle, istemci JS'i yok) ve `tpl_cart_link` yuvaları. **Mağaza listesi** (`/magaza`) `shop` şablonuyla (arşiv listesi yuvası zorunlu; ürünler fiyatlı kartlardır), **mağaza ürün sayfası** (`/magaza/{ürün}`) `product` şablonuyla çizilir; `type: "product"` içerik sayfaları da aynı türü kullanır. **Güvenlik ağı:** ürün şablonunda satın alma kutusu ya da mağaza şablonunda arşiv listesi yoksa ürün alınamayacağı/listelenemeyeceği için ilgili ticaret sayfası yerleşik görünümde kalır (stüdyoda uyarı gösterilir). Hazır şablonlar: Ürün — klasik, Ürün — benzer ürünlerle (dinamik "benzer ürünler"), Mağaza — ürün ızgarası, Mağaza — liste. Sepet/ödeme/teşekkür sayfaları yerleşiktir.

## Editör: kitaplık, sürükle-bırak, önizleme (2026-11-03)
- **Üst çubuk:** *Önizle* son kaydedilmiş taslağı imzalı, 1 günlük bağlantıyla yeni sekmede açar (`createDraftPreviewLinkAction`); *Göster* gerçek yayın adresini (`/{locale}/{slug}`) açar ve yalnızca yayındayken etkindir.
- **Kitaplık (`+ Blok & Satır`):** `packages/editor/src/block-catalog.ts` — `BLOCK_CATALOG` (kategorili bloklar), `ROW_TEMPLATES` + `buildRow` (satır düzenleri), `searchCatalog`. Yeni blok eklemek için buraya bir giriş yazılır; props, ilgili blok oluşturucusunun okuduğu alanlarla uyumlu olmalıdır.
- **Kampanya Vitrini Bloğu (`campaign_showcase` — 2026-11-04):** İstediğimiz sayfada (Ana Sayfa, Açılış Sayfası, Ürün, vb.) kampanyaları listelemek için 4 farklı yerleşim modu sunar: `carousel` (saf CSS snap-scroll atlıkarınca, 0-KB istemci JS), `grid` (2–4 sütun), `spotlight` (büyük öne çıkan kart, sayaç ve doğrudan WhatsApp/Telefon butonları), `ticker` (indirim şeridi). `CampaignShowcaseFields` denetçisi ile tüm detaylar görsel olarak yönetilir.
- **Sürükle-bırak:** `apps/cms/src/components/admin/editor/dnd.tsx` (`EditorDnd`, `DropZone`); kitaplık parçası (`block-inserter.tsx`), tuval başlık çubukları (`canvas-block.tsx`) ve gezgin (`block-outline.tsx`) kaynaktır. Bırakma `handleDropBlock` → çekirdekte `moveBlockTo` / `placeNewBlock`. Yerel HTML5 DnD; bağımlılık eklenmedi.

## Stil motoru v2 (2026-11-03)
`compileBlockStylesToCss` artık tipografi, metin gölgesi, kenar başına dış boşluk, kenarlık biçimi, arka plan boyut/konum/sabit, dönüşüm, **hover** (`style.hover`, `@media (hover:hover)`) ve **giriş animasyonu** (`style.animation`, CSS `animation-timeline: view()`; `BLOCK_ANIMATIONS`) üretir. Cihazdan bağımsız alanlar (hover, animasyon, `transitionMs`) `updateSelectedBlockStyleRoot` ile kök stile yazılır. Yol haritası: `docs/20-REFERENCE-ANALYSIS-AND-EDITOR-PLAN.md`.

## Şablon görüntüleme koşulları (2026-11-03)
`TemplateMeta.conditions` (`include`/`exclude`) ve `behavior` (`sticky`, `glass`, yalnızca header). `resolveTemplate(kind, templates, assignedId, ctx)` sırası: atama → en özgül eşleşen koşul → varsayılan → yerleşik. Bağlam (`TemplateContext`) çağıran katmanda bilinen alanlardan oluşur; bilinmeyen alana bağlı kural eşleşmez. Yönetim: Görünüm › Şablonlar › şablonun **Ayarlar** paneli.

## Palet değişkenleri ve karanlık mod (2026-11-03)
Ziyaretçi renkleri `var(--nx-bg|fg|primary|…)` okunur: `toCssVarTokens` (renderer girişinde ve layout'ta uygulanır), anlamsal Tailwind sınıfları `text-nx-fg|soft|muted|link`, `bg-nx-card|subtle`, `border-nx-line` aynı değişkenleri kullanır. **Yeni blok/bileşende sabit `slate/zinc/white` renk sınıfı yazılmaz; anlamsal sınıf kullanılır** (karanlık mod bunu varsayar). `customizer.darkMode = "auto"` iken `darkModeCss` yalnızca `prefers-color-scheme: dark` altında değişkenleri değiştirir. Şablon davranışı: `TemplateBehavior` (`sticky`, `glass`, `transparent`, `tone`, `contentWidth`).

## Stil ön ayarları ve kayan araç çubuğu (2026-11-03)
`StylePreset {id, name, style}` site başına `settings.customizer.stylePresets` içinde durur (en çok 50). Uygulama `applyStylePreset`: görsel stil ön ayar olur, bloğa özel alanlar (`anchorId`, `cssClass`, `customCss`, `hideOn`, `fullWidth`) korunur. Arayüz: Stil sekmesi üstündeki ön ayar çubuğu + seçili bloğun üstündeki `FloatingToolbar` (`editor/floating-toolbar.tsx`).

## Tuval v2: satır içi düzenleme (2026-11-03)
`InlineEditable` (`editor/inline-editable.tsx`) zengin bloğun render çıktısını sarar; `props` içindeki görünen metinleri DOM yaprak öğelerine eşler ve `contenteditable` yapar. Yeni blok yazarken **özel bir şey gerekmez**: metin `props` içinde düz dize olarak durup bloğun çıktısında tek başına bir öğede (yaprak) görünüyorsa tuvalde otomatik düzenlenebilir. Eşleşmeyen alanlar (birleştirilmiş/biçimlendirilmiş metin) sağ panelden düzenlenir. Yapısal alanlar (`href`, `align`, `layout`…) `SKIP_KEYS` ile hariçtir. Yön kararı: `docs/21-EDITOR-DIRECTION.md`.

## Tuval çerçevesi (2026-11-03)
Görsel tuval `CanvasFrame` ile bir iframe'e portal edilir. Çerçeve içinde çalışacak kod `document`/`window` yerine öğenin `ownerDocument`/`defaultView`'ini kullanmalıdır (örn. `prose-field`, `quick-insert`); `document.body`'e portal yapılmaz. Çerçeve dışına taşması gereken olaylar (Ctrl+S, dragend, pointerdown) `CanvasFrame` içinde üst pencereye iletilir.

## Stüdyo v3: Birleşik Üst Çubuk, Görsel Sütun Seçici, Bağlamsal Araç Çubuğu ve Alt Hiyerarşi Yolu (2026-11-03)
- **Birleşik Üst Kontrol Çubuğu (`dual-mode-editor-topbar.tsx`):**
  - Sol: Mavi `+ Blok Ekle` çekmece tetikleyicisi, `Yapı` (blok ağacı) tetikleyicisi, `Geri Al / İleri Al` düğmeleri ve kalıcı bağlantıyı (`/{locale}/{slug}`) + arama sonucu önizlemesini (`SearchSnippetBar`) açılır pencerede sunan kompakt adres rozeti.
  - Orta: Her an erişilebilen vurgulu **`✨ Tasarım Kütüphanesi`** düğmesi ve görünüm/cihaz seçici (`StudioViewBar`).
  - Sağ: Kaydedilmemiş değişiklik rozeti, `Taslak`, `Yayınla`, canlı sayfa bağlantısı, tıklanabilir `SEO {puan}` rozeti ve `Denetçi` çekmece anahtarı.
- **Kanvas Üstü Görsel Sütun Düzeni Seçici (`editor/row-layout-picker.tsx`):**
  - Boş bir satır (`buildEmptyRow`) eklendiğinde veya seçili satırda `Düzen` düğmesine tıklandığında kanvas üzerinde SVG sütun oran kartları (`12`, `6+6`, `4+8`, `8+4`, `4+4+4`, `3+6+3`, `3+3+3+3`) ve `Tasarım Kütüphanesinden Hazır Bölüm Seç` aksiyonu belirir.
  - Dolu satır, sütun ve kapsayıcı bölümler kalıcı gri çerçeveler yerine gerçek sayfa görünümüyle çizilir; kesikli sınır ve hızlı seçim etiketleri yalnızca üzerine gelindiğinde veya seçildiğinde görünür.
- **Zengin Bağlamsal Yüzen Araç Çubuğu (`editor/floating-toolbar.tsx`, `editor/toolbar-prose-ai.tsx`):**
  - Tüm bloklarda bloğun üst kenarında (`-top-10`) tek ve birleşik bir araç çubuğu olarak konumlanır; metin veya görsel bloklarında ikinci bir yüzen çubuk açılmaz.
  - Üst kapsayıcıya tek tıkla çıkış (`↑ Üst`), sürükle tutamacı, yukarı/aşağı taşıma.
  - Blok türüne özel hızlı kontroller: satırlarda sütun oranı geçişi (`12`..`3+3+3+3`), bölümlerde genişlik (`Dar`, `Kutu`, `Tam`), metin/başlık/alıntı/özet bloklarında birleşik etiket dönüştürücü (`P | H1 | H2 | H3 | H4 | Div`), satır içi TipTap biçimlendirme düğmeleri, bağlantı düzenleyici ve **`✨ AI Yaz / Düzenle`** açılır penceresi (`AiComposePanel`), görsel bloklarında hizalama + ölçek (`25%..100%`) + `Görsel Seç` (alt kenardaki yinelenen ölçek çubuğu kaldırıldı, sürükleme tutamaçları korundu), çok öğeli bloklarda (`canAppendRepeaterItem` / `appendRepeaterItem`) tek tıkla `+ Öğe Ekle`.
- **İki Modlu Sağ Denetçi, Tema Paleti Renk Seçicisi ve Bağlı Boşluk Ön-Ayarları (`editor/block-inspector.tsx`, `editor/style-controls.tsx`, `editor/block-style-tab.tsx`):**
  - Sağ panel üst başlığı **`Blok`** (`Genel & Düzen | Stil | Gelişmiş` + üst kapsayıcı yolu) ve **`Sayfa Ayarları`** (`Yayın | SEO | Medya & Etk.`) olarak iki ana çalışma moduna ayrılır.
  - `ColorInput`, aktif temanın `siteTokens.colors` paletini (`Birincil`, `İkincil`, `Vurgu`, `Ön Plan`, `Yumuşak`, `Arka Plan`, `Kenarlık`) tıklanabilir renk yuvarlakları olarak sunar.
  - `BlockStyleTab` iç boşluk (padding) ve dış boşluk (margin) için hızlı ön-ayar düğmeleri (`0`, `XS`, `S`, `M`, `L`, `XL`, `2XL`) ve `Tüm kenarlar bağlı / Ayrı kenarlar` kilidi içerir.
- **Alt Hiyerarşi (Breadcrumb) ve Durum Çubuğu (`editor/editor-status-bar.tsx`):**
  - Seçili bloğun kök sayfadan itibaren ata zincirini (`getBlockAncestors`, `summarizeBlockPreview`: `Sayfa › Kapsayıcı bölüm › Satır (6+6) › Sütun (50%) › Başlık`) tıklanabilir adımlar halinde ve sağda toplam blok/kelime sayacıyla gösterir.
- **Görsel Simge Seçici Modal (`editor/icon-picker-modal.tsx`, `@nexpress/core/icons`):**
  - 112 yerleşik saf SVG simge (`ICON_PATHS`, Türkçe `ICON_LABELS` ve 7 kategori `ICON_CATEGORIES` ile: `ui`, `corporate`, `tech`, `commerce`, `contact`, `media`, `sector`) aranabilir ve kategori sekmeli görsel ızgara modalında (`IconPickerModal`) sunulur; `button_element`, `single_icon`, `bento_features`, `icon_list`, `info_box`, `tabs` blokları ve menü/mega-menü editörlerinde simgeler hem düğme üzerinde hem modalda gerçek SVG grafiğiyle görünür.
- **Zengin Kapsayıcı Sekmeler (`tabs` & `editor/canvas-tabs-block.tsx`):**
  - `tabs` bloğu tam bir kapsayıcıdır (`CONTAINER_BLOCK_TYPES` içinde, alt düğümleri `column` sekme panelleridir): her sekmenin içine çok sütunlu satırlar (`columns`), görseller, butonlar, listeler veya tablolar eklenebilir. Ön yüzde 0 KB istemci JS (saf CSS radio-tab + `tabStyle`: `pills` | `underline` | `boxed`) olarak çizilir; editör tuvalinde ise sekmeler arası canlı geçiş, satır içi sekme adı/simgesi düzenleme ve sekmeye doğrudan satır/sütun ekleme çubuğu sunar.
- **Doğrudan Sürükle-Bırak ve Sabit Seçimli Medya Penceresi (`editor/dnd.tsx`, `editor/canvas-block.tsx`, `media/media-picker-dialog.tsx`):**
  - Tuvaldeki her blok üzerine gelindiğinde sol üstteki tutamaçtan doğrudan sürüklenebilir; herhangi bir bloğun üst/alt yarısına, sütunlara, bölümlere, sekme panellerine veya sol yapı gezginindeki düğümlere bırakılarak kapsayıcılar arası taşınabilir.
  - `MediaPickerDialog` sol medya ızgarası ile sağ detay panelini bağımsız kaydırır, kart üzerinde tek tıkla/çift tıkla `Seç` aksiyonu ve pencere altında her zaman görünür sabit `✓ Seçilen Görseli Ekle` çubuğu barındırır.

## Canlı Tema Özelleştirici v2, 11 Şablon Türü, Sol/Sağ Sidebar ve Zengin Mega Menü (2026-11-03)
- **Canlı Tema Özelleştirici (`/admin/themes` — `theme-store-control-panel.tsx`, `theme-store-preview-canvas.tsx`, `theme-store-tab-layout.tsx`):**
  - Sol kontrol çekmecesi 6 sekmeye ayrıldı: `Temalar`, `Renkler`, `Yazı Tipi`, `Sidebar & En`, `Header/Footer`, `Şablonlar`.
  - Sağ canlı önizleme kanvası 8 farklı sayfa/şablon görünümünü anlık olarak simüle eder: **Ana Sayfa**, **Blog Yazısı**, **Kategori**, **Etiket**, **Sayfa**, **Ürün Detay**, **Ürün Kategori** ve **Arama Sonuçları**.
  - **Sol / Sağ Sidebar ve Sayfa Genişliği:** `customizer.layout` altında `sidebarPosition` (`none` | `left` | `right`), `sidebarWidth` (`260px` | `300px` | `340px`), sayfa türü bazlı görünürlük anahtarları (`sidebarOnBlog`, `sidebarOnArchive`, `sidebarOnPage`, `sidebarOnShop`, `sidebarOnSearch`) ve arşiv/ürün ızgara sütun sayısı (`2 | 3 | 4`) hem canlı önizleme kanvasında hem de gerçek ziyaretçi düzeninde (`(public)/[locale]/layout.tsx`) anında uygulanır.
- **11 Şablon Türü ve 32 Hazır Şablon (`packages/core/src/templates.ts`, `/admin/appearance/templates`):**
  - `TemplateKind` kapsamı 11 türe çıkarıldı: `header`, `footer`, `sidebar`, `page`, `post`, `category`, `tag`, `product`, `shop`, `product_category`, `search` (arama sayfası `(public)/[locale]/ara/page.tsx` artık `search` şablonunu da destekler).
  - `STARTER_TEMPLATES` 32 zengin başlangıç şablonuna yükseltildi: Sağ ve Sol Sidebarlı Sayfa şablonları, Sağ/Sol Sidebarlı ve Dergi (Magazine) Blog Yazısı şablonları, Sağ/Sol Sidebarlı Kategori ve Etiket arşiv şablonları, Sağ Sidebarlı (Güven/Teslimat Kutulu) Ürün Detay şablonu, Sol Filtre Sidebarlı Mağaza ve Ürün Kategorisi şablonları, 2 Arama Sonuçları şablonu, 6 Header, 3 Footer ve 3 Kenar Çubuğu şablonu.
- **Zengin Header, Footer, Kenar Çubuğu ve Mega Menü Editörleri (`/admin/appearance/*`):**
  - **Menü & Mega Menü (`/admin/appearance/menus`):** `NavigationLink` artık `icon` alanı destekler; ziyaretçi navigasyonunda (`site-nav.tsx`) masaüstü menü, açılır menü ve Mega Menü kartlarında 0-KB RSC SVG simgeler ve rozetler çizilir. Menü editörüne etkileşimli **Canlı Menü & Mega Menü Önizleme** çubuğu, simge seçici ve 3 adet tek tıkla **Hazır Mega Menü Şablonu** (`Kurumsal Çözüm & Ürün Vitrini (3 Sütun)`, `E-Ticaret & Katalog Mega Menü (4 Sütun)`, `Bilgi Bankası & Kaynak Merkezi (2 Sütun)`) eklendi.
  - **Header, Footer ve Sidebar Editörleri:** Her üç editöre de canlı görsel önizleme şeridi ve tek tıkla hazır kurumsal/e-ticaret/dokümantasyon şablonları eklendi.

## Kenar Çubuğu & Footer Bileşen (Widget) Sistemi, Gizlenebilir Tema Seçici ve Doğrudan Şablon Oluşturucu (2026-11-03)
- **Tema Seçimini Gizle / Göster ve Tam Ekran Canlı Önizleme (`/admin/themes` — `theme-store-header.tsx`, `theme-store-customizer.tsx`, `use-theme-store.tsx`):**
  - `/admin/themes` açıldığında varsayılan olarak tema kartları gizlidir (`showThemeSelector = false`) ve doğrudan özelleştirme sekmeleri (`Renkler`, `Yazı Tipi`, `Sidebar & En`, `Header/Footer`, `Şablonlar`) görünür; üst çubuktaki **`Tema Seçimini Göster / Gizle`** düğmesiyle tema kartları istenildiğinde açılıp kapatılabilir.
  - Ayrıca **`Paneli Gizle (Tam Önizleme)`** (`hideControlPanel`) düğmesiyle sol kontrol paneli tamamen gizlenerek sağdaki canlı önizleme kanvası 12 sütun tam genişliğe büyütülebilir.
- **Kenar Çubuğu (Sidebar) ve Footer Bileşen (Widget) Mimarisi (`@nexpress/core/widgets`, `appearance/widget-studio.tsx`, `sidebar-editor.tsx`, `footer-editor.tsx`, `public/public-widgets.tsx`):**
  - Kenar çubuğu ve Footer'daki düz bağlantı listeleri kaldırılarak yerine 13 bileşen türünden oluşan **Birleşik Bileşen (Widget) Sistemi (`SITE_WIDGET_TYPES`)** getirildi:
    1. `categories` (Kategoriler — yazı sayısı rozeti, hiyerarşi, liste/rozet/kart görünümü)
    2. `recent_posts` (Son Yazılar — küçük görsel, yayın tarihi, kompakt/numaralı/kart görünümü)
    3. `recent_comments` (Son Yorumlar & İncelemeler — 5 yıldız puanı ve yorum özeti)
    4. `campaigns` (Kampanya & Fırsat Kutusu — rozet, indirim oranı, kupon kodu, çağrı butonu ve renk tonu)
    5. `featured_products` (Öne Çıkan Ürünler — mağaza vitrini ve fiyat etiketi)
    6. `popular_tags` (Popüler Etiketler Bulutu)
    7. `search` (Site İçi Arama + önerilen anahtar kelimeler)
    8. `newsletter` (E-Bülten Abonelik Kutusu)
    9. `about_brand` (Marka Özeti, İletişim & Sosyal Medya Simgeleri)
    10. `contact_card` (Uzman Desteği & Hızlı İletişim Kartı)
    11. `trust_badges` (Güven, SSL, Teslimat & Garanti Rozetleri)
    12. `toc` (İçindekiler Rehberi)
    13. `nav_menu` (İkonlu ve rozetli hızlı bağlantı grubu)
  - **Footer Sütun Yerleşim Düzenleri (`FOOTER_LAYOUT_PRESETS`):** `Marka Geniş + 3 Sütun (4+2+3+3)`, `4 Eşit Sütun (3+3+3+3)`, `3 Eşit Sütun (4+4+4)`, `2 Sütun Asimetrik (5+7)` ve `Tek Sütun Merkezi Vitrin (12)` düzenleri ile her sütuna ayrı ayrı bileşen (widget) ekleme, sütunlar arası taşıma ve üst kampanya şeridi (`topBanner`) desteği eklendi.
  - **0-KB RSC Ziyaretçi Çizimi (`getPublicWidgetFeed`, `RenderPublicWidget`):** Hem kenar çubuğu hem footer bileşenleri ziyaretçi sayfalarında gerçek veritabanı verileriyle (kategoriler, son yazılar, onaylı yorumlar, ürünler) 0 KB istemci JS ile çizilir.
- **Şablon Oluşturucu Modal ve Özelleştirici İçi Şablon Yönetimi (`appearance/templates/templates-manager.tsx`, `appearance/templates/actions.ts`, `theme-store-tab-layout.tsx`):**
  - Hem `/admin/appearance/templates` sayfasına hem de `/admin/themes` içindeki `Şablonlar` sekmesine doğrudan **Yeni Şablon Oluşturucu** (11 şablon türü, özel şablon adı, hazır şablondan veya `Tam Genişlik` / `Sağ Sidebar (8+4)` / `Sol Sidebar (4+8)` iskeletiyle sıfırdan oluşturma, şablon çoğaltma, varsayılan yapma ve tek tıkla Görsel Stüdyoda düzenleme) eklendi.

## Çoklu Kenar Çubuğu (Multi-Sidebar) Mimarisi ve İçerik Türü Bazlı Kenar Çubuğu Eşleme (2026-11-03)
- **Çoklu Kenar Çubuğu Alanları (`@nexpress/core/widgets`, `STANDARD_SIDEBAR_AREAS`):**
  - Tek ve sabit bir kenar çubuğu yerine, farklı içerik türleri ve şablonlar için bağımsız kenar çubuğu alanları (`SidebarAreaConfig`: `id`, `name`, `description`, `enabled`, `position`, `width`, `sticky`, `styleVariant`, `widgets`) tanımlandı.
  - 6 Standart Kenar Çubuğu Alanı:
    1. `primary` — Genel / Varsayılan Kenar Çubuğu
    2. `blog` — Blog & Makale Kenar Çubuğu (Son yazılar, kategoriler, bülten, yazar kartı)
    3. `shop` — Ürün & Mağaza Kenar Çubuğu (Öne çıkan ürünler, filtreler, güven rozetleri)
    4. `archive` — Kategori & Arşiv Kenar Çubuğu (Kategori ağacı, etiket bulutu, arama)
    5. `faq` — Soru & Cevap / SSS Kenar Çubuğu (Uzman desteği, iletişim kartı, içindekiler)
    6. `page` — Kurumsal Sayfa Kenar Çubuğu (Hızlı gezinme menüsü, marka kartı, iletişim)
  - Kullanıcılar ayrıca `/admin/appearance/sidebar` stüdyosundan diledikleri kadar özel kenar çubuğu alanı oluşturabilir veya silebilir (`resolveAllSidebarAreas`, `resolveActiveSidebarArea`).
- **Çoklu Sidebar Stüdyosu (`apps/cms/src/components/admin/appearance/sidebar-editor.tsx`):**
  - Üstte alan seçim sekmeleri (tüm standart ve özel kenar çubukları simgeleri ve bileşen sayılarıyla listelenir), yeni alan ekleme modalı ve alana özel kontroller (sağ/sol yön, 260/300/340px genişlik, kart/kenarlık/minimal stil, yapışkanlık ve aktiflik).
  - Her alan bağımsız bileşen listesine (`widgets`) ve hazır şablon ön ayarlarına (`SIDEBAR_WIDGET_PRESETS`) sahiptir.
- **Canlı Tema Özelleştiricide İçerik Türü Kenar Çubuğu Eşleme (`theme-store-tab-layout.tsx`):**
  - `customizer.layout` ayarları altına içerik türü bazlı sidebar alan seçicileri eklendi:
    - Blog Yazıları → `blogSidebarId` (Varsayılan: Blog Kenar Çubuğu)
    - Kategori & Arşivler → `archiveSidebarId` (Varsayılan: Kategori & Arşiv)
    - Kurumsal Sayfalar → `pageSidebarId` (Varsayılan: Kurumsal Sayfa)
    - E-Ticaret & Ürünler → `shopSidebarId` (Varsayılan: Ürün & Mağaza)
    - Arama Sonuçları → `searchSidebarId` (Varsayılan: Genel)
- **Ziyaretçi Düzeninde Sidebar Sızıntısı Giderildi ve Akıllı Alan Yönlendirme (`apps/cms/src/app/(public)/[locale]/layout.tsx`):**
  - Blog için seçilen sol kenar çubuğunun standart sayfalara (`post` vs `page`) sızması engellendi.
  - Sayfa bazlı görünürlük bayrakları (`sidebarOnPage: false` varsayılan) ve rota eşleme ile:
    - Ana sayfa (`/`): Kenar çubuğu kesinlikle devre dışıdır (`none`).
    - Blog yazıları (`type: "post"`): Yalnızca `sidebarOnBlog` etkinse seçilen blog kenar çubuğu gösterilir.
    - Kurumsal sayfalar (`type: "page"`): Yalnızca `sidebarOnPage` etkinse seçilen sayfa kenar çubuğu gösterilir.
    - Mağaza ve ürünler: `sidebarOnShop` ve `shopSidebarId` alanını kullanır.
    - Arşiv ve kategoriler: `sidebarOnArchive` ve `archiveSidebarId` alanını kullanır.
    - Sayfa içi özel kenar çubuğu geçersiz kılma (`content.schemaAttributes._sidebar`) ve şablon kuralları önceliklidir.
  - Tüm bileşenler ve kenar çubukları 0-KB RSC mimarisiyle sıfır istemci JavaScript'iyle çalışır.

### 5. Senkronize Modeller (Synced Patterns / Reusable Blocks) ve Uzmanlaşmış Şablonlar
- **WordPress Tarzı Senkronize Model Modülü (`synced_pattern`):**
  - Editörde kanvastaki herhangi bir bloğun (bölüm, satır, kart grubu vb.) kayan araç çubuğundaki **✨ Model Oluştur** butonuna tıklanarak açılan modal ile model adı ve kategorisi girilir.
  - Model `type: "template"`, `kind: "pattern"` olarak veritabanına kaydedilir.
  - Sayfadaki blok anında `{ type: "synced_pattern", props: { patternId, title } }` referans düğümüne dönüştürülür.
  - Model tasarım stüdyosunda (`/admin/appearance/templates`) güncellendiğinde, bu modeli kullanan yüzlerce sayfadaki bloklar anında ve otomatik olarak güncellenir.
  - **Bağlantıyı Kopar (Detach Pattern):** Kayan araç çubuğundaki "Bağlantıyı Kopar" aksiyonu ile senkronize model, ana modeli etkilemeden sayfaya özel bağımsız blok kopyalarına dönüştürülebilir.
  - **Tasarım Kütüphanesi Entegrasyonu (`✨ Tasarım Kütüphanesi`):**
    - Kullanıcının kaydettiği tüm modeller "Modellerim" sekmesi altında listelenir.
    - Kullanıcı modele tıklayıp "Model Olarak Ekle (Senkronize)" veya "Kopya Olarak Ekle (Bağımsız)" seçimi yapabilir.
- **Uzmanlaşmış İçerik Şablonları & Hazır Başlangıç Paketleri:**
  - **ERP & Yazılım Vitrin Şablonu (`product-software-erp`):** Logo ve Akınsoft kurumsal yazılım sayfalarındaki gibi yapışkan sekme menü, modül detayları, donanım spekleri, demo talep çağrısı ve `SoftwareApplication` şeması.
  - **Kampanya Detay Şablonu (`campaign-detail`):** Geri sayım, indirim/hediye kutuları, şartlar & kupon ve `Offer` şeması.
  - **Teknik Makale Şablonu (`tech-article-guide`):** Ön koşul ve mimari matrisi, adım adım kurulum ve `TechArticle` şeması.
  - **Soru-Cevap & AI Prompt Şablonu (`qa-single`):** Öne çıkan uzman yanıtı, mevzuat özeti, PAA alt soruları ve `QAPage` şeması.
  - **Destek Hub Şablonu (`destek-hub`):** AnyDesk/TeamViewer uzaktan bağlantı butonları ve 7/24 teknik servis çağrısı.
- **0-KB RSC Hız Kuralı:** Senkronize modeller ziyaretçi yüzeyinde (`RscBlockRenderer`) önbelleğe alınmış desen sözlüğü (`patterns`) üzerinden derlenir; sayfaya tek bir satır dahi istemci JS yükü binmez.
