# 20 — Referans Eklenti/Tema İncelemesi ve Gerçek Editör Planı

> Kaynak: yerel referans ortamı (`tools/wp-reference/`, lisanslı paketler `docs/kadence-referans-eklentiler/` altında, depoya girmez). Bu belge ürün adlarını anmaz (AGENTS.md §6); "referans blok paketi", "referans tema" vb. denir. İnceleme 2026-11-03: paket kaynakları (`block.json` envanteri, tema özelleştirici seçenekleri, eklenti modülleri) + canlı editör ekran görüntüleri + içe aktarılan demo içerik.

## 1. Bulgular

### 1.1 Blok kataloğu (referans blok paketi, ücretsiz + Pro)
`block.json` envanteri: **~60 blok, ~90 kayıt** (iç blokları ve form alanlarını sayarak). Gruplar:

| Grup | Referans blokları | Bizdeki durum |
|---|---|---|
| Düzen | Satır (170 öznitelik), Sütun, Boşluk, Bölüm ayırıcı | `columns`/`column`/`section`/`divider_spacer` var; öznitelik zenginliği düşük |
| Metin | Gelişmiş metin (145 öznitelik: tipografi, vurgu/işaret, gradyan, metin gölgesi, simge), Liste, İçindekiler | `heading`/`paragraph`/`list_element`/`toc`; tipografi yok |
| Düğme | Düğme grubu + Tek düğme (132 öznitelik: hover, gradyan, simge, kenarlık) | `button_element`/`button_row`; hover/simge/gradyan yok |
| Medya | Görsel, Galeri, Video açılır, Lottie, Vektör, Harita, Simge, Tek simge | `image_figure`/`gallery`/`video_*`/`map_embed`; **simge, vektör, Lottie yok** |
| İçerik kutuları | Bilgi kutusu (89 öznitelik), Akordeon (+SSS şeması), Sekmeler, Tablo, Referanslar, İlerleme çubuğu, Sayaç, Geri sayım, Göster/gizle | Çoğu var; **sayaç (countup), referans şeması, gelişmiş tablo yok** |
| Dinamik (Pro) | Sorgu döngüsü + kart + süzgeçler (arama, aralık, onay kutusu, tarih, derecelendirme, sıralama, sayfalama, sonuç sayısı), Yazı/Çalışma ızgarası, Ürün atlıkarıncası, Tekrarlayıcı, Dinamik HTML/Liste, Kullanıcı bilgisi | `dynamic_list`, `post_grid`, `repeater`; **süzgeç/sayfalama/sıralama yok** |
| Etkileşim (Pro) | Slayt, Açılır pencere (modal), Görsel kapak, Bölünmüş içerik | Var (basit) |
| Form | Gelişmiş form + 16 alan türü | Form modülümüz var (`docs/16`) |
| Üst bilgi/menü | Header bloğu (satır/sütun/off-canvas), Navigasyon, Kimlik (logo), Arama | Şablon sistemi + menü ağacı var; **off-canvas/yapışkan/şeffaf yok** |
| Yaratıcı paket | **Marquee**, **animasyon (giriş efekti) eklentisi**, **sayfa sihirbazı (yapay zekâ ile sayfa)**, Premium tasarımlar | Marquee/animasyon yok; yapay zekâ sayfa üretimi var (`ai-design`) |

### 1.2 Denetçi (inspector) deneyimi — canlı gözlem
- Her blokta üç sekme: **Düzen/Genel · Stil · Gelişmiş**. Sekmeler bizdekiyle aynı (iyi).
- Her sekme **katlanır paneller**: Yazı tipi (+ "gelişmiş yazı tipi"), Kenarlık, Metin gölgesi, Metin yönü, Simge, Vurgu, Satır içi görsel, Üst/Alt ayırıcı…
- **Her denetimde aygıt anahtarı** (masaüstü/tablet/mobil) ve **"düzenlendi" noktası + tek tıkla sıfırla**.
- **Hazır ayar (Preset)**: bloğun stilini adlandırıp kaydetme/uygulama.
- **Hover durumu**: renk, arka plan, kenarlık, gölge için ayrı normal/hover sekmesi.
- Satır içi **kayan blok araç çubuğu** (taşı, seviye, hizalama, yapay zekâ, dinamik içerik, kalın/italik/bağlantı).
- Renkler **genel palet** değişkenlerinden seçilir (palet değişince tüm bloklar güncellenir).
- Arka plan: renk / gradyan / görsel (konum, boyut, ek, tekrar) / video; ayrıca **kaplama (overlay)** ve karışım kipi.
- **Yatay/alt şekil ayırıcıları** (dalga, eğim, üçgen…), satırda **sütun sırası değiştirme** ve **mobil yığılma düzeni**.

### 1.3 Tema özelleştirici (referans tema + Pro)
Seçenek grupları (`inc/customizer/options` listesi): genel renkler/palet, tipografi, düğmeler (birincil/ikincil/çizgi), düzen (içerik genişliği, kenar boşlukları), görüntü, performans, kırıntı, yorumlar, kenar çubuğu, sosyal, yukarı çık; **üst bilgi oluşturucu** (üst/ana/alt satır; logo, menü, ikincil menü, düğme, HTML, arama, sepet, hesap, sosyal, ayırıcı, tetikleyici, yapışkan, şeffaf, mobil ayrı); **alt bilgi oluşturucu** (üst/orta/alt satır, 6 widget sütunu, menü, sosyal, HTML); sayfa/yazı/arşiv/arama/404/ürün **tür başına yerleşim** (içerik stili, kenar çubuğu, başlık görünümü).
Pro eklenti modülleri: **Elements (koşullu kanca içeriği: üst/alt bilgi/blok, görüntüleme koşulları, kullanıcı rolü)**, koşullu üst bilgi, mega menü, üst bilgi eklentileri (hesap, ikinci düğme, iletişim, ayırıcılar), **karanlık mod**, sonsuz kaydırma, yerel gravatar, betik ekleme, WooCommerce eklentileri, gelişmiş sayfalar (arşiv meta).

### 1.4 Diğer eklentiler
Desen merkezi (ortak tasarım kitaplığı + sayfa desenleri), Dönüşümler (açılır pencere/hedef izleme), Insights (A/B testi), Sayfa geçişleri, Fiyat tablosu, Okuma süresi, Basit paylaşım, Özel yazı tipleri (yükleme), Beyaz etiket, Captcha, Galeriler, Mağaza kiti (ürün galerisi/hızlı bakış).

## 2. Bizim mimaride karşılığı — kısıtlar
- Ön yüz **0 KB istemci JS**: referansın JS gerektiren özellikleri (animasyon kütüphanesi, slider, sayaç) **CSS-only** karşılıkla çözülür: giriş animasyonu `animation-timeline: view()` (kademeli iyileştirme, desteklemeyen tarayıcıda sade görünüm), sekme/akordeon `<details>`/radyo, marquee CSS `@keyframes`. Gerçekten JS gereken (Lottie, karanlık mod anahtarı) Faz 4'te "isteğe bağlı küçük betik" bütçesiyle ele alınır, bütçe testi ayrıca güncellenir.
- Veri modeli: `BlockNode` JSON AST korunur; yeni stil alanları `BlockStyleValues`'a eklenir, derleyici `compileBlockStylesToCss` tek kaynaktır (editör ve ön yüz aynı CSS'i üretir).
- Tüm yeni CSS çıktıları `cssSafe` ile temizlenir; kullanıcı girdisi sözdizimini kıramaz.

## 3. Aşamalı plan

**Faz 1 — Stil motoru (bu turda başladı)**
1. `BlockStyleValues` genişler: tipografi (aile, ağırlık, satır yüksekliği, harf aralığı, büyük/küçük harf), kenar başına boşluk (sol/sağ kenar boşluğu), kenarlık stili, metin gölgesi, arka plan konum/boyut/sabit (paralaks), kaplama opaklığı, dönüşüm (kaydır/ölçek/döndür), geçiş süresi, hizalama (flex: dikey/yatay).
2. **Hover durumu** (`hover?: BlockStyleValues` alt kümesi) + **giriş animasyonu** (`animation`) derlenir.
3. Denetçi **Stil** sekmesi katlanır panellere bölünür; her denetimde aygıt anahtarı ve "düzenlendi + sıfırla".
4. Birim testleri (derleyici çıktısı, güvenlik temizliği).

**Faz 2 — Blok zenginliği**: simge/tek simge, sayaç (countup), referans (şema ile), gelişmiş tablo, ilerleme çubuğu, marquee, vektör; düğmede hover/simge/gradyan; satırda sütun sırası ve mobil yığılma, şekil ayırıcılar; arka plan video/gradyan oluşturucu.

**Faz 3 — Dinamik içerik**: sorgu döngüsü bloğu (süzgeç/sıralama/sayfalama, URL parametreli, RSC), kart şablonu seçimi, ürün atlıkarıncası.

**Faz 4 — Tema özelleştirici**: üst bilgi oluşturucu (satır/öğe, yapışkan/şeffaf, mobil ayrı), tür başına yerleşim seçenekleri, düğme/kırıntı/yukarı çık ayarları, **görüntüleme koşulları** (şablon koşulları: sayfa türü, kullanıcı oturumu, dil), karanlık mod (CSS `prefers-color-scheme` + kalıcı seçim), genel palet değişkenleri.

**Faz 5 — Hazır ayar/kitaplık**: stil ön ayarı kaydet/uygula, desen kitaplığı paylaşımı (içe/dışa aktarma zaten var), kayan blok araç çubuğu, A/B ve açılır pencere (Dönüşümler) Pro eklentisi olarak değerlendirilir.

## 4. Kabul ölçütleri
Her faz: birim testi, tarayıcıda (Playwright) doğrulama, `perf-budget.json` ihlali yok, `docs/06` kaydı, ürün adı geçmez.
