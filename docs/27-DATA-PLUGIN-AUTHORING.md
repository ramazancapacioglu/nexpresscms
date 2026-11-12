# 27 — Veri eklentisi (.nxplugin) yazarlık ve güvenlik sözleşmesi

Veri eklentisi **kod çalıştırmaz**. Zip içinde yalnızca doğrulanan JSON dosyaları bulunur; sunucu paketi açmadan önce boyut ve dosya sayısını denetler, kod ya da ön yüze yüklenebilir her dosyayı (`js`, `html`, `svg`, `wasm`, `php`, `sh`…) **reddeder**. Kod eklentileri (React/sunucu kodu) hâlâ yalnızca derleme zamanıdır (`docs/13` §1).

## 1. Paket içeriği

| Dosya | Zorunlu | Ne yapar |
| :--- | :--- | :--- |
| `plugin.json` | evet | `id` (3–40, küçük harf/rakam/tire), `name`, `version` (1.2.3), `vendor`, `description`, `homepage` (https), `publisherKey` (Ed25519, 43 karakter base64url) |
| `content-types.json` | hayır | `CustomContentType[]` (en çok 6; `docs/03` özel içerik türleri). Geçersiz tür ya da alan paketi **reddettirir** (sessizce eksik kurulmaz). Alanda `schemaProp` ile JSON-LD eşlemesi |
| `pages/*.json` | hayır | Başlangıç sayfası: `slug`, `title`, `tldr?`, `type` (`page`/`post`), `blocks` (katalog blokları; `.nxtheme` ile aynı şema). En çok 20 |
| `webhooks.json` | hayır | `{ id, event, url, description? }[]` (en çok 5). Olaylar: `content.published`, `content.updated` |
| `plugin.sig` | hayır | `{ "signature": "<base64url>" }` |
| `README.md` | hayır | Gösterilmez, yok sayılır |

Sınırlar: zip 2 MB, açılmış 8 MB, en çok 20 dosya, JSON başına 256 KB.

## 2. Webhook sözleşmesi

Adres yalnızca **https, alan adı, 443 portu**; IP, `localhost`, `.local/.internal`, kullanıcı bilgisi reddedilir. Gönderimde adres **bağlantı anında** çözülür ve her IP'nin genel internete ait olması şarttır (DNS yeniden bağlama, bulut meta veri ve iç ağ adresleri engellenir); yönlendirme izlenmez; 5 sn zaman aşımı. Gövde: `{ event, plugin, webhook, deliveredAt, data: { contentId, type, slug, title, url, status, locale } }` — **içerik metni ve kişisel veri gitmez**. Başlıklar: `X-NexPress-Event`, `X-NexPress-Delivery`, `X-NexPress-Timestamp` (Unix sn), `X-NexPress-Signature: sha256=<HMAC-SHA256(sır, zaman + "." + gövde) onaltılık>`. Sır, eklenti ilk etkinleştirilince üretilir, `secret-box` ile şifreli saklanır ve yalnızca yönetici panelinden (denetim günlüğüne yazılarak) gösterilir. Alıcı zaman damgası eskiyse (ör. 5 dk) isteği reddetmelidir. Sonuç eklenti kartında "Son bildirim" olarak görünür; hata içerik kaydını etkilemez.

## 3. İmza ve güven

- Bütünlük: `checksum` = SHA-256( sıralı her dosya için `ad\0uzunluk\0bayt`, `plugin.sig` hariç ). Değişen tek bayt imzayı bozar.
- İmza: Ed25519 üzerinde `nxplugin-v1:<checksum>`; açık anahtar `plugin.json › publisherKey` (manifest imzaya dahildir).
- Durumlar: **Doğrulanmış yayıncı** (imza geçerli ve anahtar sunucuda `PLUGIN_TRUSTED_KEYS` listesinde), **İmzalı, yayıncı tanınmıyor**, **İmzasız**; imza **geçersizse paket kurulmaz**. İmza yalnızca "bu anahtar sahibinden geldi, değişmedi" der; güven kararı sunucu yöneticisinindir.
- Araç: `node scripts/nxplugin.mjs keygen > anahtar.json`, `node scripts/nxplugin.mjs pack <klasor> --key anahtar.json -o paket.nxplugin`.

## 4. Kurulum akışı ve izinler

Yükleme (`/admin/plugins/packages`, yalnızca yönetici) paketi doğrular ve **devre dışı** kurar; hiçbir içeriğe/ayara dokunmaz. Kart, paketin yapacağı her şeyi listeler (eklenen türler, taslak sayfalar, webhook alan adları ve adresleri). **Etkinleştirme açık onay ister.** Etkinleşince: türler siteye eklenir (var olan başka kaynaklı tür kimliğiyle çakışma ya da 12 tür sınırı **reddedilir**); sayfalar yalnızca istenirse ve **taslak** eklenir (aynı adresli içerik ezilmez); webhook sırrı üretilir. Devre dışı bırakınca eklentinin türleri kaldırılır (türde içerik varsa reddedilir). Etkin eklenti güncellenemez/silinemez: önce devre dışı bırakılır (izinler değişmiş olabilir, yeniden onay). Eklentinin eklediği tür, tür yöneticisinden elle silinemez. Tüm eylemler denetim günlüğündedir (`plugins.upload|enableData|disableData|deleteData|revealWebhookSecret`).

## 5. Bilinen sınırlar

- Kod, sunucu rotası, yeni tablo, ziyaretçi CSS/JS'i eklenemez (bilerek).
- Webhook olayları yalnızca içerik yayını/güncellemesidir (form gönderimi kişisel veri taşıdığı için yok).
- Eklenti ayar alanları ve çeviri paketi henüz yok.
