import type { TaxonomyDto } from "./types";
import { eq, and } from "drizzle-orm";
import { CmsCommentsRepository } from "./comments";

export class CmsTaxonomyRepository extends CmsCommentsRepository {
  /**
   * Kategori ve Etiketleri (`taxonomies`) listeler (`siteId` korumalı).
   */
  public async listTaxonomies(taxonomyType?: string): Promise<TaxonomyDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.taxonomies)
      .where(
        and(
          eq(t.taxonomies.siteId, this.siteId),
          taxonomyType ? eq(t.taxonomies.taxonomyType, taxonomyType) : undefined
        )
      );
    return rows.map((r) => ({
      ...r,
      imageUrl: r.imageUrl ?? null,
      sortOrder: r.sortOrder ?? 0,
    }));
  }

  /**
   * Yeni Kategori veya Etiket kaydeder / günceller (`siteId` korumalı, Ağaç Yapısı & Görsel destekli).
   */
  public async saveTaxonomy(input: {
    id?: string;
    taxonomyType: string;
    slug: string;
    name: string;
    description?: string;
    parentId?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
    color?: string;
    seoTitle?: string;
    seoDescription?: string;
    /** undefined: mevcut atama korunur; null: şablonu kaldırır */
    templateId?: string | null;
  }): Promise<TaxonomyDto> {
    const id = input.id && input.id.trim() ? input.id.trim() : `tax_${input.taxonomyType}_${Date.now()}`;
    const now = new Date();
    // Döngüsel parent koruması (kendisini parent yapamaz)
    const cleanParentId =
      input.parentId && input.parentId.trim() && input.parentId.trim() !== id
        ? input.parentId.trim()
        : null;

    const record: TaxonomyDto = {
      id,
      siteId: this.siteId,
      taxonomyType: input.taxonomyType,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      parentId: cleanParentId,
      imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
      sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
      color: input.color ?? "#2563eb",
      seoTitle: input.seoTitle ?? input.name,
      seoDescription: input.seoDescription ?? input.description ?? null,
      templateId: input.templateId ?? null,
      itemCount: 1,
      createdAt: now,
    };

    const { db, t } = this.backend;
    await db
      .insert(t.taxonomies)
      .values(record)
      .onConflictDoUpdate({
        target: t.taxonomies.id,
        setWhere: eq(t.taxonomies.siteId, this.siteId),
        set: {
          slug: record.slug,
          name: record.name,
          description: record.description,
          parentId: record.parentId,
          imageUrl: record.imageUrl,
          sortOrder: record.sortOrder,
          color: record.color,
          seoTitle: record.seoTitle,
          seoDescription: record.seoDescription,
          ...(input.templateId !== undefined ? { templateId: record.templateId } : {}),
        },
      });
  
    return record;
  }

  /**
   * Kategori veya Etiketi siler; silinen kategorinin alt kategorilerini bir üst seviyeye (`existing.parentId ?? null`) taşır (`siteId` korumalı).
   */
  public async deleteTaxonomy(taxonomyId: string): Promise<{ deletedId: string }> {
    const all = await this.listTaxonomies();
    const target = all.find((t) => t.id === taxonomyId);
    const nextParentId = target?.parentId ?? null;

    const { db, t } = this.backend;
    await db
      .update(t.taxonomies)
      .set({ parentId: nextParentId })
      .where(
        and(
          eq(t.taxonomies.siteId, this.siteId),
          eq(t.taxonomies.parentId, taxonomyId)
        )
      );
    await db
      .delete(t.taxonomies)
      .where(
        and(
          eq(t.taxonomies.siteId, this.siteId),
          eq(t.taxonomies.id, taxonomyId)
        )
      );
  

    return { deletedId: taxonomyId };
  }
}
