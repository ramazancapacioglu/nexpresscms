import "server-only";
import { backupReminder, healthNotifications, loginFailureAlert, type NotificationInput } from "@nexpress/core";
import { getAuditRepository, getNotificationRepository, getScopedRepository } from "@nexpress/database";
import { collectSystemStatus } from "@/lib/system-status";

/** Bildirim üretir; hata asıl işi (form gönderimi, yayın, içe aktarma…) asla bozmaz. */
export async function notify(siteId: string, input: NotificationInput): Promise<void> {
  try {
    await getNotificationRepository(siteId).emit(input);
  } catch (error) {
    console.warn("[bildirim]", error instanceof Error ? error.message : error);
  }
}

const lastSync = new Map<string, number>();
const SYNC_INTERVAL_MS = 10 * 60_000;

/**
 * Sistem sağlığından türetilen uyarıları bildirimlere işler: sorun varsa açar/günceller, düzelenleri çözer.
 * Süreç başına site başına 10 dakikada en çok bir kez çalışır (`force` ile atlanır); zamanlayıcı ve bildirim sayfası çağırır.
 */
export async function syncSystemNotifications(siteId: string, force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - (lastSync.get(siteId) ?? 0) < SYNC_INTERVAL_MS) return;
  lastSync.set(siteId, now);
  try {
    const repo = getNotificationRepository(siteId);
    const cms = getScopedRepository(siteId);
    const audit = getAuditRepository(siteId);
    const [{ checks }, lastBackup, failures, site] = await Promise.all([
      collectSystemStatus(siteId),
      audit.list({ actionPrefix: "backup.export", limit: 1 }).then((r) => (r[0] ? new Date(r[0].at) : null)),
      Promise.all([audit.count({ actionPrefix: "auth.login_failed", since: new Date(now - 3_600_000) }), audit.count({ actionPrefix: "auth.login_blocked", since: new Date(now - 3_600_000) })]).then(([a, b]) => a + b),
      cms.getSite(),
    ]);
    const hasContent = (await cms.listContents({ locale: site?.defaultLocale ?? "tr" })).length > 0;
    const desired = [...healthNotifications(checks), backupReminder(lastBackup, hasContent), loginFailureAlert(failures)].filter((x): x is NonNullable<typeof x> => x !== null);
    for (const n of desired) await repo.emit(n);
    await repo.resolveSystemExcept(desired.map((d) => d.dedupeKey));
    await repo.purge();
  } catch (error) {
    console.warn("[bildirim-senkron]", error instanceof Error ? error.message : error);
  }
}
