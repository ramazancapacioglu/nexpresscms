/** İçerik tazeliği (saf mantık): bayat ve süresi dolmuş içerikleri bulur. */
export interface FreshnessInput {
  id: string;
  title: string;
  slug: string;
  type: string;
  updatedAt: Date;
  /** Kampanya vb. içerikler için bitiş tarihi */
  expiresAt?: Date | null;
}

export interface StaleItem extends FreshnessInput {
  reason: "expired" | "stale";
  ageDays: number;
}

const DAY = 86_400_000;
export const STALE_AFTER_DAYS = 180;

/** Süresi dolanlar önce, sonra en eski güncellenenler. */
export function findStale(items: FreshnessInput[], now: Date, staleAfterDays = STALE_AFTER_DAYS): StaleItem[] {
  const out: StaleItem[] = [];
  for (const i of items) {
    const ageDays = Math.floor((now.getTime() - i.updatedAt.getTime()) / DAY);
    if (i.expiresAt && i.expiresAt.getTime() < now.getTime()) out.push({ ...i, reason: "expired", ageDays });
    else if (ageDays >= staleAfterDays) out.push({ ...i, reason: "stale", ageDays });
  }
  return out.sort((a, b) => (a.reason === b.reason ? b.ageDays - a.ageDays : a.reason === "expired" ? -1 : 1));
}
