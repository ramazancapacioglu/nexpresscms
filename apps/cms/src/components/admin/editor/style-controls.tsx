"use client";

import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

const input = "h-7 w-full rounded border border-border bg-background px-1.5 font-mono text-[11px]";
const muted = "text-[#5F6570] dark:text-[#8C9099]";

/** Katlanır denetçi paneli (başlık + durum noktası). */
export function StylePanel({ title, edited = false, defaultOpen = false, children }: { title: string; edited?: boolean; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider">
        <span className="inline-flex items-center gap-1.5">
          {title}
          {edited && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-label="düzenlendi" />}
        </span>
        <span className={`${muted} transition group-open:rotate-90`} aria-hidden>›</span>
      </summary>
      <div className="space-y-2.5 border-t border-border p-3">{children}</div>
    </details>
  );
}

/** Etiketli alan: değer doluysa "düzenlendi" noktası ve tek tıkla sıfırlama gösterir. */
export function Field({ label, value, onReset, children }: { label: string; value: unknown; onReset?: () => void; children: ReactNode }) {
  const set = value !== undefined && value !== "";
  return (
    <div>
      <label className={`mb-0.5 flex items-center justify-between text-[10px] ${muted}`}>
        <span className="inline-flex items-center gap-1">
          {label}
          {set && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />}
        </span>
        {set && onReset && (
          <button type="button" onClick={onReset} title="Sıfırla" aria-label={`${label} değerini sıfırla`} className="text-blue-700 dark:text-blue-300">
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder }: { label: string; value: string | undefined; onChange: (v: string | undefined) => void; placeholder?: string }) {
  return (
    <Field label={label} value={value} onReset={() => onChange(undefined)}>
      <input aria-label={label} type="text" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value || undefined)} className={input} />
    </Field>
  );
}

export function ColorInput({ label, value, onChange, fallback = "#ffffff" }: { label: string; value: string | undefined; onChange: (v: string | undefined) => void; fallback?: string }) {
  return (
    <Field label={label} value={value} onReset={() => onChange(undefined)}>
      <div className="flex items-center gap-1.5">
        <input aria-label={`${label} (renk seçici)`} type="color" value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : fallback} onChange={(e) => onChange(e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-border" />
        <input aria-label={label} type="text" value={value ?? ""} placeholder={fallback} onChange={(e) => onChange(e.target.value || undefined)} className={input} />
      </div>
    </Field>
  );
}

export function SelectInput<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: Array<[T | "", string]>; onChange: (v: T | undefined) => void }) {
  return (
    <Field label={label} value={value} onReset={() => onChange(undefined)}>
      <select aria-label={label} value={value ?? ""} onChange={(e) => onChange((e.target.value || undefined) as T | undefined)} className="h-7 w-full rounded border border-border bg-background px-1 text-[11px]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

export function NumberInput({ label, value, onChange, min, max, step, placeholder }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; min?: number; max?: number; step?: number; placeholder?: string }) {
  return (
    <Field label={label} value={value} onReset={() => onChange(undefined)}>
      <input aria-label={label} type="number" min={min} max={max} step={step} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className={input} />
    </Field>
  );
}
