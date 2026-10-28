"use client";

import React from "react";
import type { FormField, FormFieldType } from "@nexpress/core";
import { convertibleTypes, hasOptions, isContent, kindOf, slugName } from "./builder-model";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
export const inputCls = `h-8 w-full rounded-md border ${border} bg-transparent px-2 text-[12px] outline-none focus:border-[#266DF0]`;
export const labelCls = "block text-[11px] font-medium text-[#5C5F66] dark:text-[#9CA3AF]";

export function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-[#8C9099]">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-[12px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

/** Seçili alanın özellikleri. Tür, etiket, ad (makine adı), zorunluluk, genişlik, seçenekler ve sınırlar. */
export function FieldInspector({ f, all, onChange }: { f: FormField; all: FormField[]; onChange: (patch: Partial<FormField>) => void }) {
  const content = isContent(f.type);
  const otherNames = new Set(all.filter((x) => x.id !== f.id).map((x) => x.name));
  const types = convertibleTypes(f.type);
  const autoName = f.name === slugName(f.label, new Set([...otherNames]));
  const relabel = (label: string) => onChange({ label, ...(autoName && !content ? { name: slugName(label, otherNames) } : {}) });
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">{kindOf(f.type).label}</p>
      {types.length > 1 && (
        <Row label="Alan türü">
          <select className={inputCls} value={f.type} onChange={(e) => onChange({ type: e.target.value as FormFieldType })}>
            {types.map((t) => <option key={t} value={t}>{kindOf(t).label}</option>)}
          </select>
        </Row>
      )}
      <Row label={content ? "Metin" : "Etiket"}>
        {f.type === "paragraph" ? <textarea className={`${inputCls} h-20 py-1.5`} value={f.label} maxLength={120} onChange={(e) => relabel(e.target.value)} /> : <input className={inputCls} value={f.label} maxLength={120} onChange={(e) => relabel(e.target.value)} />}
      </Row>
      {!content && (
        <>
          <Row label="Alan adı" hint="Dışa aktarma ve analizde kullanılır. Harfle başlar; küçük harf, rakam, alt çizgi.">
            <input
              className={`${inputCls} font-mono`}
              value={f.name}
              onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40) })}
              onBlur={() => { if (!/^[a-z][a-z0-9_]*$/.test(f.name) || f.name === "website" || otherNames.has(f.name)) onChange({ name: slugName(f.label, otherNames) }); }}
            />
          </Row>
          <Toggle checked={f.required} onChange={(v) => onChange({ required: v })}>Zorunlu alan</Toggle>
          {!["radio", "checkboxes", "checkbox", "rating", "scale"].includes(f.type) && <Row label="Yer tutucu"><input className={inputCls} value={f.placeholder} maxLength={80} onChange={(e) => onChange({ placeholder: e.target.value })} /></Row>}
          <Row label="Yardım metni"><input className={inputCls} value={f.help} maxLength={240} onChange={(e) => onChange({ help: e.target.value })} /></Row>
        </>
      )}
      {hasOptions(f.type) && (
        <Row label="Seçenekler" hint="Her satıra bir seçenek.">
          <textarea className={`${inputCls} h-28 py-1.5`} value={f.options.join("\n")} onChange={(e) => onChange({ options: e.target.value.split("\n").slice(0, 50) })} onBlur={() => onChange({ options: [...new Set(f.options.map((o) => o.trim()).filter(Boolean))] })} />
        </Row>
      )}
      {f.type === "number" && (
        <div className="grid grid-cols-2 gap-2">
          <Row label="En az"><input type="number" className={inputCls} value={f.min ?? ""} onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })} /></Row>
          <Row label="En çok"><input type="number" className={inputCls} value={f.max ?? ""} onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })} /></Row>
        </div>
      )}
      {(f.type === "text" || f.type === "textarea") && (
        <div className="grid grid-cols-2 gap-2">
          <Row label="En az karakter"><input type="number" min={0} className={inputCls} value={f.min ?? ""} onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)) })} /></Row>
          <Row label="En çok karakter"><input type="number" min={1} className={inputCls} value={f.max ?? ""} onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Math.max(1, Number(e.target.value)) })} /></Row>
        </div>
      )}
      {f.type === "rating" && <Row label="Yıldız sayısı"><input type="number" min={3} max={10} className={inputCls} value={f.max ?? 5} onChange={(e) => onChange({ max: Math.min(10, Math.max(3, Number(e.target.value) || 5)) })} /></Row>}
      <Row label="Genişlik">
        <select className={inputCls} value={f.width} onChange={(e) => onChange({ width: e.target.value as "full" | "half" })}>
          <option value="full">Tam satır</option>
          <option value="half">Yarım (yan yana iki alan)</option>
        </select>
      </Row>
    </div>
  );
}
