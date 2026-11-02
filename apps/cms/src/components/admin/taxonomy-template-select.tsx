"use client";

import { useState, useTransition } from "react";
import { assignTaxonomyTemplateAction } from "@/app/admin/appearance/templates/actions";
import { TemplatePicker } from "./editor/template-picker";

/** Kategori/etiket arşiv sayfasının şablonu. Seçim anında kaydedilir (formun Kaydet düğmesinden bağımsız). */
export function TaxonomyTemplateSelect({ taxonomyId, kind, initial }: { taxonomyId: string; kind: "category" | "tag"; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="rounded-lg border border-border p-2.5 space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Arşiv sayfası şablonu</div>
      <TemplatePicker id={`tax-tpl-${taxonomyId}`} kind={kind} value={value} onChange={(v) => { setValue(v); start(async () => { const r = await assignTaxonomyTemplateAction({ taxonomyId, templateId: v || null }); setNote(r.ok ? "Şablon kaydedildi." : r.error); }); }} />
      {pending ? <p className="text-[10px] text-muted-foreground">Kaydediliyor…</p> : note ? <p role="status" className="text-[10px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}
