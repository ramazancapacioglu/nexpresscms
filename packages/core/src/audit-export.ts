import { toCsv } from "./forms";

/**
 * Denetim günlüğü dışa aktarma ve saklama kuralları (saf). CSV kaçışı (formül enjeksiyonu dahil) `forms.ts`
 * içindeki `toCsv` ile ortaktır.
 */
export interface AuditCsvRow {
  at: Date;
  actorEmail: string;
  action: string;
  target: string | null;
  detail: string;
  ip: string;
}

export const AUDIT_CSV_HEADER = ["zaman", "kullanici", "eylem", "hedef", "ayrinti", "ip"];

export const auditCsvRow = (r: AuditCsvRow): string[] => [r.at.toISOString(), r.actorEmail, r.action, r.target ?? "", r.detail, r.ip];

/** Tam dosya (BOM + CRLF). Büyük dışa aktarmada parça parça üretmek için `auditCsvRow` + `toCsv` kullanın. */
export const auditCsv = (rows: AuditCsvRow[]): string => toCsv([AUDIT_CSV_HEADER, ...rows.map(auditCsvRow)]);

/** Elle temizlemede en az bu kadar günlük kayıt korunur (kimin ne yaptığı kısa sürede silinemesin). */
export const AUDIT_MIN_RETENTION_DAYS = 30;

/** Gün sayısı geçerliyse kesme anını (bundan ESKİ kayıtlar silinir) döner; değilse null. */
export function auditPurgeCutoff(days: number, now: number = Date.now()): Date | null {
  if (!Number.isInteger(days) || days < AUDIT_MIN_RETENTION_DAYS || days > 3650) return null;
  return new Date(now - days * 86_400_000);
}
