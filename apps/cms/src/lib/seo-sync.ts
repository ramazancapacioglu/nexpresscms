import { pluginActions, resolveSiteSettings } from "@nexpress/core";
import { getAgentRequestRepository, getScopedRepository } from "@nexpress/database";
import { fetchBingQueryStats, fetchGscSearchQueries, fetchYandexOrganicLandings } from "@nexpress/seo-core";
import "@/plugins/register";

export interface SeoSyncReport {
  notes: string[];
  purged: number;
}

/** Canlı anahtarı olan konsolları havuza yazar ve eski talepleri temizler. Örnek satır kaydedilmez. */
export async function runSeoSync(siteId: string): Promise<SeoSyncReport> {
  const notes: string[] = [];
  const site = await getScopedRepository(siteId).getSite();
  const integrations = resolveSiteSettings(site?.settings).seo.integrations;
  const gsc = integrations?.gsc;
  if (gsc?.enabled && gsc.clientId && gsc.clientSecret && gsc.refreshToken && gsc.siteUrl) {
    try {
      const rows = await fetchGscSearchQueries(
        { clientId: gsc.clientId, clientSecret: gsc.clientSecret, refreshToken: gsc.refreshToken, siteUrl: gsc.siteUrl },
        28,
        50,
      );
      await pluginActions.run("intel.import", {
        siteId,
        userId: "cron",
        input: { live: true, source: "gsc", rows: rows.map((row) => ({ keyword: row.query, clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position })) },
      });
      notes.push(`Search Console: ${rows.length}`);
    } catch {
      notes.push("Search Console yanıt vermedi.");
    }
  } else {
    notes.push("Search Console anahtarı yok.");
  }

  const bing = integrations?.bing;
  if (bing?.enabled && bing.apiKey && bing.siteUrl) {
    try {
      const rows = await fetchBingQueryStats(bing.apiKey, bing.siteUrl);
      await pluginActions.run("intel.import", {
        siteId,
        userId: "cron",
        input: { live: true, source: "bing", rows: rows.map((row) => ({ keyword: row.query, clicks: row.clicks, impressions: row.impressions, position: row.position })) },
      });
      notes.push(`Bing: ${rows.length}`);
    } catch {
      notes.push("Bing yanıt vermedi.");
    }
  } else {
    notes.push("Bing anahtarı yok.");
  }

  const yandex = integrations?.yandex;
  if (yandex?.enabled && yandex.token && yandex.counterId) {
    try {
      const rows = await fetchYandexOrganicLandings(yandex.token, yandex.counterId);
      await pluginActions.run("intel.import", {
        siteId,
        userId: "cron",
        input: { live: true, source: "yandex", rows: rows.map((row) => ({ keyword: row.path, impressions: row.visits })) },
      });
      notes.push(`Yandex: ${rows.length}`);
    } catch {
      notes.push("Yandex yanıt vermedi.");
    }
  } else {
    notes.push("Yandex anahtarı yok.");
  }

  const recheck = await pluginActions.run("source.recheck", { siteId, userId: "cron", input: {} });
  const changed = recheck.ok && recheck.data && typeof recheck.data === "object" && "changed" in recheck.data ? Number(recheck.data.changed) : 0;
  notes.push(recheck.ok ? `Kaynak denetimi: ${changed} değişti` : "Kaynak denetimi kapalı.");
  const purged = await getAgentRequestRepository(siteId).purgeOlderThan(180);
  return { notes, purged };
}
