"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { sanitizeFieldValues, type CustomFieldDef, type FieldValue } from "@nexpress/core";
import { MediaPickerDialog } from "../media/media-picker-dialog";
import { useStudioInspector } from "./studio-inspector-context";

const input = "h-8 w-full rounded border border-border bg-background px-2 text-[12px]";

function FieldInput({ def, value, onChange }: { def: CustomFieldDef; value: FieldValue | undefined; onChange: (v: FieldValue | undefined) => void }) {
  const [picker, setPicker] = useState(false);
  const id = `cf-${def.key}`;
  const str = value === undefined ? "" : String(value);
  switch (def.kind) {
    case "textarea":
      return <textarea id={id} rows={4} maxLength={5000} className="w-full rounded border border-border bg-background p-2 text-[12px]" value={str} onChange={(e) => onChange(e.target.value || undefined)} />;
    case "number":
      return <input id={id} type="number" step="any" className={input} value={str} onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value as unknown as number)} />;
    case "boolean":
      return <label className="flex items-center gap-2 text-[12px]"><input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked ? true : undefined)} /> Evet</label>;
    case "select":
      return (
        <select id={id} className={input} value={str} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Seçin…</option>
          {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "date":
      return <input id={id} type="date" className={input} value={str} onChange={(e) => onChange(e.target.value || undefined)} />;
    case "image":
      return (
        <div>
          <div className="flex gap-1">
            <input id={id} className={`${input} font-mono`} value={str} placeholder="/media/… ya da https://…" onChange={(e) => onChange(e.target.value || undefined)} />
            <button type="button" aria-label={`${def.label}: kitaplıktan seç`} onClick={() => setPicker(true)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border"><ImageIcon className="h-3.5 w-3.5" /></button>
          </div>
          <MediaPickerDialog open={picker} onClose={() => setPicker(false)} onPick={(m) => { onChange(m.url); setPicker(false); }} />
        </div>
      );
    default:
      return <input id={id} type={def.kind === "email" ? "email" : "text"} maxLength={200} className={input} value={str} placeholder={def.kind === "url" ? "/yol ya da https://…" : undefined} onChange={(e) => onChange(e.target.value || undefined)} />;
  }
}

/** Özel içerik türünün alanları (yalnızca özel türlerde görünür). Kayıtta sunucu yeniden doğrular; hatalı değer yazılmaz. */
export function CustomFieldsTab() {
  const { customType, fieldValues, setFieldValues } = useStudioInspector();
  if (!customType) return null;
  const { errors } = sanitizeFieldValues(customType, fieldValues);
  return (
    <div className="space-y-3 text-[12px]">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{customType.label} alanları</div>
        <p className="text-muted-foreground">Bu bilgiler ziyaretçide alan tablosu olarak ve içerik bloklarında kullanılabilir.</p>
      </div>
      {customType.fields.length === 0 ? <p className="text-muted-foreground">Bu türe alan eklenmemiş. İçerik Türleri sayfasından ekleyin.</p> : null}
      {customType.fields.map((def) => (
        <div key={def.key} className="space-y-1">
          <label htmlFor={`cf-${def.key}`} className="flex items-center gap-1 text-[11px] font-semibold">{def.label}{def.required ? <span className="text-red-600" aria-hidden="true">*</span> : null}</label>
          <FieldInput def={def} value={fieldValues[def.key]} onChange={(v) => setFieldValues((prev) => { const next = { ...prev }; if (v === undefined) delete next[def.key]; else next[def.key] = v; return next; })} />
          {def.help ? <p className="text-[11px] text-muted-foreground">{def.help}</p> : null}
          {errors[def.key] && fieldValues[def.key] !== undefined ? <p role="alert" className="text-[11px] text-red-600">{errors[def.key]}</p> : null}
        </div>
      ))}
    </div>
  );
}
