import type { KpiFormat, ColumnKind } from "@nexpress/seo-core";

const nf = new Intl.NumberFormat("tr-TR");
const nf1 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatValue(value: number, format: KpiFormat | ColumnKind): string {
  switch (format) {
    case "pct":
      return `%${nf1.format(value)}`;
    case "pos":
      return nf1.format(value);
    case "duration":
      return formatDuration(value);
    default:
      return nf.format(Math.round(value));
  }
}

/** Eksen etiketi: 10.000 ve üzerinde kısaltılır (10 B), altında tam sayı. */
export function formatAxis(value: number): string {
  return Math.abs(value) >= 10_000 ? compact.format(value) : nf.format(Math.round(value));
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const formatPercentChange = (value: number): string => `${value >= 0 ? "+" : "−"}${nf1.format(Math.abs(value))}%`;
export const formatTwoDecimals = (value: number): string => nf2.format(value);

const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const dayLongFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "short", timeZone: "UTC" });
export const formatDay = (iso: string): string => dayFmt.format(new Date(`${iso}T00:00:00Z`));
export const formatDayLong = (iso: string): string => dayLongFmt.format(new Date(`${iso}T00:00:00Z`));

/** Eksen için "güzel" üst sınır: 1, 2, 2.5, 5 × 10^n. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  for (const step of [1, 2, 2.5, 5, 10]) if (value <= step * base) return step * base;
  return 10 * base;
}
