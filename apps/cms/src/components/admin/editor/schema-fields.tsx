"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ImageIcon, Plus, Trash2 } from "lucide-react";
import { buildEditorFields, emptyItem, getPath, moveItem, setPath, type EditorField, type Path } from "@nexpress/core";
import { MediaPickerDialog } from "../media/media-picker-dialog";
import { IconPickerField } from "./icon-picker-modal";
import { LinkField } from "./link-picker";

const input = "h-8 w-full rounded border border-border bg-background px-2 text-[12px]";
const cap = "mb-1 flex items-center gap-1 text-[11px] font-semibold";

interface Ctx {
  root: Record<string, unknown>;
  set: (path: Path, value: unknown) => void;
}

function Control({ f, path, ctx }: { f: EditorField; path: Path; ctx: Ctx }) {
  const value = getPath(ctx.root, path);
  const set = (v: unknown) => ctx.set(path, v);
  const id = `sf-${path.join("-")}`;
  const head = (
    <label htmlFor={id} className={cap}>
      {f.label}
      {f.required ? <span className="text-red-600" aria-hidden="true">*</span> : null}
      {f.max && (f.kind === "text" || f.kind === "textarea") ? <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">{String(value ?? "").length}/{f.max}</span> : null}
    </label>
  );
  if (f.key === "icon" && (f.kind === "enum" || f.kind === "text")) {
    return (
      <div>
        {head}
        <IconPickerField
          value={String(value ?? "")}
          onChange={(next) => set(next)}
          allowEmpty={!f.required}
          label={f.label}
        />
      </div>
    );
  }
  switch (f.kind) {
    case "text":
      return <div>{head}<input id={id} className={input} value={String(value ?? "")} maxLength={f.max} onChange={(e) => set(e.target.value)} /></div>;
    case "textarea":
      return <div>{head}<textarea id={id} rows={3} className="w-full rounded border border-border bg-background p-2 text-[12px]" value={String(value ?? "")} maxLength={f.max} onChange={(e) => set(e.target.value)} /></div>;
    case "url":
      return <div>{head}<LinkField value={String(value ?? "")} label={f.label} onChange={set} /></div>;
    case "image":
      return <ImageField f={f} id={id} value={String(value ?? "")} onChange={set} />;
    case "number":
      return <div>{head}<input id={id} type="number" min={f.min} max={f.max} className={input} value={Number(value ?? 0)} onChange={(e) => set(Number(e.target.value))} /></div>;
    case "boolean":
      return <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} /> {f.label}</label>;
    case "color":
      return <div>{head}<div className="flex gap-1"><input aria-label={`${f.label} seçici`} type="color" className="h-8 w-10 rounded border border-border bg-background" value={String(value ?? "#000000").slice(0, 7)} onChange={(e) => set(e.target.value)} /><input id={id} className={`${input} font-mono`} value={String(value ?? "")} onChange={(e) => set(e.target.value)} /></div></div>;
    case "enum":
      return <div>{head}<select id={id} className={input} value={String(value ?? "")} onChange={(e) => set(e.target.value)}>{(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
    case "strings":
      return <StringsField f={f} value={Array.isArray(value) ? (value as string[]) : []} onChange={set} />;
    case "matrix":
      return <MatrixField f={f} value={Array.isArray(value) ? (value as string[][]) : []} onChange={set} />;
    case "group":
      return <fieldset className="space-y-2 rounded border border-border p-2"><legend className="px-1 text-[11px] font-semibold">{f.label}</legend>{(f.fields ?? []).map((c) => <Control key={c.key} f={c} path={[...path, c.key]} ctx={ctx} />)}</fieldset>;
    case "list":
      return <ListField f={f} path={path} ctx={ctx} />;
  }
}

function ImageField({ f, id, value, onChange }: { f: EditorField; id: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={cap}>{f.label}</label>
      <div className="flex gap-1">
        <input id={id} className={`${input} font-mono`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/media/… veya https://…" />
        <button type="button" aria-label={`${f.label}: kitaplıktan seç`} onClick={() => setOpen(true)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border"><ImageIcon className="h-3.5 w-3.5" /></button>
      </div>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onPick={(m) => onChange(m.url)} />
    </div>
  );
}

function StringsField({ f, value, onChange }: { f: EditorField; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1">
      <div className={cap}>{f.label}</div>
      {value.map((s, i) => (
        <div key={i} className="flex gap-1">
          <input aria-label={`${f.label} ${i + 1}`} className={input} value={s} maxLength={f.max} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" aria-label="Sil" className="text-red-600" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button type="button" disabled={f.maxItems !== undefined && value.length >= f.maxItems} onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 text-[11px] font-medium underline disabled:opacity-50"><Plus className="h-3 w-3" /> Ekle</button>
    </div>
  );
}

function MatrixField({ f, value, onChange }: { f: EditorField; value: string[][]; onChange: (v: string[][]) => void }) {
  const cols = Math.max(1, ...value.map((r) => r.length));
  return (
    <div className="space-y-1">
      <div className={cap}>{f.label}</div>
      <div className="overflow-x-auto"><table className="w-full border-separate border-spacing-1"><tbody>
        {value.map((row, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => <td key={c}><input aria-label={`${f.label} satır ${r + 1} sütun ${c + 1}`} className={input} value={row[c] ?? ""} onChange={(e) => onChange(value.map((rw, i) => (i === r ? Array.from({ length: cols }, (_, k) => (k === c ? e.target.value : rw[k] ?? "")) : rw)))} /></td>)}
            <td><button type="button" aria-label={`Satır ${r + 1} sil`} className="text-red-600" onClick={() => onChange(value.filter((_, i) => i !== r))}><Trash2 className="h-3.5 w-3.5" /></button></td>
          </tr>
        ))}
      </tbody></table></div>
      <div className="flex gap-3 text-[11px] font-medium underline">
        <button type="button" disabled={f.maxRows !== undefined && value.length >= f.maxRows} onClick={() => onChange([...value, Array.from({ length: cols }, () => "")])}>Satır ekle</button>
        <button type="button" disabled={f.maxCols !== undefined && cols >= f.maxCols} onClick={() => onChange(value.length ? value.map((r) => [...Array.from({ length: cols }, (_, k) => r[k] ?? ""), ""]) : [[""]])}>Sütun ekle</button>
      </div>
    </div>
  );
}

function ListField({ f, path, ctx }: { f: EditorField; path: Path; ctx: Ctx }) {
  const list = (getPath(ctx.root, path) as Array<Record<string, unknown>> | undefined) ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(list.length === 1 ? 0 : null);
  const titleOf = (it: Record<string, unknown>, i: number) => String(it.title ?? it.name ?? it.label ?? it.question ?? it.text ?? it.value ?? "").slice(0, 46) || `${f.label} ${i + 1}`;
  const fields = f.fields ?? [];
  return (
    <div className="space-y-1.5">
      <div className={cap}>{f.label} <span className="font-normal text-muted-foreground">({list.length}{f.maxItems ? `/${f.maxItems}` : ""})</span></div>
      {list.map((it, i) => (
        <div key={i} className="rounded border border-border">
          <div className="flex items-center gap-1 px-2 py-1">
            <button type="button" aria-expanded={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-1 text-left text-[12px] font-medium"><ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${openIdx === i ? "" : "-rotate-90"}`} aria-hidden="true" /><span className="truncate">{titleOf(it, i)}</span></button>
            <button type="button" aria-label="Yukarı" disabled={i === 0} className="disabled:opacity-30" onClick={() => ctx.set(path, moveItem(list, i, i - 1))}><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Aşağı" disabled={i === list.length - 1} className="disabled:opacity-30" onClick={() => ctx.set(path, moveItem(list, i, i + 1))}><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Sil" className="text-red-600" onClick={() => ctx.set(path, list.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          {openIdx === i && <div className="space-y-2 border-t border-border p-2">{fields.map((c) => <Control key={c.key} f={c} path={[...path, i, c.key]} ctx={ctx} />)}</div>}
        </div>
      ))}
      <button type="button" disabled={f.maxItems !== undefined && list.length >= f.maxItems} onClick={() => { ctx.set(path, [...list, emptyItem(fields)]); setOpenIdx(list.length); }} className="inline-flex items-center gap-1 text-[11px] font-medium underline disabled:opacity-50"><Plus className="h-3 w-3" /> {f.label} ekle</button>
    </div>
  );
}

/** Bloğun TÜM alanlarını (katalog sözleşmesi + mevcut değerlerden çıkarım) düzenlenebilir yapar. */
export function SchemaFields({ type, props, onChange }: { type: string; props: Record<string, unknown>; onChange: (patch: Record<string, unknown>) => void }) {
  const fields = buildEditorFields(type, props);
  const ctx: Ctx = {
    root: props,
    set: (path, value) => {
      const [head, ...rest] = path;
      onChange({ [head as string]: rest.length === 0 ? value : setPath(props[head as string], rest, value) });
    },
  };
  if (fields.length === 0) return <p className="text-[11px] text-muted-foreground">Bu bloğun düzenlenecek alanı yok.</p>;
  return <div className="space-y-3">{fields.map((f) => <Control key={f.key} f={f} path={[f.key]} ctx={ctx} />)}</div>;
}
