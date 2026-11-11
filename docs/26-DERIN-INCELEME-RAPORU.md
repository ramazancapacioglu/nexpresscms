# 26 — Derin İnceleme Raporu: Eksikler, WordPress/referans tema Karşılaştırması, SEO ve Performans

> **Tarih:** 2026-11-11 · **Dal:** `claude/abi-project-review-report-c431db` (`d44a201` üzerinde) · **Kapsam:** monorepo kodu, `docs/01–25`, canlı site `https://ileriseo.com`.
>
> Bu rapor `docs/25` iç denetiminin yerine geçmez, onu **ölçümle sınar**. `docs/25` her satırı "✅ %100" işaretler; aşağıdaki bulgular bunun bazı yerlerde iyimser olduğunu gösterir.

---

## 0. Yöntem ve sınırlar (neyi nasıl doğruladım)

| Yöntem | Ne yapıldı |
| :--- | :--- |
| Kod okuma | SEO motoru, meta/şema üretimi, ara katman, genel düzen, eklenti manifestleri, köprü eklentisi, tema/özelleştirici ayarları |
| Yerel doğrulama | `pnpm test` → **508 test, 0 hata** (11 turbo görevi). `pnpm typecheck` → çıkış 0. Tek tek sorun yeniden üretildi (§2.4) |
| Canlı site (yalnızca açık HTTP, salt okunur) | Başlıklar, `robots.txt`, site haritası, `llms.txt`, `ai-sitemap.json`, `?format=md`; `ai-sitemap.json`'daki **132 sayfanın tamamı** sırayla tarandı; 3 sayfada masaüstü + mobil **Lighthouse 12.8** koşuldu |
| **Yapılmayan** | Sunucuya SSH ile **girilmedi**. Depodaki bağlantı bilgisi (`38.210.77.230:4383`, `~/.ssh/ileriseo_deploy`) CI'ın *tek komutluk* dağıtım anahtarıdır; kullanmak güncelleme betiğini tetikleyip canlıyı yeniden dağıtırdı. Bu yüzden sunucu içi konular (nginx ayarı, PM2, disk, yedek cron'u, Postgres) **doğrulanmadı**; §8'de ayrı listelendi |

Güven düzeyi: **(K)** canlıda ya da testte doğrulandı · **(O)** kodu okuyarak çıkarıldı, çalıştırılmadı · **(?)** çıkarım, kanıt eksik.

---

## 1. Yönetici özeti

**Güçlü yan (ölçüldü):** ziyaretçi performansı gerçekten iyi. Üç sayfada Lighthouse **Performans 99–100**, TBT 0–30 ms, CLS ≤0,05, LCP 0,4–0,5 s (masaüstü) / 1,4–1,8 s (mobil, Lighthouse yavaş-4G benzetimi), tüm sayfalar gzip ~50 KB HTML. Mimari (RSC, sıfır sayfaya-özel istemci JS, AVIF/WebP `<picture>`, `markdownCache`, `llms.txt`, MCP) rakipsiz bir fark yaratıyor: WordPress+referans tema bu ölçüde GEO/LLMO sunmaz.

**Zayıf yan:** SEO *üretimi* (çıkan HTML) ile SEO *vaadi* (docs/04, docs/25) arasında somut boşluklar var ve CI bunları yakalamıyor çünkü genel sayfa meta/şema çıktısını doğrulayan test yok.

### En acil 8 bulgu

| # | Önem | Bulgu | Güven |
| :-: | :-: | :--- | :-: |
| 1 | 🔴 | **132 iç sayfanın tamamında `<title>|</title>`** (ana sayfa hariç). Köprü, WordPress *ana sayfa* başlık şablonunu site geneli `titleTemplate` olarak yazıyor; bilinmeyen değişkenler sessizce boşalıyor (§2.1) | K + O |
| 2 | 🔴 | Canlı site bilerek **kapalı** (`Disallow: /`, `noindex`, boş site haritası). Yayına açmadan önce #1, #3, #4, #5 kapanmalı; açılış listesi §2.7 | K |
| 3 | 🔴 | **Şema:** `datePublished` hiç basılmıyor, `BreadcrumbList` hiç basılmıyor, her yazıda `og:type=website`, JSON-LD'ye `wpId/wpKind/migratedFrom` sızıyor, yazar adı uydurma **"Baş Mimari Ekibi"** (§2.2) | K + O |
| 4 | 🟠 | SEO çözümleyici zengin metindeki **satır içi bağlantıları görmüyor** (yeniden üretildi: iç=0, dış=0) ve 77 blok türünün ~12'sini tanıyor; skor ve iç bağlantı önerileri yanıltıcı (§2.3) | K |
| 5 | 🟠 | **Favicon / site simgesi / web manifest yok** (`/favicon.ico` 404, konsol hatası, ayar ekranı da yok) (§2.5) | K |
| 6 | 🟠 | **Yazı tipi altyapısı yok:** `googleFonts` ayarı ölü, yazı tipi seçici/yükleme yok, CSP zaten dış yazı tipini engeller. referans tema karşılaştırmasında en büyük tasarım açığı (§4) | O |
| 7 | 🟠 | 46/132 sayfada **iki `<h1>`**; 79/132 meta açıklama 150–160 karakterde **kelime ortasından kesilmiş** (§2.6) | K |
| 8 | 🟡 | Genel HTML `no-store`: her ziyaret sunucuda render; önbellek tek süreç belleğinde; CDN/ISR yok; tek PM2 örneği (§3.3) | K |

---

## 2. SEO analizi

### 2.1 🔴 Başlık etiketi: `<title>|</title>` (K)

- Canlıda 132/132 iç sayfada başlık `|`. Ana sayfa doğru (`homeTitleTemplate` farklı yoldan çözülüyor). `og:title` doğru, yani veri var; bozuk olan şablon çözümü.
- **Kök neden (O, canlı veritabanını okuyamadım):**
  - PHP köprüsü SEO eklentisinin ana sayfa başlık ayarı değerini okuyup `titleTemplate` diye gönderiyor (`plugins/wp-bridge/nexpress-bridge/includes/class-nexpress-transfer.php:606–630`).
  - Panel bunu yalnızca `includes("%")` ise kabul edip **site geneli sayfa şablonu** olarak yazıyor (`apps/cms/src/lib/wp-bridge/apply.ts:326`). Ana sayfa şablonu ile sayfa şablonu ayrı kavramlardır.
  - `applyTemplate` bilinmeyen `%sitename%`, `%sitedesc%`, SEO eklentisi `%%…%%` değişkenlerini `""` yapıyor (`packages/seo-core/src/engine.ts:444`); `%sep%` ise `|` oluyor → sonuç `|`.
  - Sonucun boş/yalnız ayraç çıkması için **koruma yok**.
- **Düzeltme:** (1) Köprü ana sayfa şablonunu `homeTitleTemplate`'e yazsın, `titleTemplate`'e yazmasın; (2) SEO eklentisi değişkenlerini (`%sitename%`, `%sitedesc%`, `%%title%%`, `%%sep%%`…) bizim `%title% %site% %tagline% %sep%` kümemize çevir, tanınmayan değişken varsa şablonu reddet; (3) `resolveSeoMeta` sonucu boş ya da yalnız ayraç ise `"{title} | {site}"` yedeğine düşsün; (4) §6'daki oluşturulmuş-çıktı testi.

### 2.2 🔴 Yapılandırılmış veri (K + O)

Örnek yazı JSON-LD'si (canlı): `Organization`, `WebSite`, `BlogPosting`. Sorunlar:

| Sorun | Kanıt | Düzeltme |
| :--- | :--- | :--- |
| `datePublished` yok (yalnız `dateModified`); yazı akışında `pubDate` var, yani veri mevcut | `[slug]/page.tsx:197–207` `buildPageSchemaGraph`'a `publishedAt` geçilmiyor (`index.ts:107` bunu bekliyor) | `publishedAt: content.publishedAt` geç |
| `BreadcrumbList` hiç yok (docs/04 §3 "otomatik üretilir"; çözümleyici bu kontrolü sabit `pass` işaretler `engine.ts:362`) | `index.ts:173` `input.breadcrumbs` bekliyor; sayfa çağrısı geçmiyor (breadcrumb yalnız şablon bağlamına gidiyor, `page.tsx:336`). Canlıda görünür kırıntı da yok | Aynı listeyi şemaya da ver; `"Ana sayfa"` sabit metnini `t()` anahtarına taşı (AGENTS §8) |
| `og:type` hep `website`; `article:published_time/modified_time` yok | `generateMetadata` `resolveSeoMeta`'ya `ogType`, `publishedTime`, `modifiedTime` geçmiyor (`page.tsx:63–84`) | Yazı için `ogType:"article"` + tarihler |
| JSON-LD'ye iç alanlar sızıyor: `wpId`, `wpKind`, `migratedFrom` (geçersiz özellikler) | `index.ts:118` `...cleanAttrs` her `schemaAttributes`'ı yayar; süzgeç yalnız `_`-önekli ve 5 adlı anahtarı eler | `cleanAttrs`'ı **izin listesine** çevir (Schema.org özellikleri) |
| Yazar **"Baş Mimari Ekibi"** — hiçbir yerde gerçek olmayan varsayılan | `packages/core/src/site-settings.ts:429` varsayılan; seed'de de var. Canlıdaki tüm `BlogPosting.author` bu | Varsayılanı boş yap; yazar yoksa `Organization`'a düş (AGENTS §9 "ön yüzde sahte veri yok") |
| Yazıda `image` yok (öne çıkan görsel yoksa) | `page.tsx:206` yalnız `featuredImageUrl` | `/og` görselini yedek ver (meta için zaten kullanılıyor) |
| `Organization` iskelet: logo, `sameAs`, iletişim yok; ana sayfa `WebPage @id` `https://ileriseo.com#webpage` (eğik çizgi eksik) | canlı JSON-LD | Köprüden gelen `organizationLogo`/`sameAs` doldurulmalı; `@id` birleştirmesi düzelt |

### 2.3 🟠 Çözümleyici ile gerçek içerik ayrışıyor (K)

`analyzeSeo` → `extractContentStats` (`engine.ts:145`) paragrafı `props.text`'ten okur; editör ise düz metni `text`'e, bağlantıları içeren zengin metni `html`'e yazar (AGENTS §5). Yeniden üretim:

```
paragraph { text:"…fiyat sayfamıza bakın.", html:'<p>… <a href="/fiyat">…</a> <a href="https://example.org/x">…</a></p>' }
→ internalLinks = 0, externalLinks = 0
```

Etkiler: "İç bağlantılar/Dış kaynak" kontrolleri ve skor yanlış; `/admin/seo/audit` ve iç bağlantı önericisi aynı veriye yaslanıyor; WP'den gelen sayfalar (HTML ağırlıklı) en çok etkilenen. Ayrıca çözümleyici ~12 bloğu tanıyor, Markdown derleyicisi ise `info_box`, `tabs`, `cta_banner`, `pricing_table`… dahil çok daha fazlasını (`markdown-compiler.ts`). Sözcük sayısı/başlık/ince-içerik denetimi iki kaynakta farklı çıkar.

**Öneri:** çözümleyiciyi tek gerçek kaynağa bağla: `blockPlainText` + derleyicinin Markdown'ı üzerinden istatistik çıkar; `heading_element`, `text_div`, `paragraph_element` eşlemesini ekle.

### 2.4 Yeniden üretim komutu

`packages/seo-core` içinde `extractContentStats` çağıran 10 satırlık tsx betiği (scratchpad'de), çıktı `{"internal":0,"external":0,"words":8}`.

### 2.5 🟠 Marka ve tarayıcı varlıkları (K)

`/favicon.ico` → 404; sayfada `<link rel="icon">` yok; `manifest.webmanifest` 404; panelde site simgesi ayarı yok (kodda yalnız `favicon.ico` yolu ayrılmış). Lighthouse en iyi uygulamalar puanını (96) buna bağlı konsol hatası düşürüyor; Google mobil sonuçlarında favicon da gösterilmez. **Öneri:** Site simgesi ayarı (512 px kaynaktan `sharp` ile 32/180/192/512 türet), `generateMetadata.icons`, `manifest`.

### 2.6 🟠 Sayfa içi bulgular, 132 sayfa taraması (K)

| Ölçüt | Sonuç |
| :--- | :--- |
| HTTP durumu | 132/132 `200` |
| `canonical` | 132/132 kendini gösteriyor ✅ |
| Meta açıklama | 0 eksik ✅; 7 kısa (<70); **79 adet 150–160 karakter ve çoğu kelime ortasında kesik** (örnek: "…ERP, MRP,") → içe aktarma/derleme sabit uzunlukta kesiyor |
| `<h1>` sayısı | **46 sayfada 2** (hero H1 + başlık şablonu H1) |
| Görsel alt | `alt` özniteliği her görselde var (527); 35 boş alt (süs olabilir). Ancak logo `alt="MERKEZSOFT"` Akınsoft sitesinde — veri hatası |
| `og:image` | 132/132 ✅ |
| JSON-LD | 131/132 var; yazılarda sorunlar §2.2 |
| TL;DR/açıklama kesimi | `llms.txt` özetleri de ~200. karakterde kesik ("…sunar. İz") |
| Başlık uzunluğu | ölçülemedi (§2.1) |

### 2.7 Yayına açma (indekslemeyi açma) kontrol listesi

Canlı site **bilerek** kapalı: `seo.searchIndexing=false` → `robots.txt` = `Disallow: /`, `X-Robots-Tag: noindex, nofollow` + meta robots, `sitemap.xml` boş indeks (docs/04 §10; "kopya/deneme sitesi için"). Lighthouse SEO 69'un tek nedeni budur. Kaynak içerik `akinsoftizmir.com.tr`'den geldiği için kopya içerik riski var: alan adı değişmeden açmayın.

Açmadan önce: (1) §2.1, §2.2, §2.5; (2) `www` → apeks yönlendirmesi (canlıda `www.ileriseo.com` **200** dönüyor, yönlendirmiyor); (3) `INDEXNOW_API_KEY`/`/indexnow-key.txt` (canlıda 404 → ortamda tanımlı değil); (4) `security.txt`; (5) Search Console + Bing doğrulaması ve site haritası gönderimi; (6) `Organization` verisinin (logo, sameAs, telefon) doldurulması; (7) kırık görsel/bağlantı taraması (`/admin/seo` aracı hazır).

### 2.8 Çekirdek SEO kapsamı: WordPress (popüler SEO eklentileri) karşılaştırması

| Özellik | NexPress | Not |
| :--- | :-: | :--- |
| Başlık/meta şablonları, canlı SERP önizleme | ✅ | Düzgün, ama §2.1 sonuç koruması yok |
| Canonical, noindex, robots, X-Robots | ✅ | |
| XML site haritası (parçalı, hreflang, görsel) | ✅ | Haber/video haritası yok |
| Otomatik 301 (slug geçmişi), yönlendirme yöneticisi + 404 günlüğü | ✅ | Zincir/döngü raporu yok |
| Schema: Article, FAQ, HowTo, Product, SoftwareApp, QAPage, LocalBusiness | ✅ | Gerçek çıktıda eksikler §2.2; Person/author sayfası şeması yok |
| Odak anahtar kelime, okunabilirlik, 17 kriter | ◐ | Çok-kelimeli odak kelime, eş anlamlı, ilişkili anahtar kelime yok; §2.3 |
| İç bağlantı önerisi | ◐ | Sözcük/başlık eşleşmesi; §2.3 nedeniyle bağlantı sayısı yanlış |
| Kırık bağlantı denetimi, yinelenen başlık/açıklama raporu | ✅ | SEO eklentisi Pro'nun ötesinde |
| Toplu düzenleme (meta) | ◐ | Hızlı düzenle var; toplu şablon uygulama sınırlı |
| Google Search Console / GA4 / Bing / Yandex | ✅ | CSV + API; OAuth yenileme sizde |
| Çok dilli hreflang | ✅ | Tek dilli sitede basılmıyor (doğru) |
| Görsel SEO / alt metin otomasyonu | ✅ | `scoreMediaSeo`, odak noktası |
| **GEO/LLMO:** `llms.txt`, `?format=md`, `ai-sitemap`, MCP, NLWeb, bot telemetrisi | ✅✅ | WordPress'te karşılığı yok |
| Kırıntı (breadcrumb) HTML + şema | ❌ | §2.2 |
| Sosyal önizleme (OG/Twitter) | ◐ | `article:*` yok |
| Yerel SEO (LocalBusiness, harita) | ✅ | Pro eklenti |
| Yönlendirme içe aktarma (CSV), SEO eklentisi/SEO eklentisi verisi taşıma | ◐ | Köprü başlık/açıklama/odak/canonical/noindex/OG taşır; şablon değişkeni çevirisi yok (§2.1) |
| **Alan verisi (CrUX/RUM)** | ❌ | Roadmap'te borç; Perfornext "Core Web Vitals" yalnız **tahmin** (içerik ağırlığı) |

---

## 3. Performans analizi

### 3.1 Ölçülen (Lighthouse 12.8, ileriseo.com, tek koşu, ağ gecikmesi dahil)

| Sayfa | Cihaz | Perf | FCP | LCP | TBT | CLS | Erişilebilirlik | En iyi uygulama |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Ana sayfa | masaüstü | **100** | 0,3 s | 0,4 s | 0 ms | 0,048 | 96 | 96 |
| Ana sayfa | mobil | **99** | 1,4 s | 1,7 s | 30 ms | 0 | 96 | 96 |
| `/akinsoft` | masaüstü/mobil | **100 / 99** | 0,3 / 1,4 s | 0,5 / 1,8 s | 0 / 10 ms | 0,022 / 0 | 96 | 96 |
| Uzun yazı | masaüstü/mobil | **100 / 100** | 0,3 / 1,1 s | 0,5 / 1,4 s | 0 / 10 ms | 0 | 96 | 96 |

Ek: sayfa ağırlığı 182–361 KiB, DOM 884–1 072 öğe; 132 sayfa taramasında ortanca TTFB **0,23 s**, p95 **0,29 s**, en kötü 1,27 s (`olivetti-okc-entegrasyon-cozumleri`, soğuk önbellek). Lighthouse'ta kalan tek çizgi: `color-contrast` (`text-amber-600` beyaz üstünde), konsol hatası (favicon 404), `bf-cache` (iki neden), `unsized-images` (logo `<img>` genişlik/yükseklik yok), `legacy-javascript` (Next çalışma zamanı), `csp-xss` (`'unsafe-inline'`).

**Sonuç:** "Lighthouse 100" iddiası bu sayfalarda **doğrulandı** (CI'da yalnız bütçe testi var, laboratuvar koşusu yok; bunu CI'a ekleyin §6). SEO 69 yalnız `noindex` yüzünden.

### 3.2 Yapısal maliyetler (K)

| Konu | Ölçüm | Yorum |
| :--- | :--- | :--- |
| Ana sayfa HTML | **259 KB ham / ~60 KB gzip** | Bunun **154 KB'ı (%59)** satır içi RSC "flight" verisi: içerik HTML'de bir kez, serileştirilmiş olarak ikinci kez. App Router'ın doğası; "sıfır sayfa JS" doğru ama sayfa verisi iki kez taşınır |
| Satır içi stil | 22 KB / sayfa + her blok için `[data-nx-b]` kuralları flight'ta tekrar | Ortak CSS'e alınabilir/yinelenenler birleştirilebilir |
| `<script>` etiketi | 75 (2'si JSON-LD, çoğu flight parçası) | Yürütme maliyeti yok denecek kadar; HTML ayrıştırma var |
| Tek paylaşılan CSS | 158 KB ham / **24 KB gzip**, `/login` ile ana sayfada **aynı dosya** | Yönetim paneli yardımcı sınıfları ziyaretçiye de gidiyor. Tailwind `@source`'u ziyaretçi için ayrı bir giriş dosyasına ayırın |
| Çalışma zamanı JS | ~106 kB gzip (bütçe 108) | Bütçe %2 payla sınırda; yeni özellik bütçeyi aşabilir |
| Yazı tipi | Hiç web yazı tipi yok (sistem yığını) | Hız için artı, tasarım için eksi (§4) |

### 3.3 🟡 Önbellek mimarisi (K + O)

- Tüm genel HTML `Cache-Control: private, no-cache, no-store` (canlıda doğrulandı). `PUBLIC_CACHE_SECONDS=0` ve değer **derleme anında** okunuyor (`next.config.ts`). Kök düzen `headers()` okuduğu için sayfalar tamamen dinamik; "HTML'i statik/ISR yap" roadmap borcu (P0-1c).
- Veri önbelleği (`unstable_cache` + dönem sayacı) süreç belleğinde; PM2 `instances:1, fork`. Yatay ölçek ve sıfır kesinti yeniden başlatma yok.
- Karşılaştırma: referans tema + sayfa önbellek eklentisi önbelleğiyle TTFB 30–80 ms; NexPress 100–230 ms. Tek sunucuda yeterli, trafik artınca CDN `s-maxage` + `stale-while-revalidate` (çalışma zamanı ayarı, derleme zamanı değil) kritik.
- `ara katman` her 15 sn'de `/api/locale-mode`'a kendi kendine HTTP çağrısı yapıyor (`middleware.ts:14–36`, 800 ms zaman aşımı). Çağrı hem başarısız hem önbellek boşsa `index` varsayılanı **`true`** (`:38`): soğuk başlangıçta bir kesinti, kapalı bir sitenin kısa süre `noindex`'siz yayınlanmasına yol açabilir.

### 3.4 Perfornext eklentisi (v1.2.0)

Önbellek ön ısıtma, DB bakımı (revizyon budama, 404/çöp temizliği), medya denetimi, bütçe. İyi bir bakım paneli; ancak **"Core Web Vitals" modülü yalnız içerikten tahmin** (LCP/CLS "riski", DOM, HTML KB): gerçek ölçüm (RUM/CrUX) değil. Adlandırma kullanıcıyı yanıltabilir; "tahmini ağırlık raporu" demek daha doğru. Gerçek veri için: PageSpeed Insights/CrUX API (anahtar yeter, JS gerekmez) ya da isteğe bağlı `web-vitals` (≈1,5 KB, onay çerezli).

---

## 4. referans tema (tema + blok + Pro) kıyaslaması

Durum: ✅ var · ◐ kısmi · ❌ yok · 🅿 bilerek yok (0-KB kuralı). Kaynak: kod taraması + `docs/20` (önceki referans analizi) + canlı çıktı.

### 4.1 Tema özelleştirici

| referans tema | NexPress | Durum |
| :--- | :--- | :-: |
| Genel renk paleti | 6 palet, token'lar, karanlık palet | ✅ |
| **Tipografi (aile, boyut, harf aralığı; Google/yerel yazı tipi)** | Yalnız başlık ağırlığı, satır yüksekliği, dönüşüm; `googleFonts` bayrağı **ölü**; yazı tipi yükleme/self-host yok; CSP dış yazı tipini kapatır | ❌ **en büyük açık** |
| Üst bilgi oluşturucu (satır/öğe, yapışkan, şeffaf, mobil ayrı) | Bölge dizileri, mobil dizi, cam/şeffaf/yapışkan, kütüphane | ✅ |
| Off-canvas mobil menü | `<details>` açılır liste | ◐ (docs/12 bilinen) |
| Mega menü | Menü ağacı + `site-nav.tsx` içinde destek var | ◐ (doğrulanmadı) |
| Alt bilgi oluşturucu | Sütun, menü, widget alanları | ✅ |
| Kenar çubuğu / widget alanları | ✅ (sayfa türüne göre) | ✅ |
| Hooked Elements + görüntüleme koşulları | Şablon koşulları: adres/kategori/etiket/tür/dil. Kullanıcı rolü/oturum koşulu bilerek yok (önbellek) | ◐ |
| Koşullu üst bilgi | Şablon atama ile | ✅ |
| Sayfa bazında geçersiz kılma (başlığı gizle, şeffaf header, düzen) | Bulunamadı; yalnız şablon ataması | ❌ (?) |
| Karanlık mod + ziyaretçi anahtarı | `prefers-color-scheme` otomatik; anahtar yok | ◐ 🅿 |
| Başlangıç şablonları / kütüphane | 6 resmi tema, `.nxtheme`, **194 kütüphane öğesi**, yapay zeka tasarımı | ✅ güçlü |
| Özel CSS / header-footer betiği | Var (yalnız admin) | ✅ |
| Arşiv/blog düzeni, kırıntı, yorumlar | Var | ✅ |
| Sonsuz kaydırma, yerel Gravatar | Yok / gerekmez | ❌/n.a. |
| Beyaz etiket | Yok | ❌ |

### 4.2 Blok ve editör (referans blok paketi + blok editörü)

| Alan | Durum | Not |
| :--- | :-: | :--- |
| Blok genişliği | ✅ | 77 blok türü ≈ referans tema ~60 blok |
| Satır/sütun + ön ayar oranları, mobil yığılma, sütun sırası | ✅ | |
| Stil motoru: aygıt başına denetim, hover, gradyan, gölge, şekil ayırıcı, arka plan video | ✅ | |
| Sorgu döngüsü + süzgeç/sıralama/sayfalama | ✅ | Derecelendirme süzgeci yok; özel alan süzgeci yok |
| Form oluşturucu (koşullu alan, webhook) | ✅ | |
| Sayaç, marquee, akordeon, sekme, galeri, slayt, geri sayım, modal | ✅ | CSS-only |
| **Lottie** | ❌ | docs/20'de bilinçli ertelendi |
| Giriş animasyonu | ◐ | `blocks-motion` + `block-style`; kapsam sınırlı |
| Sekme/akordeon/menü etkileşimi JS'siz | ✅ 🅿 | `<details>` |
| Serbest SVG vektör bloğu | ❌ | güvenlik kararı; `vector_mark` yalnız hazır |
| Senkron desen (reusable) | ✅ `synced_pattern` | Desen merkezi (paylaşımlı kütüphane) yok |
| Dinamik içerik (özel alan, özel alan benzeri) | ❌ | **Özel yazı türü ve özel alan yok**; türler sabit (`page, post, kb_tech, ai_prompt, campaign, product`) |
| Geri al/yinele, revizyon, otomatik kayıt | ✅ | |
| Eşzamanlı düzenleme/kilit | ❌ (?) | yok olarak işaretlendi |
| Mobil/tablet düzenleme önizlemesi | ✅ | |
| Yapay zekâ yaz/düzenle, AI tasarım | ✅ | WordPress'te Pro/eklenti |
| Koşullu blok görünürlüğü (rol/oturum/tarih) | ◐ | Aygıt gizleme var; kullanıcı koşulu bilerek yok |

### 4.3 WordPress ekosistemi (alternatif olmak için gerekenler)

| Alan | Durum | Neden önemli |
| :--- | :-: | :--- |
| Eklenti pazarı / üçüncü taraf eklenti API'si | ❌ | Eklenti yazmak yalnız monorepo içinden; `register.ts` kompozisyon kökü var, **dışarıdan yükleme yok** |
| Özel yazı türü, özel taksonomi, özel alan | ❌ | özel alan / özel yazı türü eklentileri, kurumsal sitelerin temel ihtiyacı |
| Ödeme ağ geçidi / vergi | ❌ | Ticaret "kapıda ödeme simülasyonu"; iyzico/PayTR/Stripe yok (docs/09) |
| Çok yazarlı rol matrisi (author, shop-manager) | ◐ | Yalnız `admin` + `editor` (docs/12 P1) |
| E-posta pazarlama / bülten formu | ◐ | Form modülü var; footer bülten yuvası yok |
| Çerez onayı / KVKK banner | ❌ | Türkiye pazarı için şart; JS gerektirir → onaylı küçük betik tasarlanmalı |
| Kullanıcı kaydı / üyelik (ziyaretçi) | ◐ | `members_only` kapısı var, ziyaretçi kayıt akışı yok |
| Arama (site içi) | ✅ | BM25, JS'siz |
| Çok sunucu / Redis / S3 medya | ❌ | tek sunucu |
| Yedek | ✅ | Sunucu dışına kopya sizde |
| WordPress içe aktarma | ✅ | WXR + canlı köprü; **şablon değişkeni çevirisi eksik (§2.1)** |

---

## 5. Eklentilerin incelemesi

| Eklenti | Gerçek durum | Riskler / eksikler |
| :--- | :--- | :--- |
| `@nexpress-pro/agentic-seo` 6.0 (33 modül) | Kod, test ve panel kartlarıyla gerçek; manifestte 34 modül `ready`. Birçok modül `OPENAI_API_KEY`'e bağlı (canlıda tanımlı olduğu doğrulanamadı) | Canlıda Speakable çıkıyor; `LocalBusiness` çıkmıyor (ayar doldurulmuş mu **doğrulanamadı**). `/api/mcp` GET herkese açık araç listesi dönüyor (tasarım gereği; hız sınırı doğrulanmadı) |
| `@nexpress-pro/ai-design` 1.0 | ~125 satır; üret → doğrula → tek onarım turu. Küçük ve sağlam | Tek model çağrısı, görsel doğrulama (render + kontrast) yok; 1 test dosyası |
| `plugin-wp-bridge` 0.3.1 + PHP eklentisi | En kritik göç aracı; zengin blok derleyicisi, 350 KB sınırı, tek kullanımlık eşleştirme | **Başlık şablonu hatası (§2.1)**; sağlama/doğrulama aşaması yok (aktarım sonrası "başlık, açıklama, şema kalite kapısı" raporu verilmeli) |
| `plugin-perfornext` 1.2.0 | Faydalı bakım paneli | CWV adı yanıltıcı (§3.4) |
| `plugin-design-studio`, `campaigns`, `commerce`, `marketplaces`, `seo-basic` | Panel modülleri; pazar yeri sürücüleri (5) | `packages/commerce` ve `packages/marketplace` testsiz (0 test dosyası); ticarette ödeme yok |
| Lisans (Ed25519 çevrimdışı) | Tasarım sağlam | Lisans üretme/ihraç aracı ve iptal listesi yok |

---

## 6. Test, CI ve süreç

- **Yeşil:** 508 test geçiyor, tip kontrolü temiz. `packages/core` (54 dosya) ve `database` (66 test, SQLite + PG eşlik) iyi korunmuş.
- **Boşluk:** `apps/cms` ~56 bin satır, yalnız **7** test dosyası. **Ziyaretçi sayfasının `<head>` ve JSON-LD çıktısını doğrulayan test yok.** §2.1–§2.3'ün hiçbiri CI'da yakalanamazdı. Öneri:
  1. `seo-contract` testi: tohum veriyle derlenmiş uygulamayı başlat, her içerik türü için `<title>` (boş/yalnız ayraç değil, ≤60), tek `<h1>`, canonical, `og:type`, JSON-LD geçerliliği (`validateSchemaGraph`), `datePublished`, bilinmeyen alan yokluğu.
  2. Lighthouse CI (veya `lighthouse` + bütçe): LCP/TBT/CLS eşikleri, `a11y` ≥95.
  3. Köprü için "WordPress'ten gelen ayar → render edilen başlık" uçtan uca testi.
- `a11y` işi var (axe), yeşil. Lighthouse renk karşıtlığı hatasını yakalamıyor çünkü yönetim ve örnek tarama ziyaretçi temalarını kapsamıyor olabilir (?).
- Doküman: `docs/25` "%100 uyumlu" diyor; §2'deki tutarsızlıklar (özellikle BreadcrumbList) bu ifadeyi yumuşatmayı gerektiriyor. Çözümleyicideki sabit `pass` kontrolü (`engine.ts:362`) "gerçek çıktıyı doğrulamayan skor" üretir; gerçek `buildPageSchemaGraph` çıktısıyla doğrulansın.

## 7. Güvenlik ve depo hijyeni

**İyi:** Next 15.5.28 (CVE-2025-29927 yaması dahil; `x-middleware-subrequest` denemesi `/admin` için 307 döndü, aşılmadı). HSTS, CSP, `nosniff`, `Permissions-Policy`. scrypt, TOTP, `secret-box`, oturum veritabanı doğrulaması. 156 server action tarandı: korumasız görünenlerin tümü ya genel (giriş, yorum, sepet) ya da yerel `guard()`/`ctx()` sarmalayıcılarıyla `requireAdmin/requireUser` çağırıyor (perfornext, şablon, stüdyo örneklendi; 27 işaretlenenin tamamı tek tek incelenmedi).

**İzlenecek:**
1. CSP `script-src 'unsafe-inline'` (Next satır içi betikleri nedeniyle; Lighthouse "High"). Nonce'lu CSP roadmap'te.
2. Giriş/yorum hız sınırları bellek içi; yeniden başlatmada sıfırlanır, çok örnekte işlemez.
3. Ara katman `index` varsayılanı fail-open (§3.3).
4. CI dağıtımı `root` SSH ile (kısıtlı anahtar) yapılıyor; kök yerine sınırlı kullanıcı + `sudo` tek komut daha güvenli. Anahtar yalnız GitHub sırrında olmalı (yerelde `~/.ssh/ileriseo_deploy` bulunuyor).
5. Depo: `apps/cms/data/media/**` altında 27 türev dosya (2,8 MB) `.gitignore`'a rağmen izleniyor; `docs/akinsoftizmir-com-tr-aktarim` (47 dosya, 6 MB, tam bir Next uygulaması + `.env.example`) dokümanlar altında; paket boyutu ve arama kirliliği için `data/` altına ya da ayrı depoya alın.
6. AGENTS §6 (üçüncü taraf adı yasağı): `README.md` ve `[locale]/layout.tsx:109` yorumunda ürün adı geçiyor.
7. `.env.example` içinde `AUTH_SECRET` ve yönetici parolası örneği var; üretimde reddediliyor (doküman) — canlıda yönetici 2FA'sı (`REQUIRE_ADMIN_2FA`) açık mı **doğrulanamadı**.

## 8. Sunucu içi doğrulanamayanlar (sizden bir kez bakmanızı isterim)

Aşağıdakiler SSH gerektirir; kasıtlı bakılmadı:

- nginx: `gzip/brotli`, `www`→apeks 301, `/_next/static` ve `/media` önbellek başlıkları, HTTP/3, `limit_req`.
- PM2/systemd: örnek sayısı, bellek (`max_memory_restart: 1G`), log döndürme.
- PostgreSQL: yedek cron'u (`/api/cron/backup`), `pg_dump` sunucu dışına kopya, vacuum/analyze, indeksler.
- `.env`: `OPENAI_API_KEY`, `INDEXNOW_API_KEY`, `CRON_SECRET`, `REQUIRE_ADMIN_2FA`, `SMTP_URL`, `PUBLIC_CACHE_SECONDS`.
- `MEDIA_DIR` kalıcı birimi ve yedeği; güncelleme betiğinin geri alma (rollback) davranışı.

---

## 9. Öncelikli yol haritası

### Faz A — Yayına açılmadan önce (1–3 gün)
1. Başlık şablonu: köprü eşlemesi + token çevirisi + boş sonuç yedeği + test (§2.1).
2. Şema: `datePublished`, `BreadcrumbList`, `og:type=article`, `cleanAttrs` izin listesi, sahte yazar adı kaldır, `image` yedeği (§2.2).
3. SEO çözümleyici: `html` içindeki bağlantıları say, Markdown derleyiciden istatistik al (§2.3).
4. Favicon/site simgesi + manifest (§2.5).
5. Çift `<h1>` temizliği; meta açıklama kesimini kelime sınırında ve `…` ile yap; veri düzeltme (§2.6).
6. `seo-contract` + Lighthouse CI (§6). `www` yönlendirmesi, `INDEXNOW`, Search Console.

### Faz B — referans tema'e denklik (2–4 hafta)
1. **Yazı tipi sistemi:** site genelinde ve blok başına yazı tipi ailesi; self-host (woff2 yükleme + `@font-face`, `font-display: swap`, ön yükleme); ölü `googleFonts` bayrağını kaldır.
2. Off-canvas mobil menü (CSS-only `:target`/`<dialog>`), mega menü doğrulama/tamamlama.
3. Sayfa bazlı geçersiz kılma (başlığı gizle, şeffaf header, içerik genişliği, kenar çubuğu) — şablondan ayrı hafif "Sayfa seçenekleri" paneli.
4. Ziyaretçi için çerez onayı/KVKK (onaylı betik bütçesiyle).
5. Genel CSS'i ziyaretçi/yönetim olarak ayır (24 KB → ~8–12 KB hedef); ortak blok CSS'ini deduplike et.

### Faz C — WordPress'e alternatif olmak için (1–3 ay)
1. **Özel yazı türü + özel alan** (Drizzle `content_types` + alan tanımı, blok/şablonlarda dinamik bağlama). En yüksek kaldıraçlı eksik.
2. Dışarıdan eklenti yükleme (paket formatı, imza, izolasyon) ve belge.
3. Ödeme ağ geçitleri (iyzico/PayTR/Stripe) + vergi; ticaret testleri.
4. Rol matrisi (`author`, `shop-manager`), ziyaretçi üyelik akışı.
5. Redis/S3 + CDN HTML önbelleği (çalışma zamanı `s-maxage`, ISR) ve çok örnek desteği.
6. RUM/CrUX alan verisi, Perfornext'te "tahmin" ile "ölçülen" ayrımı.

---

## 10. Ek: ham ölçüm özeti

- 132 sayfa: durum 200×132; ortanca gzip HTML 49,7 KB (maks 70,2); TTFB ortanca 0,226 s, p95 0,291 s.
- Ana sayfa: 259 470 bayt ham HTML, flight 153 922 bayt, satır içi stil 22 117 bayt, 188 bağlantı, 13 görsel (11 lazy, hepsi alt'lı).
- `x-robots-tag: noindex, nofollow`; `robots.txt` = 26 bayt; `sitemap.xml` = 123 bayt (boş indeks); `llms.txt` 39,6 KB; `ai-sitemap.json` 132 öğe; `.well-known/{nlweb,ai-plugin,mcp}.json` 200; `merchant-feed.xml` 200; `indexnow-key.txt` 404; `favicon.ico` 404; `manifest.webmanifest` 404; `www` 200.
- Lighthouse ham çıktıları: oturum scratchpad'inde (`.../scratchpad/lh/*.json`).
