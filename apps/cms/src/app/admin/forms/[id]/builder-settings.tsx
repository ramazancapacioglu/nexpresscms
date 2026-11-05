"use client";

import React from "react";
import Link from "next/link";
import { DEFAULT_FORM_APPEARANCE, type FormAppearance, type FormField, type FormNotifySettings, type FormSpec } from "@nexpress/core";
import type { FormDefinitionStatus } from "@nexpress/database";
import { inputCls, Row, Toggle } from "./builder-inspector";

const note = "rounded-md bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-300";

export function SettingsTab({ name, setName, status, setStatus, spec, patchSpec }: { name: string; setName: (v: string) => void; status: FormDefinitionStatus; setStatus: (v: FormDefinitionStatus) => void; spec: FormSpec; patchSpec: (p: Partial<FormSpec>) => void }) {
  return (
    <div className="max-w-xl space-y-3">
      <Row label="Form adı (yalnızca panelde)"><input className={inputCls} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></Row>
      <Row label="Durum" hint="Duraklatılan veya arşivlenen form sayfada 'kabul etmiyor' mesajı gösterir.">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as FormDefinitionStatus)}>
          <option value="active">Aktif — gönderim alır</option>
          <option value="paused">Duraklatıldı</option>
          <option value="archived">Arşivlendi</option>
        </select>
      </Row>
      <Row label="Gönder düğmesi metni"><input className={inputCls} value={spec.submitLabel} maxLength={60} onChange={(e) => patchSpec({ submitLabel: e.target.value })} /></Row>
      <Row label="Başarı mesajı" hint="Boşsa sitenin varsayılan teşekkür metni gösterilir.">
        <textarea className={`${inputCls} h-16 py-1.5`} value={spec.successMessage} maxLength={300} onChange={(e) => patchSpec({ successMessage: e.target.value })} />
      </Row>
      <Row label="Başarıdan sonra yönlendir (isteğe bağlı)" hint="Yalnızca site içi yol: /tesekkurler. Boşsa aynı sayfada mesaj gösterilir.">
        <input className={`${inputCls} font-mono`} value={spec.redirectUrl} placeholder="/tesekkurler" maxLength={200} onChange={(e) => patchSpec({ redirectUrl: e.target.value })} />
      </Row>
    </div>
  );
}

export function DesignTab({ spec, patchSpec }: { spec: FormSpec; patchSpec: (p: Partial<FormSpec>) => void }) {
  const look = spec.appearance ?? DEFAULT_FORM_APPEARANCE;
  const set = (p: Partial<FormAppearance>) => patchSpec({ appearance: { ...look, ...p } });
  return (
    <div className="max-w-xl space-y-3">
      <Row label="Sütun" hint="Dar ekranda alanlar alt alta iner. Çeyrek genişlik 4 sütunda bir hücre tutar.">
        <select className={inputCls} value={look.columns} onChange={(e) => set({ columns: Number(e.target.value) as 1 | 2 | 4 })}>
          <option value={1}>Tek sütun — alt alta</option>
          <option value={2}>2'li — yan yana</option>
          <option value={4}>4'lü — sık ızgara</option>
        </select>
      </Row>
      <Row label="Etiket">
        <select className={inputCls} value={look.labels} onChange={(e) => set({ labels: e.target.value as FormAppearance["labels"] })}>
          <option value="top">Üstte</option>
          <option value="side">Solda</option>
        </select>
      </Row>
      <Row label="Sıklık">
        <select className={inputCls} value={look.density} onChange={(e) => set({ density: e.target.value as FormAppearance["density"] })}>
          <option value="comfortable">Ferah</option>
          <option value="compact">Sıkı</option>
        </select>
      </Row>
      <Row label="Gönder düğmesi">
        <select className={inputCls} value={look.buttonAlign} onChange={(e) => set({ buttonAlign: e.target.value as FormAppearance["buttonAlign"] })}>
          <option value="left">Satırın solunda</option>
          <option value="center">Ortada</option>
          <option value="full">Satırı kaplasın</option>
          <option value="beside">Son alanın yanında</option>
        </select>
      </Row>
      <Row label="Yüzey">
        <select className={inputCls} value={look.surface} onChange={(e) => set({ surface: e.target.value as FormAppearance["surface"] })}>
          <option value="inline">Sayfanın içinde</option>
          <option value="dialog">Açılır pencere</option>
        </select>
      </Row>
      {look.surface === "dialog" && (
        <Row label="Tetik metni" hint="Ziyaretçi bu bağlantıya basınca form açılır. Sayfaya istemci kodu eklenmez.">
          <input className={inputCls} value={look.triggerLabel} maxLength={60} placeholder="Hızlı iletişim" onChange={(e) => set({ triggerLabel: e.target.value })} />
        </Row>
      )}
      <Toggle checked={look.stepped} onChange={(v) => set({ stepped: v })}>Adımlı form</Toggle>
      {look.stepped && <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Alanlara adım numarası verin. Ziyaretçi adımı sayfa yenilenmeden değiştirir. Gönder düğmesi son adımdadır; sunucu yine bütün zorunlu alanları denetler.</p>}
    </div>
  );
}

export function NotifyTab({ notify, patch, fields, smtpReady, contactEmail, isAdmin }: { notify: FormNotifySettings; patch: (p: Partial<FormNotifySettings>) => void; fields: FormField[]; smtpReady: boolean; contactEmail: string; isAdmin: boolean }) {
  const emails = fields.filter((f) => f.type === "email");
  const setReply = (p: Partial<FormNotifySettings["autoReply"]>) => patch({ autoReply: { ...notify.autoReply, ...p } });
  return (
    <div className="max-w-xl space-y-4">
      {!smtpReady && (
        <p className={note}>
          E-posta gönderimi henüz yapılandırılmamış; bildirimler gönderilemez (gönderimler yine kaydedilir).{" "}
          {isAdmin ? <Link href="/admin/forms/email" className="font-medium underline">SMTP ayarlarını yapın</Link> : "Bir yöneticiden SMTP ayarlarını istemelisiniz."}
        </p>
      )}
      <section className="space-y-3">
        <Toggle checked={notify.enabled} onChange={(v) => patch({ enabled: v })}>Yeni gönderimde bana e-posta gönder</Toggle>
        {notify.enabled && (
          <>
            <Row label="Alıcılar" hint={`Virgül veya satırla ayırın. Boşsa iletişim e-postası kullanılır${contactEmail ? ` (${contactEmail})` : " (Ayarlar'da tanımlı değil)"}.`}>
              <textarea className={`${inputCls} h-16 py-1.5`} defaultValue={notify.to.join(", ")} onBlur={(e) => patch({ to: e.target.value.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean) })} />
            </Row>
            <Row label="Konu" hint="{form} form adıyla, {site} site adıyla değişir."><input className={inputCls} value={notify.subject} maxLength={150} onChange={(e) => patch({ subject: e.target.value })} /></Row>
          </>
        )}
      </section>
      <section className="space-y-3 border-t border-[#E6E7EA] pt-4 dark:border-[#23262E]">
        <Toggle checked={notify.autoReply.enabled} onChange={(v) => setReply({ enabled: v })}>Ziyaretçiye otomatik yanıt gönder</Toggle>
        {emails.length === 0 && <p className={note}>Otomatik yanıt için forma bir <strong>E-posta</strong> alanı ekleyin.</p>}
        {notify.autoReply.enabled && emails.length > 0 && (
          <>
            <Row label="Alıcı alan">
              <select className={inputCls} value={notify.autoReply.emailField} onChange={(e) => setReply({ emailField: e.target.value })}>
                {emails.map((f) => <option key={f.id} value={f.name}>{f.label}</option>)}
              </select>
            </Row>
            <Row label="Konu"><input className={inputCls} value={notify.autoReply.subject} maxLength={150} onChange={(e) => setReply({ subject: e.target.value })} /></Row>
            <Row label="Mesaj" hint="Düz metin. Spam sayılan gönderimlere yanıt gönderilmez.">
              <textarea className={`${inputCls} h-24 py-1.5`} value={notify.autoReply.body} maxLength={2000} onChange={(e) => setReply({ body: e.target.value })} />
            </Row>
          </>
        )}
      </section>
      <section className="space-y-3 border-t border-[#E6E7EA] pt-4 dark:border-[#23262E]">
        <Toggle checked={notify.webhook.enabled} onChange={(v) => patch({ webhook: { ...notify.webhook, enabled: v } })}>Gönderimi bir webhook adresine ilet</Toggle>
        {notify.webhook.enabled && (
          <Row label="Adres" hint="Yalnızca https. Kullanıcı adı, özel ağ ve ham IP kabul edilmez. Gönderim kaydı adrese bağlı değildir.">
            <input className={`${inputCls} font-mono`} value={notify.webhook.url} placeholder="https://hooks.ornek.com/form" maxLength={300} onChange={(e) => patch({ webhook: { ...notify.webhook, url: e.target.value } })} />
          </Row>
        )}
      </section>
    </div>
  );
}

export function EmbedTab({ id }: { id: string }) {
  return (
    <div className="max-w-xl space-y-3 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">
      <p><strong>Sayfaya ekleme:</strong> Görsel editörde sayfaya <strong>Form</strong> bloğu ekleyin ve denetçide bu formu seçin. Aynı form birden çok sayfada kullanılabilir; gönderimler hangi sayfadan geldiği bilgisiyle tek gelen kutusunda toplanır.</p>
      <p>Form, ziyaretçi sayfasında sunucuda çizilir: istemci JavaScript'i yoktur, tarayıcı doğrulaması ve sunucu doğrulaması birlikte çalışır.</p>
      <p>Form kimliği: <code className="rounded bg-[#F4F5F7] px-1.5 py-0.5 font-mono dark:bg-[#1C1E24]">{id}</code></p>
    </div>
  );
}
