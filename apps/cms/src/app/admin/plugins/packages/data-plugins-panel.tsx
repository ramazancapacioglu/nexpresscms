"use client";

import React, { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Upload } from "lucide-react";
import type { PermissionLine, SignatureStatus } from "@nexpress/core";
import { deleteDataPluginAction, disableDataPluginAction, enableDataPluginAction, revealWebhookSecretAction } from "./actions";

export interface DataPluginView {
  id: string;
  name: string;
  version: string;
  vendor: string;
  description: string;
  homepage: string | null;
  enabled: boolean;
  signature: SignatureStatus;
  permissions: PermissionLine[];
  hasPages: boolean;
  hasWebhooks: boolean;
  lastDelivery: { at: string; event: string; ok: boolean; status: number | null; error?: string } | null;
  installedAt: string;
}

type Report =
  | { ok: true; replaced: boolean; plugin: { id: string; name: string; version: string }; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const SIG: Record<SignatureStatus, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  verified: { label: "Doğrulanmış yayıncı", cls: "text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10", Icon: ShieldCheck },
  "signed-untrusted": { label: "İmzalı, yayıncı tanınmıyor", cls: "text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10", Icon: ShieldQuestion },
  unsigned: { label: "İmzasız", cls: "text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10", Icon: ShieldAlert },
  invalid: { label: "İmza geçersiz", cls: "text-red-700 dark:text-red-300 border-red-500/40 bg-red-500/10", Icon: ShieldAlert },
};

function Card({ p }: { p: DataPluginView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [consent, setConsent] = useState(false);
  const [addPages, setAddPages] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const sig = SIG[p.signature];
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) =>
    start(async () => {
      const res = await fn();
      setNote({ ok: res.ok, text: res.ok ? okText : (res.error ?? "İşlem başarısız.") });
      if (res.ok) router.refresh();
    });

  return (
    <article className={`space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold">{p.name} <span className="font-mono text-[11px] font-normal text-[#8C9099]">v{p.version}</span></h2>
          <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{p.vendor} · <span className="font-mono">{p.id}</span> · yüklendi {p.installedAt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${sig.cls}`}><sig.Icon className="h-3 w-3" aria-hidden /> {sig.label}</span>
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${p.enabled ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : `${border} text-[#5F6570]`}`}>{p.enabled ? "Etkin" : "Devre dışı"}</span>
        </div>
      </div>
      {p.description ? <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{p.description}</p> : null}

      <div className="space-y-1.5 rounded-md bg-[#F8FAFC] p-3 text-[12px] dark:bg-[#111318]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Bu eklenti şunları yapar</div>
        {p.permissions.map((l) => (
          <div key={l.id}>
            <div className="font-medium">{l.label}</div>
            <ul className="ml-4 list-disc text-[11px] text-[#5F6570] dark:text-[#8C9099]">{l.details.map((d) => <li key={d} className="break-all">{d}</li>)}</ul>
          </div>
        ))}
      </div>

      {p.lastDelivery ? <p className="text-[11px] text-[#5F6570]">Son bildirim: {p.lastDelivery.at.slice(0, 16).replace("T", " ")} · {p.lastDelivery.event} · <span className={p.lastDelivery.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}>{p.lastDelivery.ok ? "başarılı" : `başarısız (${p.lastDelivery.error ?? p.lastDelivery.status})`}</span></p> : null}

      {!p.enabled ? (
        <div className="space-y-2 border-t pt-3 text-[12px]">
          <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /> <span>Yukarıdaki izinleri okudum ve bu eklentinin bunları yapmasına izin veriyorum.</span></label>
          {p.hasPages ? <label className="flex items-center gap-2"><input type="checkbox" checked={addPages} onChange={(e) => setAddPages(e.target.checked)} /> Başlangıç sayfalarını taslak olarak ekle</label> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!consent || pending} onClick={() => run(() => enableDataPluginAction({ pluginId: p.id, consent, addPages }), "Eklenti etkinleştirildi.")} className="h-8 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white disabled:opacity-50">{pending ? "İşleniyor" : "Etkinleştir"}</button>
            <button type="button" disabled={pending} onClick={() => { if (window.confirm(`“${p.name}” paketi silinsin mi?`)) run(() => deleteDataPluginAction({ pluginId: p.id }), "Paket silindi."); }} className="text-[12px] text-red-600 hover:underline">Paketi sil</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-[12px]">
          <button type="button" disabled={pending} onClick={() => run(() => disableDataPluginAction({ pluginId: p.id }), "Eklenti devre dışı bırakıldı.")} className={`h-8 rounded-md border ${border} px-3 font-medium disabled:opacity-50`}>Devre dışı bırak</button>
          {p.hasWebhooks ? (
            <button type="button" disabled={pending} onClick={() => start(async () => { const r = await revealWebhookSecretAction({ pluginId: p.id }); if (r.ok) setSecret(r.secret); else setNote({ ok: false, text: r.error }); })} className="text-[#266DF0] hover:underline">Webhook sırrını göster</button>
          ) : null}
        </div>
      )}
      {secret ? (
        <div className={`space-y-1 rounded-md border ${border} p-2 text-[11px]`}>
          <div>Alıcıda <code>X-NexPress-Signature: sha256=…</code> değerini <code>HMAC-SHA256(sır, zaman + &quot;.&quot; + gövde)</code> ile doğrulayın; zaman damgası eskiyse reddedin.</div>
          <code className="block break-all rounded bg-[#F4F5F7] px-2 py-1 font-mono dark:bg-[#1C1E24]">{secret}</code>
        </div>
      ) : null}
      {note ? <p role="status" className={`text-[12px] ${note.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>{note.text}</p> : null}
    </article>
  );
}

export function DataPluginsPanel({ plugins, trustedKeyCount }: { plugins: DataPluginView[]; trustedKeyCount: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const send = async (file: File) => {
    setBusy(true);
    setReport(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/plugins/upload", { method: "POST", body });
      setReport((await res.json()) as Report);
      if (res.ok) router.refresh();
    } catch {
      setReport({ ok: false, errors: ["Yükleme tamamlanamadı (ağ hatası)."], warnings: [] });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void send(f); }}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-7 text-center ${drag ? "border-[#266DF0] bg-[#266DF0]/5" : border}`}
      >
        <Upload className="h-6 w-6 text-[#5F6570]" aria-hidden />
        <p className="text-[13px] font-medium">{busy ? "Doğrulanıyor…" : "Eklenti paketini (.nxplugin) buraya bırakın"}</p>
        <p className="max-w-[64ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">En çok 2 MB. Kod, HTML ve betik dosyaları reddedilir. {trustedKeyCount > 0 ? `${trustedKeyCount} güvenilen yayıncı anahtarı tanımlı.` : "Güvenilen yayıncı anahtarı tanımlı değil (PLUGIN_TRUSTED_KEYS): imzalı paketler de “tanınmıyor” görünür."}</p>
        <input ref={input} type="file" accept=".nxplugin,.zip" className="sr-only" aria-label="Eklenti paketi seç" onChange={(e) => { const f = e.target.files?.[0]; if (f) void send(f); }} />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`h-8 rounded-md border ${border} px-3 text-[12px] font-medium disabled:opacity-50`}>Dosya seç</button>
      </div>
      {report ? (
        report.ok ? (
          <div role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px]">
            “{report.plugin.name}” v{report.plugin.version} {report.replaced ? "güncellendi" : "kuruldu"} (devre dışı). Aşağıdan izinleri inceleyip etkinleştirebilirsiniz.
            {report.warnings.length > 0 ? <ul className="mt-1 list-disc pl-4 text-amber-800 dark:text-amber-200">{report.warnings.map((w) => <li key={w}>{w}</li>)}</ul> : null}
          </div>
        ) : (
          <ul role="alert" className="list-disc space-y-0.5 rounded-md border border-red-500/30 bg-red-500/10 p-3 pl-7 text-[12px] text-red-700 dark:text-red-300">{report.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )
      ) : null}
      {plugins.length === 0 ? (
        <p className={`rounded-lg border border-dashed ${border} p-8 text-center text-[12px] text-[#5F6570]`}>Henüz paket yüklenmedi.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">{plugins.map((p) => <Card key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
