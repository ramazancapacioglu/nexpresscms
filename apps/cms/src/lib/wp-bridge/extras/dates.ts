import "server-only";
import { getScopedRepository } from "@nexpress/database";
import { wpAll, type WpSession } from "./session";

interface WpModified {
  id: number;
  modified_gmt?: string;
}

/**
 * Güncelleme tarihi: sonraki adımlar içeriği yeniden yazdığında `updatedAt` yazma gününe kayar (makale künyesi ve şemadaki
 * `dateModified` yanlış olur). Bu adım kaynaktaki `modified_gmt` değerini geri yazar; bu yüzden diğer adımlardan SONRA çalışmalıdır.
 */
export async function restoreModifiedDates(session: WpSession, siteId: string): Promise<{ restored: number }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const modified = new Map<string, Date>();
  for (const rest of ["pages", "posts", "ai_prompt"]) {
    for (const row of await wpAll<WpModified>(session, `${rest}?status=publish,draft,pending,future&context=edit&_fields=id,modified_gmt`, 100)) {
      if (row.modified_gmt) modified.set(`cnt_wp_${row.id}`, new Date(`${row.modified_gmt}Z`));
    }
  }
  let restored = 0;
  for (const row of await repo.listContents({ locale })) {
    const at = modified.get(row.id);
    if (!at || Number.isNaN(at.getTime())) continue;
    if (Math.abs(new Date(row.updatedAt).getTime() - at.getTime()) < 60_000) continue;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      updatedAt: at,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: row.schemaAttributes,
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: row.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    restored += 1;
  }
  return { restored };
}
