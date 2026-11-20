"use client";

import React, { useState } from "react";
import { parseSearchConsoleCsv, parseSearchConsoleJson } from "@nexpress/seo-core";
import { runPluginAction } from "@/app/admin/plugin-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

/** API kullanılamıyorsa Search Console / Bing dışa aktarımını (CSV veya JSON) kelime havuzuna elle aktarır. Örnek veri içermez. */
export function ManualImport() {
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const run = () => {
    const body = text.trim();
    if (!body) return;
    const rows = body.startsWith("[") || body.startsWith("{") ? parseSearchConsoleJson(body) : parseSearchConsoleCsv(body);
    if (rows.length === 0) {
      setNote("Veri tanınamadı: Search Console'dan indirilen CSV ya da JSON içeriğini yapıştırın.");
      return;
    }
    void runPluginAction({ name: "intel.import", payload: { live: true, source: "gsc", rows: rows.map((r) => ({ keyword: r.query, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })) } });
    setNote(`${rows.length} sorgu kelime havuzuna aktarıldı.`);
    setText("");
  };
  return (
    <details className="v-card p-3 text-[12px]">
      <summary className="v-ink cursor-pointer text-[13px] font-semibold">Elle içe aktar (CSV / JSON)</summary>
      <p className="v-ink2 mt-1 text-[11px]">API bağlı değilse Search Console'dan indirdiğiniz <code>Sorgular.csv</code> içeriğini yapıştırın; sorgular kelime havuzuna yazılır.</p>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Sorgu,Tıklama,Gösterim,TO,Konum…" className={`${fieldClass} mt-2 font-mono text-xs`} />
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={run} className="rounded-md bg-nx-primary px-3 py-1 text-xs font-semibold text-nx-primary-fg">Aktar</button>
        {note ? <span role="status" className="v-ink2 text-[11px]">{note}</span> : null}
      </div>
    </details>
  );
}
