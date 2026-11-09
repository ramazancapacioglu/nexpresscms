import "server-only";
import { inspectBlocks, weighContent, type ContentWeight } from "@nexpress/core";
import { getPerformanceRepository, getScopedRepository } from "@nexpress/database";

export interface ContentReport {
  published: number;
  averageSeo: number;
  missingMeta: number;
  missingAlt: number;
  heavy: number;
  critical: number;
  heaviest: ContentWeight[];
}

/** Yayındaki sayfa ve yazıların ağırlığı. Şablonlar listeye girmez. */
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
      missingMeta: !row.metaDescription?.trim(),
      seoScore: row.seoScore,
    });
  });
  const rank = { critical: 0, heavy: 1, light: 2 };
  const heaviest = weighed
    .filter((row) => row.band !== "light")
    .sort((a, b) => rank[a.band] - rank[b.band] || b.markdownChars - a.markdownChars)
    .slice(0, 12);
  const seo = weighed.reduce((sum, row) => sum + row.seoScore, 0);
  return {
    published: weighed.length,
    averageSeo: weighed.length ? Math.round(seo / weighed.length) : 0,
    missingMeta: weighed.filter((row) => row.missingMeta).length,
    missingAlt: weighed.reduce((sum, row) => sum + row.imagesMissingAlt, 0),
    heavy: weighed.filter((row) => row.band === "heavy").length,
    critical: weighed.filter((row) => row.band === "critical").length,
    heaviest,
  };
}

export async function databaseReport(siteId: string) {
  const repo = getPerformanceRepository(siteId);
  const [tables, bytes] = await Promise.all([repo.tableCounts(), repo.databaseBytes()]);
  return { tables, bytes };
}
