"use client";

import React from "react";
import Link from "next/link";
import type { FormField, FormNotifySettings, FormSpec } from "@nexpress/core";
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
