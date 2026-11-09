"use server";

import { redirect } from "next/navigation";
import { getPerformanceRepository, getScopedRepository } from "@nexpress/database";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, setCacheTtlSeconds } from "@/lib/cache";
import { assertPlugin } from "@/lib/plugin-gate";
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
