"use client";

import React, { useState, useTransition } from "react";
import { CONDITION_LABELS, type ConditionType, type TemplateCondition, type TemplateConditions, type TemplateKind } from "@nexpress/core";
import { Plus, Trash2 } from "lucide-react";
import { updateTemplateSettingsAction } from "./actions";

const field = "h-8 rounded border border-[#D5D8DE] bg-transparent px-2 text-[12px] dark:border-[#2E333D]";
const TYPES = Object.keys(CONDITION_LABELS) as ConditionType[];
const HINTS: Record<ConditionType, string> = { slug: "ör. iletisim (ana sayfa: ana-sayfa)", category: "kategori adı ya da slug", tag: "etiket adı ya da slug", contentType: "page, post, product…", locale: "tr, en…" };

function RuleList({ title, rules, onChange }: { title: string; rules: TemplateCondition[]; onChange: (r: TemplateCondition[]) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[12px] font-semibold">{title}</legend>
      {rules.length === 0 && <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Kural yok.</p>}
      {rules.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select aria-label="Koşul türü" value={r.type} onChange={(e) => onChange(rules.map((x, j) => (j === i ? { ...x, type: e.target.value as ConditionType } : x)))} className={field}>
            {TYPES.map((t) => <option key={t} value={t}>{CONDITION_LABELS[t]}</option>)}
          </select>
          <input aria-label="Koşul değeri" value={r.value} placeholder={HINTS[r.type]} maxLength={80} onChange={(e) => onChange(rules.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className={`${field} w-56`} />
          <button type="button" aria-label="Kuralı sil" onClick={() => onChange(rules.filter((_, j) => j !== i))} className="h-8 w-8 rounded border border-[#D5D8DE] text-red-600 dark:border-[#2E333D]"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
        </div>
      ))}
      {rules.length < 20 && <button type="button" onClick={() => onChange([...rules, { type: "locale", value: "" }])} className="inline-flex h-8 items-center gap-1 rounded border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"><Plus className="h-3.5 w-3.5" /> Kural ekle</button>}
    </fieldset>
  );
}

/** Şablon ayarları: görüntüleme koşulları (atama olmadan kendiliğinden devreye girme) ve header davranışı. */
export function TemplateSettings({ id, kind, conditions: initial, behavior: initialBehavior, onSaved }: { id: string; kind: TemplateKind; conditions: TemplateConditions; behavior: { sticky?: boolean; glass?: boolean }; onSaved: (c: TemplateConditions, b: { sticky?: boolean; glass?: boolean }) => void }) {
  const [conditions, setConditions] = useState(initial);
  const [behavior, setBehavior] = useState(initialBehavior);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const save = () =>
    start(async () => {
      const r = await updateTemplateSettingsAction({ id, conditions, behavior });
      setMsg(r.ok ? "Kaydedildi." : r.error);
      if (r.ok) onSaved({ include: conditions.include.filter((c) => c.value.trim()), exclude: conditions.exclude.filter((c) => c.value.trim()) }, behavior);
    });
  return (
    <div className="space-y-3 border-t border-[#E6E8EC] bg-[#FAFAFB] px-4 py-3 dark:border-[#262A33] dark:bg-[#101216]">
      <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Koşullar, sayfaya şablon atanmadığında devreye girer; birden fazla şablon uyarsa en özgül olan (sayfa adresi &gt; kategori &gt; etiket &gt; tür &gt; dil) seçilir. Hiçbiri uymazsa varsayılan şablon kullanılır. Header/footer/kenar çubuğu için yalnızca dil ve sayfa adresi kuralları çalışır.</p>
      <RuleList title="Şu durumlarda kullan" rules={conditions.include} onChange={(include) => setConditions({ ...conditions, include })} />
      <RuleList title="Şu durumlarda kullanma" rules={conditions.exclude} onChange={(exclude) => setConditions({ ...conditions, exclude })} />
      {kind === "header" && (
        <fieldset className="space-y-1.5">
          <legend className="text-[12px] font-semibold">Header davranışı</legend>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={behavior.sticky !== false} onChange={(e) => setBehavior({ ...behavior, sticky: e.target.checked })} /> Yapışkan (sayfa kayarken üstte kalır)</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={behavior.glass !== false} onChange={(e) => setBehavior({ ...behavior, glass: e.target.checked })} /> Buzlu cam arka plan</label>
        </fieldset>
      )}
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending} onClick={save} className="h-8 rounded bg-blue-700 px-4 text-[12px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Ayarları kaydet"}</button>
        {msg && <span role="status" className="text-[12px]">{msg}</span>}
      </div>
    </div>
  );
}
