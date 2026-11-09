import "server-only";
import {
  auditCustomizerPerformance,
  inspectBlocks,
  weighContent,
  type ContentWeight,
  type CustomizerPerformanceAudit,
} from "@nexpress/core";
import {
  getMediaAdminRepository,
  getPerformanceRepository,
  getScopedRepository,
  type MediaPerformanceStats,
  type TableCount,
} from "@nexpress/database";
import perfBudget from "../../../perf-budget.json";

export interface ContentReport {
  published: number;
  averageSeo: number;
  missingMeta: number;
  missingAlt: number;
  clsRiskCount: number;
  lcpRiskCount: number;
  totalEstimatedHtmlKb: number;
  heavy: number;
  critical: number;
  heaviest: ContentWeight[];
}

export interface DatabaseReport {
  tables: TableCount[];
  bloat: TableCount[];
  bytes: number | null;
  trashedCount: number;
}

export interface MediaReport extends MediaPerformanceStats {
  unusedCount: number;
}

export interface BudgetReport {
  publicFirstLoadGzipKb: number;
  publicOwnGzipKb: number;
  customizer: CustomizerPerformanceAudit;
}

/** Yayındaki sayfa ve yazıların ağırlığı ve Core Web Vitals (CLS/LCP/DOM) sinyalleri. Şablonlar listeye girmez. */
export async function contentReport(siteId: string, locale: string): Promise<ContentReport> {
  const rows = await getScopedRepository(siteId).listContents({ locale, status: "published" });
  const weighed = rows.map((row) => {
    const blocks = inspectBlocks(row.blocks);
    return weighContent({
      id: row.contentId,
      title: row.title,
      slug: row.slug,
      type: row.type,
      markdownChars: row.markdownCache.length,
      blockCount: blocks.blockCount,
      imageCount: blocks.imageCount,
      imagesMissingAlt: blocks.imagesMissingAlt,
      imagesMissingDimensions: blocks.imagesMissingDimensions,
      embedCount: blocks.embedCount,
      maxDepth: blocks.maxDepth,
      firstFoldHeavy: blocks.firstFoldHeavy,
      missingMeta: !row.metaDescription?.trim(),
      seoScore: row.seoScore,
    });
  });
  const rank = { critical: 0, heavy: 1, light: 2 };
  const heaviest = weighed
    .filter((row) => row.band !== "light" || row.notes.length > 0)
    .sort((a, b) => rank[a.band] - rank[b.band] || b.estimatedHtmlKb - a.estimatedHtmlKb || b.markdownChars - a.markdownChars)
    .slice(0, 12);
  const seo = weighed.reduce((sum, row) => sum + row.seoScore, 0);
  const totalEstimatedHtmlKb = Number(
    weighed.reduce((sum, row) => sum + row.estimatedHtmlKb, 0).toFixed(1)
  );
  return {
    published: weighed.length,
    averageSeo: weighed.length ? Math.round(seo / weighed.length) : 0,
    missingMeta: weighed.filter((row) => row.missingMeta).length,
    missingAlt: weighed.reduce((sum, row) => sum + row.imagesMissingAlt, 0),
    clsRiskCount: weighed.filter((row) => (row.imagesMissingDimensions ?? 0) > 0).length,
    lcpRiskCount: weighed.filter((row) => row.firstFoldHeavy).length,
    totalEstimatedHtmlKb,
    heavy: weighed.filter((row) => row.band === "heavy").length,
    critical: weighed.filter((row) => row.band === "critical").length,
    heaviest,
  };
}

export async function databaseReport(siteId: string): Promise<DatabaseReport> {
  const repo = getPerformanceRepository(siteId);
  const scoped = getScopedRepository(siteId);
  const [tables, bloat, bytes, trashed] = await Promise.all([
    repo.tableCounts(),
    repo.bloatCounts(),
    repo.databaseBytes(),
    scoped.listTrashed(),
  ]);
  return { tables, bloat, bytes, trashedCount: trashed.length };
}

export async function mediaPerformanceReport(siteId: string): Promise<MediaReport> {
  const [stats, unusedIds] = await Promise.all([
    getPerformanceRepository(siteId).mediaStats(),
    getMediaAdminRepository(siteId).findUnusedIds(),
  ]);
  return {
    ...stats,
    unusedCount: unusedIds.length,
  };
}

export async function budgetPerformanceReport(siteId: string): Promise<BudgetReport> {
  const site = await getScopedRepository(siteId).getSite();
  const customizer = auditCustomizerPerformance(site?.settings?.customizer ?? {});
  return {
    publicFirstLoadGzipKb: perfBudget.publicFirstLoadGzipKb,
    publicOwnGzipKb: perfBudget.publicOwnGzipKb,
    customizer,
  };
}
