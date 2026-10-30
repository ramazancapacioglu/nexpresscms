# 18 — Panel Düzenlemesi, Eksik Sayfalar ve AI Tasarım Eklentisi (Plan)

Durum günlüğü `docs/06-PROGRESS-LOG.md`'dedir. Bu doküman kapsamı, sınırları ve sırayı sabitler.

## 0. Karar notları

- "Gele düzenlemeleri" ifadesi **genel düzenlemeler** (panelin tutarlılık/cila işleri) diye yorumlandı; farklıysa bu doküman güncellenir.
- AI tasarım **yazmaz, yayınlamaz**: model çıktısı doğrulanır, raporlanır ve kullanıcı onayıyla **tasarım kütüphanesine** kaydedilir. Sayfaya uygulamak editörde ayrı ve görünür bir eylemdir.
- Gerçek model çağrısı `OPENAI_API_KEY` ister (şu an boş). Anahtarsız çalışan kısımlar: bilgi paketi, doğrulayıcılar, kütüphane, "dış sohbet için komut kopyala". Canlı üretim **sahte sunucuyla** doğrulanır, gerçek anahtarla denenmedi diye raporlanır.

## 1. Sıra

| # | İş | Çıktı |
| :-- | :-- | :-- |
| 1 | Ortak sohbet istemcisi çekirdeğe (`@nexpress/core/ai-chat`); Agentic eklentisi onu kullanır | tek soyutlama |
| 2 | **AI tasarım bilgi paketi** + doğrulayıcılar (saf, testli): blok sözleşmesi, SEO/GEO sınırları, tasarım jetonu sınırları (WCAG kontrast), tema/üst-alt bilgi şemaları | `@nexpress/core` modülleri |
| 3 | `design_library` tablosu + depo + göç `0013` | kalıcı, kiracıya kapalı kütüphane |
| 4 | **Pro eklenti `@nexpress-pro/ai-design`**: bölüm / sayfa / tema üretimi, doğrulama + tek otomatik onarım turu, hız sınırı, `ai-design.generate` eylemi | eklenti + manifest |
| 5 | **Eksik panel sayfaları**: `/admin/design-library` (kütüphane + AI üretici), `/admin/seo/audit` (site geneli SEO denetimi), `/admin/integrations` (AI, e-posta, IndexNow, MCP durumu), `/admin/help` (kısayollar ve belgeler) | 4 sayfa |
| 6 | Editörde tasarım kütüphanesi: "Benim tasarımlarım" sekmesi (kaydedilen bölüm/paketler) ve AI üreticiye geçiş | editör |
| 7 | **Sayfa içi SEO**: meta açıklaması ve TL;DR ayrıldı, gerçek adresle SERP (masaüstü/mobil), uzunluk ölçerleri, sosyal kart önizlemesi, canonical/noindex/nofollow, ikincil anahtar kelimeler | SEO sekmesi |
| 8 | **Panel arayüzü/genel**: Türkçe breadcrumb, yükleme iskeleti ve hata sınırı (`loading.tsx`/`error.tsx`), başlangıç kontrol listesi, tutarlı sayfa başlığı bileşeni | kabuk |
| 9 | Test, dokümanlar, CI, her aşama ayrı commit | — |

## 2. AI tasarım güvenlik/sınır kuralları (doğrulayıcıların kodladığı)

**Blok:** yalnızca bilinen `BlockType`; `props` yalnızca bildirilen alanlar, metinler sınırlı uzunlukta, URL'ler `/`, `#`, `http(s)` ve medya başvurusu; `javascript:`/`data:` yok; betik, satır içi stil ve iframe yok (ön yüzde 0 KB JS kuralı).
**SEO/GEO (sayfa):** tam bir `h1` (hero başlığı); başlık sırası atlanmaz; `tldr` 40–260 karakter ve Answer-First; görsel varsa alt metin; bir sayfada en çok 1 birincil CTA grubu ve 14 bölüm; SSS varsa `faq_accordion` (şema üretir); sahte veri yok (uydurma puan/yorum/rakam "Demo verisi" etiketsiz kalamaz); iç bağlantılar yalnızca sitede var olan yollara.
**Tema:** jeton renkleri `#rrggbb`; metin/arka plan kontrastı en az 4.5:1 (büyük metin 3:1), birincil düğme metni 4.5:1; yazı tipleri güvenli listeden; yarıçap/ölçek aralıkları sınırlı. Tema çıktısı mevcut `.nxtheme` şemasından geçer (`@nexpress/themes/package`).

## 3. Kapsam dışı (bilinçli)

Görsel (resim) üretimi, modelin site verisine yazma erişimi, otomatik yayın, çoklu model karşılaştırması, gerçek anahtarla kalite ölçümü.

## 4. Durum (2026-10-30)

Tüm sıra maddeleri uygulandı. Doğrulama: çekirdek (112), editör sözleşme testi, eklenti (5), veritabanı (iki motor) testleri; gerçek derlemede **sahte OpenAI sunucusuyla** uçtan uca (sayfa üretimi → hatalı ilk çıktı → otomatik onarım → kayıt → taslak sayfa oluşturma; bölüm; tema → onarım → kurulum; yapıştırılan hatalı JSON'un reddi ve kaydet düğmesinin kilitlenmesi; editör "Benim tasarımlarım"; SEO sekmesi alanları ve ölçerleri); axe taraması 34 sayfa × 2 görünüm.

### Gerçek modelle doğrulama (2026-10-30, gpt-4o-mini)

Gerçek OpenAI anahtarıyla sayfa, bölüm ve tema üretimi uçtan uca denendi (üretim → doğrulama → kayıt → taslak sayfa → tema kurulumu). İlk koşu **iki gerçek hata** buldu, düzeltildi ve testlendi:
1. Model blok alanlarını `props` yerine bloğun köküne düz yazıyordu → tüm zorunlu alanlar boş sayılıp sayfa 0/100 oluyordu. `lintDesign` artık düz alanları `props`'a toplar (`props` varsa üstündür); komut da "alanlar HER ZAMAN props içindedir" örneğiyle netleştirildi.
2. Tema renklerinde kontrast hatası (ör. orta tonlu zeminde beyaz metin) tek onarım turunda düzelmiyordu → `autoFixContrast`: kontrast belirleyici biçimde, tonu koruyarak onarılır (önce zeminden uzaklaşan yön, olmazsa karşı yön), koyu kip düzeltmeleri `darkColors`a yazılır ve raporda "N renk kontrast için otomatik ayarlandı" uyarısı çıkar.
Sonuç (üç tarif): sayfa 100/100 (9 blok, 206 sözcük, ilk denemede, editörde SEO 91/100), bölüm 95, tema 95 — hepsi tek model çağrısıyla. Ayrıca public `[locale]` sayfası geçersiz dil parçasında (`/favicon.ico`) `RangeError` ile 500 veriyordu; `format()` artık geçersiz dil etiketinde `tr` kurallarına düşer.

**Doğrulanmayanlar:** yalnızca gpt-4o-mini denendi (daha büyük modellerle kalite karşılaştırması yok); tek tarifli küçük örneklem; üretilen sayfanın metin kalitesi (içerik doğruluğu) editör tarafından gözden geçirilmelidir.
