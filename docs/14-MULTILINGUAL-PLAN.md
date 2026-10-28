# 14 — Çok Dilli Altyapı Planı

> **Durum: PLAN.** Arayüz dili şimdilik Türkçedir (AGENTS.md kural 8). Bu doküman ikinci dil eklenmeden önce hazırlanacak altyapıyı tanımlar. Faz başladığında kural 8 güncellenir (çeviri dosyası ve dil tablosu yasağı kalkar).

## 1. Bugün ne var, ne yok?

**Hazır olanlar**
- URL: `/{locale}/{slug}`; `/{locale}` kökü yalnızca `sites.supportedLocales` içindeki diller için 200 döner.
- Veri: `content_translations` (içerik × dil × bölge, dil başına ayrı `slug`, meta, `markdownCache`); `navigation_layouts` dil başınadır; `taxonomies.locale` sütunu var; RAG parçalarında `locale` var.
- Site haritası: tüm çeviriler karşılıklı `hreflang` + `x-default` ile bağlanır (`docs/04` §1).

**Eksik olanlar (denetimle doğrulandı)**
| Alan | Durum |
| :--- | :--- |
| `<head>` içinde `alternates.languages` (hreflang) ve dil başına canonical | Yok (yalnızca sitemap'te) |
| Ziyaretçi dil değiştirici ve insan için dil önerisi (botlara asla yönlendirme) | Yok |
| Arayüz metinleri (ön yüz bileşenlerinde ve temalarda) | **Türkçe sabit** (örn. "Değerlendirmeler", "Paylaş", "Okuma süresi") |
| Mesaj kataloğu / tip güvenli anahtarlar | Yok |
| Çeviri iş akışı (kaynaktan çeviri oluştur, "çeviri gerekiyor" durumu, eksik çeviri raporu) | Yok; editör tek dil düzenler |
| Dil başına site ayarları (ad, slogan, SEO şablonları, sosyal görsel) | Yok; `sites.name/tagline` tek |
| Medya alt metni / başlık / altyazı dil başına | Yok; tek `altText` |
| Yerel ayara duyarlı metin işlemleri | `slugify` yalnızca Türkçe haritalı; `toLocaleLowerCase("tr")` sabit |
| SEO motoru dil kuralları (okunabilirlik, durak sözcükler, klişe listesi) | Türkçeye göre |
| Ticaret: ürün alanları/para birimi/fiyat dil-bölge başına | Tek dil/tek para birimi |
| `llms.txt`, `llms-full.txt`, `ai-sitemap.json`, MCP | Yalnızca `tr` |
| RAG: dil bazlı sorgu yönlendirme | Parçalar dilli ama arama `tr` varsayar |
| Tarih/sayı/para biçimleri | `tr-TR` sabit |
| RTL (Arapça, İbranice) | Yok |
| Yönetim paneli arayüz dili | Yok (Türkçe sabit) |

## 2. Tasarım kararları

1. **URL stratejisi:** her zaman dil öneki (`/tr`, `/en`); varsayılan dil önekisiz sunulmaz (tekil canonical, basit hreflang). Bölge ayrımı isteğe bağlı (`en-us`, `en-gb`) ve `content_translations.region` ile saklanır; URL öneki yalnızca dildir, bölge ayrı site/alan adı gerektirir (v1 kapsam dışı).
2. **Dil kaynağı:** `sites.supportedLocales` kalır (kural 8). İkinci dil açılırken **ayrı `locales` tablosu açılmaz**; gerekirse dil başına ayar `sites.settings.locales[locale]` altında tutulur (ad, slogan, SEO şablonu, sosyal görsel, tarih biçimi, yön `ltr|rtl`, yerel adı).
3. **Mesaj kataloğu:** `@nexpress/i18n` paketi; `messages/tr.json`, `messages/en.json`; **anahtarlar TypeScript tipine derlenir** (eksik anahtar derleme hatası), ICU benzeri çoğul ve değişken desteği (`Intl.PluralRules`). Sunucu bileşenlerinde `getMessages(locale)`; **istemci JS'e katalog taşınmaz** (0 KB kuralı). Tema, bloklar ve ön yüz bileşenleri anahtar kullanır.
4. **İçerik çevirisi:** editörde "Diller" şeridi: her dil için durum (`yok | taslak | yayında | kaynak değişti`). "Kaynaktan çeviri oluştur" blok ağacını kopyalar, `translationOf` ve `sourceHash` ile bağlar; kaynak değişince çeviri "gözden geçir" olur. Çeviri, aynı `contentId` altında yeni `content_translations` satırıdır (şema hazır). İsteğe bağlı **AI çeviri taslağı** (Pro eklenti, sağlayıcı yapılandırılabilir; çıktı daima taslak).
5. **SEO:** `generateMetadata` içinde `alternates.languages` + `x-default`; dil başına canonical; `og:locale:alternate`; JSON-LD `inLanguage`; çevirisi olmayan dile bağlantı verilmez (hreflang yalnızca var olan çeviriler).
6. **Dil algılama:** botlara yönlendirme yok (mevcut kural); insanlara kapatılabilir üst bar önerisi (`Accept-Language` + çerez), zorunlu yönlendirme yok.
7. **Medya:** `media_assets.altText/titleText/caption` dil başına `translations` JSON'una taşınır (`{tr:{alt,..},en:{..}}`); görsel bloğu yerelleştirilmiş alt metni seçer.
8. **Metin işleme:** `slugify(text, locale)` dil başına dönüştürme tabloları (tr, de, es, fr, …) + Unicode `NFKD` yedeği; `toLocaleLowerCase(locale)`; SEO motoru dil profilleri (durak sözcük, ortalama cümle uzunluğu eşiği, klişe listesi) `SeoLanguageProfile` olarak dil başına.
9. **RAG/GEO:** `searchCorpus(locale)`; MCP araçlarına `locale` parametresi; `llms.txt` dil bölümleri ve `/{locale}/llms.txt`; `ai-sitemap.json` dil kırılımı; gömme sağlayıcısı çok dilli model olmalıdır (yerel sözcüksel model dil başına token kuralı gerektirir).
10. **Ticaret:** ürün adı/açıklaması çeviri tablosu (`commerce_product_translations`), fiyat bölge/para birimi başına (`commerce_prices`); sepet para birimi dil ile değil bölge ile seçilir. v1: yalnızca metin çevirisi, tek para birimi.
11. **RTL:** `<html lang dir>`; tema ve bloklarda mantıksal CSS özellikleri (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`); Tailwind `rtl:` değiştiricileri; RTL için görsel regresyon turu.
12. **Panel arayüz dili:** yönetim paneli katalog kullanır, kullanıcı başına dil seçimi (`users.uiLocale`); içerik dili (düzenlenen çeviri) arayüz dilinden bağımsızdır.

## 3. Uygulama fazları

| Faz | İçerik | Doğrulama |
| :--- | :--- | :--- |
| **L1** | `@nexpress/i18n` + Türkçe katalog; ön yüzdeki sabit metinlerin anahtara taşınması (davranış değişmez) | Çıktı HTML'i bölme öncesiyle aynı; tip kontrolü eksik anahtarı yakalar |
| **L2** | `<head>` hreflang/canonical/`inLanguage`, dil başına site ayarları, `slugify` ve SEO dil profilleri | Birim testleri; iki dilli örnek veriyle HTML denetimi |
| **L3** | Editörde diller şeridi, kaynaktan çeviri, durumlar, eksik çeviri raporu; medya çevirisi | Uçtan uca: çeviri oluştur → yayınla → hreflang karşılıklı |
| **L4** | Dil değiştirici, insan için dil önerisi, dil başına navigasyon/footer, `llms*.txt`/`ai-sitemap`/MCP/RAG dil kırılımı | Bot yönlendirmesi yok doğrulaması; sitemap ve hreflang tutarlılığı |
| **L5** | Panel arayüz dili, RTL, ticaret çevirileri, (Pro) AI çeviri taslağı | RTL görsel denetim, panel katalog kapsamı |

**Çıkış ölçütü:** ikinci bir dil (örn. `en`) örnek verisiyle uçtan uca çalışır; kataloğu eksik anahtarla derleme başarısız olur; hreflang her çeviri çiftinde karşılıklıdır; `/zzz` 404 kalır.

## 4. Riskler

- Sabit metinlerin dağınıklığı: L1'de otomatik tarama (Türkçe karakter içeren JSX metni) ile kapsam ölçülür.
- Aynı `slug` farklı dillerde: tekillik `(siteId, locale, slug)` ile korunur (şemada var).
- Önbellek anahtarları dili içermeli (`cachedRead` argümanları zaten `locale` taşır; dönem sayacı site başınadır).
- Yerel gömme modeli çok dilli değildir; çok dilli sitede anlamsal sağlayıcı önerilir.
