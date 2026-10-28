import type { ContentWithTranslationDto, EntityLinkDto } from "./types";
import { eq, and, desc } from "drizzle-orm";
import { resolvePublishing, type ContentStatus, type ContentType } from "@nexpress/core";
import { CmsTaxonomyRepository } from "./taxonomy";

export class CmsContentReadRepository extends CmsTaxonomyRepository {
  /**
   * Sitenin tüm içeriklerini çevirileriyle birlikte listeler (`siteId` korumalı).
   */
  public async listContents(options?: {
    locale?: string;
    type?: ContentType;
    status?: ContentStatus;
  }): Promise<ContentWithTranslationDto[]> {
    const locale = options?.locale ?? "tr";

    const { db, t } = this.backend;
    const rows = await db
      .select({
        content: t.contents,
        translation: t.contentTranslations,
      })
      .from(t.contents)
      .innerJoin(
        t.contentTranslations,
        and(
          eq(t.contentTranslations.contentId, t.contents.id),
          eq(t.contentTranslations.siteId, this.siteId),
          eq(t.contentTranslations.locale, locale)
        )
      )
      .where(
        and(
          eq(t.contents.siteId, this.siteId),
          options?.type ? eq(t.contents.type, options.type) : undefined,
          // Ziyaretçi görünürlüğü: içerik VE çeviri yayında olmalı
          options?.status === "published" ? eq(t.contents.status, "published") : undefined,
          options?.status === "published" ? eq(t.contentTranslations.translationStatus, "published") : undefined
        )
      )
      .orderBy(desc(t.contents.importanceScore), desc(t.contents.updatedAt));

    const mapped = rows.map(({ content, translation }) => ({
      id: content.id,
      contentId: content.id,
      siteId: content.siteId,
      type: content.type,
      status: (translation.translationStatus === "draft" ? "draft" : content.status) as ContentStatus,
      importanceScore: content.importanceScore,
      schemaType: content.schemaType,
      schemaAttributes: content.schemaAttributes ?? {},
      featuredImage: content.featuredImage ?? null,
      authorName: content.authorName,
      publishedAt: content.publishedAt ?? null,
      createdAt: content.createdAt,
      translationId: translation.id,
      translationStatus: translation.translationStatus,
      sourceLocale: translation.sourceLocale ?? null,
      sourceHash: translation.sourceHash ?? null,
      locale: translation.locale,
      region: translation.region,
      slug: translation.slug,
      title: translation.title,
      excerpt: translation.excerpt,
      tldr: translation.tldr,
      blocks: translation.blocks,
      markdownCache: translation.markdownCache,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      canonicalUrl: translation.canonicalUrl ?? null,
      noIndex: Boolean(translation.noIndex),
      seoScore: translation.seoScore,
      gapFindings: translation.gapFindings,
      updatedAt: translation.updatedAt,
    }));
    // Yayın dışı filtreler etkin durum üzerinden (çeviri taslağı içerik durumunu ezer)
    return options?.status && options.status !== "published" ? mapped.filter((c) => c.status === options.status) : mapped;
  }

  /**
   * `publicOnly`: ziyaretçiye açılabilecek içerikler. Taslak, zamanlanmış ve arşivlenmiş içerik ile
   * `private` görünürlüklü içerik ziyaretçiye hiçbir zaman verilmez (yayında olsa bile).
   * `restricted` durum, sayfada kısıtlı bildirimiyle gösterilir.
   */
  private async visibleContents(locale: string, publicOnly?: boolean): Promise<ContentWithTranslationDto[]> {
    const all = await this.listContents({ locale });
    if (!publicOnly) return all;
    return all.filter(
      (c) => (c.status === "published" || c.status === "restricted") && resolvePublishing(c.schemaAttributes).visibility !== "private"
    );
  }

  /**
   * Tekil bir içeriği `slug` ve `locale` üzerinden getirir (Ön yüz 100/100 RSC ve `?format=md` için).
   */
  public async getContentBySlug(
    slug: string,
    locale = "tr",
    options?: { publicOnly?: boolean }
  ): Promise<ContentWithTranslationDto | null> {
    const all = await this.visibleContents(locale, options?.publicOnly);
    return all.find((item) => item.slug === slug) ?? null;
  }

  /**
   * Tekil içeriği kimliğiyle (`contentId`) getirir.
   */
  public async getContentById(
    contentId: string,
    locale = "tr"
  ): Promise<ContentWithTranslationDto | null> {
    const all = await this.listContents({ locale });
    return all.find((item) => item.id === contentId) ?? null;
  }

  /**
   * SEO Motoru — Otomatik 301: Geçerli slug yoksa `slugHistory` içinde eski adresi arar.
   * Dönen `isRedirect=true` ise çağıran taraf güncel slug'a kalıcı yönlendirme yapmalıdır.
   */
  public async resolveContentBySlug(
    slug: string,
    locale = "tr",
    options?: { publicOnly?: boolean }
  ): Promise<{ content: ContentWithTranslationDto; isRedirect: boolean } | null> {
    const all = await this.visibleContents(locale, options?.publicOnly);
    const direct = all.find((item) => item.slug === slug);
    if (direct) return { content: direct, isRedirect: false };
    const old = all.find((item) => resolvePublishing(item.schemaAttributes).slugHistory.includes(slug));
    return old ? { content: old, isRedirect: true } : null;
  }

  /**
   * Bir içeriğin tüm dil/bölge çevirilerini getirir (Karşılıklı Hreflang matrisi için).
   */
  public async getTranslationsForContent(
    contentId: string
  ): Promise<Array<{ locale: string; region: string; slug: string; title: string; translationStatus: string; sourceLocale: string | null; sourceHash: string | null; updatedAt: Date }>> {
    const { db, t } = this.backend;
    return db
      .select({
        locale: t.contentTranslations.locale,
        region: t.contentTranslations.region,
        slug: t.contentTranslations.slug,
        title: t.contentTranslations.title,
        translationStatus: t.contentTranslations.translationStatus,
        sourceLocale: t.contentTranslations.sourceLocale,
        sourceHash: t.contentTranslations.sourceHash,
        updatedAt: t.contentTranslations.updatedAt,
      })
      .from(t.contentTranslations)
      .where(
        and(
          eq(t.contentTranslations.siteId, this.siteId),
          eq(t.contentTranslations.contentId, contentId)
        )
      );
  }

  /**
   * Makale <-> Ürün <-> Kampanya arasındaki @id Knowledge Graph bağlantılarını getirir.
   */
  public async listEntityLinks(): Promise<EntityLinkDto[]> {
    const { db, t } = this.backend;
    return db
      .select()
      .from(t.contentEntityLinks)
      .where(eq(t.contentEntityLinks.siteId, this.siteId));
  }
}
