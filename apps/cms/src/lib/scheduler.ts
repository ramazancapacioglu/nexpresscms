import "server-only";
import { getFormSubmissionRepository, getScopedRepository } from "@nexpress/database";
import "@/plugins/register";
import { invalidateSite } from "./cache";
import { notify, syncSystemNotifications } from "./notify";
import { contentPath, localeBase, resolveSiteSettings } from "@nexpress/core";
import { dispatchPluginWebhooks, processDueWebhookDeliveries } from "./plugin-webhooks";

const lastRun = new Map<string, number>();
const MIN_INTERVAL_MS = 60_000;

/**
 * Zamanı gelen zamanlanmış içerikleri yayınlar ve süresi dolan çöpü temizler. Süreç başına site başına
 * dakikada en çok bir kez çalışır (ziyaretçi trafiğinde bedava zamanlayıcı); kesin zamanlama için
 * `/api/cron/scheduled` bir dış zamanlayıcıdan (cron) çağrılabilir. Hata asıl isteği bozmaz.
 */
export async function runScheduler(siteId: string, force = false): Promise<{ published: string[]; purged: number }> {
  const now = Date.now();
  if (!force && now - (lastRun.get(siteId) ?? 0) < MIN_INTERVAL_MS) return { published: [], purged: 0 };
  lastRun.set(siteId, now);
  try {
    const repo = getScopedRepository(siteId);
    const published = await repo.publishDue();
    const purged = await repo.purgeExpiredTrash();
    // KVKK: form gönderimleri 365 günden uzun tutulmaz
    await getFormSubmissionRepository(siteId).purgeOlderThan(365).catch(() => 0);
    if (published.length > 0) {
      // Zamanlanmış yayın da eklenti webhook'larını tetikler (admin kaydından farksız)
      void (async () => {
        const site = await repo.getSite();
        const locale = site?.defaultLocale ?? "tr";
        const types = resolveSiteSettings(site?.settings).general.contentTypes;
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
        for (const id of published) {
          const c = await repo.getContentById(id, locale);
          if (c) await dispatchPluginWebhooks(siteId, "content.published", { contentId: c.contentId, type: c.type, slug: c.slug, title: c.title, url: `${appUrl}${localeBase(site, locale)}${contentPath(types, c)}`, status: "published", locale });
        }
      })().catch(() => undefined);
    }
    if (published.length > 0) await notify(siteId, { kind: "content.scheduled_published", severity: "info", title: `${published.length} zamanlanmış içerik yayınlandı`, href: "/admin/schedule", audience: "all", window: 0 });
    void syncSystemNotifications(siteId);
    // Eklenti webhook yeniden denemeleri (zamanı gelen bekleyenler)
    void processDueWebhookDeliveries(siteId);
    if (published.length > 0 || purged > 0) {
      try {
        await invalidateSite(siteId);
      } catch {
        // render sırasında etiket düşürülemezse 120 sn'lik yedek süre devreye girer
      }
    }
    return { published, purged };
  } catch (error) {
    console.warn("[scheduler]", error instanceof Error ? error.message : error);
    return { published: [], purged: 0 };
  }
}
