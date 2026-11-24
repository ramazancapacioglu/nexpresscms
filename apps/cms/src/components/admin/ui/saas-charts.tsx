import React from "react";
import Link from "next/link";

export type MetricTone = "emerald" | "blue" | "amber" | "rose" | "violet" | "slate";

const TONE_ICON: Record<MetricTone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  slate: "bg-muted text-muted-foreground",
};

const TONE_BADGE: Record<MetricTone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  amber: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  slate: "bg-muted text-muted-foreground",
};

const TONE_BAR: Record<MetricTone, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-foreground/60",
};

export interface KpiStatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  badge?: string;
  badgeTone?: MetricTone;
  hint?: string;
  icon?: React.ReactNode;
  iconTone?: MetricTone;
  progressPct?: number;
  sparkline?: number[];
  href?: string;
}

/** SaaS gösterge paneli KPI kartı (ikon rozeti, değer, durum rozeti, isteğe bağlı mini grafik). */
export function KpiStatCard({
  label,
  value,
  suffix,
  badge,
  badgeTone = "emerald",
  hint,
  icon,
  iconTone = "blue",
  progressPct,
  sparkline,
  href,
}: KpiStatCardProps) {
  const inner = (
    <div className="flex h-full flex-col justify-between gap-2.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition hover:border-border">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        {icon ? (
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${TONE_ICON[iconTone]}`}>
            {icon}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            {suffix ? (
              <span className="text-[12px] font-medium text-muted-foreground">{suffix}</span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badge ? (
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TONE_BADGE[badgeTone]}`}>
                {badge}
              </span>
            ) : null}
            {hint ? (
              <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </div>

        {sparkline && sparkline.length >= 2 ? (
          <MiniSparkline values={sparkline} tone={badgeTone} />
        ) : null}
      </div>

      {typeof progressPct === "number" ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${TONE_BAR[badgeTone]}`}
            style={{ width: `${Math.max(0, Math.min(100, Math.round(progressPct)))}%` }}
          />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

const SPARK_STROKE: Record<MetricTone, string> = {
  emerald: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  slate: "#64748b",
};

function MiniSparkline({ values, tone }: { values: number[]; tone: MetricTone }) {
  const w = 68;
  const h = 26;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = SPARK_STROKE[tone];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}

/** 180 derece yarım daire sağlık/SEO göstergesi (saf SVG, sıfır istemci bağımlılığı). */
export function SemiCircleGauge({
  score,
  label,
  subtitle,
}: {
  score: number;
  label: string;
  subtitle?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 72;
  const cx = 92;
  const cy = 88;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const stroke =
    clamped >= 85 ? "#10b981" : clamped >= 70 ? "#3b82f6" : clamped >= 50 ? "#f59e0b" : "#ef4444";
  const statusText =
    clamped >= 85 ? "Mükemmel" : clamped >= 70 ? "İyi" : clamped >= 50 ? "İyileştirilmeli" : "Kritik";

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[108px] w-[184px]">
        <svg viewBox="0 0 184 102" className="h-full w-full" role="img" aria-label={`${label}: ${clamped}/100`}>
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            className="stroke-muted"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <div className="text-[28px] font-bold leading-none tabular-nums text-foreground">
            {clamped}
            <span className="text-[13px] font-medium text-muted-foreground">/100</span>
          </div>
          <span className="mt-1 text-[11px] font-semibold" style={{ color: stroke }}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="text-[12px] font-medium text-foreground">{label}</div>
        {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  );
}

export interface VerticalBarItem {
  label: string;
  value: number;
  sublabel?: string;
  tone?: MetricTone;
  highlight?: boolean;
}

/** Dikey sütun grafiği (SVG + esnek yerleşim, en yüksek çubuk vurgulu). */
export function VerticalBarChart({
  items,
  height = 148,
  emptyText = "Henüz veri yok.",
}: {
  items: VerticalBarItem[];
  height?: number;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end justify-between gap-2 pt-4" style={{ minHeight: height }}>
      {items.map((item) => {
        const pct = Math.max(item.value > 0 ? 8 : 2, Math.round((item.value / max) * 100));
        const barColor = item.highlight
          ? "bg-emerald-500 dark:bg-emerald-400"
          : item.tone
            ? TONE_BAR[item.tone]
            : "bg-emerald-500/25 dark:bg-emerald-400/25 hover:bg-emerald-500/50";
        return (
          <div key={item.label} className="group flex flex-1 flex-col items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold tabular-nums text-foreground">
              {item.value.toLocaleString("tr-TR")}
            </span>
            <div className="flex w-full items-end justify-center" style={{ height: height - 44 }}>
              <div
                className={`w-full max-w-[44px] rounded-t-lg transition-all ${barColor}`}
                style={{ height: `${pct}%` }}
                title={`${item.label}: ${item.value.toLocaleString("tr-TR")}`}
              />
            </div>
            <div className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
              {item.label}
            </div>
            {item.sublabel ? (
              <div className="-mt-1 w-full truncate text-center text-[10px] text-muted-foreground/80">
                {item.sublabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Yatay sağlık / performans çubuğu satırı. */
export function HealthBarRow({
  label,
  valueText,
  pct,
  tone = "emerald",
  href,
}: {
  label: string;
  valueText: string;
  pct: number;
  tone?: MetricTone;
  href?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[12px]">
        {href ? (
          <Link href={href} className="truncate font-medium text-foreground hover:text-blue-600 hover:underline">
            {label}
          </Link>
        ) : (
          <span className="truncate font-medium text-foreground">{label}</span>
        )}
        <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
          {valueText}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${TONE_BAR[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/** Çok parçalı yatay dağılım çubuğu (örn. Anahtar Kelime Pozisyon Dağılımı). */
export function StackedDistributionBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; tone: MetricTone }>;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
        Henüz pozisyon verisi yok.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((seg) => {
          if (seg.value <= 0) return null;
          const pct = (seg.value / total) * 100;
          return (
            <div
              key={seg.label}
              className={`h-full ${TONE_BAR[seg.tone]} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        {segments.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${TONE_BAR[seg.tone]}`} />
              <span>{seg.label}</span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {seg.value}
              </span>
              <span className="text-[10px]">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
