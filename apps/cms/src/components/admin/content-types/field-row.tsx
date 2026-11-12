"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { FIELD_KINDS, FIELD_KIND_LABEL, isValidFieldKey, type CustomFieldDef, type FieldKind } from "@nexpress/core";

const input = "h-8 w-full rounded border border-[#E6E7EA] bg-white px-2 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]";

/** Tek alan satırı: ad, anahtar, tür, (seçenek listesi), zorunlu/gösterim. Anahtar kayıtlı içeriğin değer anahtarıdır; sonradan değiştirmeyin. */
export function FieldRow({
  field,
  index,
  total,
  keyLocked,
  onChange,
  onMove,
  onRemove,
}: {
  field: CustomFieldDef;
  index: number;
  total: number;
  keyLocked: boolean;
  onChange: (next: CustomFieldDef) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const keyOk = isValidFieldKey(field.key);
  return (
    <div className="space-y-2 rounded-md border border-[#E6E7EA] bg-[#FBFBFD] p-2.5 dark:border-[#23262E] dark:bg-[#12141A]">
      <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="block text-[11px]">Etiket
          <input aria-label="Alan etiketi" className={input} value={field.label} maxLength={60} onChange={(e) => onChange({ ...field, label: e.target.value })} placeholder="Müşteri adı" />
        </label>
        <label className="block text-[11px]">Anahtar {keyLocked ? <span className="text-[#8C9099]">(kayıtlı)</span> : null}
          <input aria-label="Alan anahtarı" className={`${input} font-mono ${keyOk ? "" : "border-red-500"}`} value={field.key} disabled={keyLocked} maxLength={40} onChange={(e) => onChange({ ...field, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="musteri_adi" />
        </label>
        <label className="block text-[11px]">Tür
          <select aria-label="Alan türü" className={input} value={field.kind} onChange={(e) => onChange({ ...field, kind: e.target.value as FieldKind, ...(e.target.value === "select" ? { options: field.options?.length ? field.options : ["Seçenek 1"] } : { options: undefined }) })}>
            {FIELD_KINDS.map((k) => <option key={k} value={k}>{FIELD_KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-1">
          <button type="button" aria-label="Yukarı" disabled={index === 0} onClick={() => onMove(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#E6E7EA] disabled:opacity-40 dark:border-[#23262E]"><ArrowUp className="h-3.5 w-3.5" /></button>
          <button type="button" aria-label="Aşağı" disabled={index === total - 1} onClick={() => onMove(1)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#E6E7EA] disabled:opacity-40 dark:border-[#23262E]"><ArrowDown className="h-3.5 w-3.5" /></button>
          <button type="button" aria-label="Alanı sil" onClick={onRemove} className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#E6E7EA] text-red-600 dark:border-[#23262E]"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {field.kind === "select" ? (
        <label className="block text-[11px]">Seçenekler (her satıra bir tane)
          <textarea aria-label="Seçenekler" className={`${input} h-20 py-1.5`} value={(field.options ?? []).join("\n")} onChange={(e) => onChange({ ...field, options: e.target.value.split("\n") })} />
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
        <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={field.required === true} onChange={(e) => onChange({ ...field, required: e.target.checked || undefined })} /> Zorunlu</label>
        <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={field.show !== false} onChange={(e) => onChange({ ...field, show: e.target.checked ? undefined : false })} /> Ziyaretçide göster</label>
        <input aria-label="Yardım metni" className={`${input} max-w-sm`} value={field.help ?? ""} maxLength={160} onChange={(e) => onChange({ ...field, help: e.target.value || undefined })} placeholder="Editöre yardım metni (isteğe bağlı)" />
      </div>
    </div>
  );
}
