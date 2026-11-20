"use server";

import { groupNotFoundPaths, resolveSiteSettings, sanitizeCrawlHygiene, type CrawlHygiene } from "@nexpress/core";
import { getRedirectRepository, getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";

export interface CrawlHygieneView {
  hygiene: CrawlHygiene;
  groups: Array<{ pattern: string; hits: number; paths: number; sample: string; covered: boolean }>;
  total404: number;
}

/** Kayıtlı kurallar ve bulunamayan adres günlüğünün yol kalıbına göre özeti (spam kalıplarını görmek için). */
export async function loadCrawlHygieneAction(): Promise<CrawlHygieneView> {
  const admin = await requireAdmin("seo.crawlHygiene.view");
  const site = await getScopedRepository(admin.siteId).getSite();
  const hygiene = resolveSiteSettings(site?.settings).seo.crawlHygiene ?? sanitizeCrawlHygiene(undefined);
  const rows = await getRedirectRepository(admin.siteId).listNotFound(1000);
  const groups = groupNotFoundPaths(rows.map((r) => ({ path: r.path, hits: r.hits }))).slice(0, 25).map((g) => ({ ...g, covered: hygiene.goneRules.includes(g.pattern) }));
  return { hygiene, groups, total404: rows.reduce((a, r) => a + r.hits, 0) };
}

/** Kuralları kaydeder (girdi temizlenir). Ara katman değişikliği en geç 15 saniyede görür. */
export async function saveCrawlHygieneAction(input: { goneRules: string; goneParams: string; noindexUnknownParams: boolean }): Promise<{ ok: true; hygiene: CrawlHygiene } | { ok: false; error: string }> {
  const admin = await requireAdmin("seo.crawlHygiene.save");
  const hygiene = sanitizeCrawlHygiene(input);
  const asked = new Set(String(input.goneRules ?? "").split(/[\n,]/).map((s) => s.trim().replace(/\/{2,}/g, "/")).filter(Boolean));
  if (asked.size > hygiene.goneRules.length) return { ok: false, error: "Bazı satırlar geçersiz ya da sınır (100) aşıldı: kural / ile başlamalı, yalnızca harf, rakam ve / _ - . * karakterleri olabilir; tek başına / ya da /* yazılamaz." };
  const repo = getScopedRepository(admin.siteId);
  const current = resolveSiteSettings((await repo.getSite())?.settings).seo;
  await repo.saveSiteSettings({ seo: { ...current, crawlHygiene: hygiene } });
  await recordAudit({ id: admin.sub, email: admin.email }, "seo.crawlHygiene.saved", { target: "seo", detail: `${hygiene.goneRules.length} yol kuralı, ${hygiene.goneParams.length} parametre` });
  await revalidatePath("/admin/seo/integrations");
  return { ok: true, hygiene };
}
