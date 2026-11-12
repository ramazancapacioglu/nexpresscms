"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { MAX_CONTENT_TYPES, MAX_FIELDS_PER_TYPE, isValidTypeId, type CustomContentType, type CustomFieldDef } from "@nexpress/core";
import { Plus } from "lucide-react";
import { saveContentTypesAction } from "@/app/admin/content-types/actions";
import { FieldRow } from "./field-row";

const input = "h-8 w-full rounded border border-[#E6E7EA] bg-white px-2 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]";
const slug = (text: string) => text.toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 31);

const blank = (n: number): CustomContentType => ({ id: "", label: "", labelPlural: "", schemaType: "WebPage", inSitemap: true, archive: true, fields: [{ key: "alan_" + (n + 1), label: "", kind: "text" }] });

/** Özel içerik türü tanımlayıcı: tür listesi + seçili türün ayarları ve alanları. Kayıtta sunucu yeniden doğrular. */
export function ContentTypesManager({ initial, counts }: { initial: CustomContentType[]; counts: Record<string, number> }) {
  const [types, setTypes] = useState<CustomContentType[]>(initial);
  const [saved] = useState(() => new Set(initial.map((t) => t.id)));
  const [savedKeys, setSavedKeys] = useState(() => new Map(initial.map((t) => [t.id, new Set(t.fields.map((f) => f.key))])));
  const [active, setActive] = useState(0);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const t = types[active];

  const patch = (next: Partial<CustomContentType>) => setTypes((all) => all.map((x, i) => (i === active ? { ...x, ...next } : x)));
  const setField = (i: number, f: CustomFieldDef) => patch({ fields: t!.fields.map((x, j) => (j === i ? f : x)) });
  const move = (i: number, dir: -1 | 1) => {
    const fields = [...t!.fields];
    const [item] = fields.splice(i, 1);
    fields.splice(i + dir, 0, item!);
    patch({ fields });
  };

  const save = () => {
    start(async () => {
      const res = await saveContentTypesAction({ types });
      if (res.ok) {
        setTypes(res.types);
        setSavedKeys(new Map(res.types.map((x) => [x.id, new Set(x.fields.map((f) => f.key))])));
        setNote({ ok: true, text: "Kaydedildi." });
      } else setNote({ ok: false, text: res.error });
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-2">
        {types.map((x, i) => (
          <button key={i} type="button" onClick={() => setActive(i)} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] ${i === active ? "border-[#266DF0] bg-[#266DF0]/5 font-semibold" : "border-[#E6E7EA] dark:border-[#23262E]"}`}>
            <span className="truncate">{x.labelPlural || x.label || "(yeni tür)"}</span>
            <span className="font-mono text-[10px] text-[#8C9099]">{counts[x.id] ?? 0}</span>
          </button>
        ))}
        {types.length < MAX_CONTENT_TYPES ? (
          <button type="button" onClick={() => { setTypes((all) => [...all, blank(0)]); setActive(types.length); }} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#D5D8DE] py-2 text-[12px] font-medium text-[#266DF0] dark:border-[#2E333D]">
            <Plus className="h-3.5 w-3.5" /> Yeni tür
          </button>
        ) : null}
      </aside>

      {t ? (
        <section className="space-y-4 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] font-medium">Tür adı (tekil)
              <input aria-label="Tür adı" className={input} value={t.label} maxLength={40} onChange={(e) => patch({ label: e.target.value, ...(saved.has(t.id) ? {} : { id: slug(e.target.value) }) })} placeholder="Referans" />
            </label>
            <label className="block text-[11px] font-medium">Çoğul ad
              <input aria-label="Çoğul ad" className={input} value={t.labelPlural} maxLength={40} onChange={(e) => patch({ labelPlural: e.target.value })} placeholder="Referanslar" />
            </label>
            <label className="block text-[11px] font-medium">Kimlik {saved.has(t.id) ? <span className="font-normal text-[#8C9099]">(kayıtlı, değişmez)</span> : null}
              <input aria-label="Tür kimliği" className={`${input} font-mono ${t.id === "" || isValidTypeId(t.id) ? "" : "border-red-500"}`} value={t.id} disabled={saved.has(t.id)} onChange={(e) => patch({ id: slug(e.target.value) })} placeholder="referans" />
            </label>
            <label className="block text-[11px] font-medium">Schema.org türü
              <input aria-label="Schema.org türü" className={input} value={t.schemaType} onChange={(e) => patch({ schemaType: e.target.value.replace(/[^A-Za-z0-9]/g, "") })} placeholder="WebPage" />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-[12px]"><input type="checkbox" checked={t.inSitemap} onChange={(e) => patch({ inSitemap: e.target.checked })} /> Site haritasına ekle</label>

          <div className="space-y-2 rounded-md border border-[#E6E7EA] p-3 dark:border-[#23262E]">
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold"><input type="checkbox" checked={t.archive === true} onChange={(e) => patch({ archive: e.target.checked })} /> Arşiv (liste) sayfası oluştur</label>
            {t.archive ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-medium">Arşiv adresi
                  <span className="flex items-center gap-1"><span className="font-mono text-[#8C9099]">/</span>
                    <input aria-label="Arşiv adresi" className={`${input} font-mono`} value={t.archiveSlug ?? ""} maxLength={40} onChange={(e) => patch({ archiveSlug: e.target.value.toLocaleLowerCase("tr").replace(/[^a-z0-9-]/g, "-") })} placeholder="boşsa çoğul addan üretilir" />
                  </span>
                </label>
                <label className="block text-[11px] font-medium">Başlık altı tanıtım
                  <input aria-label="Arşiv tanıtımı" className={input} value={t.archiveIntro ?? ""} maxLength={300} onChange={(e) => patch({ archiveIntro: e.target.value })} placeholder="Kısa bir açıklama (isteğe bağlı)" />
                </label>
              </div>
            ) : <p className="text-[11px] text-[#8C9099]">Açıkken bu türün yayınları ziyaretçide sayfalı bir liste olarak görünür ve site haritasına girer.</p>}
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-semibold">Alanlar ({t.fields.length}/{MAX_FIELDS_PER_TYPE})</div>
            {t.fields.map((f, i) => (
              <FieldRow key={i} field={f} index={i} total={t.fields.length} keyLocked={savedKeys.get(t.id)?.has(f.key) === true} onChange={(next) => setField(i, next)} onMove={(d) => move(i, d)} onRemove={() => patch({ fields: t.fields.filter((_, j) => j !== i) })} />
            ))}
            {t.fields.length < MAX_FIELDS_PER_TYPE ? (
              <button type="button" onClick={() => patch({ fields: [...t.fields, { key: `alan_${t.fields.length + 1}`, label: "", kind: "text" }] })} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#266DF0]"><Plus className="h-3.5 w-3.5" /> Alan ekle</button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#E6E7EA] pt-3 dark:border-[#23262E]">
            <button type="button" onClick={save} disabled={pending} className="inline-flex h-8 items-center rounded-md bg-[#14151A] px-4 text-[12px] font-medium text-white disabled:opacity-60 dark:bg-[#F3F4F6] dark:text-[#14151A]">{pending ? "Kaydediliyor" : "Kaydet"}</button>
            <button type="button" onClick={() => { setTypes((all) => all.filter((_, i) => i !== active)); setActive(0); }} className="text-[12px] text-red-600 hover:underline">Bu türü kaldır</button>
            {saved.has(t.id) ? <Link href={`/admin/entries/${t.id}`} className="text-[12px] text-[#266DF0] hover:underline">Kayıtları aç →</Link> : null}
            {note ? <span role="status" className={`text-[12px] ${note.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>{note.text}</span> : null}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-[#D5D8DE] p-8 text-center text-[12px] text-[#5F6570] dark:border-[#2E333D]">Henüz özel tür yok. Soldan &quot;Yeni tür&quot; ile başlayın.</p>
      )}
    </div>
  );
}
