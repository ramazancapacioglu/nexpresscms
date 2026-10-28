import { and, eq, or, sql } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export interface MediaUsageDto {
  contentId: string;
  locale: string;
  slug: string;
  title: string;
}

/** LIKE joker karakterlerini (`%`, `_`) ve kaçış karakterini kaçışlar (ESCAPE '!'). */
export const likeEscape = (value: string) => value.replace(/[!%_]/g, (c) => `!${c}`);

export class MediaAdminRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /**
   * Görselin geçtiği içerikler: blok ağacı, öne çıkan görsel ve yayın öznitelikleri taranır.
   * Başvuru biçimi `/media/{id}?…` olduğundan `/media/{id}` önekiyle eşleşir.
   */
  public async findUsage(mediaId: string): Promise<MediaUsageDto[]> {
    const pattern = `%/media/${likeEscape(mediaId)}%`;
    const { db, t } = this.backend;
    return db
      .selectDistinct({
        contentId: t.contents.id,
        locale: t.contentTranslations.locale,
        slug: t.contentTranslations.slug,
        title: t.contentTranslations.title,
      })
      .from(t.contents)
      .innerJoin(
        t.contentTranslations,
        and(eq(t.contentTranslations.contentId, t.contents.id), eq(t.contentTranslations.siteId, this.siteId))
      )
      .where(
        and(
          eq(t.contents.siteId, this.siteId),
          or(
            sql`CAST(${t.contentTranslations.blocks} AS TEXT) LIKE ${pattern} ESCAPE '!'`,
            sql`${t.contents.featuredImage} LIKE ${pattern} ESCAPE '!'`,
            sql`CAST(${t.contents.schemaAttributes} AS TEXT) LIKE ${pattern} ESCAPE '!'`
          )
        )
      );
  }

  /** Kaydı siler; dosyaları silmek çağıranın işidir. Silindiyse `true`. */
  public async deleteAsset(mediaId: string): Promise<boolean> {
    const { db, t } = this.backend;
    const res = await db
      .delete(t.mediaAssets)
      .where(and(eq(t.mediaAssets.siteId, this.siteId), eq(t.mediaAssets.id, mediaId)))
      .returning({ id: t.mediaAssets.id });
    return res.length > 0;
  }
}

export function getMediaAdminRepository(siteIdOverride?: string): MediaAdminRepository {
  return new MediaAdminRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
