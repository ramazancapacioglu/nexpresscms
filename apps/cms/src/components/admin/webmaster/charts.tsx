"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ReportKpi, ReportSeries } from "@nexpress/seo-core";
import { formatAxis, formatDay, formatDayLong, formatPercentChange, formatValue, niceMax, percentChange } from "./format";

const SERIES_VARS = ["var(--v-s1)", "var(--v-s2)", "var(--v-s3)"] as const;

/** Konteyner genişliği (piksel): grafik tam genişliğe oturur, yeniden boyutlanınca yeniden çizilir. */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/**
 * Zaman serisi (tek ölçü, tek eksen): 2 px çizgi, %10 alan yıkaması, hairline ızgara, uç noktada 8 px işaret (2 px yüzey halkası).
 * İmleç/odak en yakın güne oturur; tek tooltip değeri öne çıkarır. Klavye: ok tuşları. Tablo görünümü her zaman erişilebilir.
 */
export function TimelineChart({ dates, series, index = 0, loading = false }: { dates: string[]; series: ReportSeries; index?: number; loading?: boolean }) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const height = 176;
  const pad = { l: 44, r: 14, t: 12, b: 24 };
  const color = SERIES_VARS[index % SERIES_VARS.length]!;
  const values = series.values;
  const max = niceMax(Math.max(...values, 0));
  const w = Math.max(width, 240);
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (values.length <= 1 ? iw / 2 : (i / (values.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = useMemo(() => values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" "), [values, w]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = values.length ? `${line} L${x(values.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + ih).toFixed(1)} Z` : "";
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(values.length / Math.max(2, Math.floor(iw / 78))));
  const total = values.reduce((a, b) => a + b, 0);
  const last = values.length - 1;
  const hovered = active ?? last;

  const at = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - pad.l;
    return Math.min(last, Math.max(0, Math.round((rel / iw) * last)));
  };

  return (
    <div className="v-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="v-ink text-[12px] font-semibold">{series.label}</h4>
        <span className="v-ink2 text-[11px]">
          Toplam {formatValue(total, series.format)} · ortalama {formatValue(values.length ? total / values.length : 0, series.format)}/gün
        </span>
      </div>
      <div ref={ref} className={`relative mt-1 ${loading ? "v-fade" : ""}`}>
        <svg
          width={w}
          height={height}
          role="img"
          aria-label={`${series.label}: ${dates[0] ?? ""} – ${dates[last] ?? ""}, toplam ${formatValue(total, series.format)}`}
          tabIndex={0}
          className="block touch-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--v-s1)]"
          onPointerMove={(e) => setActive(at(e.clientX, e.currentTarget.getBoundingClientRect()))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((v) => v ?? last)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setActive((v) => Math.max(0, (v ?? last) - 1));
            else if (e.key === "ArrowRight") setActive((v) => Math.min(last, (v ?? last) + 1));
            else if (e.key === "Home") setActive(0);
            else if (e.key === "End") setActive(last);
            else return;
            e.preventDefault();
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? "v-axis" : "v-grid"} />
              <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" className="v-tick">{formatAxis(t)}</text>
            </g>
          ))}
          {dates.map((d, i) => ((i % labelEvery === 0 && last - i >= labelEvery * 0.7) || i === last ? (
            <text key={d} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="v-tick">{formatDay(d)}</text>
          ) : null))}
          {area ? <path d={area} fill={color} opacity={0.1} /> : null}
          {line ? <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /> : null}
          {values.length ? <circle cx={x(hovered)} cy={y(values[hovered] ?? 0)} r={4} fill={color} stroke="var(--v-surface)" strokeWidth={2} /> : null}
          {active !== null ? <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + ih} className="v-axis" /> : null}
        </svg>
        {active !== null && values.length ? (
          <div className="v-tip absolute z-10 px-2.5 py-1.5" style={{ left: Math.min(Math.max(x(active) - 60, 0), w - 140), top: 0 }}>
            <div className="v-ink flex items-center gap-1.5 text-[13px] font-semibold">
              <span aria-hidden="true" className="inline-block h-0.5 w-3 rounded" style={{ background: color }} />
              {formatValue(values[active] ?? 0, series.format)}
            </div>
            <div className="v-ink2 text-[10px]">{formatDayLong(dates[active] ?? "")}</div>
          </div>
        ) : null}
      </div>
      <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="v-ink2 mt-1 text-[11px] underline underline-offset-2">
        {table ? "Tabloyu gizle" : "Tablo olarak göster"}
      </button>
      {table ? (
        <div className="mt-1 max-h-48 overflow-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="v-ink2"><tr><th className="py-0.5 pr-3">Tarih</th><th className="py-0.5 text-right">{series.label}</th></tr></thead>
            <tbody>
              {dates.map((d, i) => (
                <tr key={d} className="v-ink border-t" style={{ borderColor: "var(--v-grid)" }}>
                  <td className="py-0.5 pr-3">{formatDayLong(d)}</td>
                  <td className="py-0.5 text-right tabular-nums">{formatValue(values[i] ?? 0, series.format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/** Hero rakam + önceki dönemle fark (yön × "yukarısı iyi mi"; renk tek başına taşımaz: ok + yüzde). */
export function StatTile({ kpi, days, loading = false }: { kpi: ReportKpi; days: number; loading?: boolean }) {
  const change = kpi.previous === undefined ? null : percentChange(kpi.value, kpi.previous);
  const good = change === null || change === 0 ? null : kpi.lowerIsBetter ? change < 0 : change > 0;
  const Icon = change === null || change === 0 ? Minus : change > 0 ? ArrowUp : ArrowDown;
  const tone = good === null ? "var(--v-muted)" : good ? "var(--v-good)" : "var(--v-bad)";
  return (
    <div className={`v-card p-3 ${loading ? "v-fade" : ""}`}>
      <div className="v-ink2 text-[11px]">{kpi.label}</div>
      <div className="v-ink mt-0.5 text-[24px] font-semibold leading-tight tabular-nums">{formatValue(kpi.value, kpi.format)}</div>
      {change !== null ? (
        <div className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: tone }} title={`Önceki ${days} gün: ${formatValue(kpi.previous ?? 0, kpi.format)}`}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          <span className="font-medium">{change === 0 ? "Değişim yok" : formatPercentChange(change)}</span>
          <span className="v-muted">önceki {days} güne göre</span>
        </div>
      ) : (
        <div className="v-muted mt-0.5 text-[11px]">&nbsp;</div>
      )}
    </div>
  );
}

/** Küçük çizgi (özet kartları için): eksensiz, son nokta işaretli. */
export function Sparkline({ values, color = "var(--v-s1)" }: { values: number[]; color?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${i === 0 ? "M" : "L"}${((i / Math.max(1, values.length - 1)) * (w - 8) + 4).toFixed(1)},${(h - 4 - (v / max) * (h - 8)).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg width={w} height={h} role="img" aria-label="Eğilim" className="block">
      <path d={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {last >= 0 ? <circle cx={((last / Math.max(1, last)) * (w - 8)) + 4} cy={h - 4 - ((values[last] ?? 0) / max) * (h - 8)} r={4} fill={color} stroke="var(--v-surface)" strokeWidth={2} /> : null}
    </svg>
  );
}
