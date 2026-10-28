# 13 — Eklenti Sistemi, Tema Paketleri ve Panel Planı

> **Durum: PLAN (§2 eklenti tarafı kısmen kodlandı).** Bu doküman henüz kodlanmamış işleri tasarlar; kodlananlar §0'da işaretlidir. Mevcut durum ve gerekçe en altta "Bugün ne var?" bölümündedir.

## 0. Bugün ne var?

- **Eklentiler (`/admin/plugins`) — v1 yapıldı (2026-10-28):** `pluginRegistry` manifestleri (`packages/core/src/plugins.ts`), `site_plugins` tablosu (migrasyon `0002`, kiracı başına `enabled` + modül anahtarları + `settings` JSON), çalışma zamanı kapısı `isPluginModuleEnabled`, çekirdek uç noktalar için `pluginRoutes`, manifestten üretilen **ayar formu**. Sayfa: eklenti listesi, modül anahtarları (Hazır/Yakında), arama ve filtre, Ayarlar sekmesi, Geliştirici sekmesi (kancalar/yuvalar). `requireAdmin` + denetim kaydı (`plugins.toggle|module|settings`). Henüz **yok**: Pro lisans anahtarı, eklenti göçleri (`plugin_migrations`), "eklenti ekle" sihirbazı. Modül kataloğu: `docs/15`.
- **Temalar — v1 yapıldı (2026-10-28):** resmi temalar kodda (`OFFICIAL_THEME_STORE`); **veri temaları** `.nxtheme` paketiyle yüklenir (`/admin/themes/packages`): doğrulama raporu, önizleme (`?nx_preview=<tema>`, yalnızca oturumlu), etkinleştirme (üst/alt şablon ve başlangıç sayfaları isteğe bağlı, sayfalar taslak ve asla ezmez), dışa aktarma (yüklenen tema veya **mevcut tasarım**), silme (etkin tema silinemez). Kalan: yazı tipi dosyaları (`woff2`), tema ayarı sürüm geçmişi/geri al, güncelleme rozeti, kod temaları (CLI).

## 1. Temel kısıt (dürüst tasarım notu)

Next.js uygulamasında bir eklentinin **React/sunucu kodu derleme anında paketlenir**. Çalışan sunucuya zip yükleyip rastgele JavaScript çalıştırmak (a) pakete girmez, (b) kiracılar arası ciddi bir güvenlik riskidir. Bu yüzden iki ayrı model kullanılır:

| Tür | İçerik | Nasıl kurulur | Panelden yüklenebilir mi? |
| :--- | :--- | :--- | :--- |
| **Veri temaları** | token, header/footer şablonu, başlangıç sayfaları, **CSS-only blok görünümleri**, görseller | zip / JSON içe aktarma | **Evet** (kod çalıştırmaz, doğrulanır) |
| **Kod temaları** | React blok görünümleri | npm/workspace paketi + yeniden derleme | Hayır (CLI) |
| **Eklentiler** | hook, slot, rota, tablo, ayar | npm/workspace paketi + yeniden derleme | **Hayır** (CLI); **etkinleştirme/ayar/lisans panelden** |

Yönetilen (barındırılan) kurulumda "Eklenti ekle" düğmesi, derleme hattını tetikleyen bir iş akışına bağlanabilir; bu plan kapsamı dışında.

## 2. Eklenti sistemi

### 2.1 Manifest

Her eklenti `manifest` dışa aktarır (zod ile doğrulanır):

```ts
{ id: "@nexpress-pro/agentic-seo", name, version, description, vendor,
  license: "free" | "pro", requires: { core: "^0.1" },
  hooks: [...], slots: [...], endpoints: [...],
  settings: JSONSchema,           // panel formu bundan üretilir
  migrations: { sqlite: [...], postgresql: [...] } }
```

### 2.2 Kayıt ve açma/kapama

- `apps/cms/src/plugins/register.ts` **tek kompozisyon kökü olarak kalır**; ancak elle yazılmak yerine `pnpm nexpress plugin add <paket>` komutu bağımlılığı, `transpilePackages` girdisini ve kayıt çağrısını ekler (tek doğruluk kaynağı: `plugins.manifest.ts`).
- Yeni tablo **`site_plugins`** (`siteId`, `pluginId`, `enabled`, `settings` JSON, `licenseKey`, `installedAt`, `updatedAt`). Kural 2 gereği `siteId` sütunu ve indeksi vardır.
- **Çalışma zamanı kapısı:** `cmsHooks.runFilter/runAction` ve `<PluginSlot>` her çağrıda `isPluginEnabled(siteId, pluginId)` denetler (istek başına önbellekli). Kapalı eklentinin kancası ve yuvası atlanır; böylece bir kiracıda kapatmak diğerlerini etkilemez.
- **Çekirdek `if (isPro)` içermez** (kural 4): kapı, genel eklenti kimliği üzerinden çalışır; "Pro" yalnızca manifestteki `license` alanıdır.
- Eklentinin kendi rotaları (`/api/mcp`, `/llms-full.txt`) kapalıyken 404 döner (rota işleyicisi `requirePlugin(id)` çağırır).

### 2.3 Lisans (Pro)

Çevrimdışı doğrulanabilir imzalı belirteç (Ed25519, açık anahtar paketle gelir): `{ plugin, siteDomain, exp }`. Panelde anahtar girilir; süresi dolan eklenti **veriyi silmez**, yalnızca özellikleri kapatır ve uyarı gösterir. Lisans sunucusu çağrısı gerektirmez.

### 2.4 Veritabanı değişiklikleri

Eklenti, iki motor için SQL göçü verir; `plugin_migrations` (`pluginId`, `version`, `appliedAt`) uygulananı izler. Eklenti kapatılınca tablolar **silinmez**; "Kaldır ve veriyi sil" ayrı, onaylı bir eylemdir.

### 2.5 Panel: `/admin/plugins`

1. **Kurulu eklentiler** tablosu: ad, sürüm, tür (ücretsiz/Pro), lisans durumu, kiracı için açık/kapalı anahtarı, ayarlar bağlantısı, kancalar/yuvalar/uç noktalar (bugünkü sabit tablonun gerçek veriyle yerine geçmesi).
2. **Ayarlar** sayfası: manifestteki JSON Schema'dan otomatik form (örn. `MCP_AGENT_KEY` durumu, bot izin politikası).
3. **Eklenti ekle** sihirbazı: paket adı → uyumluluk denetimi → CLI komutunu gösterir (veya yönetilen kurulumda derleme tetikler).
4. **Kancalar & yuvalar** (bugünkü "Slot & Hook Veriyolu") sekme olarak kalır — geliştirici görünümü.
5. Sağlık: kayıt hatası, bekleyen göç, uyumsuz çekirdek sürümü uyarıları.

### 2.6 Güvenlik

Eklentiler **güvenilir koddur** (kendi süreçlerinde, sandbox yok); bu dokümanda açıkça yazılır. Önlemler: manifestte beyan edilen izinler (tablo, rota, ağ alanları) panelde gösterilir; yazma rotaları `requireUser/Admin` kuralına tabidir; imzasız Pro paket uyarı verir.

## 3. Tema paketleri

### 3.1 Veri teması paket biçimi (`.nxtheme` = zip)

```
theme.json        # manifest: id, ad, sürüm, yazar, uyumlu çekirdek, önerilen siteProfile, yerelleştirilmiş ad
tokens.json       # light/dark renk, tipografi, geometri (DesignTokens)
chrome/           # header.json, footer.json, sidebar.json  (docs/08 sözleşmesi)
pages/            # başlangıç sayfaları: BlockNode[] JSON (docs/07 sözleşmesi)
skins.css         # CSS-only blok görünümleri: [data-nx-skin="<tema>"] .nx-block-* kapsamında
screenshot.webp   # mağaza kartı
```

### 3.2 Doğrulama (yükleme sırasında, hepsi zorunlu)

- Zip: boyut ≤ 8 MB, dosya sayısı ≤ 200, açılmış toplam ≤ 30 MB (zip bombası), yol gezinmesi (`..`, mutlak yol) reddi, yalnızca izinli uzantılar (`json`, `css`, `webp`, `png`, `jpg`, `woff2`).
- `theme.json`, `tokens.json`, `chrome/*`, `pages/*` zod şemalarıyla doğrulanır; sayfalar mevcut `normalizeImportedBlock` ve HTML temizleyiciden geçer.
- **CSS temizleme:** `@import`, `expression()`, `behavior`, `javascript:` yasak; `url()` yalnızca tema içi varlık veya `data:image`; tüm seçiciler tema kapsamına (`[data-nx-skin]`) zorlanır; boyut ≤ 200 KB. Başarısız tema kurulmaz, hatalar satır satır gösterilir.
- Görseller medya hattından geçirilir (EXIF silme, türev); tema silinince kullanılmayanlar temizlenir.

### 3.3 Yaşam döngüsü

Yükle → doğrula → **önizle** (`?nx_preview=<tema>` yalnızca oturumlu admin; kiracı ziyaretçileri etkilenmez) → etkinleştir (token + şablon + isteğe bağlı başlangıç sayfaları "ekle" olarak, **mevcut içeriği ezmeden**) → özelleştir → **dışa aktar** (mevcut tasarımı `.nxtheme` yap) → sil (etkinse reddedilir).

Depolama: `installed_themes` genişler (`manifest`, `tokens`, `css`, `source: official|uploaded`, `version`, `checksum`); resmi temalar kodda kalır, yüklenenler veritabanında yaşar ve tenant kapsamlıdır.

### 3.4 Panel: `/admin/themes`

Mağaza kartları (resmi + yüklenen), **Tema yükle** (sürükle-bırak + doğrulama raporu), önizleme, etkinleştir, dışa aktar, sil, sürüm/güncelleme rozeti, tema ayarlarının geçmişi (geri al). Mevcut özelleştirici korunur; `theme-store-client.tsx` (833 satır) bu iş sırasında bölünür.

## 4. Panel (yönetim arayüzü) eksikleri

Denetimle bulunan açıklar; öncelik sırasıyla:

| # | Eksik | Not |
| :-- | :--- | :--- |
| 1 | **Ayarlar** sayfası | **v1 yapıldı** (ad, slogan, iletişim e-postası, saat dilimi, sistem bilgisi). Kalan: logo/favicon, e-posta gönderimi (SMTP), dil yönetimi (`docs/14`), ticaret ayarlarının tek yerde toplanması. |
| 2 | **Kullanıcılar & roller**, profil, parola değiştirme, 2FA (TOTP) | **Yapıldı** (2FA hariç). Roller: admin, editor; ileride author, shop-manager. |
| 3 | **Denetim günlüğü** | **Yapıldı** (filtre, sayfalama). Kalan: dışa aktarım, eylem sonucu/ayrıntısı. |
| 4 | **Eklentiler** ve **tema yükleme** | Bu dokümanın §2–§3. |
| 5 | **İçerik revizyonları** + karşılaştırma + geri alma | **v1 yapıldı** (2026-10-28): her kayıtta görüntü saklanır (aynı içerik tekrarlanmaz, içerik başına son 50), editörde Yayın sekmesinde "Sürüm Geçmişi" ve "Bu sürümü yükle" (yalnızca editörü doldurur, kaydetmek ayrı adım). Kalan: iki sürüm arası fark görünümü, sürüm silme, bloğa göre karşılaştırma. |
| 6 | **Otomatik kayıt / taslak kurtarma** | **Tarayıcı tarafı yapıldı** (2026-10-28): "Kaydedilmedi" rozeti, sekme kapatma uyarısı, Ctrl/Cmd+S, 1,2 sn aralıkla yerel taslak (`localStorage`, `nx:draft:{siteId}:{contentId}`) ve açılışta kurtarma çubuğu; kayıt hatasında uyarı. Kalan: sunucu tarafı otomatik kayıt (çoklu cihaz), eşzamanlı düzenleme çakışma uyarısı. |
| 7 | **Çöp kutusu** (yumuşak silme, geri yükleme) | **Yapıldı (2026-10-28):** silme çöpe taşır (`status = trashed`, önceki durum saklanır), tüm yüzeylerden (liste, ziyaretçi, sitemap, RAG) gizlenir; `/admin/trash` geri yükle (**taslak** olarak) / kalıcı sil (yönetici) / çöpü boşalt; 30 gün sonra kendiliğinden silinir. |
| 8 | **Zamanlanmış yayın** arayüzü ve takvim | **Yapıldı:** editörde tarih-saat seçici (site saat dilimi, tarihsiz/geçmiş reddedilir), `/admin/schedule` gün gün takvim (şimdi yayınla / zamanlamayı kaldır), tetikleyici: ziyaretçi trafiğiyle dakikada bir + `/api/cron/scheduled` (`CRON_SECRET`) ile kesin; yayında `content:afterPublish` (arama dizini, IndexNow) çalışır. |
| 9 | **Paylaşılabilir taslak önizleme** bağlantısı | **Yapıldı (2026-10-28):** editör çubuğunda "Önizleme bağlantısı" (1/7/30 gün); `?nx_draft=<belirteç>` ile oturumsuz görüntüleme. Belirteç `@nexpress/core/draft-preview` (HMAC: site+içerik+bitiş). **Sınırlar:** tek bağlantı iptali yok (süre dolar ya da `AUTH_SECRET` döner), yalnızca `/{dil}/{slug}` sayfaları (ana sayfa, mağaza ve besleme yüzeyleri değil), yalnızca son kaydedilmiş hal görünür. |
| 10 | **Yönlendirme yöneticisi** (301/302 elle) ve **404 izleyici** | **Yapıldı:** `/admin/redirects` (göç `0008`): doğrulama (rezerve yollar, kendine yönlendirme, döngü), zincir çözümü, 301/308 ve 302/307, isabet sayaçları; 404 izleyici (sorgusuz yol, son yönlendiren alan adı, "Yönlendir" kısayolu, yok say, 2000 satır sınırı). |
| 11 | **Formlar ve gelen kutusu** | **Yapıldı (2026-10-28):** sürükle-bırak form kurucusu (`/admin/forms/[id]`, `@dnd-kit`), 15 alan türü, 8 hazır şablon, e-posta bildirimi + otomatik yanıt (SMTP, `nodemailer`), gönderim analizi (`/admin/forms/[id]/analytics`), gelen kutusu (`/admin/forms/inbox`), CSV. Ayrıntı: `docs/16-FORMS.md`. **Kalan:** dosya yükleme alanı, koşullu alanlar, çok adımlı form, webhook, görüntülenme/dönüşüm izleme (JS'siz ziyaretçi kuralı gereği ölçülmez). |
| 12 | **Gerçek WordPress içe aktarma** | `/admin/migration` bugün **örnek veriyle simülasyon**; WXR/REST yükleme ve medya taşıma yok. |
| 13 | **Medya**: klasör/etiket, toplu ve sürükle-bırak yükleme, dosya değiştirme, "kullanılmayanlar" raporu | |
| 14 | **Yedekleme / dışa-içe aktarma** (JSON+zip, kiracı bazlı) | **Yapıldı (2026-10-28):** `/admin/backup` (yalnızca admin) `.nxbackup` dışa aktarır; içe aktarmada önce kuru doğrulama, sonra birleştir/değiştir. **Kalan:** CLI (`db:export/import`), zamanlanmış otomatik yedek. |
| 15 | **Sistem durumu** sayfası | **Yapıldı:** `/admin/system` (yönetici): veritabanı bağlantı/gecikme ve bekleyen göç, ortam denetimi (yer tutucu `AUTH_SECRET`, https, anahtar varlığı — değerler gösterilmez), medya klasörü ve boş disk, arama dizini kapsamı, zamanlanmış/çöp/404/talep/bot özetleri. Kalan: önbellek, sürüm/güncelleme. |
| 16 | **Bildirim merkezi** | Başarısız dizinleme, lisans süresi, güncelleme, güvenlik uyarıları. |
| 17 | **Komut paleti (⌘K)** veri kapsamı | Yalnızca gezinti; içerik/ayar/eylem araması yok. |
| 18 | **Mobil/duyarlı yönetim**, klavye kısayolları, erişilebilirlik denetimi, boş durum ve yükleme iskeletleri | AGENTS.md kural 6 hedefi; tutarlılık denetimi yapılmadı. |
| 19 | **Panel arayüz dili** (i18n) | Çok dilli plan ile birlikte (`docs/14`). |
| 20 | **Panel gerçek metrikleri** | Dashboard kısmen gerçek (içerik skorları, bot günlüğü); Web Vitals ve arama dizini kartları eksik. |

## 5. Uygulama sırası (bu doküman için)

1. `site_plugins` + manifest + çalışma zamanı kapısı + `/admin/plugins` gerçek envanter ve aç/kapa.
2. Eklenti ayar formu (JSON Schema) + lisans doğrulama.
3. Tema paket biçimi + doğrulayıcı (saf, testli) + yükleme/önizleme/etkinleştirme/dışa aktarma.
4. Panel eksikleri 1–3, sonra 5–8 (içerik güvenliği), sonra kalanlar.

Her adımda: testler, uçtan uca doğrulama, `docs/06` kaydı.
