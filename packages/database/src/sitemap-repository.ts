import { and, eq } from "drizzle-orm";
import { getCmsContext, resolvePublishing, type ContentType, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

/** Site haritası için gereken en az alan; bloklar ve Markdown okunmaz. */
export interface SitemapEntryDto {
  contentId: string;
  type: ContentType;
  locale: string;
  region: string;
  slug: string;
  updatedAt: Date;
}

interface RawEntry extends SitemapEntryDto {
  noIndex: boolean;
  schemaAttributes: Record<string, unknown> | null;
}

export class SitemapRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /** Yayınlanmış, indekslenebilir ve herkese açık tüm çeviriler (tüm diller). */
  public async listEntries(): Promise<SitemapEntryDto[]> {
    const raw = await this.readRaw();
    return raw
      .filter((r) => !r.noIndex && resolvePublishing(r.schemaAttributes).visibility === "public")
      .map(({ noIndex: _n, schemaAttributes: _s, ...entry }) => entry);
  }

  private async readRaw(): Promise<RawEntry[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select({
        contentId: t.contents.id,
        type: t.contents.type,
        schemaAttributes: t.contents.schemaAttributes,
        locale: t.contentTranslations.locale,
        region: t.contentTranslations.region,
        slug: t.contentTranslations.slug,
        noIndex: t.contentTranslations.noIndex,
        updatedAt: t.contentTranslations.updatedAt,
      })
      .from(t.contents)
      .innerJoin(
        t.contentTranslations,
        and(
          eq(t.contentTranslations.contentId, t.contents.id),
          eq(t.contentTranslations.siteId, this.siteId)
        )
      )
      .where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.status, "published"), eq(t.contentTranslations.translationStatus, "published")));
    return rows.map((r) => ({ ...r, noIndex: Boolean(r.noIndex) }));
  }
}

export function getSitemapRepository(siteIdOverride?: string): SitemapRepository {
  return new SitemapRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
