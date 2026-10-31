"use server";

import { revalidatePath } from "next/cache";
import { AUDIT_MIN_RETENTION_DAYS, auditPurgeCutoff } from "@nexpress/core";
import { getAuditRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

export type PurgeResult = { ok: true; deleted: number } | { ok: false; error: string };

/**
 * Belirtilen günden ESKİ denetim kayıtlarını siler (kiracı başına, yönetici). En az 30 gün korunur; silme,
 * silinen sayıyla birlikte günlüğe `audit.purged` olarak yazılır (silinemeyen tek kayıt).
 */
export async function purgeAuditAction(input: { days: number }): Promise<PurgeResult> {
  const admin = await requireAdmin("audit.purge");
  const cutoff = auditPurgeCutoff(input.days);
  if (!cutoff) return { ok: false, error: `Gün sayısı ${AUDIT_MIN_RETENTION_DAYS} ile 3650 arasında tam sayı olmalı.` };
  const deleted = await getAuditRepository(admin.siteId).purgeOlderThan(cutoff);
  await recordAudit({ id: admin.sub, email: admin.email }, "audit.purged", { detail: `${input.days} günden eski ${deleted} kayıt silindi` });
  revalidatePath("/admin/audit");
  return { ok: true, deleted };
}
