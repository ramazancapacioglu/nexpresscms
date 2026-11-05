"use server";

import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { runSeoSync, type SeoSyncReport } from "@/lib/seo-sync";

/** Yönetici düğmesi: canlı konsol ve kaynak denetimi. Örnek satır yazılmaz. */
export async function syncSeoNowAction(): Promise<{ ok: true; report: SeoSyncReport } | { ok: false; error: string }> {
  const admin = await requireAdmin("seo.sync");
  try {
    const report = await runSeoSync(admin.siteId);
    await recordAudit({ id: admin.sub, email: admin.email }, "seo.sync", { target: "seo_intel", detail: report.notes.join(" · ") });
    return { ok: true, report };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Eşitleme tamamlanamadı." };
  }
}
