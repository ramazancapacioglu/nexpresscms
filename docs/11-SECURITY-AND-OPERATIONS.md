# 11 — Güvenlik, Kimlik Doğrulama ve İşletim

## 1. Kimlik doğrulama, hesaplar ve oturumlar

- **Tablolar:** `users` (`siteId`, `email`, `name`, `passwordHash`, `role`, `status` `active|disabled`, `sessionVersion`, `passwordChangedAt`, `createdAt`, `lastLoginAt`; `(siteId, email)` tekil) ve `audit_log` (§8). Her kiracının kullanıcısı ayrıdır; aynı e-posta farklı kiracıda kullanılabilir.
- **Roller:** `admin` (her şey) ve `editor` (içerik, taksonomi, medya, yorum, tema/menü, katalog). **Yalnızca admin:** Ayarlar, Kullanıcılar & Roller, Denetim Günlüğü, SEO motoru ayarları, WordPress göçü, ticaret ayarları, pazar yeri işlemleri, medya silme, arama dizini yeniden kurma.
- **Parola:** `scrypt` (N=16384, 16 bayt tuz), zamanlamaya dayanıklı karşılaştırma. **Politika (NIST çizgisi):** en az 12, en çok 128 karakter; yaygın listede olmamalı; tek karakter tekrarı (≤3 farklı karakter) ve 8+ ardışık dizi reddedilir; e-posta yerel kısmını veya adı içeremez. Karakter türü zorunluluğu yoktur (`validatePassword`, saf, testli).
- **Oturum:** `nx_session` çerezi (`HttpOnly`, `SameSite=Lax`, üretimde `Secure`, 12 saat). Belirteç `sub`, `siteId`, `role`, **`sv` (oturum sürümü)**, `exp` taşır, HMAC-SHA256 imzalıdır. Eski (sürümsüz) belirteçler geçersizdir.
- **Veritabanı doğrulamalı oturum:** imza geçse bile `getSession()` kullanıcıyı okur; hesap `active` değilse veya `sv` eşleşmezse oturum yoktur. **Rol de veritabanından okunur.** Rol değişikliği, devre dışı bırakma/etkinleştirme, parola değişimi/sıfırlama ve "oturumları kapat" `sessionVersion`'ı atomik artırır → açık oturumlar bir sonraki istekte düşer (yeniden etkinleştirmek eski çerezleri geri getirmez).
- **Dört savunma katmanı:**
  1. `middleware.ts`: imza + süre + site; `/admin/users|audit|settings` için rol `admin` değilse anında 307 → `/admin`.
  2. `app/admin/layout.tsx`: veritabanı doğrulamalı oturum yoksa `/login`.
  3. Yönetici sayfaları `requireAdminPage()` (rol veritabanından).
  4. Her admin server action'ı `requireUser({ audit })` / `requireAdmin(name)`; sayfa koruması bunun yerine geçmez.
- **Hesap kuralları:** kimse kendi rolünü/durumunu değiştiremez; son etkin yönetici düşürülemez/devre dışı bırakılamaz (`wouldRemoveLastAdmin`); devre dışı hesap doğru parolayla bile genel hata alır (hesap varlığı sızmaz); kullanıcı silme yoktur, devre dışı bırakma vardır (denetim izi korunur).
- **Profil (`/admin/profile`):** ad, parola değiştirme (mevcut parola şart; başarılıda diğer tüm oturumlar kapanır, bu oturum yeni sürümle sürer), "her yerden çıkış". Hatalı mevcut parola `auth.passwordChangeFailed` olarak günlüğe yazılır.
- **İlk yönetici:** kullanıcı tablosu boşken `.env` içindeki `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD` ile yapılan ilk giriş yöneticiyi oluşturur. Üretimde `Admin123!` ve politikaya uymayan parolalar kabul edilmez.
- **`AUTH_SECRET`:** üretimde en az 32 karakter, `change-in-production` içermeyen bir değer olmalı; aksi halde uygulama hata verir.
- **Deneme sınırı:** site + IP + e-posta başına 15 dakikada 8 hata (bellek içi; çok örnekli kurulumda Redis'e taşınmalı). Engellenen denemeler `auth.login_blocked` olarak günlüğe yazılır.
- **Doğrulama (2026-10-28, gerçek form/eylem çağrılarıyla):** politika 5 ret + kabul; aynı e-posta reddi; editör yönetici sayfalarında 307, yönetici eyleminde 500 ve kayıt oluşmaz; devre dışı bırakılan editörün **açık oturumu anında 307**; devre dışı hesapla giriş reddi; yeniden etkinleştirmede eski çerez 307; parola değişiminde diğer cihaz oturumu 307, yeni çerez 200, eski parola reddi; kendi rolünü/hesabını değiştirme reddi; ayar kaydı sonrası site adı ön yüzde anında değişti.
- **Çıkış:** çerez silinir ve `auth.logout` yazılır.
- **Ortam dosyası:** Next yalnızca `apps/cms` içindeki `.env` dosyasını okur. `predev` / `prebuild` / `prestart` betiği (`apps/cms/scripts/link-env.mjs`) kökteki `.env`'e sembolik bağ kurar.

## 2. Sırlar

- Pazar yeri kimlik bilgileri veritabanında AES-256-GCM ile şifrelenir (`enc:v1:iv:tag:veri`, `packages/core/src/secret-box.ts`). Anahtar `SECRETS_KEY`, yoksa `AUTH_SECRET`. Eski düz kayıtlar okunurken olduğu gibi döner ve bir sonraki kayıtta şifrelenir.
- `SECRETS_KEY` veya `AUTH_SECRET` değişirse mevcut şifreli sırlar çözülemez; anahtar döndürmeden önce kanal bilgilerini yeniden girin.
- Formlar ham sır göstermez; boş gönderilen alan önceki değeri korur.

## 3. MCP yazma araçları

`nexpress_create_lead` gibi yazma araçları `X-Agent-Key` ister. Anahtar `MCP_AGENT_KEY` ortam değişkenidir; **tanımlı değilse yazma araçları kapalıdır**. IndexNow anahtarıyla paylaşılmaz. Karşılaştırma `safeEqual` ile yapılır.

## 4. HTTP başlıkları (`apps/cms/next.config.ts`)

Tüm yollarda `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; üretimde `Strict-Transport-Security`. `/admin` ve `/login` ayrıca `X-Frame-Options: DENY` ve `Cache-Control: no-store`. `X-Powered-By` kapalıdır.

## 5. Testler

`pnpm test` her pakette `tsx --test` (Node'un yerleşik test koşucusu, ek bağımlılık yok) çalıştırır.

| Paket | Kapsam |
| :--- | :--- |
| `packages/core/test` | oturum belirteci, parola, sır kutusu, tarih korumalı JSON, parola politikası / son yönetici kuralı, parçalayıcı ve yerel gömme, medya başvurusu / türev adı, bot algılama / ters DNS soneki / istek türü, blok ağacı, Markdown derleyici, HTML temizleyici, kiracı çözümleme |
| `packages/database/test` | bot sayaç özeti, UTC gün anahtarı, LIKE kaçışı, hesaplar ve denetim günlüğü, **şema paritesi, push/göç sistemi, CMS ve ticaret depoları (kiracı yalıtımı dahil)** — SQLite; `DB_TEST_PG_URL` (sunucu adresi) ile PostgreSQL |
| `packages/rag/test` | OpenAI sağlayıcısı (sahte fetch), dizinleme / arama / benzerlik (SQLite; `RAG_TEST_PG_URL` ile pgvector) |
| `packages/seo-core/test` | `slugify`, `truncateSmart`, `analyzeSeo`, site haritası (bölme, hreflang, dosya adı, kaçış) |

Kural: saf mantık (SEO, derleyici, kiracı, kimlik) testsiz birleştirilmez.

## 6. Ortam değişkenleri

| Değişken | Amaç |
| :--- | :--- |
| `AUTH_SECRET` | oturum imzası (üretimde zorunlu, ≥32 karakter) |
| `SECRETS_KEY` | pazar yeri sırlarını şifreleme (boşsa `AUTH_SECRET`) |
| `MCP_AGENT_KEY` | MCP yazma araçları (boşsa kapalı) |
| `INDEXNOW_API_KEY` | IndexNow bildirimi ve `/indexnow-key.txt` |
| `EMBEDDING_PROVIDER` / `EMBEDDING_MODEL` / `OPENAI_BASE_URL` | arama dizini gömme sağlayıcısı (boşsa `OPENAI_API_KEY` varsa openai, yoksa yerel) |
| `SMTP_URL` | form e-postaları için yedek SMTP bağlantısı (`smtp://kullanici:parola@sunucu:587`); panelden SMTP açıksa o kullanılır |
| `MEDIA_DIR` | yüklenen görseller ve türevleri (kalıcı birim; varsayılan `./data/media`) |
| `PUBLIC_CACHE_SECONDS` | ziyaretçi HTML'i için CDN `s-maxage` (0 = kapalı; derlemede okunur) |

## 7. CI ve performans bütçesi

- **Çalışma akışı (`.github/workflows/ci.yml`):** `verify` (kilitli kurulum → `pnpm typecheck` → `pnpm test` → `next build` → `pnpm --filter @nexpress/cms budget`), `pgvector` (RAG testleri `pgvector/pgvector:pg16` servisinde, `RAG_TEST_PG_URL`) ve `audit` (`pnpm audit --prod`, uyarı verir, engellemez). Aynı komutlar yerelde çalıştırıldı (12 paket tip kontrolü, 63 test); iş akışının kendisi GitHub'da henüz çalıştırılmadı.
- **Ziyaretçi JS bütçesi (`apps/cms/perf-budget.json`, `scripts/check-budget.mjs`):** `.next/app-build-manifest.json`'dan her `/(public)/…/page` rotası için kök düzen + ara düzenler + sayfa dosyalarının **gzip** JS toplamı hesaplanır. Sınırlar: toplam ≤ **104 kB**, rota/düzen kodu (`static/chunks/app/…`) ≤ **1 kB**; ayrıca ziyaretçi paketinde `app/admin|login` parçaları ve `ProseMirror` / `tiptap` / `next-themes` izleri bulunamaz. Saf ölçüm/değerlendirme mantığı `scripts/budget-lib.mjs` içindedir ve 5 testlidir; sıkı bir bütçede komut gerçekten `1` ile çıkar (doğrulandı).
- **Yapılan iyileştirmeler:** `next-themes` kök düzenden yönetim ve giriş ekranlarına taşındı (`ThemeBoundary`); ziyaretçi sayfaları `next/link` yerine düz `<a>` kullanır (`components/public/link.tsx`). Bedel: yumuşak gezinti ve ön yükleme yok, her gezinti tam sayfadır (CDN önbelleği ve RSC HTML ile hızlıdır).
- Bütçeyi artırmak için `perf-budget.json` içindeki gerekçe notu güncellenir.

## 8. Denetim günlüğü ve Ayarlar

- **Denetim günlüğü (`audit_log`, `/admin/audit`, yalnızca admin):** zaman (ms), kullanıcı, eylem, hedef, ayrıntı, IP. Yalnızca eklenir. İki tür kayıt vardır: (a) **yetkilendirilmiş çağrı** — `requireUser({audit})`/`requireAdmin(name)` ile adı verilen her admin eylemi (`cms.*`, `commerce.*`, `marketplace.*`; çağrının sonucu ayrıca garanti edilmez); (b) **kesin sonuç** — `auth.login|login_failed|login_blocked|logout|passwordChanged|passwordChangeFailed`, `user.created|roleChanged|disabled|enabled|passwordReset|sessionsRevoked`, `settings.saved`. Parola, belirteç ve sır yazılmaz; ayrıntı 500 karakterle sınırlıdır. Süzme: kullanıcı e-postası, alan ön eki; sayfalama 50.
- **Yeni eylem kuralı:** her yeni admin server action eylem adını `requireUser({ audit: "alan.eylem" })` ile bildirir; kullanıcı/oturum gibi hassas eylemler ayrıca sonucu `recordAudit` ile yazar.
- **Ayarlar (`/admin/settings`, yalnızca admin):** site adı, slogan (`sites.name/tagline`), iletişim e-postası ve saat dilimi (`sites.settings.general`), doğrulamalı; salt okunur sistem bilgisi (siteId, alan adı, diller, çalışma modu, veritabanı motoru, ortam, arama dizini modeli, medya dizini). Kurum kimliği/`sameAs` SEO ayarlarında kalır. Kaydedince ön yüz önbelleği düşer.

## 8a. Formlar ve yedekleme

- **Form gönderimi (`/api/forms/submit`):** JS'siz HTML POST, yanıt 303. Katmanlar: bal küpü alanı `website` (doluysa sessizce başarılı gösterilir, kaydedilmez), HMAC zaman belirteci (3 sn – 24 sa; çok hızlı/eski/bozuk → hata), IP özeti başına 5 gönderim / 10 dk, form tanımı istemciden değil yayınlanmış içerikteki bloktan okunur (kiracıya kapalı), alan doğrulaması (tür, uzunluk, toplam bayt), 2'den fazla bağlantı içeren metin `spam` işaretlenir. IP ham saklanmaz (özet). Kayıtlar 365 gün sonra zamanlayıcıyla silinir. CSV dışa aktarma formül enjeksiyonuna karşı önek koyar. Silme yalnızca admin.
- **Yedek (`/admin/backup`, `/api/admin/backup/*`, yalnızca admin):** `.nxbackup` = zip (manifest + `data/<tablo>.json` + isteğe bağlı `media/<id>/original`, dosya başına SHA-256). İçerik, çeviri, bağlantılar, taksonomi, menü/yerleşim, medya kayıtları, yönlendirme, yüklenen temalar, eklenti ayarları (lisans anahtarı hariç), site ayarları. **Girmez:** kullanıcılar, parolalar, oturumlar, denetim günlüğü, arama dizini, revizyonlar, ticaret. Form gönderimleri ve yorumlar yalnızca "kişisel veri" seçilirse girer.
- **İçe aktarma:** önce `dryRun=1` doğrulaması (zip bombası sınırları, güvenli dosya adları, özet, sürüm). `merge` yalnızca eksikleri ekler; `replace` kiracının yedek tablolarını siler ve `GERI YUKLE` onay metni ister; tek işlemde çalışır. Kimlikler genel birincil anahtardır: başka kiracıya ait kimlikle çakışan satırlar atlanır ve raporlanır. İçe aktarmadan sonra arama dizini yeniden kurulmalıdır.

- **Form e-postası:** SMTP ayarları `sites.settings.email` içinde, parola `secret-box` ile şifreli; panele geri verilmez, boş bırakılan parola korunur, yedek dosyasına girmez ve `replace` içe aktarması mevcut parolayı korur. Gönderim `after()` ile yanıttan sonra yapılır; sonuç `form_submissions.notify_status` alanındadır. E-posta içeriği HTML'de kaçışlanır, konu tek satıra indirilir, ziyaretçiye yanıt yalnızca e-posta türlü alana ve spam olmayan gönderime gider (hız sınırı ve bal küpü aynen geçerli).
- **Form tanımı güvenliği:** alan listesi sunucuda normalleştirilir (sınırlar, ayrılmış ad `website`, tür/seçenek doğrulaması); yönlendirme yalnızca site içi yoldur; gönderim her zaman sunucudaki tanıma göre doğrulanır, duraklatılmış/arşivlenmiş form gönderim almaz. Form düzenleme `requireUser`, silme ve SMTP `requireAdmin`.

- **Taslak önizleme bağlantısı:** `?nx_draft=` belirteci yalnızca belirtilen `siteId` + `contentId` için geçerlidir ve sayfanın slug'ı o içeriğe ait olmalıdır; süre ≤ 30 gün. Ara katman bu parametreyi görünce yanıtı `private, no-store` + `X-Robots-Tag: noindex` yapar, sayfa `robots: noindex` verir ve üstte "Taslak önizleme" bandı gösterir. Belirteç imzası `safeEqual` benzeri sabit zamanlı karşılaştırılır; denetim günlüğüne `content.preview-link` yazılır.

- **WordPress içe aktarma (`/api/admin/wp-import`, yalnızca admin):** dosya ≤ 64 MB, ≤ 20.000 öğe; XML'de `ENTITY` tanımı reddedilir, iyi biçimlilik doğrulanır. İçerik HTML'i `htmlparser2` ile ayrıştırılıp yalnızca bilinen bloklara çevrilir (betik, stil, form, yabancı iframe atılır; satır içi HTML `sanitizeInlineHtml`'den geçer). Görsel indirme (isteğe bağlı) `lib/safe-fetch.ts` ile yapılır: yalnızca http/https ve 80/443, kimlik bilgili adres yok, bağlantı anında çözülen her IP `isPublicIp` ile doğrulanır (özel/yerel/bulut meta verisi/CGNAT/ULA/IPv4-gömülü IPv6 reddedilir), en çok 3 yönlendirme (her adım yeniden doğrulanır), 10 sn zaman aşımı, akışta 12 MB sınırı, içerik `sharp` ile doğrulanır. Denetim günlüğüne `wp-import.run` yazılır.

## 9. Derleme izolasyonu

Doğrulama derlemeleri `NEXT_DIST_DIR=.next-verify` ile ayrı klasöre alınır (`next.config.ts` `distDir`; `check-budget` aynı değişkeni okur). Aynı klasörde çalışan bir `next dev` ile `next start` birbirinin `.next` çıktısını ezebilir: bu oturumda üretim sunucusu `ChunkLoadError` verdi çünkü `.next` sonradan geliştirme düzeniyle yeniden yazılmıştı (kod hatası değildi). Yerel doğrulama ve CI için ayrı `distDir` kullanın.

