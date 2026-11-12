# 12 — Yol Haritası ve Bilinen Borçlar

Önceliklendirme ölçütü: **SEO / GEO / hız** doğrudan ürünün vaadidir; ardından güvenlik, sonra bakım borcu. Tamamlananlar `06-PROGRESS-LOG.md` içindedir.

## Yürütme sırası (güncel karar)

| Faz | İş | Durum |
| :--- | :--- | :--- |
| **F8** | Performans bütçesi testi + GitHub Actions (typecheck, test, build) | ✅ Tamam (CI GitHub'da henüz çalıştırılmadı) |
| **F9** | Kullanıcı yönetimi, profil/parola, oturum iptali, denetim günlüğü, **Ayarlar** sayfası | ✅ Tamam (davet/parola sıfırlama e-postası ve 2FA eklendi) |
| **F10** | Drizzle migration + şema paritesi testi + dialect dallarının sadeleştirilmesi + büyük dosyaların bölünmesi | ✅ Tamam (kalan: dondurulmuş `push.ts`) |
| **F11** | RAG: gerçek anahtarla kalite ölçümü, hibrit arama, site içi arama; bot politikası arayüzü (`robots.txt`); RSS, JSON-LD doğrulayıcı, kırık bağlantı denetimi | ✅ Tamam (kalan: gerçek OpenAI anahtarıyla kalite ölçümü, "bu siteye sor" yanıtı, dile göre llms/ai-sitemap). Dış bağlantı denetimi 2026-11-04'te yönetici isteğiyle eklendi. |
| **F12** | **Çok dilli altyapı** (L1–L5, `docs/14`) | ✅ Tamam (`password`/`members_only` erişim kapısı ve dil başına site adı/slogan/SEO başlık şablonu da tamamlandı; kalan, gerekçeli: ticaret çevirisi, insan için dil önerisi, AI çeviri taslağı, panel sayfa içi metinleri; `docs/14` §0) |
| **F13** | **Eklenti sistemi + tema paketleri** (`docs/13` §2–§3): eklenti envanteri/aç-kapa/ayar/lisans, tema yükle/önizle/etkinleştir/dışa aktar | ✅ Eklenti tarafı v1, **çevrimdışı Ed25519 Pro lisans doğrulaması** ve **tema paketleri v1** yapıldı (`docs/13` §0, §2.3, §3). Kalan: eklenti göçleri (`plugin_migrations`), tema yazı tipi dosyaları ve ayar geçmişi |
| **F14** | **Panel eksikleri** (`docs/13` §4): revizyonlar, otomatik kayıt, çöp, zamanlanmış yayın, yönlendirme/404, formlar, gerçek WP içe aktarma, medya klasörleri, yedekleme, sistem durumu, bildirimler, ⌘K kapsamı, mobil/a11y | 🔄 Revizyon, yerel otomatik kayıt, **çöp kutusu, zamanlanmış yayın, yönlendirme + 404, sistem durumu, formlar (sürükle-bırak kurucu, şablonlar, e-posta bildirimi, analiz), gelen kutusu, yedekleme/geri yükleme, gerçek WordPress (WXR) içe aktarma, medya klasörleri + toplu yükleme, bildirim merkezi** yapıldı. Kalan: görsel editör/tema özelleştirici mobil gözden geçirmesi (axe taraması CI'da). **2026-10-30:** panel genel düzenleme, eksik sayfalar (tasarım kütüphanesi, SEO denetimi, entegrasyonlar, yardım), AI Tasarım Pro ve sayfa içi SEO geliştirmeleri yapıldı (`docs/18`) (⌘K veri kapsamı, paylaşılabilir taslak önizleme ve ilk mobil/a11y turu yapıldı) |

Her faz: testler, uçtan uca doğrulama, ilgili dokümanlar ve `06-PROGRESS-LOG.md` kaydı olmadan "tamamlandı" sayılmaz.

## P0 — Vaadi gerçeğe çevirenler

1. ~~İstekler arası önbellek~~ **Yapıldı (2026-10-28).** Bkz. `docs/04` §6. Kalanlar: (a) admin dışı yazma yolları (zamanlanmış yayın, harici betikler) yalnızca 120 sn yedek süresine güvenir; (b) çoklu örnekli kurulumda hem `unstable_cache` hem dönem sayacı süreç/örnek başınadır; ortak depo (Redis cache handler + paylaşılan dönem) gerekir; (c) HTML'i tamamen statik/ISR yapmak için `x-nexpress-site-id` başlığı yerine `siteId`'yi rota kesitine taşımak gerekir.
2. ~~Gerçek bot telemetrisi~~ **Yapıldı (2026-10-28).** Bkz. `docs/04` §7. Kalanlar: (a) OpenAI / Anthropic / Perplexity için yayımlanan IP aralıklarıyla doğrulama (şu an `claimed`); (b) bot başına en çok çekilen yollar ve 4xx/5xx oranı (yolu saklamak için ayrı, sınırlı tablo); (c) CDN önbelleği arkasındaki istekler için CDN günlüğü içe aktarma veya kenar işlevi; (d) `bot_daily_stats` saklama süresi / temizlik (ör. 400 gün); (e) ~~`robots.txt` bot bazlı izin/engel arayüzü~~ yapıldı (F11, `docs/04` §10).
3. ~~Medya hattı~~ **Yapıldı (2026-10-28).** Bkz. `docs/04` §8. Odak noktası, silme (kullanım denetimiyle) ve ön ısıtma da yapıldı. Kalanlar: (a) S3 uyumlu depo sürücüsü (çok örnekli kurulum için; şu an yerel disk); (b) arka plan işçisi ve kuyruğu (Redis/BullMQ) ile yeniden boyutlandırma; (c) ticaret ürün görselleri ve seed'deki dış adresler yeni hatta geçmedi; (d) animasyonlu GIF/WebP ve SVG (temizlemeli) desteği; (e) virüs taraması kancası; (f) `sharp` sarmalayıcısı için otomatik test (şu an uçtan uca elle doğrulandı); (g) toplu içe aktarma ve 'kullanılmayan görselleri bul' raporu.
4. ~~Gerçek RAG~~ **Yapıldı (2026-10-28).** Bkz. `docs/04` §9. Kalanlar: (a) OpenAI sağlayıcısı yalnızca sahte sunucuyla (istek biçimi, başlıklar, boyut, yeniden deneme) doğrulandı; **gerçek anahtarla denenmedi**; (b) ~~hibrit arama (BM25 + vektör, RRF)~~ yapıldı (F11); yeniden sıralama (cross-encoder) kaldı; (c) kısmi parça yeniden kullanımı ve kuyruklu toplu dizinleme (Redis/BullMQ) büyük sitelerde; (d) SQLite'ta ANN yok (libSQL vektör uzantısı `F32_BLOB` değerlendirilebilir); (e) çok dilli dizin ve dile göre sorgu yönlendirme; (f) site içi arama kutusu ve "bu siteye sor" yanıt üretimi (LLM çağrısı) henüz yok, yalnızca erişim katmanı var; (g) soru havuzu canlı GSC/Serper/Bing/Yandex satırını kaydeder (örnek satır yazılmaz); küme en çok 24 sorguda anlam, fazlasında sözcük örtüşmesidir; (h) dizin sağlık metrikleri (eski model, başarısız dizinleme sayısı) panelde.
5. ~~Site haritası~~ **Yapıldı (2026-10-28).** Bkz. `docs/04` §1. Kalanlar: (a) ~~`ai-sitemap.json` ve `llms*.txt` dile göre~~ yapıldı (`/{locale}/ai-sitemap.json`, `/{locale}/llms.txt`, `/{locale}/llms-full.txt`; kök adresler `Accept-Language`/varsayılan dile düşer, `localeEndpoints` tüm dilleri listeler); (b) haber/görsel/video uzantıları (Google News, image sitemap); (c) ~~seed `en` dili~~ giderildi (aşağıdaki not).
6. ~~Performans bütçesi CI'da~~ **Yapıldı (2026-10-28).** Bkz. `docs/11` §7. Ölçüm: ziyaretçi sayfası **101,1 kB gzip JS** (React + Next çalışma zamanı), rota/düzen kodu **0,53 kB**; başlangıçta 105,6 kB ve ~2 kB idi. Kalanlar: (a) Lighthouse CI (yalnızca bütçe ve paket denetimi var, laboratuvar ölçümü yok); (b) çalışma zamanı ~100 kB'ın altına inmek Next App Router ile mümkün değil, "0 KB" yalnızca "sayfaya özel istemci kodu yok" demektir; (c) `next/image` yerine `<picture>` kullanıldığı için görsel hattı JS'siz; (d) bütçe yalnızca JS'i bağlar; ziyaretçi CSS'i yönetim CSS'inden ayrıldı (~13 kB gzip, `css:check`), CSS için ayrı sayısal sınır eklenebilir.

## P1 — Güvenlik ve işletim

> Panel arayüzü eksikleri, eklenti ve tema yükleme/etkinleştirme planı: `docs/13`. Çok dilli altyapı: `docs/14`.

- ~~Kullanıcı yönetimi, profil/parola, rol, denetim günlüğü, oturum iptali~~ yapıldı (F9, `docs/11` §1, §8). ~~e-posta ile davet / parola sıfırlama~~ yapıldı (`docs/11` §1). ~~2FA (TOTP) ve kurtarma kodları~~ yapıldı (`docs/11` §1; QR kodu ve yönetici için zorunlu kılma (`REQUIRE_ADMIN_2FA`) eklendi). Kalanlar: (c) giriş denemesi sınırının Redis'e taşınması; (d) denetim günlüğünde eylem **sonucu** (başarı/hata) ve içerik başlığı gibi hedef ayrıntısı — bugün çoğu `cms.*` kaydı yalnızca yetkilendirilmiş çağrıdır; (e) ~~denetim günlüğü dışa aktarma ve elle temizleme~~ yapıldı (kalan: otomatik/zamanlanmış saklama süresi); (f) kullanıcı silme ve hesap devri; (g) ~~`author` rolü ve izin matrisi~~ yapıldı (`docs/11` §1; `contributor` da eklendi). Kalan: `shop-manager`/SEO gibi görev rolleri, düzenlenebilir (özel) izin matrisi, içerik silme/çöp izni (`content.delete` tanımlı, sınırlı rollerde eylem yok), editörün katkıcı taslağını bildirimle alması, yazarın kendi içeriğini silmesi, içerik devri (sahip değiştirme).
- ~~Yorum / inceleme spam koruması~~ **Yapıldı (2026-11-09).** Ziyaretçi yorum, yanıt ve 5 yıldızlı inceleme gönderimi (`submitPublicDiscussionAction`, `docs/04` §12) bal küpü (`company`), IP başına hız sınırı (`createRateLimiter`), HTML temizliği ve bağlantı spam süzgeci (`validatePublicCommentSubmission`, >2 dış URL reddi) ile korunur; tüm ziyaretçi gönderimleri `status: "pending"` ve `isVerified: false` olarak kaydedilir. Faydalı oyu (`voteCommentHelpfulAction`) `HttpOnly` çerez ve hız sınırıyla korunur.
- ~~Giriş akışı için otomatik uçtan uca test~~ yapıldı (`auth:e2e`, CI'da; davet, parola, sıfırlama yanıtı, 2FA — bkz. doc 11). Kalan: e-postayla gelen sıfırlama bağlantısının SMTP sahte sunucusuyla CI'da denenmesi.
- Admin sayfalarının tarayıcıda (görsel) regresyon testi: bölünen denetçi sekmeleri yalnızca tip kontrolü ve SSR 200 ile doğrulandı.
- ~~GitHub Actions~~ yapıldı (`.github/workflows/ci.yml`; GitHub'da ilk çalıştırma ve dal koruma kuralı sizde).
- ~~Yedekleme / geri yükleme komutu (`db:export`, `db:import`), kiracı bazında~~ **Yapıldı (2026-11-09).** Hem `/admin/backup` arayüzü hem de `pnpm db:export` / `pnpm db:import` CLI (`packages/database/src/scripts/backup-cli.ts`) ve `/api/cron/backup` devrede.
- ~~Çerez/KVKK onayı~~ **Yapıldı (2026-11-11):** `/admin/settings` › Çerez onayı; JS'siz banner, GA4 ve özel betikler onay kapısında (`docs/11` §4). Kalan: kategori bazlı (analitik/pazarlama ayrı) onay ve onay kaydı (kanıt) tutma.

## P2 — GEO / SEO derinliği

- ~~`Link` başlığı~~ yapıldı; ~~dile göre `llms.txt`/`ai-sitemap.json`/`llms-full.txt`~~ yapıldı.
- ~~RSS / Atom~~ yapıldı; ~~kategori/etiket bazlı beslemeler~~ yapıldı (`/feed.xml?category=ad`, `?tag=ad`, `/atom.xml` için de); kalan: tam içerik (`content:encoded`), Google Haberler/Discover görsel şartları.
- ~~Şema doğrulayıcı~~ yapıldı (editörde canlı); kalan: kayıtta engelleme/uyarı eşiği, `Speakable`, `Person` yazar varlıkları, `sameAs`.
- ~~İç bağlantı önerisi: vektörsüz ilk sürüm (başlık / varlık eşleşmesi)~~ **Yapıldı (2026-11-09).** `suggestInternalLinks` (`packages/core/src/internal-links.ts`, birim testli) ve `/admin/seo/audit` ekranında otomatik iç bağlantı fırsatları kartı devrede.
- 404 ve yönlendirme zincirleri raporu; ~~kırık iç bağlantı denetimi~~ yapıldı (iç bağlantılar); ~~dış bağlantı denetimi~~ yapıldı (2026-11-04, SSRF kapılı, yönetici isteği, en çok 30 adres). Kalan: 404 günlüğü ayrı bir rapor olarak iç denetimle birleşmedi (yönlendirme sayfasındaki kayıt duruyor).
- ~~Core Web Vitals alan verisi (CrUX)~~ yapıldı (`docs/11` §7a; Perfornext, sunucu tarafı, anahtar gerekir). Kalan: sayfa/URL düzeyinde CrUX sorgusu, geçmiş eğilim (28 gün anlık görüntüleri saklayıp grafik), otomatik günlük yenileme (cron), CrUX History API; kendi `web-vitals` toplayıcısı (yalnızca onaylı izleme, düşük trafikli siteler için) bilinçli olarak yapılmadı: 0-KB kuralı.

## P3 — Bakım borcu

- ~~Çift şema ve elle SQL~~ **Yapıldı (F10).** Bkz. `docs/02` §Göçler. Şemalar birbirine ve gerçek `push.ts` veritabanlarına testle bağlı; göçler `drizzle-kit` ile üretilir ve `pnpm db:migrate` ile uygulanır; 4 depo + seed + küçük depolar tek kod yoluna indi (yalnızca `chunk-repository` vektör SQL'i dallanır). Kalanlar: (a) `push.ts` (890 satır) **dondurulmuş eski taban** olarak duruyor; tüm kurulumlar göç günlüğüne geçince silinebilir; (b) ilk gerçek göç `0001_content_revisions` üretildi ve uygulandı; yeni şema değişikliğinde `pnpm db:generate` kullanılır; (c) ~~kiracıya kapalı upsert~~ tüm kimlikli yazmalarda (`upsertScoped`/`setWhere siteId`) tamam; başka kiracının kimliğiyle yazma artık sessizce yok sayılıyor (taksonomi/medya/yorum/içerik metotları başarı döndürebilir ama satır yazılmaz; hata döndürmek istenirse sonuç doğrulaması eklenmeli); (d) çok dilli işler (`docs/14`) göç ile eklenecek.
- **Dosya boyutu (AGENTS.md kural 7).** Bölünenler: `renderer.tsx` (1109 → 102), `block-inspector.tsx` (1262 → 134), `repository.ts` (1528 → 18 + 7 alan dosyası ≤ 290 satır), `seed.ts` (1346 → 231 + 4 veri modülü), `editor/src/index.ts` (870 → 14 + 5 modül), `admin-shell-client.tsx` (659 → 390 + `admin-nav.ts`), `admin-nav.ts` (522 → 384 + `admin-nav-meta.ts`), `packages/core/src/types.ts` (476 → 302 + `types-chrome.ts`), `packages/core/src/site-settings.ts` (520 → 402 + `site-settings-defaults.ts`), `packages/themes/src/registry.ts` (461 → 296 + `palettes.ts`), `commerce-repository.ts` (436 → 370 + `commerce-mappers.ts`), `commerce-ops-repository.ts` (412 → 395), `content-list-client` (1011), `theme-store-client` (833), `taxonomy-studio-client` (666) → kanca + alan bileşenleri. `dual-mode-editor-client.tsx` (1390) kanca zinciri + 8 bileşene bölündü (istemci 27 satır). `rich-layout.ts` satır derleyicisi `rich-layout-rows.ts` dosyasına ayrıldı. Veri kümesi menüsü `dataset-chrome.ts` içindedir. Hâlâ büyük: yalnızca `push.ts` (dondurulmuş).
- `block-*` dosyalarında `any` kalıntıları ve tip daraltma.
- ~~`autoCanonical` etkisizdi~~ düzeltildi: kapalıyken elle girilmeyen sayfada canonical etiketi yazılmaz.
- ~~Kökte kalıntı dosyalar~~ temizlendi (`HTTP`, `cursor_abi_project_review.md`, `*.Zone.Identifier`).

## Yayın öncesi kalanlar (2026-11-02)

- Bellek içi hız sınırları ve ön yüz önbelleği tek sunucu içindir; çok sunucu için Redis katmanı yok.
- ~~Zamanlanmış yedek~~ yapıldı (`/api/cron/backup`). ~~Komut satırı yedeği~~ yapıldı (`pnpm db:export` / `pnpm db:import`). Kalan: yedeğin sunucu dışına kopyası, belge/video/ses ve veritabanının sunucu düzeyinde yedeği (`docs/19`).
- ~~CSP başlığı~~ yapıldı (üretimde, `'unsafe-inline'` ile). Kalan: nonce'lu sıkı CSP (Next.js satır içi betikleri nedeniyle ayrı iş).
- Dockerfile yok: bu ortamda Docker çalışmadığı için doğrulanamadı, denenmemiş dosya eklenmedi.
- Görsel türev adresleri (`/media/{id}/1280.webp`) açıklayıcı ad taşımaz; görsel olmayan dosyalar taşır.
- Medya seçici için axe taraması yok (kitaplık sayfası taranıyor).
- Pro rapor kartları `/admin/seo/reports` altındadır. Dış servis anahtarı yoksa örnek satır kaydedilmez.

## Panel düzeni ve dinamik içerik (2026-11-02) — kalanlar

- ~~Dil başına menü~~ yapıldı (`/admin/appearance/menus?locale=`; kayıt yoksa varsayılan dil gösterilir, ilk kayıtta header/footer devralınır). ~~Birden çok menü~~ yapıldı: kayıtlar `footerConfig.menus`, header kaydı `menuItems`. Footer ve kenar çubuğu `nav_menu.settings.menuId` ile bağlanır. Kalan: header ve footer düzeninin dil başına ayrılması.
- Ürün kategorisi veri modelinde olmadığı için menüde "ürün kategorisi" kaynağı yok (ürün ve mağaza var).
- ~~Kategori/etiket arşivleri sitemap'te~~ yapıldı (`archive-1.xml`, yalnızca yayını olanlar, varsayılan dil). ~~Arşiv sayfalaması~~ yapıldı (`?sayfa=`, 12'şer, rel prev/next, sayfa başına canonical; site haritasında yalnızca ilk sayfa).
- Dinamik liste: sayfalama, alan yetkili filtre (yazar, tarih aralığı), özel ürün alanları yok; Markdown/llms çıktısına girmez.
- AI yazım: gerçek modelle (gpt-4o-mini) denendi; yeniden yaz/kısalt/düzeltte model yeni cümle ekleme eğilimindeydi → paragraf kırpma + uzunluk uyarısı (`guardEdit`) eklendi, yine de uygulamadan önce karşılaştırma gerekir. Seçili metin parçası yerine tüm blok işlenir; çok blokluk taslak/taslak sayfa üretimi yok (AI tasarım eklentisi ayrıdır).
- Panel yazı ölçeği CSS katmanıyla ayarlanır (bileşenlerde sabit px sınıfları kaldı); ayrı kullanıcı tercihi (yazı boyutu) yok.

## Tema oluşturucu — kalanlar (2026-11-03)

- ~~Ürün/mağaza şablonları~~ yapıldı: `/magaza` (liste) ve `/magaza/{ürün}` ticaret sayfaları ile `type: "product"` içerik sayfaları şablon kullanır. Kalan: ürün kategorisi (veri modelinde yok), sepet/ödeme/teşekkür sayfaları için şablon, mağaza listesinde sayfalama/süzgeç/sıralama.
- Ana sayfa için ayrı şablon türü yok (ana sayfa genelde özel tasarımdır); şablon koşulları ve dil başına şablon ARTIK VAR (bkz. docs/20 Faz 4a): kural türleri sayfa adresi/kategori/etiket/içerik türü/dil; oturum/rol koşulu bilerek yok (sayfalar önbelleklenir). Kalan: şablon paketinde koşulların taşınması.
- ~~Şablon dışa/içe aktarma~~ yapıldı (`.nxtemplates.json`, `docs/03`). Kalan: medya dosyalarını ppakete gömme (şimdi yerel medya başvuruları boşaltılır), `.nxtheme` içine şablon koyma, imzalı paket / şablon pazarı, içe aktarmadan önce önizleme.
- Header şablonunda yapışkan/şeffaf/küçülen header gibi davranış seçenekleri yok (sabit yapışkan, açık zemin). Footer'da bülten formu yuvası yok.
- Sayfa/yazı şablonu uygulanırken paylaşım çubuğu ve yorum/inceleme bölümü şablonda yuva olmadığından çizilmez.
- Şema kartları dört tür (yazılım, kampanya, soru-cevap, teknik künye); Product/LocalBusiness/Event gibi türler ve kartların çoklu varyantı yok.
- Canvas üzerinde alan içi (inline) metin düzenleme yalnızca paragraf/başlıkta; diğer bloklar denetçiden düzenlenir.

- **Editör zenginleştirme (docs/20):** Faz 1 (stil motoru) tamam. Sırada Faz 2 (simge/sayaç/referans/marquee blokları, düğme hover-simge, sütun sırası, şekil ayırıcılar), Faz 3 (sorgu döngüsü + süzgeçler), Faz 4 (üst bilgi oluşturucu, tür başına yerleşim, görüntüleme koşulları, karanlık mod), Faz 5 (stil ön ayarları, kayan blok araç çubuğu).

- **Faz 4b tamam** (karanlık mod, palet değişkenleri, şeffaf header, içerik genişliği). **Üst bilgi öğe dizisi ve mobil düzen yapıldı (2026-11-04):** sol/orta/sağ bölgeler ve ayrı mobil diziler ön yüzde ve header editöründe çözülür. Yazılmayan ana şerit logo solda, kalan öğeler sağda türetilir. Hazır header kütüphanesinin her kaydında tasarlanmış mobil dizi vardır; forma alınmadan düzenlenir. Üst ve alt şerit mobil dizisi yazılırsa küçük ekran onu basar. Kalan: ziyaretçi için elle tema anahtarı (JS gerektirir; bilerek yok), kullanıcı CSS'inde ve eklenti bloklarında sabit renkler için uyum denetimi.

## Özel içerik türleri — kalanlar (2026-11-12)

- Yapıldı: tür/alan tanımı, editör sekmesi, ziyaretçi tablosu, markdown, site haritası, dinamik liste kaynağı (`docs/03`).
- Arşiv sayfası, kayıt öneki (`/referanslar/acme`), kartlarda alan ve alanlardan JSON-LD yapıldı (`docs/03`). Kalan: arşiv için tema şablonu türü; arşivde alan süzme/sıralama; önek değişince eski adresten otomatik yönlendirme; ana sayfa demo listesi ve arama sonuçlarında önekli adres (şimdi 308 ile düzelir) (ör. `Event`, `Person`); dinamik liste kartında alan gösterimi; alan bazlı süzme/sıralama; tür başına sınıflandırma; alanların CSV içe/dışa aktarımı.

## Footer — kalanlar (2026-11-12)

- Yapıldı: satır stilleri (zemin, boşluk, ayraç, genişlik), alt çubuk düzeni, `{year}`/`{site}`, "Başa dön".
- Kalan: alt çubukta sosyal simge ve menü yuvası; üst satır için ayrı sütun düzeni (şimdi yalnızca çağrı bandı); satır başına arka plan görseli/degrade; mobilde sütun sırası seçimi; yönetim önizlemesinde yer tutucuların açılmış hali.

## Önbellek (2026-11-12) — kalanlar

- Yapıldı: çalışma zamanlı, çerez/sorgu duyarlı HTML `s-maxage` (`docs/04` §6).
- Kalan: yayında CDN/nginx temizleme (purge) bağlantısı (şimdi yalnızca TTL ile bayatlar); 404/yönlendirme yanıtları için ayrı (kısa) TTL; çok örnekli kurulumda ortak veri önbelleği (Redis); kök düzenin `headers()` okuması yüzünden sayfaların hâlâ dinamik üretilmesi (kaynakta ISR için kiracı kimliğinin başlıktan ayrılması gerekir).

## Veri eklentileri (2026-11-12) — kalanlar

- Yapıldı: `.nxplugin` (tür, taslak sayfa, imzalı webhook; `docs/27`). Kod eklentisi yükleme bilerek yok.
- Kalan: eklenti ayar alanları ve çeviri paketi; `form.submitted` olayı (kişisel veri: ayrı onay ve alan seçimi gerekir); yeniden deneme kuyruğu ve teslimat günlüğü (şimdi yalnızca son sonuç); eklenti güncelleme akışında izin farkını gösterme; imzayı sunucuya `PLUGIN_TRUSTED_KEYS` yerine panelden yönetilen anahtar listesi; ziyaretçi CSS katkısı (kapsamlı, bütçe denetimli).


## Ziyaretçi üyeliği (2026-11-12) — kalanlar

- Yapıldı: parolasız üyelik (`docs/11` §7b). Kalan: üye başına içerik/rol ayrımı (şimdi tek düzey "üye"), ücretli/kademeli üyelik, üye profil alanları, "tüm cihazlardan çıkış", hız sınırının Redis'e taşınması, sosyal giriş, üye e-posta değiştirme, üyelere bülten/bildirim tercihleri ve üye girişi için header bağlantısı (şimdi gate ve `/uye/giris` adresi).
