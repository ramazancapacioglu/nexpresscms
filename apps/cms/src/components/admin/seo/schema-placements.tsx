"use client";

import { useState, useTransition } from "react";
import type { SchemaPlacement } from "@nexpress/core";
import { saveSeoEngineSettingsAction } from "@/app/admin/actions";

const TYPES = ["WebPage", "Article", "BlogPosting", "NewsArticle", "FAQPage", "AboutPage", "ContactPage", "Organization", "SoftwareApplication", "Service", "Product", "HowTo"];

function blank(): SchemaPlacement {
  return { id: `sch_${Date.now().toString(36)}`, name: "", schemaType: "BlogPosting", scope: "post", category: "", enabled: true };
}

/** Şema kurallarını düzenler. İçerikteki özel şema türü bu listeden ezilmez. */
export function SchemaPlacements({
  initial,
  inventory,
}: {
  initial: SchemaPlacement[];
  inventory: Array<{ schemaType: string; count: number }>;
}) {
  const [rows, setRows] = useState<SchemaPlacement[]>(initial);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    start(async () => {
      const ready = rows.filter((row) => row.name.trim() && (row.scope !== "category" || row.category.trim()));
      const res = await saveSeoEngineSettingsAction({ seo: { schemaPlacements: ready } });
      setNote(res.ok ? "Şema kuralları kaydedildi." : "Kaydedilemedi.");
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        <h2 className="text-[13px] font-semibold">Sitedeki şema türleri</h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-[12px]">
          {inventory.map((item) => (
            <li key={item.schemaType} className="rounded border border-[#E6E7EA] px-2 py-1 dark:border-[#23262E]">{item.schemaType} · {item.count}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-2 rounded-lg border border-[#E6E7EA] bg-white p-3 md:grid-cols-6 dark:border-[#23262E] dark:bg-[#15171C]">
            <input aria-label="Şema adı" value={row.name} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Ad" className="h-8 rounded border px-2 text-[12px] md:col-span-2" />
            <select aria-label="Şema türü" value={row.schemaType} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, schemaType: e.target.value } : item))} className="h-8 rounded border px-2 text-[12px]">
              {TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select aria-label="Kullanım yeri" value={row.scope} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, scope: e.target.value as SchemaPlacement["scope"] } : item))} className="h-8 rounded border px-2 text-[12px]">
              <option value="page">Sayfa</option>
              <option value="post">Blog</option>
              <option value="category">Kategori</option>
            </select>
            <input aria-label="Kategori adresi" value={row.category} disabled={row.scope !== "category"} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, category: e.target.value } : item))} placeholder="kategori adresi" className="h-8 rounded border px-2 text-[12px]" />
            <div className="flex items-center gap-2 text-[12px]">
              <label className="flex items-center gap-1"><input type="checkbox" checked={row.enabled} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, enabled: e.target.checked } : item))} /> Açık</label>
              <button type="button" className="text-rose-700" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}>Sil</button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setRows((prev) => [...prev, blank()])} className="rounded border px-3 py-1.5 text-[12px]">Yeni şema</button>
          <button type="button" disabled={pending} onClick={save} className="rounded bg-[#14151A] px-3 py-1.5 text-[12px] text-white dark:bg-white dark:text-[#14151A]">{pending ? "Kaydediliyor" : "Kaydet"}</button>
          {note ? <span className="text-[12px]">{note}</span> : null}
        </div>
      </section>
    </div>
  );
}
