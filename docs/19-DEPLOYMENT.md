# 19 — Yayına Alma (Dağıtım) Rehberi

Bu rehber, uygulamanın üretimde nasıl çalıştırılacağını ve yayından önce/sonra kontrol edilecekleri toplar. Komutlar bu depoda denenmiş akışa dayanır (`pnpm build` + `pnpm start`, CI'daki `a11y` işi aynı yolu üretim kipinde koşar). **Bu rehberdeki Dockerfile/Kubernetes gibi kapsayıcı kurulumları yoktur**; kapsayıcı isterseniz Node 20 + pnpm ile aynı komutlar kullanılır.

## 1. Gereksinimler

- Node.js 20, pnpm 10 (`corepack enable`).
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

İsteğe bağlı: `REQUIRE_ADMIN_2FA=1`, `SMTP_URL`, `OPENAI_API_KEY`, `MCP_AGENT_KEY`, `MEDIA_DIR`, `REDIS_URL` (bugün yalnızca bildirilmiş altyapı; giriş sınırları süreç belleğindedir).

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

Yedek dosyasını **sunucu dışına** kopyalamak sizin işinizdir (rsync, nesne depolama, sağlayıcı anlık görüntüsü). Aşağıdakiler de geçerli:

- Panel: **Yedek** → `.nxbackup` (içerik, çeviri, taksonomi, menü, ayarlar, tema, görsel özgünleri). **Belge/video/ses dosyaları, kullanıcılar, parolalar, oturumlar, denetim günlüğü ve ticaret yedeğe girmez.**
- Bu yüzden ayrıca **veritabanı** (SQLite dosyası ya da `pg_dump`) ve **`MEDIA_DIR` klasörü** sunucu düzeyinde yedeklenmeli. Komut satırı (`db:export`) yedeği yoktur; geri yükleme panelden yapılır.

## 7. Güvenlik denetim listesi

- [ ] İçerik Güvenliği Politikası açık (`curl -I` ile `Content-Security-Policy` görülüyor; ek betik gerekiyorsa `CSP_EXTRA_SCRIPT_SRC`).
- [ ] `AUTH_SECRET` güçlü, `ADMIN_DEFAULT_*` kaldırıldı, yönetici 2FA açık.
- [ ] HTTPS ve `NEXT_PUBLIC_APP_URL` doğru; `curl -I` ile `Strict-Transport-Security` görülüyor.
- [ ] Panelde *Sistem durumu*: ortam, göçler, medya klasörü, arama dizini yeşil.
- [ ] SMTP tanımlı ve **Formlar → E-posta → Test e-postası** başarılı (davet ve parola sıfırlama buna bağlı).
- [ ] `robots.txt`, `/sitemap.xml`, `/llms.txt` beklenen adrese işaret ediyor; Search Console / Bing'e site haritası eklendi.
- [ ] Veritabanı ve `MEDIA_DIR` yedeği ayrı bir yere alınıyor; geri yükleme bir kez denendi.
- [ ] Çoklu sunucu (yük dengeli) kuruyorsanız: giriş/sıfırlama hız sınırları ve ön yüz önbelleği **süreç başınadır**; ortak Redis katmanı henüz yok. Tek sunucuyla başlayın.

## 8. ileriseo.com otomatik aktarım

`main` dalına push, CI'daki tip kontrolü ve testler geçince GitHub Actions sunucuya bağlanır (`38.210.77.230` kapı `4383`). Bağlantı yalnızca `DEPLOY_SSH_KEY` sırrındaki anahtarla olur; anahtar sunucuda tek bir güncelleme betiğini çalıştırır. Betik depoyu çeker, göçü uygular, üretim derlemesini alır ve `nexpress` servisini yeniden başlatır. Kök parola ve `AUTH_SECRET` depoya yazılmaz.

Canlı veritabanı PostgreSQL 16 + pgvector 0.6 (`nexpress_cms`, yalnızca `127.0.0.1:5432`). `DB_DIALECT=postgresql`. RAG vektör sütunu `vector(1536)` ve HNSW indeksi bu kurulumdadır. SQLite dosyası durur, uygulama onu okumaz.

## 9. Bilinen sınırlar

Bkz. `docs/12-ROADMAP.md`: Redis/S3/kuyruk (çok sunuculu kurulum), CLI yedek, Lighthouse CI, Search Console bağlantısı ve "Yakında" eklenti modülleri.
