# 21 — Editör Yönü Kararı: WordPress blok editörü mü, kendi editörümüz mü?

> Tarih: 2026-11-03. İstek: "WordPress blocks ve editörün açık kaynak Next.js sürümü var; kurup uyarlayabilir miyiz?" Kaynaklar: npm kayıt defteri (sürüm/lisans/boyut/bağımlılık), [@wordpress/block-editor dokümanı](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/), [Isolated Block Editor](https://github.com/Automattic/isolated-block-editor), [Puck](https://github.com/puckeditor/puck) ve yerel referans ortamında (`tools/wp-reference`) canlı gözlem. Bu belge ürün adlarını yalnızca karar kanıtı olarak anar.

## 1. Soru: `@wordpress/block-editor` Next.js içinde kurulabilir mi?
**Teknik olarak evet, ürün olarak hayır.** Bulgular:

| Konu | Bulgu |
|---|---|
| Çalışır mı? | Paket kendini "standalone block editor" diye tanıtır (`BlockEditorProvider` + `BlockCanvas`); React 18/19 peer'ı vardır. Resmî örnek WordPress dışında çalışır, ama blok türlerini (`registerCoreBlocks`) ve üç ayrı stil dosyasını elle yüklemek gerekir. Next.js App Router için resmî rehber yok; yalnızca istemci bileşeni (`ssr:false`) olarak düşünülebilir. |
| **Lisans** | `@wordpress/block-editor`, `block-library`, `components`, `data`, `core-data`, `blocks`, `rich-text` … hepsi **GPL-2.0-or-later**. Güçlü copyleft: yazılımı dağıtırsak birleşik eserin GPL olması gerekir. NexPress açık çekirdek + **kapalı/lisanslı Pro eklentiler** modelindedir; GPL bağımlılık bu modeli (özellikle kapalı Pro paketlerini) hukuken tehlikeye atar. Karar vermeden önce hukuki görüş şarttır. |
| Boyut | block-editor ≈ 20 MB, block-library ≈ 18 MB, components ≈ 16 MB açılmış boyut; her biri 40–50 bağımlılık + `@wordpress/data`/`core-data` mağazaları. Yalnızca `/admin`'e yüklenir (ziyaretçiyi etkilemez) ama panel paketini ağırlaştırır ve Tailwind/shadcn panel stilleriyle çakışır. |
| İçerik modeli | Gutenberg bloğu bellekte `{name, attributes, innerBlocks}` nesnesidir (bizim `BlockNode`'a yakın), ama kalıcı biçim **HTML + blok yorumları**dır ve her blok `save()` fonksiyonuyla HTML üretir. Bizim ilkemiz JSON AST (RSC + yapay zekâ sözleşmesi); iki yönlü dönüştürücü + ~70 blok için Gutenberg blok tanımı (edit + save) yazmak gerekir. |
| Hazır blok? | WordPress çekirdek blokları (paragraf, grup, sütun…) gelir; referans blok paketinin blokları gelmez: onlar WordPress'in `wp.*` küresel nesnelerine ve çoğu PHP'ye (sorgu, yazı ızgarası, form) bağlıdır. "PHP yok" ilkemizle uyumsuzdur. |
| Olgunluk | Otonom (WordPress'siz) kullanım için Automattic'in Isolated Block Editor'ü vardır ama kendini "deneysel" ilan eder, belirli Gutenberg sürümüne (16.9) sabitlidir. |

**Sonuç:** Gutenberg'i çekirdek editör yapmıyoruz. Hukuki risk (GPL), ağırlık, içerik modeli uyumsuzluğu ve PHP bağımlılığı; getirdiği (satır içi düzenleme, araç çubuğu, ekleyici) bizim yığınımızda da yapılabilir.

## 2. Alternatif: Puck (MIT, React/Next.js için görsel editör)
- MIT, `@puckeditor/core` 0.24.0 (2026-10-29), ≈3 MB; bağımlılıklar zaten bizimkilerle örtüşür (TipTap, dnd-kit, Radix). Slot (iç içe bileşen), TipTap tabanlı `richtext` alanı (`contentEditable` ile satır içi), viewport (cihaz genişliği) rehberi, Next.js App Router tarifi var.
- **Çekinceler:** 1.0 öncesi (API oynak); bileşenin metinleri `ReactNode` olarak alması gerekir (satır içi düzenleme için) → ~70 blok oluşturucusunun hepsini yeniden yazmak; bizim cihaz bazlı stil modelimiz, şablonlar, yapay zekâ yazımı, şema kartları ve sürükle-bırak katmanımız yeniden entegre edilir.
- **Sonuç:** Şimdilik **benimsemiyoruz**; sürükle-bırak ve gezgin zaten bizde var. Eksik olan iki şeyi (satır içi düzenleme, gerçek önizleme çerçevesi) kendi yığınımızda çözmek daha ucuz ve riski düşük.

## 3. Kadence benzeri hissi veren şey gerçekte ne? (canlı ölçüm)
Referans editörde sayfa **sitenin kendisi gibi** görünür; her metne doğrudan tıklayıp yazılır, bloklar ince çerçeveyle seçilir, bloklar arasında "+" vardır, mobil/tablet görünümü gerçek medya sorgularıyla çalışır. Bizim editörde:
1. Her blok kart + etiketli başlık çubuğu içinde (gürültülü); sayfa başlığı ayrı alanda.
2. Vitrin, fiyat tablosu, SSS gibi **zengin blokların metni yalnızca sağ panelden** düzenlenir; tuvalde tıklanamaz (`pointer-events: none`).
3. Tuval yönetim panelinin DOM'unda çizilir: "tablet/mobil" önizlemesi gerçek medya sorgularını çalıştırmaz (yalnızca kapsayıcı daraltılır), site CSS'i ve header/footer yok.
4. Bloklar arası "+" ekleme noktası ve `/` komutuyla hızlı ekleme yok.

## 4. Karar: "Tuval v2" — kendi yığınımızda
Sıra (her adım ayrı teslim edilir, hepsi AST'yi ve 0-KB ön yüzü korur):
1. **Satır içi metin düzenleme (her blokta):** bloğun render çıktısındaki metin düğümleri blok özellikleriyle **DOM eşleştirmesiyle** bağlanır (`assignStringsToTexts`); eşleşen yaprak öğe `contenteditable` olur, `blur`/Enter'da `props` güncellenir. Render kodlarına dokunmadan ~70 blokta çalışır; eşleşmeyen metin sağ panelde kalır.
2. **Sade tuval:** kart/başlık çubuğu kaldırılır; seçili blokta ince çerçeve + yüzen araç çubuğu (üstte), üzerine gelince etiket.
3. **Bloklar arası "+" ve `/` komutu.**
4. **Gerçek önizleme çerçevesi (iframe):** site CSS'iyle, gerçek header/footer bağlamıyla; cihaz genişlikleri gerçek medya sorgularıyla.
5. **Sayfa başlığı tuval içinde** (ilk satır), SEO/meta alanları kenar panelde.
Bu adımlarla ilgili ilerleme `docs/06-PROGRESS-LOG.md`'de tutulur.

## 5. Açık kalan karar (sizin)
GPL: ileride Gutenberg'i yine de düşünürseniz önce lisans modelini netleştirin (açık çekirdeğin lisansı ve Pro eklentilerin dağıtım biçimi). Şu an kodda GPL bağımlılık **yoktur**.
