# 16 — Form Modülü

Yönetim: `/admin/forms` (liste), `/admin/forms/new` (şablon galerisi), `/admin/forms/[id]` (kurucu), `/admin/forms/[id]/analytics`, `/admin/forms/inbox`, `/admin/forms/email` (SMTP, yalnızca admin).

## 1. Veri modeli

- `forms` (göç `0010_forms_builder`): `id` (`frm_…`), `siteId`, `name`, `status` (`active|paused|archived`), `templateId`, `spec` (JSON: `fields`, `submitLabel`, `successMessage`, `redirectUrl`), `notify` (JSON), zaman damgaları. Okuma/yazma `FormDefinitionRepository` üzerinden ve `@nexpress/core` `normalizeFormSpec/normalizeNotify` ile.
- `form_submissions`: `formId` kurucu formda `frm_…`, eski satır içi bloklarda blok kimliği; `fields` JSON dizisi `{name,label,type,value,values?}`; `notify_status` (`""|sent|failed|skipped`), `notify_error`.
- `form_block` bloğu `props.formId` ile bir forma bağlanır. Bağlı değilse eski satır içi alanlar (`props.fields`) çalışır. Bağlı form silinmişse blok boş görünür.

## 2. Alan türleri

`text, textarea, email, tel, url, number, date, select, radio, checkboxes, checkbox, rating (3–10 yıldız), scale (0–10, NPS), heading, paragraph`. Her alan: `label`, `name` (makine adı), `required`, `placeholder`, `help`, `width` (`full|half`), `options`, `min/max`. Yeni tür: `packages/core/src/form-spec.ts` (tür + doğrulama) → `packages/themes/src/rsc-form.tsx` (ziyaretçi çizimi) → `apps/cms/.../forms/[id]/builder-model.ts` (palet) → `form-analytics.ts` (gerekirse içgörü).

## 3. Kurucu

`@dnd-kit` (core, sortable). Paletten sürükle-bırak veya tıklayıp ekle (klavye erişimi), kanvasta sırala (fare/klavye), çoğalt, sil; sağ panelde alan özellikleri; sekmeler: Alanlar, Ayarlar (ad, durum, düğme, başarı mesajı, yönlendirme), E-posta bildirimi, Yerleştirme. Ctrl/Cmd+S kaydeder, kaydedilmemiş değişiklikte sekme kapatma uyarısı vardır. Kurucu yalnızca `/admin` altında istemci kodudur; ziyaretçi formu sunucuda çizilir (istemci JS'i yok).

## 4. Şablonlar

İletişim, bülten, teklif talebi, geri arama, destek talebi, memnuniyet/NPS, kısa anket, etkinlik kaydı, iş başvurusu (`packages/core/src/form-templates.ts`). Şablon bir kopyadır; sonradan şablon değişse form etkilenmez.

## 5. E-posta

Ayarlar: `/admin/forms/email` (host, port, TLS, kullanıcı, parola, gönderen) veya `SMTP_URL`. Form başına: yeni gönderimde yöneticiye bildirim (alıcılar, konu `{form}`/`{site}`; Yanıtla = ziyaretçinin e-postası) ve ziyaretçiye otomatik yanıt. Gönderilemezse gönderim yine kaydedilir; durum gelen kutusunda görünür. Teslim izleme (açılma/tıklama) yoktur.

## 6. Analiz

`analyzeSubmissions` (saf, test edilir): toplam/durum/spam oranı, günlük seri (site saat dilimi), haftanın günü ve saat dağılımı, en çok gönderim alan sayfalar, alan içgörüleri: seçmeli alanlarda dağılım, puan/ölçekte ortalama ve dağılım, NPS, sayıda min/maks/ortalama, e-posta alan adı dağılımı, metinde ortalama uzunluk ve sık geçen sözcükler. Spam gönderimler alan içgörülerine katılmaz. **Görüntülenme ve dönüşüm oranı ölçülmez** (ziyaretçi sayfalarında istemci JS'i olmadığı için).

## 7. Sınırlar ve borçlar

Dosya yükleme alanı, koşullu mantık, çok adımlı form, webhook, CAPTCHA (bal küpü + zaman belirteci + hız sınırı kullanılır) ve e-posta kuyruğu/yeniden deneme yoktur; e-posta `after()` ile tek denemedir.
