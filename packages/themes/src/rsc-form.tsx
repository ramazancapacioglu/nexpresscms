import React from "react";
import { DEFAULT_FORM_APPEARANCE, fieldSpan, safeBlockDomId, ratingMax, type FormField, type FormSpec } from "@nexpress/core";
import type { FormRenderContext } from "./block-context";

export interface PublicFormDef {
  id: string;
  name: string;
  status: string;
  spec: FormSpec;
}

type Translate = (key: "blocks.formSent" | "blocks.formError" | "blocks.formClose" | "blocks.openDialog" | "blocks.formStep", vars?: Record<string, string | number>) => string;

const inputCls = "w-full rounded-md border border-nx-line bg-nx-card px-3 py-2 text-sm";
const chipCls = "inline-flex min-w-9 cursor-pointer items-center justify-center rounded-md border border-nx-line bg-nx-card px-2.5 py-1.5 text-sm peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400";

function Control({ f }: { f: FormField }): React.ReactElement | null {
  const common = { name: f.name, id: `ff_${f.id}`, required: f.required };
  switch (f.type) {
    case "textarea":
      return <textarea {...common} rows={5} maxLength={f.max ?? 5000} minLength={f.min} placeholder={f.placeholder || undefined} className={inputCls} />;
    case "select":
      return (
        <select {...common} defaultValue="" className={inputCls}>
          <option value="" disabled={f.required}>{f.placeholder || "Seçin"}</option>
          {f.options.map((o, i) => <option key={o} data-nx-i={i} value={o}>{o}</option>)}
        </select>
      );
    case "radio":
    case "checkboxes":
      return (
        <div className="space-y-1.5">
          {f.options.map((o, i) => (
            <label key={o} className="flex items-center gap-2 text-sm text-nx-soft">
              <input type={f.type === "radio" ? "radio" : "checkbox"} name={f.name} value={o} data-nx-i={i} required={f.type === "radio" && f.required && i === 0} />
              {o}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-start gap-2 text-sm text-nx-soft">
          <input type="checkbox" name={f.name} value="on" data-nx-i={0} required={f.required} className="mt-1" />
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
    case "time":
      return <input {...common} type="time" step={60} className={inputCls} />;
    default:
      return <input {...common} type={f.type === "email" || f.type === "tel" || f.type === "url" ? f.type : "text"} maxLength={f.max ?? 500} minLength={f.min} placeholder={f.placeholder || undefined} className={inputCls} />;
  }
}

/** Seçime bağlı alanın anahtarı. Adlar sunucuda süzülmüş makine adıdır; seçenek metni seçiciye yazılmaz. */
function whenKey(f: FormField, fields: FormField[]): string {
  if (!f.showWhen || !/^[a-z][a-z0-9_]{0,39}$/.test(f.showWhen.field)) return "";
  const ctrl = fields.find((x) => x.name === f.showWhen!.field);
  if (!ctrl) return "";
  const idx = ctrl.type === "checkbox" ? 0 : ctrl.options.indexOf(f.showWhen.equals);
  return idx < 0 ? "" : `${ctrl.name}:${idx}`;
}

function visibilityCss(fields: FormField[], steps: number[]): string {
  const seen = new Set<string>();
  const rules: string[] = [];
  for (const f of fields) {
    const key = whenKey(f, fields);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const [name, idx] = key.split(":");
    rules.push(`form:has(select[name="${name}"] option[data-nx-i="${idx}"]:checked) [data-nx-when="${key}"],form:has(input[name="${name}"][data-nx-i="${idx}"]:checked) [data-nx-when="${key}"]{display:block}`);
  }
  const when = rules.length ? `[data-nx-when]{display:none}${rules.join("")}` : "";
  const step = steps.length > 1
    ? `[data-nx-step]{display:none}${steps.map((n) => `form:has([name="_nxstep"][value="${n}"]:checked) [data-nx-step="${n}"]{display:contents}`).join("")}`
    : "";
  return `${when}${step}`;
}

function spanCls(width: FormField["width"], columns: 1 | 2 | 4): string {
  const n = fieldSpan(width, columns);
  if (n === columns) return columns === 4 ? "sm:col-span-4" : columns === 2 ? "sm:col-span-2" : "";
  return n === 2 ? "sm:col-span-2" : "";
}

/** Kurucuyla tanımlanan formun ziyaretçi görünümü: sunucu bileşeni, istemci JS'i yok (HTML POST + yerel doğrulama). */
function FieldView({ f, fields, columns, side }: { f: FormField; fields: FormField[]; columns: 1 | 2 | 4; side: boolean }): React.ReactElement {
  const span = spanCls(f.width, columns);
  const when = whenKey(f, fields);
  const attrs = { "data-nx-when": when || undefined, className: span };
  if (f.type === "divider") return <hr key={f.id} {...attrs} className={`${span} border-nx-line`} />;
  if (f.type === "heading") return <h3 key={f.id} {...attrs} className={`${span} text-base font-bold text-nx-fg`}>{f.label}</h3>;
  if (f.type === "paragraph") return <p key={f.id} {...attrs} className={`${span} text-sm text-nx-soft`}>{f.label}</p>;
  if (f.type === "checkbox") return <div key={f.id} {...attrs}><Control f={f} />{f.help ? <p className="mt-1 text-xs text-nx-muted">{f.help}</p> : null}</div>;
  const group = f.type === "radio" || f.type === "checkboxes" || f.type === "rating" || f.type === "scale";
  const Wrap = group ? "fieldset" : "div";
  const sideCls = side && !group ? "sm:grid sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center sm:gap-x-3" : "";
  return (
    <Wrap key={f.id} {...attrs} className={`${span} ${sideCls}`}>
      {group ? (
        <legend className="mb-1 block text-sm font-medium text-nx-soft">{f.label}{f.required ? " *" : ""}</legend>
      ) : (
        <label htmlFor={`ff_${f.id}`} className="mb-1 block text-sm font-medium text-nx-soft sm:mb-0">{f.label}{f.required ? " *" : ""}</label>
      )}
      <Control f={f} />
      {f.help ? <p className={`mt-1 text-xs text-nx-muted ${side && !group ? "sm:col-start-2" : ""}`}>{f.help}</p> : null}
    </Wrap>
  );
}

/** Kurucuyla tanımlanan formun ziyaretçi görünümü: sunucu bileşeni, istemci JS'i yok (HTML POST + yerel doğrulama). */
export function RscForm({ form, blockId, ctx, frame, title, t }: { form: PublicFormDef; blockId: string; ctx: FormRenderContext; frame: React.CSSProperties; title: string; t: Translate }): React.ReactElement {
  const look = form.spec.appearance ?? DEFAULT_FORM_APPEARANCE;
  const mine = ctx.blockId === blockId ? ctx.status : null;
  const steps = look.stepped ? [...new Set(form.spec.fields.map((f) => f.step ?? 1))].sort((a, b) => a - b) : [1];
  const multi = steps.length > 1;
  const css = visibilityCss(form.spec.fields, multi ? steps : []);
  const cols = look.columns === 4 ? "sm:grid-cols-4" : look.columns === 2 ? "sm:grid-cols-2" : "";
  const gap = look.density === "compact" ? "gap-2" : "gap-4";
  const pad = look.density === "compact" ? "p-3" : "p-5";
  const btnSpan = look.buttonAlign === "beside" && look.columns > 1 ? "" : spanCls("full", look.columns);
  const btn = `rounded-md bg-blue-600 text-sm font-semibold text-white ${look.density === "compact" ? "px-3 py-1.5" : "px-4 py-2"} ${look.buttonAlign === "full" ? "w-full" : ""}`;
  const submit = <button type="submit" className={`${btn} ${btnSpan} ${look.buttonAlign === "center" ? "sm:justify-self-center" : ""}`}>{form.spec.submitLabel}</button>;
  const body = (
    <form action="/api/forms/submit" method="post" style={look.surface === "dialog" ? undefined : frame} className={`relative border bg-nx-card ${pad}`}>
      {css ? <style>{css}</style> : null}
      {title ? <h2 className="mb-3 text-lg font-bold text-nx-fg">{title}</h2> : null}
      {mine === "sent" ? <p role="status" className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{form.spec.successMessage || t("blocks.formSent")}</p> : null}
      {mine === "error" ? <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{t("blocks.formError")}</p> : null}
      <input type="hidden" name="_path" value={ctx.path} />
      <input type="hidden" name="_block" value={blockId} />
      <input type="hidden" name="_t" value={ctx.token} />
      <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      {multi ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {steps.map((n, i) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="_nxstep" value={n} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-md border border-nx-line px-2.5 py-1 text-xs font-medium text-nx-soft peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white">{t("blocks.formStep", { n: String(n) })}</span>
            </label>
          ))}
        </div>
      ) : null}
      <div className={`grid grid-cols-1 ${gap} ${cols}`}>
        {steps.map((step) => {
          const items = form.spec.fields.filter((f) => (f.step ?? 1) === step || !multi);
          const nodes = items.map((f) => <FieldView key={f.id} f={f} fields={form.spec.fields} columns={look.columns} side={look.labels === "side"} />);
          if (!multi) return nodes;
          return (
            <div key={step} data-nx-step={step} className="contents">
              {nodes}
              {step === steps[steps.length - 1] ? submit : null}
            </div>
          );
        })}
        {multi ? null : submit}
      </div>
    </form>
  );
  if (look.surface !== "dialog") return body;
  const id = `nxf-${safeBlockDomId(blockId)}`;
  return (
    <div style={frame}>
      <a href={`#${id}`} className={btn}>{look.triggerLabel || t("blocks.openDialog")}</a>
      <div id={id}>
        <a href={ctx.path || "#nx-top"} className="mb-2 inline-block text-sm text-nx-soft">{t("blocks.formClose")}</a>
        {body}
      </div>
      <style>{`#${id}{display:none}#${id}:target{display:grid;position:fixed;z-index:70;inset:0;place-items:center;background:rgba(15,23,42,.48);padding:1rem}#${id}:target>a,#${id}:target>form{width:min(36rem,100%)}#${id}:target>form{max-height:min(86vh,48rem);overflow:auto}`}</style>
    </div>
  );
}
