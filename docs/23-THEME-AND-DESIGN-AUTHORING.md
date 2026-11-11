# 23 — Tema, tasarım kütüphanesi ve şablon yazarlığı

Bu belge, bir insana veya bir modele **geçerli bir NexPress teması** ürettirmek içindir. Belgenin tamamını modele verin ve isteği yazın. Model, aşağıdaki üç üründen isteneni **tek bir JSON** olarak döndürmelidir. Açıklama, markdown çiti ve uydurma alan yok.

Makine doğrulaması bu belgeden ayrı ikinci bir sözleşme değildir. Kaynak dosyalar değişirse **aynı turda bu belge de güncellenir** (kural: `AGENTS.md` §1). Çelişki olursa kod kazanır ve belge aynı turda düzeltilir.

| Ürün | Ne işe yarar | Nereye gider | Doğrulayan |
| :--- | :--- | :--- | :--- |
| Tema paketi (`.nxtheme`) | Renk, yazı, geometri, üst/alt şerit, başlangıç sayfaları, kapsamlı CSS | `/admin/themes` yükleme | `@nexpress/themes/package` |
| Tasarım kütüphanesi | Tekrar kullanılan bölüm veya tam sayfa bloğu | `/admin/design-library` JSON aktar | `lintDesign` / `lintDesignOutput` |
| Şablon | Sayfa, yazı, arşiv, header, footer, kenar çubuğu yerleşimi | `/admin/appearance/templates` | `validateTemplate` |

Üçü birbirinin yerine geçmez.

- **Tema paketi** site içeriğini silmez ve şablon kaydı oluşturmaz. Etkinleştirilince jetonlar ve (varsa) `chrome/header.json` + `chrome/footer.json` yerleşik üst/alt şeride yazılır.
- **Kütüphane** bir bölümü veya sayfa taslağını saklar. Tema rengi taşımaz.
- **Şablon** yayındaki yerleşimdir. Varsayılan header/footer/kenar çubuğu şablonu varsa yerleşik şeridin yerine geçer. Sayfa ve yazı şablonları içeriğin kendi bloklarının **çevresini** çizer; içeriğin yerine geçmez.

Ziyaretçi sayfası 0 KB özel istemci JavaScript ister. Paket kod çalıştırmaz. `"use client"`, betik, iframe, harici yazı tipi dosyası ve üçüncü parti sayfa oluşturucu adı yazılmaz.

---

## 1. Modele verilecek istek

Belgenin altına şunu ekleyin:

> Bu sözleşmeye uy. İstediğim iş: {tema | bölüm | sayfa | şablon | hepsi}. Konu: {…}. Dil: tr. Adresler `/tr/...` ile başlasın. Sayı, fiyat, yorum ve müşteri adı uydurma. Yalnızca aşağıdaki JSON'u döndür.

Modelin döndüreceği zarf:

```json
{
  "request": "theme",
  "files": {
    "theme.json": {},
    "tokens.json": {},
    "chrome/header.json": {},
    "chrome/footer.json": {},
    "pages/ana-sayfa.json": {},
    "skins.css": ""
  },
  "library": [],
  "templates": []
}
```

`request` değerleri: `theme` (yalnızca `files`), `section` veya `page` (yalnızca `library` içinde tek kayıt), `template` (yalnızca `templates`), `all` (üçü birden). İstenmeyen anahtar `null` olmasın; dizi boş, nesne alanları atlanır.

---

## 2. Tema paketi (`.nxtheme`)

Paket bir zip’tir. Kökte tek klasör sarmalayıcısı varsa doğrulayıcı onu atar. İzinli uzantılar: `json`, `css`, `webp`, `png`, `jpg`, `jpeg`.

| Dosya | Zorunlu | İş |
| :--- | :--- | :--- |
| `theme.json` | evet | Kimlik ve tanıtım |
| `tokens.json` | evet | Renk, yazı, geometri |
| `chrome/header.json` | hayır | Üst şerit (yerleşik header) |
| `chrome/footer.json` | hayır | Alt şerit (yerleşik footer) |
| `pages/<slug>.json` | hayır | Başlangıç sayfası, en çok 40, slug benzersiz |
| `skins.css` | hayır | Kapsamlanacak ek CSS, en çok 200 KB |
| `screenshot.webp` (png/jpg de olur) | hayır | En çok 300 KB; içerik gerçek görsel olmalı |

Sınırlar: zip 8 MB, en çok 200 dosya, açılmış toplam 30 MB, her JSON/CSS 1 MB. Kod, yazı tipi, svg, html, md yasak. `@import`, `expression()`, `javascript:`, dış `url()` yasak. `url()` yalnızca `data:image/(png|jpeg|webp|gif);base64,…` olabilir. Her CSS seçici `[data-nx-skin="<tema-id>"]` altına alınır. `:root`, `html`, `body` kapsamın kendisine eşlenir. `@media`, `@supports`, `@keyframes` serbesttir; başka at-kuralı reddedilir. En çok 3000 kural.

### 2.1. `theme.json`

```json
{
  "id": "liman-kurumsal",
  "name": "Liman Kurumsal",
  "version": "1.0.0",
  "author": "Stüdyo",
  "tagline": "Sakin kurumsal vitrin",
  "description": "Açık zemin, tek vurgu rengi, geniş okuma ölçüsü.",
  "recommendedProfile": "corporate",
  "features": ["Açık zemin", "Tek vurgu", "SSS"]
}
```

- `id`: `^[a-z0-9][a-z0-9-]{1,38}$` (2–39 karakter). Resmi kimlikleri kullanma: `corporate-aurora`, `commerce-velocity`, `editorial-pulse`, `ink-grid`, `crimson-erp`, `yazilim-firmasi` (eski `akinsoft-merkez` kimliği buna yönlenir).
- `version`: `1.2.3`.
- `recommendedProfile`: `corporate` | `ecommerce` | `news`.
- `features`: en çok 12, her biri en çok 60 karakter.
- `name` ≤ 60, `author` ≤ 80, `tagline` ≤ 120, `description` ≤ 300.

### 2.2. `tokens.json`

Renkler tema paketinde `#rgb` veya `#rrggbb` olmalı (kontrast denetimi altı haneyi de üç haneyi de kabul eder). `rgb()` / `hsl()` paket şemasından geçer ama kontrast denetiminden geçmez; **yalnızca hex yaz**.

```json
{
  "colors": {
    "primary": "#0f172a",
    "primaryForeground": "#ffffff",
    "secondary": "#e2e8f0",
    "secondaryForeground": "#0f172a",
    "accent": "#1d4ed8",
    "accentForeground": "#ffffff",
    "background": "#ffffff",
    "foreground": "#0f172a",
    "muted": "#f1f5f9",
    "mutedForeground": "#334155",
    "border": "#64748b"
  },
  "darkColors": {
    "primary": "#e2e8f0",
    "primaryForeground": "#0f172a",
    "secondary": "#1e293b",
    "secondaryForeground": "#e2e8f0",
    "accent": "#93c5fd",
    "accentForeground": "#0f172a",
    "background": "#0b1120",
    "foreground": "#e2e8f0",
    "muted": "#1e293b",
    "mutedForeground": "#cbd5e1",
    "border": "#94a3b8"
  },
  "typography": {
    "headingFont": "Georgia, ui-serif, serif",
    "bodyFont": "system-ui, sans-serif",
    "monoFont": "ui-monospace, monospace",
    "baseSizePx": 17,
    "scaleRatio": 1.25
  },
  "geometry": {
    "borderRadius": "12px",
    "containerMaxWidth": "1120px",
    "sectionSpacingY": "72px",
    "cardShadow": "sm"
  }
}
```

Kontrast çiftleri (oran tutmazsa paket kurulurken renk onarılır; buna güvenme, baştan tuttur):

| Ön plan | Zemin | En az |
| :--- | :--- | :--- |
| `foreground` | `background` | 4.5 |
| `primaryForeground` | `primary` | 4.5 |
| `secondaryForeground` | `secondary` | 4.5 |
| `accentForeground` | `accent` | 4.5 |
| `mutedForeground` | `muted` | 4.5 |
| `mutedForeground` | `background` | 4.5 |
| `primary` | `background` | 3 |
| `border` | `background` | 1.2 |

`darkColors` kısmi olabilir; eksik anahtar açık kipten tamamlanır ve koyu kip ayrıca denetlenir. Yazılmazsa koyu kip açık renkleri kullanır (uyarı).

Yazı yığını en çok 6 aile. **Son aile** şunlardan biri olmalı: `serif`, `sans-serif`, `monospace`, `system-ui`, `ui-serif`, `ui-sans-serif`, `ui-monospace`. Yazı tipi dosyası yüklenmez. Güvenli ilk aileler: `system-ui`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Helvetica`, `Arial`, `Noto Sans`, `Georgia`, `Times New Roman`, `Cambria`, `ui-serif`, `ui-sans-serif`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`, `Courier New`.

`baseSizePx` 12–22 (okunaklılık için 15–20). `scaleRatio` 1.05–1.6. `borderRadius` ≤ 32px. `containerMaxWidth` 960–1440px. `sectionSpacingY` 24–160px. Uzunluk: `12px`, `1.5rem`, `72px`. `cardShadow`: `none` | `sm` | `md` | `lg` | `glow`.

### 2.3. `chrome/header.json`

Menü ağacı bu dosyada yoktur. Menü etiketleri `/admin/appearance/menus` kaydından gelir. Dil başına birden çok menü vardır; header’a işaretlenen kayıt ziyaretçi şeridinde basılır. Footer ve kenar çubuğundaki `nav_menu` bileşeni `settings.menuId` ile aynı kaydı seçer. Üç bölge de boşsa o şeridin varsayılanı kullanılır.

Kanonic öğe kimlikleri: `announcement`, `contact`, `logo`, `menu`, `search`, `cta`, `links`.

Eski adlar kayda dokunulmadan çözülür: `contact_info` → `contact`, `mega_menu` → `menu`, `search_bar` → `search`, `cta_button` → `cta`, `campaign_links` → `links`. Bilinmeyen kimlik (`geo_selector` gibi) yok sayılır.

```json
{
  "topBar": {
    "enabled": true,
    "announcementText": "Kurumsal teklif penceresi açık.",
    "contactPhone": "+90 (212) 555 01 99",
    "contactEmail": "bilgi@ornek.com",
    "leftWidgets": ["announcement"],
    "centerWidgets": [],
    "rightWidgets": ["contact"],
    "mobileLeftWidgets": ["announcement"],
    "mobileCenterWidgets": [],
    "mobileRightWidgets": ["contact"]
  },
  "mainBar": {
    "enabled": true,
    "sticky": true,
    "glassmorphism": false,
    "leftWidgets": ["logo"],
    "centerWidgets": ["menu"],
    "rightWidgets": ["cta"],
    "mobileLeftWidgets": ["logo"],
    "mobileCenterWidgets": [],
    "mobileRightWidgets": ["menu", "cta"],
    "ctaLabel": "Teklif iste",
    "ctaHref": "/tr/iletisim"
  },
  "bottomBar": {
    "enabled": false,
    "leftWidgets": [],
    "centerWidgets": [],
    "rightWidgets": [],
    "links": []
  }
}
```

Kurallar:

- Her şeritte `enabled` ve üç dizi zorunlu. Dizi en çok 8 öğe.
- `topBar.enabled` true ise `announcementText` dolu olsun (≤ 200).
- `bottomBar.enabled` true ise `links` en az iki öğe: `{ "label", "href" }`.
- `ctaHref` ve bağlantılar `/tr` ile ya da `https://` ile başlar. `/admin` ziyaretçiye basılmaz.
- `mobile*` yoksa küçük ekran masaüstünden türetilir. Ana şeritte yoksa logo solda, kalan öğeler sağda kalır. Alt şeridin mobil dizisinde `links` yoksa telefon satırı çizilmez.
- `sticky` yapışkan şerit, `glassmorphism` cam yüzeydir.

### 2.4. `chrome/footer.json`

```json
{
  "columns": [
    {
      "id": "c_urun",
      "title": "Ürün",
      "colSpan": 1,
      "links": [
        { "label": "Vitrin", "href": "/tr/vitrin" },
        { "label": "İletişim", "href": "/tr/iletisim" }
      ]
    }
  ],
  "showNewsletter": false,
  "showLocalBusinessCard": false,
  "copyrightText": "© 2026 Liman",
  "bottomLinks": [{ "label": "İletişim", "href": "/tr/iletisim" }]
}
```

Kolon 0–6. `colSpan` 1–12. Kolon başına en çok 20 bağlantı. `bottomLinks` en çok 12. `label` ≤ 80, `href` ≤ 300, `copyrightText` ≤ 300. `showNewsletter: true` ön yüze e-posta satırı basar; adres uydurma. İsteğe bağlı `layoutPreset`: `4-equal`, `brand-wide-4`, `3-equal`, `2-asymmetric`, `1-centered`, `6-equal`. `6-equal` altı eşit sütundur (`columnIndex` 0–5).

### 2.5. `pages/<slug>.json`

Başlangıç sayfası tema kurulunca taslak içerik olur. Slug dosya adından değil JSON içinden okunur; ikisini aynı tut.

```json
{
  "slug": "ana-sayfa",
  "title": "Liman ile sakin kurumsal vitrin",
  "tldr": "Liman, hizmetini tek cümlede anlatan ve teklif isteyen sakin bir kurumsal vitrindir.",
  "type": "page",
  "blocks": []
}
```

`type`: `page` | `post`. `title` 1–160. `tldr` ≤ 400. `slug`: `^[a-z0-9][a-z0-9-]{0,80}$`. Blok sayısı (iç içe dahil) en çok 400. Bloklar §4’teki `BlockNode` biçimindedir. Paket, AI kataloğu dışındaki blok türlerini de kabul eder; yine de başlangıç sayfasında §5 kataloğunu kullan. Görsel kimliği (`/media/med_…`) ve form kimliği (`formId`) uydurma: sitede yoksa bloğu koyma.

### 2.6. `skins.css`

Jetonlar yetiyorsa dosyayı boş bırak veya hiç koyma. Ek kural yazacaksan seçiciyi sade tut; paket onu kapsama alır.

```css
.nx-hero { letter-spacing: -0.02em; }
```

Kapsam sonrası seçici `[data-nx-skin="liman-kurumsal"] .nx-hero` olur. `theme.json` içindeki `id` ile aynı temayı hedefle; kapsamı elle yazma.

### 2.7. Resmi tema demo paketi

Yüklenebilir paketin `pages/` klasörü taslak sayfa ekler. Resmi temaların vitrin demosu ayrıdır: `packages/themes/src/demo-pack.ts` içindeki `getThemeDemoPack`. Tema etkinleşince sayfa yazılmaz. Yönetici `/admin/themes` üzerinde **Demo veriyi aktar** der. Aynı slug varsa kayıt atlanır, mevcut içerik değişmez. Yeni kayıtlar `published` olur ve içerik ekranından düzenlenir. `schemaAttributes._demo.themeId` kaydın hangi temadan geldiğini tutar; kilitlemez.

Demo ana sayfa `ana-sayfa` slug'ını ezmez. Yazılım Firması paketi `yazilim-vitrin` kullanır. **Her resmi temanın demo paketi vardır:** `corporate-aurora` (`aurora-vitrin`, B2B bulut), `commerce-velocity` (`velocity-magaza`, e-ticaret), `editorial-pulse` (`pulse-dergi`, dergi/haber), `crimson-erp` (`crimson-vitrin`, ERP), `ink-grid` (`vitrin`, geliştirici). İlk dördü `demo-generic.ts` (`buildGenericDemo`) ve `demo-copy.ts` metinlerinden üretilir: ana sayfa, hakkında, hizmetler, (varsa) fiyatlar, iletişim ve 3–5 yazı; hepsi standart bloktur. Aktarım sonunda demo ana sayfa **açılış sayfası** yapılır (`general.frontPageSlug`). `/admin/themes` kartında **Demo ile** düğmesi temayı etkinleştirir ve demoyu tek adımda aktarır.

**Tema şeridi.** Resmi temalar kendi başlık/altlık düzenini getirir (`packages/themes/src/theme-chrome.ts`, `getThemeChromePreset`). Tema değişince `apps/cms/src/lib/theme-chrome-switch.ts` ayrılan temanın şeridini `general.themeChrome[temaKimliği]` altına saklar, yeni temanın saklı düzeni varsa geri yazar, yoksa temanın hazır düzenini uygular; menü, çağrı, iletişim ve altlık bağlantıları (içerik) korunur. Böylece eski temaya dönünce o temadaki düzen geri gelir. Yüklenen veri temaları kendi şablonunu `activateUploadedThemeAction` ile uygular.

**Yazılım Firması Teması (`yazilim-firmasi`)** tam site demosudur (örnek marka MerkezSoft): ana sayfa, 5 grup sayfası, 25 ürün/sektör sayfası, 6 e-dönüşüm sayfası, 6 kampanya kaydı (`type: "campaign"`, Kampanyalar eklentisi içeriği; bitiş tarihi aktarım gününe göre `endsInDays` ile yazılır), kurumsal, çözüm ortakları, medya, blog, SSS, destek, iletişim, formlu tanıtım/istek sayfaları ve 9 yazı (`canvas: false`: yerleşik makale düzeni, öne çıkan görsel, kategori ve blog kenar çubuğu). Kampanya vitrinleri statik kart değil `campaign_showcase` bloğudur ve `/kampanyalar` eklenti rotasından beslenir. `ThemeDemoEntry` alanları: `type` (`page|post|campaign`), `canvas`, `image`, `categories`, `campaign`. Kaynak: `packages/themes/src/yazilim-firmasi.ts` (menü, header, footer, jeton, CSS), `yazilim-firmasi-kit.ts` (blok kurucuları), `yazilim-firmasi-products.ts` (veri tabloları), `yazilim-firmasi-demo.ts` (sayfalar). Sayfalar yalnızca katalog blokları ve `section`/`columns`/`column` ile yazılır; bantlar `style.fullWidth` + `style.cssClass` (`yf-dark|soft|navy`, `yf-center`, `yf-card`, `yf-stat`, `yf-tag`) kullanır, bu sınıflar tema CSS'inde tanımlıdır. Görseller `apps/cms/public/demo/yazilim-firmasi/*.svg` temsili çizimlerdir (`apps/cms/scripts/gen-yazilim-firmasi-art.mjs` üretir). Tekrarlanan tasarımlar `packages/editor/src/library-yazilim.ts` (12 bölüm), header/footer `chrome-library.ts` (`header-yazilim-vitrin`, `footer-yazilim-dizin`), blok şablonları `core/templates.ts` (`header-yazilim`, `footer-yazilim-dizin`, `post-yazilim-blog`), formlar `core/form-templates.ts` (`demo-request`, `call-me`, `partner-application`) içindedir. Tema etkinleşince sayfa genişliği tam, kenar çubuğu kapalıdır; sağ altta yapışkan "Sizi arayalım" kutusu (`<details>`, JS'siz) bulunduğu sayfadan `frm_yf_reach` formuna yazar ve aynı sayfaya döner. Mobilde (≤767px) bantlar daralır, sayaç ve dörtlü kart satırları (`yf-rowwrap`) ikişerli dizilir, footer iki sütundur, tablo yatay kayar. Tema açıkken ve bu sayfa yayındayken `/{dil}` onu gösterir. Tema değişince eski ana sayfa geri gelir.

---

## 3. Tasarım kütüphanesi

Kayıt türü `section` (bölüm) veya `page` (sayfa). Tema jetonu bu kayda girmez.

### 3.1. Bölüm

En çok 3 blok. Kategori (`LIBRARY_CATEGORIES`, `packages/core/src/library-categories.ts`): içerik — `text` | `hero` | `page_title` | `accordion` | `location` | `subscribe` | `testimonials` | `stats` | `list` | `people` | `product` | `cards` | `contact` | `posts` | `pricing` | `cta` | `timeline` | `data_table` | `comparison` | `menu` | `tabs`; medya — `image_text` | `gallery` | `video_text` | `logos`. Eski adlar (`layout`, `media`, `bento`, `social`, `commerce`, `forms`, `data`, `aio_sge`, `editorial`) `normalizeLibraryCategory` ile yeni kimliğe çevrilir. Her örnek tasarım tam bir kategoriye aittir.

```json
{
  "kind": "section",
  "name": "Üç fayda",
  "description": "Hizmetin üç somut çıktısı.",
  "category": "bento",
  "blocks": [
    {
      "id": "blk_bento_01",
      "type": "bento_features",
      "variant": "bento-2x2",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": {
        "title": "Üç somut çıktı",
        "items": [
          { "icon": "shield", "title": "Tek sorumlu", "description": "Teklif, kurulum ve yayın aynı ekipte kalır." },
          { "icon": "clock", "title": "Tarihli teslim", "description": "Kapsam yazılır, tarih ona bağlanır." },
          { "icon": "file-text", "title": "Yayın öncesi liste", "description": "Açılıştan önce kontrol listesi kapanır." }
        ]
      }
    }
  ]
}
```

### 3.2. Sayfa

En az 3, önerilen üst sınır 14 blok. İlk blok `hero`. İkinci blok `tldr_box` (40–260 karakter). Başlık düzeyleri 2–4, atlama yok. En çok 6 çağrı. Uzun metinde bir `faq_accordion`. `schemaType`: `WebPage` | `AboutPage` | `FAQPage` | `Product`.

```json
{
  "kind": "page",
  "name": "Hizmet sayfası",
  "title": "Kurumsal site yayını",
  "slug": "kurumsal-site-yayini",
  "schemaType": "WebPage",
  "tldr": "Yayın; kapsam, tarih ve kontrol listesi yazıldıktan sonra açılır. Teklif için iletişim sayfası kullanılır.",
  "metaTitle": "Kurumsal site yayını",
  "metaDescription": "Kapsam, tarih ve kontrol listesi yazıldıktan sonra açılan kurumsal site yayını.",
  "blocks": []
}
```

`metaTitle` ≤ 60 karakter önerilir. `metaDescription` 70–160. Boşsa TL;DR kullanılır. Sayfa en az ~120 sözcük hedefler. Hero sayfada tek `h1` kaynağıdır; `heading` h1 üretmez.

Kütüphane doğrulaması katalog dışı türü reddeder. Bölümde `slider`, `countdown`, `map_embed`, `gallery`, `user_card` yazma.

Form kategorisindeki hazır bloklar `form_block` kullanır. `props.appearance` şunları taşır: `columns` `1|2|4`, `labels` `top|side`, `density` `compact|comfortable`, `buttonAlign` `left|center|full|beside`, `surface` `inline|dialog`, `triggerLabel`, `stepped`. Alan `width` `full|half|quarter`, `step` 1–6. `formId` yoksa alanlar `props.fields` içindedir ve gönderim gelen kutusuna düşer. Var olan bir forma bağlamak için `formId` yazılır; o zaman görünüm form tanımından gelir.

### 3.3. Modern ve yaratıcı bölümler (`lib_mod_*`, `lib_cr_*`)

Kütüphane (206 öğe: temel, katalog, modern, yaratıcı, açılır/sekme, vitrin, kurumsal ve yeni özgün bölümler) insan editörün kütüphanesidir; AI doğrulayıcısına girmez, bu yüzden `section`, `columns`, `column` ve stil anahtarları (`background`, `backgroundGradient`, `hover`, `animation`, `mobile`) kullanabilir. Kaynaklar: `packages/editor/src/library-creative.ts` (13 yaratıcı bölüm: cam kartlı vitrin, kayan slogan, poster başlık, görsel üstü kartlar, sayaç vitrini, zaman çizelgesi, sohbet SSS, ödül şeridi, uygulama bandı, ikili çağrı, kaynak kartları, etkinlik, video vitrini), `library-modern.ts` (19), `library-forms-modern.ts` (9 form tasarımı), `library-disclosure.ts` (14), `library-sections.ts` (24), `library-extras.ts` (10), `library-fresh.ts` (27), `library-vitrin.ts` (10), ortak kurucular `library-kit.ts` (`band`, `box`, `cardStyle`, `art`, `avatar`), kısa kart adları `library-names.ts` (en çok 24 karakter; tek satıra sığar).

**Kurumsal bölümler (`lib_corp_*`, `library-corporate.ts`, 12 öğe):** güven vitrini, aydınlık vitrin, rakamlarla biz, sorun-çözüm-sonuç, hizmet kartları, vaka çalışması, yatay süreç, güvence rozetleri, sektör kartları, iletişim çağrısı, haber bandı, değerler. Renkler `var(--nx-primary)`/`var(--nx-secondary)` ve `color-mix(...)` ile temadan gelir; tema değişince bölüm yeni rengi alır. Rakam ve belge adları örnektir.

**Görsel sunumu (`#nx:` yönergesi).** Her görsel alanı adresin sonunda kadraj/ölçek taşıyabilir: `…#nx:fit=contain;x=30;y=70;z=1.4` (`fit` cover|contain, `x`/`y` kadraj % , `z` 1–3 yakınlaştırma). Parça sunucuya gitmez; `ResponsiveImage` uygular, `parseMediaRef`, Markdown ve küçük resim yönergeyi atar. Denetçide görsel alanının altındaki kadraj kutusu (`image-adjust.tsx`) yazar. Eski adresler değişmeden çalışır.

Kurallar:
- **`column` yalnızca `columns` içinde** (ve sekme panelinde) geçerlidir. Sütun olmayan yerde stilli kutu gerekiyorsa `box()` (`section`, `containerMode: "full"`) kullanılır. Tuval iç içe sütunu düzenleyemez; bu yüzden `repairBlockNesting` (çekirdek) editör yüklenirken ve her yazmada eski kayıtları onarır (dışarıdaki sütun bölüme, `columns` içindeki sütun olmayan çocuk sütuna sarılır). Kütüphane sözleşme testi kuralı zorlar.
- Görseller satır içi SVG'dir (`art()`); adres `data:image/svg+xml,...` biçimindedir (`;` yok: CSS `background-image` değerlerinde `;` temizlenir).
- Koyu bantlarda metin rengi kapsayıcıdaki `textColor` ile verilir ve içteki başlık/paragrafa kalıtılır; çok katmanlı degrade `background` alanına yazılır (`backgroundGradient` yalnızca tek `linear/radial-gradient` içindir). `icon_list` kendi rengini taşır, koyu zeminde kullanma.
- `hero` bloğunun denetçisi birincil ve ikincil düğmeyi (yazı + adres) düzenler. Satır içi düzenleme `plaintext-only` desteklenmiyorsa `true` ile çalışır.
- Kütüphane penceresindeki küçük resimler bloğun **gerçek çıktısıdır** (`library-preview.tsx`, 820 px genişlikte çizilip küçültülür, kart görününce yüklenir).
- Yinelenen kütüphane öğeleri kaldırıldı (ERP/yazılım firması varyantları, yatay/dörtlü/adımlı eski formlar, temaya bağlı `lib_yf_*`); tam sayfa paketleri eşdeğer öğelere bağlandı.

Form şablonları (`core/form-templates.ts`): `reservation`, `waitlist`, `webinar`, `catalog-download` eklendi (toplam 17).

Header ve footer şablonları (`themes/src/chrome-library-modern.ts`, grup **Modern**): header — `header-modern-glass`, `header-two-tier`, `header-center-brand`, `header-app-search`, `header-shop-categories`, `header-landing-minimal`; her birinde tasarlanmış mobil dizi vardır (logo solda kalır, menü sağda `<details>`). Footer — `footer-cta-brand`, `footer-centered-brand`, `footer-newsletter-split`, `footer-trust-three`, `footer-local-business`; telefonda tek sütuna iner (marka ve çağrı bandı üstte). Blok tabanlı başlangıç şablonları (`core/templates.ts`): `header-glass-search`, `header-centered-announce`, `header-landing-cta`, `footer-cta-band`, `footer-newsletter-form`, `footer-centered-links`.

---

### 3.4. Kategoriler, akordeon/sekme görünümleri ve sayfa türleri

- Kütüphane kenar çubuğu üç başlıkta gruplanır: **İçerik**, **Medya**, **Gelişmiş** (şablon yuvaları, şema kartları, "Benim tasarımlarım"). Etiketler Türkçedir; `LIBRARY_CATEGORIES` tek kaynaktır, AI istemi ve ayrıştırıcı da bunu kullanır. Kayıtlı özel tasarımların eski kategorisi okunurken çevrilir.
- `accordion` bloğu `props.accordionStyle` alır: `classic` | `cards` | `flush` | `filled` | `accent` | `numbered` | `pills` | `bold`; `icon`: `chevron` | `plus` | `none`; `openMode`: `first` (varsayılan) | `none` (hepsi kapalı) | `all`; `exclusive` (true ise biri açılınca diğerleri kapanır; `<details name>` ile, JS yok). Eski `openFirst: false` `none` sayılır. `faq_accordion` aynı `openMode`/`exclusive` alanlarını okur; `accordionStyle` yazılırsa aynı görünümlerle çizilir. `tabs` için `tabStyle` 7 değer alır (yukarıdaki satır). İkisi de yalnız CSS ile çalışır (`<details>` ve radyo düğmesi), istemci JS'i yoktur. Kaynak: `packages/themes/src/blocks-disclosure.tsx`. Editör tuvalindeki sekme çubuğu yeni görünümleri kapsül olarak gösterir; gerçek görünüm önizleme ve ön yüzdedir.
- Yeni kütüphane dosyaları: `library-disclosure.ts` (8 akordeon, 6 sekme; `lib_dc_*`), `library-sections.ts` (sayfa başlığı, konum, abonelik, kişiler, ürün, yazılar, fiyat, tablo, menü; `lib_sx_*`), `library-fresh.ts` (27 özgün bölüm; `lib_fr_*`), `library-extras.ts` (yorum, sayaç, logo, liste, galeri, video, karşılaştırma, metin; `lib_ex_*`), `library-category-map.ts` (eski öğelerin yeni kategoriye eşlemesi).
- **Tam sayfa paketleri** `pageCategory` taşır: `home` (Ana sayfa) | `about` (Hakkında) | `contact` (İletişim) | `services` (Hizmetler) | `portfolio` (Portfolyo) | `team` (Ekip) | `gallery` (Galeri). Pencerede "Tam Sayfa Paketleri" sekmesinde Tümü + bu türlerle süzülür; türü olmayan paketler yalnız Tümü'nde görünür (`PAGE_PACK_CATEGORIES`).

## 4. Blok düğümü (`BlockNode`)

```json
{
  "id": "blk_benzersiz",
  "type": "paragraph",
  "variant": "answer-first",
  "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
  "props": { "text": "İlk cümle konuyu söyler. İkinci cümle sınırı söyler." },
  "style": {
    "paddingTop": "48px",
    "paddingBottom": "48px",
    "textAlign": "left",
    "backgroundColor": "#f1f5f9",
    "textColor": "#0f172a",
    "maxWidth": "720px"
  }
}
```

- `id` benzersiz. Kütüphane doğrulaması kimliği `ai_1` diye yeniden yazar; yine de çakışma üretme.
- `gridSpan` her eksende 1–12. Yazılmazsa 12 sayılır.
- `props` düz metindir. HTML, markdown, emoji dizisi ve betik yok. Boş isteğe bağlı alanları yazma.
- Bilinmeyen `props` anahtarı atılır.
- Bağlantı: `/tr/...`, `/#capa`, `https://...`, `mailto:...`, `tel:...`. `javascript:` reddedilir.
- Görsel: yalnızca `/media/med_…`. Kitaplık listesi verilmediyse `image_figure` ve `split_content.image` kullanma.
- `form_block.formId` yalnızca verilen form listesinden. Liste yoksa form bloğu yok.
- `stats_strip`, `pricing_table`, `countup` yer tutucudur. Kullanıcı sayı vermediyse bu blokları koyma. Koyduysan JSON dışında kısa bir notla “yayından önce gerçek veriyle değiştirin” de.

AI’ın yazabildiği stil anahtarları: `paddingTop`, `paddingBottom`, `textAlign` (`left`|`center`|`right`), `backgroundColor`, `textColor` (`#rrggbb`), `maxWidth`. Metin/zemin kontrastı en az 4.5:1. `customCss` kütüphane yolunda güvenli seçiciyle sınırlıdır; tema paketinin CSS’i `skins.css` içindedir, blok stilinin içine uzun CSS yığma.

İnsan editörün ek stil alanları (model kütüphane JSON’unda kullanmasın): `paddingLeft`, `paddingRight`, `margin*`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textTransform`, `border*`, `borderRadius`, `boxShadow` (`none|sm|md|lg|xl`), `opacity`, `backgroundImage`, `backgroundGradient`, `hideOn`, `fullWidth`, `blockWidth` (`site` tema kapsayıcısı, `full` kenardan kenara; yoksa sayfa yerleşimi), `anchorId`, `cssClass`, `animation` (`fade-in|fade-up|fade-down|fade-left|fade-right|zoom-in`), `hover`.

---

## 5. AI blok kataloğu

Alan sözlüğü: `metin ≤N` karakter sınırı, `zorunlu` boş bırakılamaz, `bağlantı` güvenli URL, `görsel` `/media/med_…`.

Simge (`icon`) yalnızca şu adlardan biri. Başka ad yazılırsa alan düşer:

`check`, `check-circle`, `badge-check`, `star`, `heart`, `thumbs-up`, `arrow-right`, `arrow-up-right`, `chevron-right`, `external-link`, `plus`, `plus-circle`, `search`, `filter`, `sliders`, `settings`, `home`, `info`, `help-circle`, `alert-triangle`, `bell`, `bookmark`, `flag`, `eye`, `download`, `upload`, `refresh`, `maximize`, `briefcase`, `building`, `landmark`, `award`, `trophy`, `crown`, `diamond`, `target`, `compass`, `rocket`, `flame`, `chart`, `pie-chart`, `trending-up`, `activity`, `user`, `users`, `user-check`, `handshake`, `lightbulb`, `puzzle`, `calendar`, `clock`, `clipboard-check`, `sparkles`, `bot`, `zap`, `cpu`, `database`, `server`, `cloud`, `code`, `terminal`, `layers`, `git-branch`, `shield`, `lock`, `key`, `fingerprint`, `wifi`, `monitor`, `smartphone`, `laptop`, `qr`, `cart`, `shopping-bag`, `store`, `credit-card`, `wallet`, `banknote`, `percent`, `tag`, `gift`, `package`, `truck`, `receipt`, `barcode`, `phone`, `mail`, `send`, `message`, `message-circle`, `headphones`, `life-buoy`, `map-pin`, `navigation`, `globe`, `share`, `link`, `megaphone`, `play`, `video`, `image`, `camera`, `mic`, `music`, `palette`, `pen`, `file-text`, `folder`, `book`, `newspaper`, `graduation-cap`, `scale`, `stethoscope`, `heart-pulse`, `leaf`, `sun`, `moon`, `coffee`, `wrench`, `car`, `plane`

### 5.1. Katalog

| `type` | Ne zaman | Sınır | `props` |
| :--- | :--- | :--- | :--- |
| `hero` | Sayfanın ilk bloğu ve tek h1 | sayfada 1. variant: `aurora-split`, `commerce-spotlight` | `badge` ≤60; `title` ≤100 zorunlu; `subtitle` ≤260; `primaryCtaLabel` ≤40; `primaryCtaHref`; `secondaryCtaLabel` ≤40; `secondaryCtaHref` |
| `tldr_box` | Hero’nun hemen ardı, 2–3 cümle | sayfada 1. variant: `answer-first` | `summary` ≤300 zorunlu (hedef 40–260) |
| `heading` | Bölüm başlığı | düzey 2–4, atlama yok | `level` 2–4; `text` ≤110 zorunlu |
| `paragraph` | Düz paragraf, 2–4 cümle | — | `text` ≤900 zorunlu |
| `stats_strip` | 2–4 ölçülebilir kanıt | yer tutucu. variant: `metrics-bar` | `stats[]` 2–4: `value` ≤16 zorunlu, `label` ≤48 zorunlu |
| `bento_features` | 2–12 fayda veya modül kartı | variant: `bento-2x2` | `title` ≤90; `subtitle` ≤240; `columns` 2–4; `items[]` 2–12: `icon`, `image`, `title` ≤60 zorunlu, `description` ≤200 zorunlu, `href` |
| `icon_list` | 2–24 kısa madde / kontrol listesi | — | `columns` 1–3; `items[]` 2–24: `icon`, `mark` ≤4, `title` ≤70 zorunlu, `text` ≤180, `href` |
| `split_content` | Metin yanında görsel | görsel kitaplıktan | `title` ≤90 zorunlu; `text` ≤500 zorunlu; `image`; `alt` ≤125 |
| `howto_steps` | Sıralı yönerge, HowTo şeması | 3–8 adım. variant: `numbered-steps` | `title` ≤90 zorunlu; `steps[]` 3–8: `title` ≤70 zorunlu, `description` ≤260 zorunlu |
| `faq_accordion` | Gerçek sorular, FAQPage | sayfada 1, 3–8 soru. variant: `clean-border` | `title` ≤90 zorunlu; `items[]` 2–8: `question` ≤140 zorunlu, `answer` ≤420 zorunlu |
| `comparison_table` | Seçenek karşılaştırması | en çok 6 sütun | `title` ≤90 zorunlu; `headers` ≤6, hücre ≤40; `rows` ≤24×6, hücre ≤80 |
| `pricing_table` | 2–4 plan | sayfada 1, yer tutucu. variant: `tiers-3` | `title` ≤90 zorunlu; `plans[]` 2–4: `name` ≤40 zorunlu, `price` ≤30 zorunlu, `description` ≤180, `ctaLabel` ≤36, `featured` boolean |
| `callout` | Tek not | variant: `info-border` | `tone`: `TIP` \| `NOTE` \| `IMPORTANT` \| `WARNING`; `title` ≤60; `text` ≤320 zorunlu |
| `info_box` | Kısa kart + görsel/bağlantı | — | `icon`; `image`; `kicker` ≤40; `title` ≤70 zorunlu; `text` ≤260; `linkLabel` ≤40; `href` (`mailto:` ve `tel:` dahil) |
| `cta_banner` | Sonda tek eylem | sayfada en çok 2. variant: `dark-contrast` | `title` ≤90 zorunlu; `subtitle` ≤200; `buttonLabel` ≤40 zorunlu; `buttonHref` zorunlu |
| `button_row` | 1–3 düğme | — | `align`: `left` \| `center` \| `right`; `buttons[]` 1–3: `label` ≤40 zorunlu, `href` zorunlu, `variant`: `primary` \| `secondary` \| `outline` |
| `tabs` | Aynı konunun 2–5 yüzü | Önemli metni sekmeye gizleme | `title` ≤90; `tabStyle`: `pills` \| `underline` \| `boxed` \| `segmented` \| `vertical` \| `cards` \| `steps`; `align`: `left` \| `center` \| `stretch`; `items[]` 2–5: `label` ≤40 zorunlu, `icon`, `subtitle` ≤40, `title` ≤80, `body` ≤500 zorunlu |
| `toc` | Uzun sayfada bölüm bağlantısı | — | `items[]` 2–10: `label` ≤60 zorunlu, `href` zorunlu (`/#bolum`) |
| `anchor_nav` | Hero altı yatay bölüm gezgini | sayfada en çok 2 | `title` ≤40; `sticky` boolean; `styleVariant`: `underline` \| `pills` \| `boxed`; `ctaLabel` ≤36; `ctaHref`; `items[]` 2–10: `label` ≤45 zorunlu, `href` zorunlu, `icon`, `badge` ≤20 |
| `data_table` | Gerçek tablo | en çok 8 sütun | `title` ≤90 zorunlu; `headers` ≤8; `rows` ≤40×8, hücre ≤80; `striped`, `firstColumnHeader`, `stickyHeader`, `compact`, `alignNumbers` boolean |
| `code_block` | Yalnızca teknik içerik | — | `language`: `typescript` \| `javascript` \| `bash` \| `json` \| `html` \| `css` \| `text` \| `python`; `code` ≤2000 zorunlu |
| `image_figure` | Kitaplıktaki görsel | alt zorunlu | `url` zorunlu; `altText` ≤125 zorunlu; `titleText` ≤80; `caption` ≤160; `aspectRatio` ≤10 (`16/9`) |
| `single_icon` | Tek yerleşik simge | — | `icon`; `size` 12–160; `color` ≤30; `background` ≤30; `href`; `label` ≤60; `align` |
| `countup` | Tek gerçek sayı | sayfada en çok 6, yer tutucu | `value` sayı; `prefix` ≤8; `suffix` ≤12; `label` ≤60; `duration` 1–10 saniye |
| `marquee` | Kısa kayan ifadeler | sayfada en çok 2 | `items` ≤12, her biri ≤40; `speed` 5–180; `direction`: `left` \| `right` |
| `shape_divider` | Bölüm arası süs | sayfada en çok 4 | `shape`: `wave` \| `tilt` \| `curve` \| `triangle` \| `slant`; `color` ≤30; `height` 20–300; `flip` boolean |
| `form_block` | Var olan form | form uydurma | `formId` ≤60 zorunlu; `title` ≤80 |

`variant` yazılmazsa kataloğun ilk varyantı seçilir. Listede olmayan varyant düşer.

### 5.2. Katalog dışı türler

Bunlar editörde elle eklenebilir ve tema paketinin `pages/*.json` şeması tür adını kabul eder. **Kütüphane doğrulaması reddeder.** Model, kullanıcı özellikle “şablon” istemedikçe bunları yazmaz. Sebep: sahte yorum/puan, istemci davranışı veya uydurma sorgu.

`heading_element`, `paragraph_element`, `text_div`, `button_element`, `media_file`, `dynamic_list`, `schema_card`, `tpl_*`, `divider_spacer`, `review_box`, `section`, `columns`, `column`, `quote`, `list_element`, `video_embed`, `testimonial_grid`, `grid_section`, `product_embed`, `accordion`, `show_more`, `gallery`, `image_overlay`, `video_popup`, `slider`, `countdown`, `progress_bar`, `map_embed`, `search_box`, `post_grid`, `modal_panel`, `portfolio_grid`, `product_row`, `user_card`, `repeater`, `vector_mark`, `synced_pattern`, `campaign_showcase`.

Şablonda kullanılanların alanı §6’dadır. Aşağıdakiler sayfa içeriği içindir, AI kataloğunda yoktur:

- `media_file`: `{ url, kind: "document"|"video"|"audio", title, description, mime, size, uploadDate, poster? }`. `url` yalnızca `/…` veya `http(s)`.
- `dynamic_list`: `{ source: "posts"|"pages"|"products", category?, tag?, limit 1–24, orderBy: "newest"|"oldest"|"title", excludeCurrent, layout: "cards"|"list"|"carousel", cardStyle: "default"|"minimal"|"overlay"|"featured", columns 1–4, showImage, showExcerpt, showDate, showSearch, showSort, showFilters, showPriceFilter, paginate, heading?, emptyText? }`. `category` / `tag` taksonomi slug’ıdır. Fiyat süzgeci yalnızca `products`.
- `schema_card`: `{ schema: "software"|"offer"|"qa"|"tech" }`. Veri içeriğin kendi özniteliğinden gelir.
- `button_element`: `{ label, href, styleVariant: "primary"|"secondary"|"outline", align, icon, iconSide }`.
- `list_element`: `{ style: "bullet"|"number", items: string[] }`.
- `quote`: `{ text, cite }`. Düz metin.

---

## 6. Şablon

Şablon bir içerik kaydıdır (`type: "template"`). Yayınlanmaz, site haritasına ve aramaya girmez. Ziyaretçi şablonu görmez; şablonun yuvaları o sayfanın gerçek başlığını, gövdesini veya arşiv listesini basar.

```json
{
  "kind": "post",
  "name": "Yazı — sağ kenar",
  "description": "Yazı solda, son yazılar sağda.",
  "isDefault": false,
  "behavior": { "contentWidth": "default" },
  "conditions": { "include": [], "exclude": [] },
  "blocks": []
}
```

`behavior`: `sticky`, `glass`, `transparent` (boolean), `tone`: `light` | `dark`, `contentWidth`: `narrow` (720px) | `default` | `wide` | `full`. Yapışkan ve cam header içindir. `transparent` hero ile başlayan sayfada içeriğin üstüne biner; koşulla bağlanır.

`conditions.include` boşsa şablon koşulla kendiliğinden açılmaz. Türler: `slug`, `category`, `tag`, `contentType`, `locale`. Değer slug veya dil kodudur (`tr`). Daha belirgin koşul kazanır: sayfa > kategori > etiket > tür > dil. Aynı puanda kimliği alfabetik ilk olan seçilir. Oturum ve role göre koşul yoktur.

### 6.1. Türler ve zorunlu yuva

| `kind` | Zorunlu yuva (tam 1 kez) | Kullanılacak yuvalar |
| :--- | :--- | :--- |
| `header` | yok | `tpl_site_logo`, `tpl_menu`, `tpl_cart_link`, `search_box` |
| `footer` | yok | `tpl_site_logo`, `tpl_menu`, `tpl_copyright` |
| `sidebar` | yok | `dynamic_list`, `tpl_menu`, `search_box` |
| `page` | `tpl_post_content` | `tpl_post_title`, `tpl_post_content`, `tpl_featured_image`, `tpl_breadcrumb` |
| `post` | `tpl_post_content` | `tpl_post_title`, `tpl_post_meta`, `tpl_featured_image`, `tpl_post_content`, `tpl_breadcrumb` |
| `category` | `tpl_archive_list` | `tpl_archive_title`, `tpl_archive_list`, `tpl_breadcrumb` |
| `tag` | `tpl_archive_list` | aynı |
| `product` | yok | `tpl_post_title`, `tpl_featured_image`, `tpl_product_buy`, `tpl_post_content`, `tpl_cart_link`, `tpl_breadcrumb`. `tpl_product_buy` yoksa mağaza ürün sayfası bu şablonu kullanmaz |
| `shop` | `tpl_archive_list` | `tpl_archive_title`, `tpl_archive_list`, `tpl_cart_link`, `search_box` |
| `product_category` | `tpl_archive_list` | `tpl_archive_title`, `tpl_archive_list`, `tpl_cart_link`, `tpl_breadcrumb` |
| `search` | `tpl_archive_list` | `search_box`, `tpl_archive_title`, `tpl_archive_list` |
| `pattern` | yok | serbest blok kümesi. İçerik yuvası yok |
| `campaign` | `tpl_post_content` | `schema_card`, başlık, görsel, gövde, `countdown`, `form_block` |
| `kb_tech` | `tpl_post_content` | `schema_card`, breadcrumb, başlık, meta, gövde, `toc`, `howto_steps` |
| `ai_prompt` | `tpl_post_content` | `schema_card`, breadcrumb, başlık, gövde, `faq_accordion`, `form_block` |

Header, footer, kenar çubuğu ve `pattern` içinde `tpl_post_content` ve `tpl_archive_list` olamaz. Sayfa, yazı, kampanya, teknik makale ve soru şablonunda `tpl_post_title` veya `hero` yoksa h1 uyarısı verilir. `tpl_post_title` ile `tpl_archive_title` birlikte birden fazla olmamalı.

### 6.2. Yuva alanları

Yuvalar veri taşımaz. Başlık, gövde, görsel, fiyat ve menü yayında sayfadan gelir. Stüdyo önizlemesi örnek metin gösterir.

| Tür | `props` |
| :--- | :--- |
| `tpl_post_title` | `align`: `left` \| `center` \| `right`. `showTldr: true` ise sayfanın kısa açıklaması (`tldr`) başlığın altında basılır. Sayfa blokları da bu yuvayı görür. |
| `tpl_post_content` | yok |
| `tpl_featured_image` | yok |
| `tpl_post_meta` | `showDate`, `showAuthor`, `showCategories` (varsayılan true) |
| `tpl_breadcrumb` | yok |
| `tpl_archive_title` | yok |
| `tpl_archive_list` | `layout`: `cards` \| `list`; `columns` 1–4; `showImage`, `showExcerpt`, `showDate` |
| `tpl_site_logo` | `align` |
| `tpl_menu` | `layout`: `list` (yoksa yatay); `align` |
| `tpl_copyright` | `align` |
| `tpl_cart_link` | `align` |
| `tpl_product_buy` | yok |
| `search_box` | `placeholder` ≤ 80 |

### 6.3. Sütun

Şablon yerleşimi `columns` > `column` ağacıdır. Kütüphane bölümü sütun kullanmaz; düz liste üretir.

`columns.props`: `layout` (`12`, `6+6`, `4+8`, `8+4`, `4+4+4`, `3+6+3`, `3+3+3+3`), `gap` (`24px`), `verticalAlign`: `start` | `center` | `end`, `stackAt`: `mobile` | `tablet`, `mobileReverse` boolean.

Her `column.props.widthPct` sayısal yüzdedir ve kardeşlerin toplamı 100’e yakınsar. Sütun sayısı `layout` parçasının sayısıyla aynıdır.

```json
{
  "id": "tpl_row",
  "type": "columns",
  "props": { "layout": "8+4", "gap": "32px", "verticalAlign": "start", "stackAt": "mobile" },
  "children": [
    {
      "id": "tpl_row_c1",
      "type": "column",
      "props": { "widthPct": 66.67 },
      "children": [
        { "id": "tpl_title", "type": "tpl_post_title", "props": {} },
        { "id": "tpl_body", "type": "tpl_post_content", "props": {} }
      ]
    },
    {
      "id": "tpl_row_c2",
      "type": "column",
      "props": { "widthPct": 33.33 },
      "children": [
        { "id": "tpl_side", "type": "dynamic_list", "props": { "source": "posts", "limit": 4, "layout": "list", "showDate": true, "excludeCurrent": true, "heading": "Son yazılar" } }
      ]
    }
  ]
}
```

---

## 7. Küçük tam örnek

İstek: “Sakin bir kurumsal hizmet teması. Tek vurgu, açık zemin, ana sayfa ve yazı şablonu.”

Model `request: "all"` döndürür. `files.theme.json` §2.1, `files.tokens.json` §2.2, `files["chrome/header.json"]` §2.3, `files["chrome/footer.json"]` §2.4. `files["pages/ana-sayfa.json"]`:

```json
{
  "slug": "ana-sayfa",
  "title": "Liman ile sakin kurumsal vitrin",
  "tldr": "Liman, hizmetini tek cümlede anlatan ve teklif isteyen sakin bir kurumsal vitrindir. Kapsam yazılmadan sayfa açılmaz.",
  "type": "page",
  "blocks": [
    {
      "id": "blk_hero",
      "type": "hero",
      "variant": "aurora-split",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": {
        "badge": "KURUMSAL YAYIN",
        "title": "Hizmetini tek cümlede anlatan vitrin",
        "subtitle": "Kapsam, tarih ve kontrol listesi yazıldıktan sonra sayfa açılır.",
        "primaryCtaLabel": "Teklif iste",
        "primaryCtaHref": "/tr/iletisim"
      }
    },
    {
      "id": "blk_tldr",
      "type": "tldr_box",
      "variant": "answer-first",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": { "summary": "Liman, hizmetini tek cümlede anlatan ve teklif isteyen sakin bir kurumsal vitrindir. Kapsam yazılmadan sayfa açılmaz." }
    },
    {
      "id": "blk_h2",
      "type": "heading",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": { "level": 2, "text": "Yayın üç adımdan oluşur" }
    },
    {
      "id": "blk_how",
      "type": "howto_steps",
      "variant": "numbered-steps",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": {
        "title": "Üç adım",
        "steps": [
          { "title": "Kapsamı yazın", "description": "Hangi sayfalar açılacak, hangileri taslak kalacak, listelenir." },
          { "title": "Tarihi bağlayın", "description": "Teslim tarihi kapsamdaki işe bağlanır, ayrı vaat yazılmaz." },
          { "title": "Listeyi kapatın", "description": "Başlık, özet ve iletişim adresi dolmadan sayfa yayına alınmaz." }
        ]
      }
    },
    {
      "id": "blk_cta",
      "type": "cta_banner",
      "variant": "dark-contrast",
      "gridSpan": { "desktop": 12, "tablet": 12, "mobile": 12 },
      "props": { "title": "Kapsamı birlikte yazalım", "subtitle": "Teklif, iletişim sayfasındaki formdan gelir.", "buttonLabel": "İletişime geç", "buttonHref": "/tr/iletisim" }
    }
  ]
}
```

`library` bu sayfadaki `bento` bölümünü §3.1 gibi ayrı bir kayıt olarak da taşıyabilir. `templates` içine §6.3 satırını `kind: "post"` ile koy. `isDefault` yalnızca kullanıcı “bunu varsayılan yap” dediyse `true` olur.

`skins.css` bu örnekte boş string. Görsel ve form yok: kitaplık verilmedi.

---

## 8. Modelin kendi kontrol listesi

Döndürmeden önce:

1. JSON ayrışır. Tek nesne. `files` içindeki her değer de JSON olarak ayrışır (`skins.css` dize).
2. `id` küçük harf, rakam ve tire. Sürüm `1.0.0` biçiminde.
3. On bir renk anahtarı açık kipte dolu. Sekiz kontrast çifti tutuyor. Koyu kip var.
4. Her yazı yığınının sonunda genel aile var.
5. Header’da üç şerit ve üç dizi var. Footer’da `columns`, `showNewsletter`, `showLocalBusinessCard`, `copyrightText`, `bottomLinks` var.
6. Sayfa `hero` ile açılır, ardından `tldr_box` gelir. Başlık düzeyi atlanmaz. Katalog dışı tür yok.
7. Sayı, fiyat, yorum, müşteri adı, `/media/` kimliği ve `formId` uydurulmamıştır.
8. Bağlantılar `/tr/...` veya `https://` ile başlar.
9. Şablonda zorunlu yuva tam bir kez var. Header/footer içinde içerik yuvası yok.
10. Metin düz metin. HTML yok. Üçüncü parti ürün adı yok.

Kurulum: `files` içeriğini aynı yollarla zip’leyip `.nxtheme` yapın, `/admin/themes` ekranına bırakın. Kurmak etkinleştirmek değildir. Kütüphane JSON’unu `/admin/design-library` aktarımına, şablon JSON’unu `/admin/appearance/templates` içine alın. Başlangıç sayfası taslaktır; yayına editörden alınır.

---

## 9. Bu belgeyi güncel tutma

Aynı turda burayı güncelle:

| Değişen kaynak | Belgede güncellenecek yer |
| :--- | :--- |
| `packages/themes/src/package/schema.ts`, `package.ts`, `css.ts` | §2 |
| `packages/core/src/ai-design/catalog.ts`, `lint.ts`, `parse.ts`, `theme-lint.ts`, `knowledge.ts` | §3, §4, §5 |
| `packages/core/src/icons.ts` `ICON_NAMES` | §5 simge listesi |
| `packages/core/src/types.ts` `BLOCK_TYPES` | §5.2 |
| `packages/core/src/templates.ts`, `template-conditions.ts`, `packages/themes/src/blocks-template.tsx`, `column-layout.ts` | §6 |
| `packages/themes/src/chrome-library.ts` öğe kimlikleri | §2.3 |
| `docs/07`, `docs/08` | Kısa özet olarak kalır; ayrıntı burada. Çelişkiyi buraya göre düzelt |

`docs/07` sayfa/kütüphane aktarımı, `docs/08` yerleşik header/footer aktarımı içindir. Yeni blok veya tema alanı yalnızca o dosyalara yazılırsa bu belge eksik kalır; modele bu belge verildiği için asıl sözleşme budur.

Son gözden geçirme: 2026-11-04. Kaynaklar yukarıdaki tabloyla karşılaştırıldı.
