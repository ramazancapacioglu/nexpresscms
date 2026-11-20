"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, Info, Search } from "lucide-react";
import type { ReportColumn, ReportTable, WebmasterReport } from "@nexpress/seo-core";
import { StatTile, TimelineChart } from "./charts";
import { formatValue } from "./format";

const PAGE = 25;

/** Sıralanabilir, aranabilir tablo. İlk sayısal sütunda ince çubuk (değerin payı) çizilir; değerler tabloda da okunur. */
export function DataTable({ table, loading = false }: { table: ReportTable; loading?: boolean }) {
  const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const first = table.columns[0]!;
  const barColumn = table.columns.find((c) => c.kind === "int");
  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    let list = q ? table.rows.filter((r) => String(r[first.key] ?? "").toLocaleLowerCase("tr").includes(q)) : table.rows;
    if (sort) {
      const dir = sort.desc ? -1 : 1;
      list = [...list].sort((a, b) => {
        const av = a[sort.key] ?? "";
        const bv = b[sort.key] ?? "";
        return typeof av === "number" && typeof bv === "number" ? (av - bv) * dir : String(av).localeCompare(String(bv), "tr") * dir;
      });
    }
    return list;
  }, [table.rows, query, sort, first.key]);
  const max = barColumn ? Math.max(1, ...table.rows.map((r) => Number(r[barColumn.key] ?? 0))) : 1;

  const cell = (column: ReportColumn, value: string | number | undefined) => {
    if (value === undefined || value === "") return <span className="v-muted">—</span>;
    if (column.kind === "url") {
      const text = String(value).replace(/^https?:\/\/[^/]+/, "") || "/";
      return /^https?:\/\//.test(String(value)) ? (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" title={String(value)} className="hover:underline">{text}</a>
      ) : (
        <span title={String(value)}>{text}</span>
      );
    }
    if (typeof value === "number") return <span className="tabular-nums">{formatValue(value, column.kind)}</span>;
    return <span>{value}</span>;
  };

  return (
    <section className={`v-card p-3 ${loading ? "v-fade" : ""}`} aria-label={table.title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="v-ink text-[13px] font-semibold">{table.title}</h4>
          {table.hint ? <p className="v-ink2 text-[11px]">{table.hint}</p> : null}
        </div>
        {table.rows.length > 10 ? (
          <label className="relative">
            <span className="sr-only">Tabloda ara</span>
            <Search className="v-muted pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5" aria-hidden="true" />
            <input type="search" name="wm-table-filter" autoComplete="off" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} placeholder={`${first.label} ara…`} className="v-ink h-7 w-44 rounded-md border bg-transparent pl-7 pr-2 text-[11px]" style={{ borderColor: "var(--v-ring)" }} />
          </label>
        ) : null}
      </div>
      {table.rows.length === 0 ? (
        <p className="v-ink2 mt-3 text-[12px]">Bu dönem için veri yok.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="v-ink2">
                {table.columns.map((c, i) => (
                  <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.desc ? "descending" : "ascending") : "none"} className={`py-1.5 pr-3 ${i > 0 ? "text-right" : ""}`}>
                    <button type="button" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, desc: !s.desc } : { key: c.key, desc: i > 0 }))} className="inline-flex items-center gap-1 hover:underline">
                      {c.label}
                      {sort?.key === c.key ? <ArrowDownUp className="h-3 w-3" aria-hidden="true" /> : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map((row, index) => (
                <tr key={`${index}-${String(row[first.key])}`} className="v-row v-ink border-t" style={{ borderColor: "var(--v-grid)" }}>
                  {table.columns.map((c, i) => (
                    <td key={c.key} className={`py-1.5 pr-3 align-middle ${i > 0 ? "text-right" : "max-w-[22rem] truncate"}`}>
                      {cell(c, row[c.key])}
                      {barColumn && c.key === barColumn.key ? (
                        <div className="mt-0.5 ml-auto w-24" aria-hidden="true">
                          <div className="v-bar" style={{ width: `${Math.max(2, (Number(row[c.key] ?? 0) / max) * 100)}%` }} />
                        </div>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="v-ink2 mt-2 flex items-center justify-between text-[11px]">
            <span>{rows.length} satırdan {Math.min(shown, rows.length)} gösteriliyor</span>
            {shown < rows.length ? <button type="button" onClick={() => setShown((s) => s + PAGE)} className="underline underline-offset-2">Daha fazla göster</button> : null}
          </div>
        </div>
      )}
    </section>
  );
}

/** Arama sorgularından fırsatlar: ilk sayfaya yakın ve CTR'si düşük olanlar (yalnızca gerçek Search Console/Bing verisinden). */
function Opportunities({ table }: { table: ReportTable }) {
  const rows = table.rows as Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
  const striking = rows.filter((r) => r.position >= 4 && r.position <= 15 && r.impressions >= 50).sort((a, b) => b.impressions - a.impressions).slice(0, 8);
  const lowCtr = rows.filter((r) => r.position > 0 && r.position <= 5 && r.impressions >= 100 && r.ctr < 2).sort((a, b) => b.impressions - a.impressions).slice(0, 8);
  if (striking.length === 0 && lowCtr.length === 0) return null;
  const list = (items: typeof rows, empty: string) =>
    items.length === 0 ? (
      <p className="v-ink2 text-[11px]">{empty}</p>
    ) : (
      <ul className="space-y-1">
        {items.map((r) => (
          <li key={r.label} className="v-ink flex items-baseline justify-between gap-3 text-[12px]">
            <span className="truncate" title={r.label}>{r.label}</span>
            <span className="v-ink2 shrink-0 text-[11px] tabular-nums">konum {formatValue(r.position, "pos")} · {formatValue(r.impressions, "int")} gösterim · TO {formatValue(r.ctr, "pct")}</span>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="v-card p-3">
        <h4 className="v-ink text-[13px] font-semibold">İlk sayfaya yakın sorgular</h4>
        <p className="v-ink2 mb-2 text-[11px]">Konum 4–15: içerik ve iç bağlantıyla yukarı taşınabilir.</p>
        {list(striking, "Bu aralıkta uygun sorgu yok.")}
      </div>
      <div className="v-card p-3">
        <h4 className="v-ink text-[13px] font-semibold">Düşük tıklama oranı</h4>
        <p className="v-ink2 mb-2 text-[11px]">İlk 5'te ama TO %2'nin altında: başlık ve açıklamayı güçlendirin.</p>
        {list(lowCtr, "Bu aralıkta uygun sorgu yok.")}
      </div>
    </div>
  );
}

/** Sorgu dizeli adresler (ör. `/?j=rastgele`) çoğu zaman spam ya da yinelenen adrestir: dizinde görünüyorsa uyarır. */
function SuspiciousUrls({ table }: { table: ReportTable }) {
  const rows = (table.rows as Array<{ label: string; impressions: number }>).filter((r) => /\?[^=#\s]+=/.test(String(r.label)));
  if (rows.length === 0) return null;
  return (
    <div role="note" className="v-card flex gap-3 p-3" style={{ borderColor: "color-mix(in srgb, var(--v-s2) 45%, transparent)" }}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--v-s2)" }} aria-hidden="true" />
      <div className="space-y-1 text-[12px]">
        <p className="v-ink font-semibold">{rows.length} sorgu dizeli adres arama sonuçlarında görünüyor</p>
        <p className="v-ink2">Bunlar genellikle spam ya da yinelenen adreslerdir. Örnekler: {rows.slice(0, 3).map((r) => String(r.label).replace(/^https?:\/\/[^/]+/, "")).join(" · ")}. <strong>Tarama temizliği</strong> sekmesinden ilgili parametre ya da yola 410 kuralı ekleyin.</p>
      </div>
    </div>
  );
}

/** Tek rapor (kaynak fark etmeksizin): notlar, KPI'lar, zaman serileri, tablolar. */
export function ReportView({ report, loading = false, days }: { report: WebmasterReport; loading?: boolean; days: number }) {
  return (
    <div className="space-y-3">
      {report.notes.length > 0 ? (
        <div className="v-ink2 flex items-start gap-2 text-[11px]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>{report.notes.join(" ")}</p>
        </div>
      ) : null}
      {report.kpis.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {report.kpis.map((k) => <StatTile key={k.key} kpi={k} days={days} loading={loading} />)}
        </div>
      ) : null}
      {report.timeline ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {report.timeline.series.map((s, i) => <TimelineChart key={s.key} dates={report.timeline!.dates} series={s} index={i} loading={loading} />)}
        </div>
      ) : null}
      {report.source === "gsc" && report.section === "queries" && report.tables[0] ? <Opportunities table={report.tables[0]} /> : null}
      {report.source === "bing" && report.section === "queries" && report.tables[0] ? <Opportunities table={report.tables[0]} /> : null}
      {(report.source === "gsc" || report.source === "bing") && report.section === "pages" && report.tables[0] ? <SuspiciousUrls table={report.tables[0]} /> : null}
      {report.tables.map((t) => <DataTable key={t.id} table={t} loading={loading} />)}
    </div>
  );
}
