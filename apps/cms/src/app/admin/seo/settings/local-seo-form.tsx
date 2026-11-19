"use client";

import { useState, useTransition } from "react";
import type { PluginSettingField } from "@nexpress/core";
import { savePluginSettingsAction } from "@/app/admin/plugins/actions";

const inputClass =
  "mt-1 h-8 w-full rounded-md border border-[#E6E7EA] bg-white px-2.5 text-[12px] outline-none focus:border-[#266DF0] dark:border-[#23262E] dark:bg-[#121317]";

const FIRM = ["businessName", "businessType", "phone", "email", "priceRange"] as const;
const ADDRESS = ["street", "city", "region", "postalCode", "country"] as const;
const MAP = ["latitude", "longitude"] as const;

/** Yerel işletme: firma, adres ve harita ayrı kartlarda. Kayıt yalnızca bu alanları yazar. */
export function LocalSeoForm({
  pluginId,
  fields,
  initial,
  moduleOn,
}: {
  pluginId: string;
  fields: PluginSettingField[];
  initial: Record<string, unknown>;
  moduleOn: Record<string, boolean>;
}) {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const [values, setValues] = useState(initial);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const off = moduleOn["local-seo"] === false;

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    start(async () => {
      const payload = Object.fromEntries([...FIRM, ...ADDRESS, ...MAP].map((key) => [key, values[key] ?? ""]));
      const res = await savePluginSettingsAction({ pluginId, values: payload });
      setNote(res.ok ? "Yerel işletme kaydedildi." : res.error);
    });
  };

  const field = (key: string, wide = false) => {
    const meta = byKey.get(key);
    if (!meta) return null;
    const value = values[key];
    return (
      <label key={key} className={`block text-[11px] text-[#5F6570] dark:text-[#8C9099] ${wide ? "sm:col-span-2" : ""}`}>
        {meta.label}
        {meta.type === "select" ? (
          <select className={inputClass} disabled={off} value={String(value ?? "")} onChange={(e) => set(key, e.target.value)}>
            <option value="">Seçin</option>
            {meta.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={inputClass}
            disabled={off}
            type={meta.type === "number" ? "number" : "text"}
            step={meta.type === "number" ? "any" : undefined}
            placeholder={meta.placeholder}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => set(key, e.target.value)}
          />
        )}
        {meta.help ? <span className="mt-1 block">{meta.help}</span> : null}
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Bu bilgiler yerel işletme şemasına ve harita etiketlerine yazılır. Boş işletme adında site adı kullanılır.
        </p>
        <button type="button" disabled={pending || off} onClick={save} className="rounded-md bg-[#14151A] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 dark:bg-[#F3F4F6] dark:text-[#14151A]">
          {pending ? "Kaydediliyor" : "Kaydet"}
        </button>
      </div>
      {off ? <p className="text-[12px] text-amber-800 dark:text-amber-300">Yerel SEO modülü kapalı. Alanlar kaydedilir ama şemaya yazılmaz.</p> : null}
      {note ? <p className="text-[12px] text-emerald-800 dark:text-emerald-400">{note}</p> : null}
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">Firma</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{FIRM.map((key) => field(key))}</div>
      </section>
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">Adres</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {field("street", true)}
          {field("city")}
          {field("region")}
          {field("postalCode")}
          {field("country")}
        </div>
      </section>
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">Harita</h2>
        <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">Haritada noktaya sağ tıklayınca görünen enlem ve boylam.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{MAP.map((key) => field(key))}</div>
      </section>
    </div>
  );
}
