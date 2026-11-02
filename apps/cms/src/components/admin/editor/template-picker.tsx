"use client";

import { useEffect, useState } from "react";
import type { TemplateKind } from "@nexpress/core";
import { TEMPLATE_KINDS } from "@nexpress/core";

interface Item { id: string; name: string; kind: TemplateKind; isDefault: boolean }

/**
 * Şablon seçici: "Varsayılan" (türün varsayılan şablonu), belirli bir şablon ya da "Yerleşik görünüm" (şablonsuz).
 * Değer: "" = varsayılan, "none" = yerleşik, aksi hâlde şablon kimliği.
 */
export function TemplatePicker({ kind, value, onChange, id }: { kind: TemplateKind; value: string; onChange: (v: string) => void; id: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    let live = true;
    void fetch("/api/admin/templates", { cache: "no-store" }).then((r) => r.json()).then((j: { ok: boolean; items?: Item[] }) => { if (live) setItems(j.ok ? j.items ?? [] : []); }).catch(() => live && setItems([]));
    return () => { live = false; };
  }, []);
  const list = (items ?? []).filter((i) => i.kind === kind);
  const def = list.find((i) => i.isDefault);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold">{TEMPLATE_KINDS[kind].label} şablonu</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded border border-border bg-background px-2 text-[12px]">
        <option value="">Varsayılan{def ? ` (${def.name})` : " (yerleşik görünüm)"}</option>
        {list.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        <option value="none">Yerleşik görünüm (şablonsuz)</option>
      </select>
      {items && list.length === 0 ? <p className="mt-1 text-[10px] text-muted-foreground">Bu tür için şablon yok. Görünüm → Şablonlar sayfasından oluşturabilirsiniz.</p> : null}
    </div>
  );
}
