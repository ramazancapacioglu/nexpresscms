import type { MediaAssetDto } from "./types";
import { eq, desc } from "drizzle-orm";
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
    focalPoint?: { x: number; y: number };
  }): Promise<MediaAssetDto> {
    const id = input.id ?? `med_${Date.now()}`;
    const now = new Date();
    const seoScore =
      (input.altText.trim().length >= 10 ? 60 : 20) +
      (input.titleText?.trim() ? 20 : 0) +
      (input.caption?.trim() ? 20 : 0);

    const record = {
      id,
      siteId: this.siteId,
      filename: input.filename,
      url: input.url,
      mimeType: input.mimeType ?? "image/webp",
      width: input.width ?? 1200,
      height: input.height ?? 630,
      sizeBytes: input.sizeBytes ?? 68000,
      altText: input.altText,
      titleText: input.titleText ?? null,
      caption: input.caption ?? null,
      focalPoint: input.focalPoint ?? { x: 50, y: 50 },
      seoScore,
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
          focalPoint: record.focalPoint,
          seoScore: record.seoScore,
        },
      });
  
    return record;
  }
}
