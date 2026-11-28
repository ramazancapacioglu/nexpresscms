# 19 — Yayına Alma (Dağıtım) Rehberi

Bu rehber, uygulamanın üretimde nasıl çalıştırılacağını ve yayından önce/sonra kontrol edilecekleri toplar. Komutlar bu depoda denenmiş akışa dayanır (`pnpm build` + `pnpm start`, CI'daki `a11y` işi aynı yolu üretim kipinde koşar). **Bu rehberdeki Dockerfile/Kubernetes gibi kapsayıcı kurulumları yoktur**; kapsayıcı isterseniz Node 20 + pnpm ile aynı komutlar kullanılır.

## 1. Gereksinimler

- Node.js 20+, pnpm 9 (`packageManager: pnpm@9.15.0`, `corepack enable`).
- Veritabanı: **SQLite/LibSQL** (tek sunucu, dosya) ya da **PostgreSQL 16 + pgvector** (kurumsal; `docker-compose.yml`).
- Kalıcı disk: `MEDIA_DIR` (varsayılan `apps/cms/data/media`) — yüklenen görsel/PDF/video/ses ve türevleri burada durur. **Yedeğe alın.**
- Tersine vekil (nginx/Caddy) ile HTTPS. Uygulama kendi TLS'ini sonlandırmaz; `Strict-Transport-Security` başlığı üretimde gönderilir.

## 2. Zorunlu ortam değişkenleri (üretim)

| Değişken | Not |
| :-- | :-- |
| `NODE_ENV=production` | `pnpm start` zaten üretim kipinde çalışır |
| `AUTH_SECRET` | **En az 32 karakter, varsayılan olmayan** rastgele değer; zayıfsa uygulama açılmaz (`openssl rand -base64 48`). Değiştirirseniz tüm oturumlar düşer |
| `NEXT_PUBLIC_APP_URL` | Herkese açık adres (`https://alanadiniz.com`). Site haritası, canonical, beslemeler, davet/sıfırlama e-postaları buna bağlıdır; boşsa `localhost` yazılır |
| `DB_DIALECT` + `SQLITE_URL` veya `DATABASE_URL` | Veritabanı bağlantısı |
| `ADMIN_DEFAULT_EMAIL`, `ADMIN_DEFAULT_PASSWORD` | **Yalnızca ilk kurulumda** ilk yöneticiyi oluşturur. Üretimde `Admin123!` ve politikaya uymayan parola kabul edilmez. İlk girişten sonra bu iki değişkeni kaldırın |
| `SECRETS_KEY` (önerilir) | SMTP parolası, 2FA anahtarı gibi sırları şifreleyen anahtar; yoksa `AUTH_SECRET` kullanılır. **Sonradan değiştirmeyin** (kayıtlı sırlar okunamaz olur) |
| `CRON_SECRET` | Zamanlanmış yayın için kesin tetikleyici (bkz. §5) |

İsteğe bağlı: `REQUIRE_ADMIN_2FA=1`, `SMTP_URL`, `OPENAI_API_KEY`, `MCP_AGENT_KEY`, `MEDIA_DIR`, `REDIS_URL` (çoklu örnekte hız sınırları ve önbellek dönemini paylaşır; tanımsızsa süreç belleğine düşer).

## 3. İlk kurulum (Otomatik & Doğrudan Host Dağıtımı)

NexPress CMS, Docker gerektirmeden standart Ubuntu/Debian VPS, Cloud sunucu veya Node.js destekli hostinglerde doğrudan çalışacak şekilde tasarlanmıştır.

### A) 1-Tık Kurulum Sihirbazı (Önerilen)

Sunucunuza depoyu klonladıktan sonra tek bir komutla kurulum sihirbazını başlatabilirsiniz:

```bash
bash scripts/install-host.sh
```

Bu betik sırasıyla:
1. Node.js (>=20) ve `pnpm` gereksinimlerini doğrular (eksikse kurar/etkinleştirir).
2. PostgreSQL (pgvector) bağlantısı (`DATABASE_URL`), alan adı ve yönetici bilgilerini sorarak güvenli `.env` dosyasını oluşturur (kriptografik `AUTH_SECRET` ve `SECRETS_KEY` otomatik üretilir).
3. `pnpm install --frozen-lockfile` ile bağımlılıkları yükler.
4. `pnpm db:migrate` ile veritabanı tablolarını ve pgvector uzantısını kurar.
5. `pnpm db:seed` ile başlangıç sitesini ve hazır şablonları ekler.
6. `pnpm build` ile Next.js 15 üretim derlemesini alır.
7. PM2 yüklüyse uygulamayı `ecosystem.config.cjs` üzerinden arka planda başlatır ve `pm2 save` eder.

### B) Manuel Kurulum Adımları

```bash
pnpm install --frozen-lockfile
pnpm db:migrate        # şemayı kurar/günceller (PostgreSQL pgvector tabloları)
pnpm db:seed           # YALNIZCA yeni ve boş kurulumda: site kaydı ve başlangıç içeriği
pnpm build             # üretim derlemesi
pm2 start ecosystem.config.cjs   # veya: pnpm start
```

### C) Süreç Yönetimi (PM2 & systemd)

- **PM2 ile Çalıştırma:**
  ```bash
  pm2 start ecosystem.config.cjs
  pm2 reload nexpress --update-env   # sıfır kesintiyle yeniden başlatma
  pm2 logs nexpress                  # canlı günlükler
  pm2 save && pm2 startup            # sunucu açılışında otomatik başlatma
  ```
- **Systemd ile Çalıştırma:**
  `scripts/nexpress.service` dosyasını `/etc/systemd/system/nexpress.service` konumuna kopyalayın:
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable nexpress
  sudo systemctl start nexpress
  ```

### D) Nginx Tersine Vekil (Reverse Proxy & SSL)

`scripts/nginx-nexpress.conf` şablonu WebSocket, 70MB dosya yükleme sınırı ve `/_next/static` ile `/media` için statik önbellekleme kurallarını içerir:

```bash
sudo cp scripts/nginx-nexpress.conf /etc/nginx/sites-available/nexpress.conf
sudo ln -s /etc/nginx/sites-available/nexpress.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d alanadiniz.com
```

ileriseo.com nginx ile Node'a vekil eder. Panelde kalıcı bağlantı kaydı `apps/cms/public/.htaccess` yazar; bu dosya depoya girmez (`**/public/.htaccess`). Güncelleme betiği pull öncesi onu siler, yoksa sunucudaki kopya `git pull`'u keser. Nginx bu dosyayı uygulamaz. 404 bu kayıttan sonra da sürerse kaynak vekil veya uygulama rotasıdır. Apache önünde dosya `HTACCESS_PATH` ile belge köküne alınabilir.

### E) 1-Tık Güncelleme (Update Script)

Yeni bir sürüm yayınlandığında sunucuda tek komutla güncelleme yapılır:

```bash
bash scripts/update-host.sh
```

- Her sürüm güncellemesinden sonra **önce `pnpm db:migrate`**, sonra yeniden başlatın. Bekleyen göç varsa panelde *Sistem durumu → Göçler* uyarı verir; çalıştırılmamış göçle bazı sayfalar `column … does not exist` hatası verir.
- `db:seed` mevcut verinin üstüne çalıştırılmaz. Seed içeriği "demo" niteliğindedir: yayına almadan önce örnek sayfa/yazıları silin ya da kendi içeriğinizle değiştirin; ön yüzde sahte veri gösterilmez kuralı için kalan örnekleri kontrol edin.
- İlk giriş: `ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD`. Hemen **Profil → İki adımlı doğrulama**'yı kurun; yönetici hesabında 2FA'yı zorunlu kılmak için `REQUIRE_ADMIN_2FA=1`.

## 4. Sağlık denetimi

`GET /api/health` kimlik gerektirmez; `{"status":"ok"}` (200) ya da veritabanı yanıt vermiyorsa `{"status":"degraded"}` (503) döner. Yük dengeleyici ve çalışma süresi izleyicisi bu adresi kullanın. Ayrıntılı denetim için panelde **Sistem durumu**.

## 5. Zamanlayıcı (zamanlanmış yayın)

Ziyaretçi trafiği dakikada bir zamanlayıcıyı tetikler; trafiksiz sitede yayın gecikir. Kesin zamanlama için `CRON_SECRET` tanımlayıp dakikada bir çağırın:

```bash
* * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://alanadiniz.com/api/cron/scheduled > /dev/null
```

## 6. Yedek

**Zamanlanmış yedek:** `CRON_SECRET` tanımlıyken günde bir çağırın; yedek `BACKUP_DIR` (varsayılan `apps/cms/data/backups`) klasörüne yazılır, en yeni `BACKUP_KEEP` (7) dosya tutulur, dosyalar yalnızca sahibi tarafından okunur (0600). `?media=1` görsel özgünlerini ekler; kişisel veri (form gönderimi/yorum) bu yola girmez. Son yedeğin yaşı *Sistem durumu*'nda görünür (48 saatten eskiyse uyarı).

```bash
17 3 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://alanadiniz.com/api/cron/backup?media=1" > /dev/null
```

Yedek dosyasını sunucu dışına almak için `BACKUP_COPY=s3` (aynı `S3_*` ayarı, anahtar `backups/{site}/{dosya}`). Boşsa kopya yapılmaz; rsync veya disk anlık görüntüsü yine kullanılabilir. Aşağıdakiler de geçerli:

- Panel: **Yedek** → `.nxbackup` (içerik, çeviri, taksonomi, menü, ayarlar, tema, görsel özgünleri). **Belge/video/ses dosyaları, kullanıcılar, parolalar, oturumlar, denetim günlüğü ve ticaret yedeğe girmez.**
- Bu yüzden ayrıca **veritabanı** (SQLite dosyası ya da `pg_dump`) ve **`MEDIA_DIR` klasörü** sunucu düzeyinde yedeklenmeli. Komut satırından kiracı JSON yedeği almak ve geri yüklemek için `pnpm db:export -- --site=default --out=./backup.json` ve `pnpm db:import -- --site=default --in=./backup.json` komutları da kullanılabilir.

## 7. Güvenlik denetim listesi

- [ ] İçerik Güvenliği Politikası açık (`curl -I` ile `Content-Security-Policy` görülüyor; ek betik gerekiyorsa `CSP_EXTRA_SCRIPT_SRC`).
- [ ] `AUTH_SECRET` güçlü, `ADMIN_DEFAULT_*` kaldırıldı, yönetici 2FA açık.
- [ ] HTTPS ve `NEXT_PUBLIC_APP_URL` doğru; `curl -I` ile `Strict-Transport-Security` görülüyor.
- [ ] Panelde *Sistem durumu*: ortam, göçler, medya klasörü, arama dizini yeşil.
- [ ] SMTP tanımlı ve **Formlar → E-posta → Test e-postası** başarılı (davet ve parola sıfırlama buna bağlı).
- [ ] `robots.txt`, `/sitemap.xml`, `/llms.txt` beklenen adrese işaret ediyor; Search Console / Bing'e site haritası eklendi.
- [ ] Veritabanı ve `MEDIA_DIR` yedeği ayrı bir yere alınıyor; geri yükleme bir kez denendi.
- [ ] Kanonik alan adı yönlendirmesi `NEXT_PUBLIC_APP_URL` değerine göre çift yönlü çalışır (`canonicalHostRedirect`: kanonik adres çıplaksa `www` → apeks, `www` ise apeks → `www` 308 ile gider). Ters vekil yönlendirmesinin `NEXT_PUBLIC_APP_URL` ile aynı yönde olduğundan emin olun; aksi halde yönlendirme döngüsü oluşur.
- [ ] `/.well-known/security.txt` iletişim adresi döner (`SECURITY_CONTACT` veya Ayarlar › iletişim e-postası).
- [ ] İndeks açılacaksa `INDEXNOW_API_KEY` tanımlı ve `/indexnow-key.txt` 200.
- [ ] Çoklu sunucu (yük dengeli): `REDIS_URL` hız sınırı ve önbellek dönemini paylaşır. Medya için `MEDIA_DRIVER=s3`. CDN temizleme isteğe bağlıdır (`CDN_PURGE_PROVIDER`). Veri önbelleğinin kendisi (`unstable_cache`) hâlâ örnek başınadır.

## 8. ileriseo.com otomatik aktarım

`main` dalına push, CI'daki tip kontrolü ve testler geçince GitHub Actions sunucuya bağlanır (`38.210.77.230` kapı `4383`). Bağlantı yalnızca `DEPLOY_SSH_KEY` sırrındaki anahtarla olur; anahtar sunucuda tek bir güncelleme betiğini çalıştırır. Betik depoyu çeker, göçü uygular, üretim derlemesini alır ve `nexpress` servisini yeniden başlatır. Kök parola ve `AUTH_SECRET` depoya yazılmaz.

Canlı veritabanı PostgreSQL 16 + pgvector 0.6 (`nexpress_cms`, yalnızca `127.0.0.1:5432`). `DB_DIALECT=postgresql`. RAG vektör sütunu `vector(1536)` ve HNSW indeksi bu kurulumdadır. SQLite dosyası durur, uygulama onu okumaz.

## 8b. Ters vekil ve `request.url` (2026-11-16)

Next (`next start`), `Host` başlığını `request.url` için kullanmaz; vekil arkasında adres `localhost:PORT` olur. Ziyaretçiye dönen mutlak yönlendirmeler `lib/public-url.ts` (`publicUrl(path, request)`) ile kurulur; `Host`/`X-Forwarded-Host` ve `X-Forwarded-Proto` başlıkları okunur. Vekil `proxy_set_header Host $host` ve `X-Forwarded-Proto $scheme` göndermelidir (Plesk için örnek `scripts/nginx-nexpress.conf`). Yeni route'larda `new URL(x, request.url)` yerine `publicUrl` kullanın.

## 8c. Eski WordPress dosya adresleri (2026-11-16)

`/wp-content/uploads/…` rotası iki iş yapar: belge ve arşiv dosyalarını (`pdf`, `zip`, `docx`, `xlsx`…) `WP_UPLOADS_DIR` (varsayılan `./data/wp-uploads`) altından özgün adresinde sunar; görsel adreslerini (boyutlu kopyalar dahil) medya kitaplığına 301 ile yönlendirir. `WP_UPLOADS_DIR` kalıcı diskte olmalı ve yedeğe girmelidir. Dosya türü izin listesi `lib/wp-uploads.ts` içindedir (betik, HTML, SVG sunulmaz). Dosyalar `import-wp-extras.ts --only files` ile iner.

## 8d. Performans (2026-11-16)

- Dağıtımdan sonra `node apps/cms/scripts/warm-cache.mjs --base http://127.0.0.1:3001 --host <alan-adi>` çalıştırın: sayfaları gezip görsel türevlerini (AVIF/WebP/JPG) üretir; ilk ziyaretçi LCP'de 2–3 sn ödemez. Yalnızca GET yapar.
- HTML önbelleği için `PUBLIC_CACHE_SECONDS` (varsayılan 0 = paylaşımlı önbellek yok). Yayına alınca 60 gibi bir değer ve vekilde `s-maxage` düşünün.
- Ölçüm: `npx lighthouse <adres> --throttling-method=provided` (mobil) ve `--preset=desktop`. Sonuçlar `docs/06`.
- Kural: kaydırma kaplarına negatif kenar boşluğu (`-mx-*`) verilmez; mobilde Chrome LCP adayı üretmeyebilir.
Aynı makinede ikinci abonelik `akinsoftizmir.com.tr` ayrı ağaçtır: `/var/www/vhosts/akinsoftizmir.com.tr/nexpress`, servis `nexpress-akinsoft`, kapı `3001`, veritabanı `nexpress_akin`. GitHub aktarımı yalnızca `ileriseo.com` ağacını ve `nexpress` servisini günceller; bu ikinci kopyaya `git pull` veya `update-host.sh` çalıştırılmaz. İlk kurulum demo sayfa içermez. Arama dizini kapalıdır (`settings.seo.searchIndexing = false`). Alan adı hâlâ eski sunucuya baktığı sürece sertifika Plesk öntanımlısıdır; DNS bu makineye geldikten sonra sertifika yenilenir.

## 8e. Canlı sunucu notları (2026-11-26)
- **Dağıtım sırası (akinsoftizmir.com.tr):** `pg_dump` yedeği → site kullanıcısıyla `git pull --ff-only` → site kullanıcısıyla `pnpm --filter @nexpress/cms build` (`.env` yüklü) → `systemctl restart nexpress-akinsoft` → `/api/health`, `/`, `/sitemap.xml` duman testi. Göç yalnızca yeni göç dosyası varsa. Derleme `.next`i yerinde yazar; derleme ile yeniden başlatma arası kısa bir pencere vardır.
- **`X-Powered-By`:** Plesk sunucu düzeyinde `add_header X-Powered-By PleskLin` basar. `vhost_nginx.conf` içindeki `location /` bloğuna `add_header X-Powered-By "";` eklenince bu başlık miras alınmaz (yalnızca o konumda başka `add_header` yoksa geçerlidir). Değişiklikten önce `vhost_nginx.conf.bak-<tarih>` alınır; `plesk sbin httpdmng --reconfigure-domain <alan>` ile uygulanır.
- **nginx paylaşımlı önbelleği bilerek açılmadı:** bot telemetrisi (`trackBotVisit`: yapay zeka botu ziyaretleri) yalnızca kaynak sunucuya ulaşan istekleri sayar; önbellekten dönen yanıtlar sayılmaz ve GEO raporu eksik kalır. Ölçülen TTFB (tek istekte 0,2–0,5 sn) kabul edilebilir. Önbellek gerekirse yalnızca insan trafiği için (bilinen bot UA'ları `proxy_cache_bypass` ile atlanarak) ve `nx_` çerezi taşıyan isteklerin dışarıda bırakılmasıyla açılmalıdır.

## 9. Bilinen sınırlar

Bkz. `docs/12-ROADMAP.md`. Redis, S3 medya ve S3 yedek kopyası isteğe bağlıdır (boşsa tek sunucu + yerel disk). Kuyruk (BullMQ), Lighthouse CI ve Search Console bağlantısı duruyor. Kök düzen `headers()` okuduğu için sayfalar Next önbelleğinde statik değildir; HTML önbelleği `PUBLIC_CACHE_SECONDS` ile CDN/nginx katmanındadır.

## Plesk sunucusunda kalıcı çalıştırma (systemd) ve www (2026-11-17)
- Uygulama kullanıcı sürecini elle başlatmak yerine `systemd` hizmetiyle çalışır (`/etc/systemd/system/<ad>.service`): site kullanıcısı, `EnvironmentFile=.env`, `PORT`, `ExecStart=node scripts/start.cjs`, `Restart=always`, PostgreSQL'den sonra başlar (`After=`/`Wants=postgresql.service`, `override.conf`). `systemctl enable` ile açılışta başlar; süreç çökerse 5 sn içinde yeniden kalkar. Dağıtım: `next build` (site kullanıcısı olarak, `.env` yüklü) → `systemctl restart <ad>`.
- Plesk nginx `vhost_nginx.conf` içinde `proxy_pass http://127.0.0.1:<PORT>` tutar. Tercih edilen alan adı `www` ise `plesk bin site -u <alan> -seo-redirect www` çıplak adresi 301 ile `www`'ye yönlendirir; uygulama kanonik adresi `NEXT_PUBLIC_APP_URL` ile bilir (derleme zamanında gömülür: değişince yeniden derleyin), aksi hâlde `www` ↔ çıplak döngüsü oluşur.
- Let's Encrypt: DNS yeni sunucuyu gösterdikten sonra Plesk'ten hem çıplak hem `www` için alınır.

## Ters Vekil ve Yerel Dağıtım Yönlendirme Sözleşmesi

Ara katman (`middleware.ts`), tek dilli ön eksiz yönlendirmeleri (`/tr/x → 308 /x`) ve indeks politikasını çözmek için dahili `/api/locale-mode` ucuna istek atar. 308 yönlendirme döngüsü yaşanmaması için şu üç değişkenin aynı topolojiyle hizalı olması gerekir:

| Değişken | Amaç | Örnek (Canlı Nginx arkasında) | Örnek (Yerel üretim testi) |
| --- | --- | --- | --- |
| `PORT` | Next.js sunucusunun dinlediği yerel port | `3001` | `4168` |
| `INTERNAL_APP_URL` | Ara katmanın kendi sürecine eriştiği yerel adres | `http://127.0.0.1:3001` | `http://127.0.0.1:4168` |
| `NEXT_PUBLIC_APP_URL` | Ziyaretçiye dönen varsayılan yayın kökeni | `https://alanadiniz.com` | `http://127.0.0.1:4168` |

- `INTERNAL_APP_URL` boş bırakılırsa ara katman `http://127.0.0.1:${PORT}` adresini dener; farklı bir portta çalışan testlerde `PORT` ve `INTERNAL_APP_URL` mutlaka eşleştirilmelidir.
- Ters vekil (Nginx/Caddy) `Host`, `X-Forwarded-Host` ve `X-Forwarded-Proto` başlıklarını iletmeli, Markdown içerik müzakeresi için `Vary: Accept` başlığını korumalıdır.
