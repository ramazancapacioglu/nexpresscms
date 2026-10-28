import React from "react";
import { ratingMax, type FormField, type FormSpec } from "@nexpress/core";
import type { FormRenderContext } from "./block-context";

export interface PublicFormDef {
  id: string;
  name: string;
  status: string;
  spec: FormSpec;
}

type Translate = (key: "blocks.formSent" | "blocks.formError") => string;

const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";
const chipCls = "inline-flex min-w-9 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400";

function Control({ f }: { f: FormField }): React.ReactElement | null {
  const common = { name: f.name, id: `ff_${f.id}`, required: f.required };
  switch (f.type) {
    case "textarea":
      return <textarea {...common} rows={5} maxLength={f.max ?? 5000} minLength={f.min} placeholder={f.placeholder || undefined} className={inputCls} />;
    case "select":
      return (
        <select {...common} defaultValue="" className={inputCls}>
          <option value="" disabled={f.required}>{f.placeholder || "Seçin"}</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "radio":
    case "checkboxes":
      return (
        <div className="space-y-1.5">
          {f.options.map((o, i) => (
            <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
              <input type={f.type === "radio" ? "radio" : "checkbox"} name={f.name} value={o} required={f.type === "radio" && f.required && i === 0} />
              {o}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name={f.name} value="on" required={f.required} className="mt-1" />
          <span>{f.label}{f.required ? " *" : ""}</span>
        </label>
      );
    case "rating":
    case "scale": {
      const nums = f.type === "scale" ? Array.from({ length: 11 }, (_, i) => i) : Array.from({ length: ratingMax(f) }, (_, i) => i + 1);
      return (
        <div role="radiogroup" aria-label={f.label} className="flex flex-wrap gap-1.5">
          {nums.map((n, i) => (
            <label key={n}>
              <input type="radio" name={f.name} value={n} required={f.required && i === 0} className="peer sr-only" />
              <span className={chipCls}>{f.type === "rating" ? `${n} ★` : n}</span>
            </label>
          ))}
        </div>
      );
    }
    case "number":
      return <input {...common} type="number" min={f.min} max={f.max} step="any" placeholder={f.placeholder || undefined} className={inputCls} />;
    case "date":
      return <input {...common} type="date" className={inputCls} />;
    default:
      return <input {...common} type={f.type === "email" || f.type === "tel" || f.type === "url" ? f.type : "text"} maxLength={f.max ?? 500} minLength={f.min} placeholder={f.placeholder || undefined} className={inputCls} />;
  }
}

/** Kurucuyla tanımlanan formun ziyaretçi görünümü: sunucu bileşeni, istemci JS'i yok (HTML POST + yerel doğrulama). */
export function RscForm({ form, blockId, ctx, frame, title, t }: { form: PublicFormDef; blockId: string; ctx: FormRenderContext; frame: React.CSSProperties; title: string; t: Translate }): React.ReactElement {
  const mine = ctx.blockId === blockId ? ctx.status : null;
  return (
    <form action="/api/forms/submit" method="post" style={frame} className="border bg-white p-5">
      {title ? <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2> : null}
      {mine === "sent" ? <p role="status" className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{form.spec.successMessage || t("blocks.formSent")}</p> : null}
      {mine === "error" ? <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{t("blocks.formError")}</p> : null}
      <input type="hidden" name="_path" value={ctx.path} />
      <input type="hidden" name="_block" value={blockId} />
      <input type="hidden" name="_t" value={ctx.token} />
      <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {form.spec.fields.map((f) => {
          const span = f.width === "half" ? "" : "sm:col-span-2";
          if (f.type === "heading") return <h3 key={f.id} className={`${span} text-base font-bold text-slate-900`}>{f.label}</h3>;
          if (f.type === "paragraph") return <p key={f.id} className={`${span} text-sm text-slate-600`}>{f.label}</p>;
          if (f.type === "checkbox") return <div key={f.id} className={span}><Control f={f} />{f.help ? <p className="mt-1 text-xs text-slate-500">{f.help}</p> : null}</div>;
          const group = f.type === "radio" || f.type === "checkboxes" || f.type === "rating" || f.type === "scale";
          const Wrap = group ? "fieldset" : "div";
          return (
            <Wrap key={f.id} className={span}>
              {group ? (
                <legend className="mb-1 block text-sm font-medium text-slate-700">{f.label}{f.required ? " *" : ""}</legend>
              ) : (
                <label htmlFor={`ff_${f.id}`} className="mb-1 block text-sm font-medium text-slate-700">{f.label}{f.required ? " *" : ""}</label>
              )}
              <Control f={f} />
              {f.help ? <p className="mt-1 text-xs text-slate-500">{f.help}</p> : null}
            </Wrap>
          );
        })}
      </div>
      <button type="submit" className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{form.spec.submitLabel}</button>
    </form>
  );
}
