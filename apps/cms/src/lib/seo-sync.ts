import { pluginActions, resolveSiteSettings } from "@nexpress/core";
import { getAgentRequestRepository, getScopedRepository } from "@nexpress/database";
import { aggregateBingQueryStats, fetchBingQueryStats, fetchGscSearchQueries, fetchYandexOrganicLandings } from "@nexpress/seo-core";
import "@/plugins/register";

/** Eşitleme notlarında nedeni görünür kılar (anahtarlar ve uzun yanıtlar kırpılır). */
const reasonOf = (error: unknown): string => (error instanceof Error ? error.message.replace(/[A-Za-z0-9_-]{24,}/g, "…").slice(0, 160) : "yanıt vermedi.");

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
    } catch (error) {
      notes.push(`Search Console: ${reasonOf(error)}`);
    }
  } else {
    notes.push("Search Console anahtarı yok.");
  }

  const bing = integrations?.bing;
  if (bing?.enabled && bing.apiKey && bing.siteUrl) {
    try {
      const rows = aggregateBingQueryStats(await fetchBingQueryStats(bing.apiKey, bing.siteUrl));
      await pluginActions.run("intel.import", {
        siteId,
        userId: "cron",
        input: { live: true, source: "bing", rows: rows.map((row) => ({ keyword: row.query, clicks: row.clicks, impressions: row.impressions, position: row.position })) },
      });
      notes.push(`Bing: ${rows.length}`);
    } catch (error) {
      notes.push(`Bing: ${reasonOf(error)}`);
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
    } catch (error) {
      notes.push(`Yandex: ${reasonOf(error)}`);
    }
  } else {
    notes.push("Yandex anahtarı yok.");
  }

  const cluster = await pluginActions.run("intel.cluster", { siteId, userId: "cron", input: {} });
  if (cluster.ok) {
    const cCount = cluster.data && typeof cluster.data === "object" && "clusters" in cluster.data ? Number(cluster.data.clusters) : 0;
    notes.push(`Otomatik kümeleme: ${cCount} küme`);
  }

  const recheck = await pluginActions.run("source.recheck", { siteId, userId: "cron", input: {} });
  const changed = recheck.ok && recheck.data && typeof recheck.data === "object" && "changed" in recheck.data ? Number(recheck.data.changed) : 0;
  notes.push(recheck.ok ? `Kaynak denetimi: ${changed} değişti` : "Kaynak denetimi kapalı.");
  const purged = await getAgentRequestRepository(siteId).purgeOlderThan(180);
  return { notes, purged };
}
