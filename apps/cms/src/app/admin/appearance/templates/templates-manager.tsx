"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { STARTER_TEMPLATES, TEMPLATE_KINDS, type TemplateKind } from "@nexpress/core";
import { AlertTriangle, Check, Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { createTemplateAction, deleteTemplateAction, setDefaultTemplateAction } from "./actions";

export interface TemplateRow { id: string; name: string; kind: TemplateKind; isDefault: boolean; blocks: number; errors: string[] }

const panel = "rounded-lg border border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]";

export function TemplatesManager({ rows: initial, kinds }: { rows: TemplateRow[]; kinds: TemplateKind[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const create = (starterId: string) =>
    start(async () => {
      const r = await createTemplateAction({ starterId });
      if (r.ok) window.location.href = `/admin/contents?id=${encodeURIComponent(r.id)}&type=template`;
      else setMsg({ kind: "error", text: r.error });
    });
  const setDefault = (id: string, makeDefault: boolean, kind: TemplateKind) =>
    start(async () => {
      const r = await setDefaultTemplateAction({ id, makeDefault });
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      setRows((cur) => cur.map((x) => (x.kind === kind ? { ...x, isDefault: x.id === id ? makeDefault : false } : x)));
      setMsg({ kind: "ok", text: makeDefault ? "Varsayılan şablon güncellendi; ziyaretçi sayfaları bu şablonla çizilir." : "Varsayılan kaldırıldı; yerleşik görünüm kullanılacak." });
    });
  const remove = (id: string, name: string) => {
    if (!window.confirm(`"${name}" şablonu silinsin mi? Bu şablonu seçmiş sayfalar varsayılan/yerleşik görünüme döner.`)) return;
    start(async () => {
      const r = await deleteTemplateAction({ id });
      if (r.ok) setRows((cur) => cur.filter((x) => x.id !== id));
      else setMsg({ kind: "error", text: r.error });
    });
  };

  const importFile = (file: File) =>
    start(async () => {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/templates/import", { method: "POST", body }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as { ok: boolean; created?: Array<{ name: string }>; warnings?: string[]; errors?: string[] } | null;
      if (json?.ok) {
        setMsg({ kind: "ok", text: `${json.created?.length ?? 0} şablon içe aktarıldı (taslak, varsayılan değil).${json.warnings?.length ? ` Uyarılar: ${json.warnings.join(" • ")}` : ""}` });
        setTimeout(() => window.location.reload(), 1800);
      } else setMsg({ kind: "error", text: (json?.errors ?? ["İçe aktarılamadı."]).join(" ") });
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <a href="/api/admin/templates/export?all=1" download className="inline-flex h-8 items-center gap-1.5 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"><Download className="h-3.5 w-3.5" /> Tümünü dışa aktar</a>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium focus-within:ring-2 focus-within:ring-[#266DF0] dark:border-[#2E333D]">
          <Upload className="h-3.5 w-3.5" /> Paketi içe aktar
          <input type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
        </label>
        <span className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Paket yalnızca veridir; içe aktarılan şablonlar taslak gelir, güvensiz adres ve özel CSS temizlenir, medya başvuruları taşınmaz.</span>
      </div>
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-[13px] ${msg.kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>{msg.text}</p>}
      {kinds.map((kind) => {
        const info = TEMPLATE_KINDS[kind];
        const list = rows.filter((r) => r.kind === kind);
        const starters = STARTER_TEMPLATES.filter((s) => s.kind === kind);
        return (
          <section key={kind} aria-labelledby={`tk-${kind}`} className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5D8DE] px-4 py-3 dark:border-[#2E333D]">
              <div><h2 id={`tk-${kind}`} className="text-[14px] font-semibold">{info.label}</h2><p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{info.description}</p></div>
              <label className="flex items-center gap-2 text-[12px]">
                <span className="sr-only">{info.label} için hazır şablon</span>
                <select disabled={pending} aria-label={`${info.label} hazır şablonu`} defaultValue="" onChange={(e) => { if (e.target.value) create(e.target.value); e.target.value = ""; }} className="h-8 rounded border border-[#D5D8DE] bg-transparent px-2 dark:border-[#2E333D]">
                  <option value="">+ Hazır şablondan oluştur…</option>
                  {starters.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.description}</option>)}
                </select>
              </label>
            </div>
            {list.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-[#5F6570] dark:text-[#8C9099]">Henüz şablon yok: yerleşik görünüm kullanılıyor. Yukarıdan bir hazır şablon seçerek başlayın <Plus className="inline h-3 w-3" />.</p>
            ) : (
              <ul className="divide-y divide-[#E6E8EC] dark:divide-[#262A33]">
                {list.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate text-[13px] font-semibold">{r.name}</span>{r.isDefault && <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-px text-[10px] font-bold text-white"><Check className="h-3 w-3" /> VARSAYILAN</span>}</div>
                      <div className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{r.blocks} kök blok</div>
                      {r.errors.map((e) => <div key={e} className="mt-1 flex items-center gap-1 text-[12px] text-red-600"><AlertTriangle className="h-3 w-3" /> {e}</div>)}
                    </div>
                    <Link href={`/admin/contents?id=${encodeURIComponent(r.id)}&type=template`} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"><Pencil className="h-3.5 w-3.5" /> Düzenle</Link>
                    <a href={`/api/admin/templates/export?id=${encodeURIComponent(r.id)}`} download aria-label={`${r.name} dışa aktar`} className="inline-flex h-8 items-center gap-1.5 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"><Download className="h-3.5 w-3.5" /> Dışa aktar</a>
                    <button type="button" disabled={pending} onClick={() => setDefault(r.id, !r.isDefault, kind)} className="h-8 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]">{r.isDefault ? "Varsayılanı kaldır" : "Varsayılan yap"}</button>
                    <button type="button" aria-label={`${r.name} sil`} disabled={pending} onClick={() => remove(r.id, r.name)} className="h-8 w-8 rounded border border-[#D5D8DE] text-red-600 dark:border-[#2E333D]"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
