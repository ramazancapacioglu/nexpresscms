"use server";

import { redirect } from "next/navigation";
import { getPerformanceRepository, getScopedRepository } from "@nexpress/database";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, setCacheTtlSeconds } from "@/lib/cache";
import { assertPlugin } from "@/lib/plugin-gate";
import {
  getPublicMediaFocal,
  getPublicNavigation,
  getPublicSite,
  getPublicWidgetFeed,
  listPublicEntityLinks,
  listPublishedContents,
  listSitemapEntries,
} from "@/lib/public-data";
import { refreshCrux, saveCruxSettings } from "@/lib/perfornext/crux";
import { PERFORNEXT_PLUGIN_ID } from "@/plugins/perfornext";
import "@/plugins/register";

async function guard(audit: string) {
  const admin = await requireAdmin(audit);
  await assertPlugin(PERFORNEXT_PLUGIN_ID);
  return admin;
}

/** Ziyaretçi önbelleğini düşürür. */
export async function flushCacheAction() {
  const admin = await guard("perfornext.flush");
  await invalidateSite(admin.siteId);
  redirect("/admin/perfornext?done=cache");
}

/** Tüm desteklenen diller için ziyaretçi önbelleğini önceden ısıtır ve gecikmeyi kaydeder. */
export async function warmCacheAction() {
  const admin = await guard("perfornext.warm");
  const t0 = Date.now();
  const site = await getPublicSite(admin.siteId);
  const locales = site?.supportedLocales?.length ? site.supportedLocales : [site?.defaultLocale ?? "tr"];
  await Promise.all([
    getPublicMediaFocal(admin.siteId),
    listSitemapEntries(admin.siteId),
    listPublicEntityLinks(admin.siteId),
    ...locales.flatMap((locale) => [
      listPublishedContents(admin.siteId, locale),
      getPublicNavigation(admin.siteId, locale),
      getPublicWidgetFeed(admin.siteId, locale),
    ]),
  ]);
  const elapsedMs = Date.now() - t0;
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: { lastWarmAt: new Date().toISOString(), lastWarmMs: elapsedMs },
  });
  redirect("/admin/perfornext?done=warm");
}

/** Planlayıcı istatistiğini günceller ve zamanı eklenti ayarına yazar. */
export async function analyzeDatabaseAction() {
  const admin = await guard("perfornext.analyze");
  const result = await getPerformanceRepository(admin.siteId).analyze();
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: { lastAnalyzeAt: new Date().toISOString(), lastAnalyzeStatement: result.statement },
  });
  await invalidateSite(admin.siteId);
  redirect("/admin/perfornext?done=analyze");
}

/** Eski içerik revizyonlarını budar (içerik/dil başına en yeni N revizyonu korur). */
export async function pruneRevisionsAction(formData: FormData) {
  const admin = await guard("perfornext.prune_revisions");
  const keep = Math.max(1, Math.min(50, Math.round(Number(formData.get("keep") ?? 10) || 10)));
  const deleted = await getPerformanceRepository(admin.siteId).pruneRevisions(keep);
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: {
      keepRevisionsCount: keep,
      lastPruneRevisionsAt: new Date().toISOString(),
      lastPruneRevisionsDeleted: deleted,
    },
  });
  redirect("/admin/perfornext?done=revisions");
}

/** Birikmiş 404 izleyici kayıtlarını ve süresi dolmuş çöp kutusu öğelerini temizler. */
export async function clearLogsAndTrashAction() {
  const admin = await guard("perfornext.cleanup_logs");
  const [notFoundDeleted, trashPurged] = await Promise.all([
    getPerformanceRepository(admin.siteId).clearNotFoundLogs(),
    getScopedRepository(admin.siteId).purgeExpiredTrash(),
  ]);
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: {
      lastCleanupAt: new Date().toISOString(),
      lastCleanupNotFound: notFoundDeleted,
      lastCleanupTrash: trashPurged,
    },
  });
  await invalidateSite(admin.siteId);
  redirect("/admin/perfornext?done=cleanup");
}

/** Kiracının tüm çevirilerinde `markdownCache` sütununu blok AST'sinden yeniden derler. */
export async function recompileMarkdownAction() {
  const admin = await guard("perfornext.recompile_markdown");
  const updated = await getPerformanceRepository(admin.siteId).recompileMarkdownCache();
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: {
      lastRecompileAt: new Date().toISOString(),
      lastRecompileCount: updated,
    },
  });
  await invalidateSite(admin.siteId);
  redirect("/admin/perfornext?done=markdown");
}

/** Önbellek süresini kaydeder ve çalışan sürece uygular. */
export async function saveCacheTtlAction(formData: FormData) {
  const admin = await guard("perfornext.ttl");
  const ttl = setCacheTtlSeconds(Number(formData.get("ttl") ?? 120));
  await getScopedRepository(admin.siteId).saveSitePlugin(PERFORNEXT_PLUGIN_ID, {
    settings: { cacheTtlSeconds: ttl },
  });
  await invalidateSite(admin.siteId);
  redirect("/admin/perfornext?done=ttl");
}

const cruxDone = (message: string) => redirect(`/admin/perfornext?done=crux&m=${encodeURIComponent(message.slice(0, 200))}`);

/** CrUX API anahtarı ve (isteğe bağlı) ölçülecek site adresi. Anahtar şifreli saklanır, geri gösterilmez. */
export async function saveCruxSettingsAction(formData: FormData) {
  const admin = await guard("perfornext.crux_save");
  const res = await saveCruxSettings(admin.siteId, { apiKey: String(formData.get("apiKey") ?? ""), origin: String(formData.get("origin") ?? "") });
  cruxDone(res.message);
}

export async function clearCruxKeyAction() {
  const admin = await guard("perfornext.crux_clear");
  await saveCruxSettings(admin.siteId, { clearKey: true });
  cruxDone("CrUX API anahtarı silindi.");
}

/** Üç cihaz türü için gerçek kullanıcı ölçümünü Google'dan çeker (sunucu tarafı; ziyaretçiye betik eklenmez). */
export async function refreshCruxAction() {
  const admin = await guard("perfornext.crux_refresh");
  cruxDone((await refreshCrux(admin.siteId)).message);
}
