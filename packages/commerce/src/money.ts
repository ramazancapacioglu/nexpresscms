/** Fiyatları kuruş/cent cinsinden saklarız; gösterimde TRY formatı. */
export function formatMoney(cents: number, currency = "TRY", locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseMoneyInputToCents(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
