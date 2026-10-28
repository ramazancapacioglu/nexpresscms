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

  /**
   * Hiçbir yerde başvurulmayan görsellerin kimlikleri: içerik blokları, öne çıkan görsel, yayın öznitelikleri,
   * taksonomi görselleri, menü/yerleşim ve site ayarları taranır (`/media/{id}` başvuruları).
   * Not: bu tarama dışında kullanılan (ör. kodla gömülü) görseller "kullanılmıyor" görünebilir; silmeden önce kullanım denetimi yine yapılır.
   */
  public async findUnusedIds(): Promise<string[]> {
    const { db, t } = this.backend;
    const s = this.siteId;
    const [assets, trans, contents, taxes, navs, sites] = await Promise.all([
      db.select({ id: t.mediaAssets.id }).from(t.mediaAssets).where(eq(t.mediaAssets.siteId, s)),
      db.select({ blocks: t.contentTranslations.blocks }).from(t.contentTranslations).where(eq(t.contentTranslations.siteId, s)),
      db.select({ f: t.contents.featuredImage, a: t.contents.schemaAttributes }).from(t.contents).where(eq(t.contents.siteId, s)),
      db.select({ i: t.taxonomies.imageUrl }).from(t.taxonomies).where(eq(t.taxonomies.siteId, s)),
      db.select().from(t.navigationLayouts).where(eq(t.navigationLayouts.siteId, s)),
      db.select({ settings: t.sites.settings, tokens: t.sites.designTokens, profile: t.sites.siteProfile }).from(t.sites).where(eq(t.sites.siteId, s)),
    ]);
    const haystack = JSON.stringify([trans, contents, taxes, navs, sites]);
    const used = new Set<string>();
    for (const m of haystack.matchAll(/\/media\/(med_[A-Za-z0-9_-]+)/g)) used.add(m[1]!);
    return assets.map((a) => a.id).filter((id) => !used.has(id));
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
