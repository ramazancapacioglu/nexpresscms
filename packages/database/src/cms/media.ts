import type { MediaAssetDto } from "./types";
import { and, eq, desc } from "drizzle-orm";
import { kindOfMime, scoreMediaSeo } from "@nexpress/core";
import { CmsNavigationRepository } from "./navigation";

export class CmsMediaRepository extends CmsNavigationRepository {
  /**
   * Medya Kütüphanesi varlıklarını ve Görsel SEO verilerini listeler (`siteId` korumalı).
   */
  public async listMediaAssets(): Promise<MediaAssetDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.mediaAssets)
      .where(eq(t.mediaAssets.siteId, this.siteId))
      .orderBy(desc(t.mediaAssets.createdAt));
    return rows.map((r) => ({
      ...r,
      focalPoint: r.focalPoint ?? { x: 50, y: 50 },
    }));
  }

  /** Tek medya varlığı (kiracı korumalı); yoksa null. */
  public async findMediaAsset(id: string): Promise<MediaAssetDto | null> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.mediaAssets).where(and(eq(t.mediaAssets.siteId, this.siteId), eq(t.mediaAssets.id, id))).limit(1);
    return rows[0] ? { ...rows[0], focalPoint: rows[0].focalPoint ?? { x: 50, y: 50 } } : null;
  }

  /**
   * Medya varlığı ve Görsel SEO bilgilerini kaydeder/günceller (`siteId` korumalı).
   */
  public async saveMediaAsset(input: {
    id?: string;
    filename: string;
    url: string;
    mimeType?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
    altText: string;
    titleText?: string;
    caption?: string;
    description?: string;
    kind?: "image" | "document" | "video" | "audio";
    focalPoint?: { x: number; y: number };
    /** Verilmezse (undefined) var olan klasör korunur; `null` köke alır */
    folderId?: string | null;
  }): Promise<MediaAssetDto> {
    const id = input.id ?? `med_${Date.now()}`;
    const now = new Date();
    const mimeType = input.mimeType ?? "image/webp";
    const kind = input.kind ?? kindOfMime(mimeType);
    const seoScore = scoreMediaSeo({
      kind,
      filename: input.filename,
      altText: input.altText,
      titleText: input.titleText,
      caption: input.caption,
      description: input.description,
      width: input.width,
      height: input.height,
      sizeBytes: input.sizeBytes ?? 0,
      mimeType,
    }).score;

    const record = {
      id,
      siteId: this.siteId,
      filename: input.filename,
      url: input.url,
      mimeType,
      width: input.width ?? 1200,
      height: input.height ?? 630,
      sizeBytes: input.sizeBytes ?? 68000,
      altText: input.altText,
      titleText: input.titleText ?? null,
      caption: input.caption ?? null,
      description: input.description ?? null,
      kind,
      focalPoint: input.focalPoint ?? { x: 50, y: 50 },
      seoScore,
      folderId: input.folderId ?? null,
      createdAt: now,
    };

    const { db, t } = this.backend;
    await db
      .insert(t.mediaAssets)
      .values(record)
      .onConflictDoUpdate({
        target: t.mediaAssets.id,
        setWhere: eq(t.mediaAssets.siteId, this.siteId),
        set: {
          filename: record.filename,
          url: record.url,
          altText: record.altText,
          titleText: record.titleText,
          caption: record.caption,
          ...(input.description !== undefined ? { description: record.description } : {}),
          focalPoint: record.focalPoint,
          seoScore: record.seoScore,
          ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
        },
      });
  
    return record;
  }
}
