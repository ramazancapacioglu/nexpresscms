import type { ContentSummaryDto, ContentWithTranslationDto, EntityLinkDto } from "./types";
import { eq, and, desc, ne, or, sql } from "drizzle-orm";
import { mergeLocalizedAttributes, resolvePublishing, type ContentStatus, type ContentType } from "@nexpress/core";
import { CmsTaxonomyRepository } from "./taxonomy";

export class CmsContentReadRepository extends CmsTaxonomyRepository {
  private mapContentRow(
    content: any,
    translation: any
  ): ContentWithTranslationDto {
    return {
      id: content.id,
      contentId: content.id,
      siteId: content.siteId,
      type: content.type,
      status: (content.status === "trashed" ? "trashed" : translation.translationStatus === "draft" ? "draft" : content.status) as ContentStatus,
      importanceScore: content.importanceScore,
      schemaType: content.schemaType,
      schemaAttributes: mergeLocalizedAttributes(content.schemaAttributes ?? {}, translation.attributes),
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
    };
  }

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
          // Şablonlar (tema oluşturucu) yalnızca açıkça istenince listelenir: hiçbir içerik/yayın yüzeyine sızmaz
          options?.type ? eq(t.contents.type, options.type) : ne(t.contents.type, "template"),
          // Ziyaretçi görünürlüğü: içerik VE çeviri yayında olmalı
          options?.status === "published" ? eq(t.contents.status, "published") : undefined,
          options?.status === "published" ? eq(t.contentTranslations.translationStatus, "published") : undefined
        )
      )
      .orderBy(desc(t.contents.importanceScore), desc(t.contents.updatedAt));

    const mapped = rows.map(({ content, translation }) => this.mapContentRow(content, translation));
    // Yayın dışı filtreler etkin durum üzerinden (çeviri taslağı içerik durumunu ezer)
    // Çöpteki içerik yalnızca açıkça istenince listelenir; hiçbir varsayılan listede görünmez
    if (options?.status === "trashed") return mapped.filter((c) => c.status === "trashed");
    const live = mapped.filter((c) => c.status !== "trashed");
    return options?.status && options.status !== "published" ? live.filter((c) => c.status === options.status) : live;
  }

  /**
   * Gövdesiz (`blocks`, `markdownCache`, `gapFindings` çekilmeden) içerik özeti listesi.
   * İlgili içerik, önceki/sonraki, üst/alt sayfa ilişkileri ve kenar çubuğu akışları için düşük bellekli/hızlı sorgu.
   */
  public async listContentSummaries(options?: {
    locale?: string;
    type?: ContentType;
    status?: ContentStatus;
  }): Promise<ContentSummaryDto[]> {
    const locale = options?.locale ?? "tr";
    const { db, t } = this.backend;
    const rows = await db
      .select({
        id: t.contents.id,
        siteId: t.contents.siteId,
        type: t.contents.type,
        status: t.contents.status,
        importanceScore: t.contents.importanceScore,
        schemaType: t.contents.schemaType,
        schemaAttributes: t.contents.schemaAttributes,
        featuredImage: t.contents.featuredImage,
        authorName: t.contents.authorName,
        publishedAt: t.contents.publishedAt,
        createdAt: t.contents.createdAt,
        translationId: t.contentTranslations.id,
        translationStatus: t.contentTranslations.translationStatus,
        sourceLocale: t.contentTranslations.sourceLocale,
        sourceHash: t.contentTranslations.sourceHash,
        locale: t.contentTranslations.locale,
        region: t.contentTranslations.region,
        slug: t.contentTranslations.slug,
        title: t.contentTranslations.title,
        excerpt: t.contentTranslations.excerpt,
        tldr: t.contentTranslations.tldr,
        metaTitle: t.contentTranslations.metaTitle,
        metaDescription: t.contentTranslations.metaDescription,
        canonicalUrl: t.contentTranslations.canonicalUrl,
        noIndex: t.contentTranslations.noIndex,
        seoScore: t.contentTranslations.seoScore,
        updatedAt: t.contentTranslations.updatedAt,
        translationAttributes: t.contentTranslations.attributes,
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
          options?.type ? eq(t.contents.type, options.type) : ne(t.contents.type, "template"),
          options?.status === "published" ? eq(t.contents.status, "published") : undefined,
          options?.status === "published" ? eq(t.contentTranslations.translationStatus, "published") : undefined
        )
      )
      .orderBy(desc(t.contents.importanceScore), desc(t.contents.updatedAt));

    const mapped: ContentSummaryDto[] = rows.map((row) => ({
      id: row.id,
      contentId: row.id,
      siteId: row.siteId,
      type: row.type as ContentType,
      status: (row.status === "trashed" ? "trashed" : row.translationStatus === "draft" ? "draft" : row.status) as ContentStatus,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: mergeLocalizedAttributes((row.schemaAttributes ?? {}) as Record<string, unknown>, row.translationAttributes as Record<string, unknown> | null | undefined),
      featuredImage: row.featuredImage ?? null,
      authorName: row.authorName,
      publishedAt: row.publishedAt ?? null,
      createdAt: row.createdAt,
      translationId: row.translationId,
      translationStatus: row.translationStatus,
      sourceLocale: row.sourceLocale ?? null,
      sourceHash: row.sourceHash ?? null,
      locale: row.locale,
      region: row.region,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? null,
      tldr: row.tldr ?? null,
      metaTitle: row.metaTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      canonicalUrl: row.canonicalUrl ?? null,
      noIndex: Boolean(row.noIndex),
      seoScore: row.seoScore,
      updatedAt: row.updatedAt,
    }));

    if (options?.status === "trashed") return mapped.filter((c) => c.status === "trashed");
    const live = mapped.filter((c) => c.status !== "trashed");
    return options?.status && options.status !== "published" ? live.filter((c) => c.status === options.status) : live;
  }

  /**
   * RAG hibrit anahtar kelime araması (BM25) için dar sütunlu sorgu: `blocks` JSON AST çekilmez,
   * yalnızca yayında, dizine açık ve herkese açık kayıtların başlık + `markdownCache` alanları döner.
   */
  public async listKeywordDocs(options?: {
    locale?: string;
    types?: ContentType[];
  }): Promise<Array<{ contentId: string; title: string; slug: string; type: ContentType; tldr: string | null; markdownCache: string }>> {
    const locale = options?.locale ?? "tr";
    const { db, t } = this.backend;
    const rows = await db
      .select({
        contentId: t.contents.id,
        type: t.contents.type,
        schemaAttributes: t.contents.schemaAttributes,
        translationAttributes: t.contentTranslations.attributes,
        title: t.contentTranslations.title,
        slug: t.contentTranslations.slug,
        tldr: t.contentTranslations.tldr,
        markdownCache: t.contentTranslations.markdownCache,
        noIndex: t.contentTranslations.noIndex,
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
          ne(t.contents.type, "template"),
          eq(t.contents.status, "published"),
          eq(t.contentTranslations.translationStatus, "published")
        )
      );

    return rows
      .filter((r) => {
        if (Boolean(r.noIndex)) return false;
        if (options?.types?.length && !options.types.includes(r.type as ContentType)) return false;
        const merged = mergeLocalizedAttributes(
          (r.schemaAttributes ?? {}) as Record<string, unknown>,
          r.translationAttributes as Record<string, unknown> | null | undefined
        );
        return resolvePublishing(merged).visibility === "public";
      })
      .map((r) => ({
        contentId: r.contentId,
        title: r.title,
        slug: r.slug,
        type: r.type as ContentType,
        tldr: r.tldr ?? null,
        markdownCache: r.markdownCache ?? "",
      }));
  }

  /**
   * Ölçeklenebilir veritabanı tam metin ön-araması:
   * - PostgreSQL'de `to_tsvector('turkish', ...)` + `plainto_tsquery` ve `ILIKE` ile doğrudan DB motorunda daraltır.
   * - SQLite'ta `LIKE` ön-filtresiyle yalnızca eşleşen satırları (`LIMIT`) çeker; 5.000+ içerikte tüm tabloyu belleğe yüklemez.
   */
  public async searchKeywordDocs(
    query: string,
    options?: { locale?: string; types?: ContentType[]; limit?: number }
  ): Promise<Array<{ contentId: string; title: string; slug: string; type: ContentType; tldr: string | null; markdownCache: string }>> {
    const clean = query.trim().slice(0, 120);
    if (clean.length < 2) return [];
    const locale = options?.locale ?? "tr";
    const limit = Math.min(100, Math.max(8, options?.limit ?? 40));
    const { db, t } = this.backend;

    const terms = clean
      .split(/\s+/)
      .map((w) => w.replace(/[%_\\]/g, "").trim())
      .filter((w) => w.length >= 2)
      .slice(0, 6);
    if (terms.length === 0) return [];

    const matchCondition =
      this.dialect !== "sqlite"
        ? or(
            sql`to_tsvector('turkish', coalesce(${t.contentTranslations.title}, '') || ' ' || coalesce(${t.contentTranslations.tldr}, '') || ' ' || coalesce(${t.contentTranslations.markdownCache}, '')) @@ plainto_tsquery('turkish', ${clean})`,
            ...terms.map((term) => {
              const pat = `%${term}%`;
              return or(
                sql`${t.contentTranslations.title} ILIKE ${pat}`,
                sql`coalesce(${t.contentTranslations.tldr}, '') ILIKE ${pat}`,
                sql`coalesce(${t.contentTranslations.markdownCache}, '') ILIKE ${pat}`
              );
            })
          )
        : or(
            ...terms.map((term) => {
              const pat = `%${term.toLowerCase()}%`;
              return or(
                sql`lower(${t.contentTranslations.title}) LIKE ${pat}`,
                sql`lower(coalesce(${t.contentTranslations.tldr}, '')) LIKE ${pat}`,
                sql`lower(coalesce(${t.contentTranslations.markdownCache}, '')) LIKE ${pat}`
              );
            })
          );

    const rows = await db
      .select({
        contentId: t.contents.id,
        type: t.contents.type,
        schemaAttributes: t.contents.schemaAttributes,
        translationAttributes: t.contentTranslations.attributes,
        title: t.contentTranslations.title,
        slug: t.contentTranslations.slug,
        tldr: t.contentTranslations.tldr,
        markdownCache: t.contentTranslations.markdownCache,
        noIndex: t.contentTranslations.noIndex,
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
          ne(t.contents.type, "template"),
          eq(t.contents.status, "published"),
          eq(t.contentTranslations.translationStatus, "published"),
          matchCondition
        )
      )
      .limit(limit * 2);

    return rows
      .filter((r) => {
        if (Boolean(r.noIndex)) return false;
        if (options?.types?.length && !options.types.includes(r.type as ContentType)) return false;
        const merged = mergeLocalizedAttributes(
          (r.schemaAttributes ?? {}) as Record<string, unknown>,
          r.translationAttributes as Record<string, unknown> | null | undefined
        );
        return resolvePublishing(merged).visibility === "public";
      })
      .slice(0, limit)
      .map((r) => ({
        contentId: r.contentId,
        title: r.title,
        slug: r.slug,
        type: r.type as ContentType,
        tldr: r.tldr ?? null,
        markdownCache: r.markdownCache ?? "",
      }));
  }

  /**
   * `publicOnly`: ziyaretçiye açılabilecek içerikler. Taslak, zamanlanmış ve arşivlenmiş içerik ile
   * `private` görünürlüklü içerik ziyaretçiye hiçbir zaman verilmez (yayında olsa bile).
   * `restricted` durum, sayfada kısıtlı bildirimiyle gösterilir.
   */
  private isPubliclyVisible(c: ContentWithTranslationDto): boolean {
    return (c.status === "published" || c.status === "restricted") && resolvePublishing(c.schemaAttributes).visibility !== "private";
  }

  private async visibleContents(locale: string, publicOnly?: boolean): Promise<ContentWithTranslationDto[]> {
    const all = await this.listContents({ locale });
    if (!publicOnly) return all;
    return all.filter((c) => this.isPubliclyVisible(c));
  }

  /**
   * Tekil bir içeriği `siteId + locale + slug` indeksiyle doğrudan tek satırda getirir
   * (Ön yüz 100/100 RSC ve `?format=md` için tüm siteyi çekmeden).
   */
  public async getContentBySlug(
    slug: string,
    locale = "tr",
    options?: { publicOnly?: boolean; type?: string }
  ): Promise<ContentWithTranslationDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ content: t.contents, translation: t.contentTranslations })
      .from(t.contentTranslations)
      .innerJoin(
        t.contents,
        and(eq(t.contents.id, t.contentTranslations.contentId), eq(t.contents.siteId, this.siteId))
      )
      .where(
        and(
          eq(t.contentTranslations.siteId, this.siteId),
          eq(t.contentTranslations.locale, locale),
          eq(t.contentTranslations.slug, slug),
          options?.type ? eq(t.contents.type, options.type as ContentType) : ne(t.contents.type, "template")
        )
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const dto = this.mapContentRow(row.content, row.translation);
    if (dto.status === "trashed") return null;
    if (options?.publicOnly && !this.isPubliclyVisible(dto)) return null;
    return dto;
  }

  /**
   * Tekil içeriği kimliğiyle (`siteId + contentId + locale`) doğrudan tek satırda getirir.
   */
  public async getContentById(
    contentId: string,
    locale = "tr"
  ): Promise<ContentWithTranslationDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ content: t.contents, translation: t.contentTranslations })
      .from(t.contents)
      .innerJoin(
        t.contentTranslations,
        and(
          eq(t.contentTranslations.contentId, t.contents.id),
          eq(t.contentTranslations.siteId, this.siteId),
          eq(t.contentTranslations.locale, locale)
        )
      )
      .where(and(eq(t.contents.siteId, this.siteId), eq(t.contents.id, contentId), ne(t.contents.type, "template")))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const dto = this.mapContentRow(row.content, row.translation);
    return dto.status === "trashed" ? null : dto;
  }

  /**
   * SEO Motoru — Otomatik 301: Geçerli slug yoksa `slugHistory` içinde eski adresi arar.
   * Gövde (`blocks`/`markdownCache`) taşımadan yalnızca meta/özellik sütunlarını tarar;
   * eşleşirse tek satır `getContentById` ile tam içeriği getirir.
   */
  public async resolveContentBySlug(
    slug: string,
    locale = "tr",
    options?: { publicOnly?: boolean; type?: string }
  ): Promise<{ content: ContentWithTranslationDto; isRedirect: boolean } | null> {
    const direct = await this.getContentBySlug(slug, locale, options);
    if (direct) return { content: direct, isRedirect: false };

    const { db, t } = this.backend;
    const candidates = await db
      .select({
        id: t.contents.id,
        type: t.contents.type,
        status: t.contents.status,
        schemaAttributes: t.contents.schemaAttributes,
        translationStatus: t.contentTranslations.translationStatus,
        translationAttributes: t.contentTranslations.attributes,
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
          options?.type ? eq(t.contents.type, options.type as ContentType) : ne(t.contents.type, "template")
        )
      );

    for (const row of candidates) {
      const effectiveStatus = (row.status === "trashed" ? "trashed" : row.translationStatus === "draft" ? "draft" : row.status) as ContentStatus;
      if (effectiveStatus === "trashed") continue;
      const merged = mergeLocalizedAttributes(
        (row.schemaAttributes ?? {}) as Record<string, unknown>,
        row.translationAttributes as Record<string, unknown> | null | undefined
      );
      if (options?.publicOnly) {
        if ((effectiveStatus !== "published" && effectiveStatus !== "restricted") || resolvePublishing(merged).visibility === "private") {
          continue;
        }
      }
      if (resolvePublishing(merged).slugHistory.includes(slug)) {
        const full = await this.getContentById(row.id, locale);
        if (full && (!options?.publicOnly || this.isPubliclyVisible(full))) {
          return { content: full, isRedirect: true };
        }
      }
    }
    return null;
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
