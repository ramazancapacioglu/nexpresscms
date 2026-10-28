"use client";

import { useState, useTransition } from "react";
import type { PluginSettingField } from "@nexpress/core";
import { savePluginSettingsAction } from "./actions";

const inputClass =
  "h-8 w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#121317] px-2.5 text-[12px] outline-none focus:border-[#266DF0] disabled:opacity-50";

/** Manifestteki ayar alanlarından üretilen form; grup başlıkları ve alan bazlı hata gösterimi. */
export function PluginSettingsForm({
  pluginId,
  fields,
  initial,
  moduleOn,
  onNotice,
  extra,
}: {
  pluginId: string;
  fields: PluginSettingField[];
  initial: Record<string, unknown>;
  moduleOn: Record<string, boolean>;
  onNotice: (tone: "ok" | "err", text: string) => void;
  /** Form altına eklenen özel bölüm (ör. Site DNA) */
  extra?: React.ReactNode;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const groups = [...new Set(fields.map((f) => f.group))];
  const set = (key: string, v: unknown) => setValues((p) => ({ ...p, [key]: v }));

  const save = () =>
    start(async () => {
      try {
        const res = await savePluginSettingsAction({ pluginId, values });
        if (res.ok) {
          setErrors({});
          onNotice("ok", "Ayarlar kaydedildi.");
        } else {
          setErrors(res.fieldErrors ?? {});
          onNotice("err", res.error);
        }
      } catch {
        onNotice("err", "Ayarlar kaydedilemedi.");
      }
    });

  return (
    <>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-5 p-4"
    >
      {groups.map((group) => (
        <fieldset key={group} className="space-y-3">
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">{group}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields
              .filter((f) => f.group === group)
              .map((f) => {
                const off = moduleOn[f.module] === false;
                const id = `ps-${f.key}`;
                const v = values[f.key];
                return (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
                      {f.label}
                    </label>
                    {f.type === "select" ? (
                      <select id={id} className={inputClass} disabled={off} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}>
                        <option value="">Seçin…</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea id={id} rows={3} className={`${inputClass} h-auto py-1.5`} disabled={off} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />
                    ) : f.type === "boolean" ? (
                      <input id={id} type="checkbox" disabled={off} checked={v === true} onChange={(e) => set(f.key, e.target.checked)} />
                    ) : (
                      <input
                        id={id}
                        className={inputClass}
                        type={f.type === "number" ? "number" : "text"}
                        step={f.type === "number" ? "any" : undefined}
                        disabled={off}
                        placeholder={f.placeholder}
                        value={v === undefined || v === null ? "" : String(v)}
                        onChange={(e) => set(f.key, e.target.value)}
                        aria-invalid={Boolean(errors[f.key])}
                      />
                    )}
                    {errors[f.key] ? (
                      <p className="mt-1 text-[11px] text-red-600">{errors[f.key]}</p>
                    ) : f.help ? (
                      <p className="mt-1 text-[11px] text-[#8C9099]">{f.help}</p>
                    ) : off ? (
                      <p className="mt-1 text-[11px] text-[#8C9099]">İlgili modül kapalı.</p>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </fieldset>
      ))}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-60">
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
    {extra}
    </>
  );
}
