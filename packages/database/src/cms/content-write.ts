import type { SaveContentInput } from "./types";
import { eq, and, inArray } from "drizzle-orm";
import { cmsHooks, compileBlocksToMarkdown, pickLocalizedAttributes, resolvePublishing, resolveSiteSettings, type ContentStatus } from "@nexpress/core";
import { analyzeSeo, extractContentStats } from "@nexpress/seo-core";
import { CmsRevisionRepository, type RevisionSnapshot } from "./revisions";

export class CmsContentWriteRepository extends CmsRevisionRepository {
  /**
   * İçerikleri (çeviri, yorum, varlık bağlantıları ve RAG parçalarıyla birlikte) kalıcı olarak siler.
   */
  public async deleteContents(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const { db, t } = this.backend;
    await db
      .delete(t.commentsReviews)
      .where(and(eq(t.commentsReviews.siteId, this.siteId), inArray(t.commentsReviews.contentId, ids)));
    await db
      .delete(t.contentRevisions)
      .where(and(eq(t.contentRevisions.siteId, this.siteId), inArray(t.contentRevisions.contentId, ids)));
    await db
      .delete(t.contentTranslations)
      .where(and(eq(t.contentTranslations.siteId, this.siteId), inArray(t.contentTranslations.contentId, ids)));
    await db
      .delete(t.contents)
      .where(and(eq(t.contents.siteId, this.siteId), inArray(t.contents.id, ids)));
    return ids.length;
  }

  /**
   * Hızlı Düzenleme & Toplu İşlemler için: mevcut içeriği okuyup yalnızca verilen alanları değiştirerek yeniden kaydeder
   * (SEO motoru, markdownCache ve slug geçmişi her zaman yeniden çalışır).
   */
  public async patchContent(
    contentId: string,
    patch: {
      title?: string;
      slug?: string;
      status?: ContentStatus;
      noIndex?: boolean;
      visibility?: "public" | "password" | "members_only" | "private";
      scheduledAt?: string;
      categories?: string[];
      addCategories?: string[];
      removeCategories?: string[];
      tags?: string[];
      addTags?: string[];
      removeTags?: string[];
      allowComments?: boolean;
      allowReviews?: boolean;
    },
    locale = "tr"
  ): Promise<boolean> {
    const existing = await this.getContentById(contentId, locale);
    if (!existing) return false;
    const pubRaw = (existing.schemaAttributes.publishing ?? {}) as Record<string, unknown>;
    const pub = resolvePublishing(existing.schemaAttributes);

    const uniq = (a: string[]) => Array.from(new Set(a));
    let categories = patch.categories ?? pub.categories;
    categories = uniq([...categories, ...(patch.addCategories ?? [])]).filter(
      (c) => !(patch.removeCategories ?? []).includes(c)
    );
    let tags = patch.tags ?? pub.tags;
    tags = uniq([...tags, ...(patch.addTags ?? [])]).filter((t) => !(patch.removeTags ?? []).includes(t));

    const schemaAttributes: Record<string, unknown> = {
      ...existing.schemaAttributes,
      publishing: {
        ...pubRaw,
        visibility: patch.visibility ?? pub.visibility,
        scheduledAt: patch.scheduledAt ?? pub.scheduledAt,
        categories,
        tags,
        allowComments: patch.allowComments ?? pub.allowComments,
        allowReviews: patch.allowReviews ?? pub.allowReviews,
      },
    };

    await this.saveContent({
      contentId,
      type: existing.type,
      status: patch.status ?? existing.status,
      importanceScore: existing.importanceScore,
      schemaType: existing.schemaType,
      schemaAttributes,
      featuredImage: existing.featuredImage,
      locale: existing.locale,
      region: existing.region,
      slug: patch.slug ?? existing.slug,
      title: patch.title ?? existing.title,
      excerpt: existing.excerpt ?? undefined,
      tldr: existing.tldr ?? undefined,
      blocks: existing.blocks,
      metaTitle: existing.metaTitle ?? undefined,
      metaDescription: existing.metaDescription ?? undefined,
      canonicalUrl: existing.canonicalUrl ?? undefined,
      noIndex: patch.noIndex ?? existing.noIndex,
    });
    return true;
  }

  /**
   * Bir içeriği (yeni kimlik ve `-kopya` slug'ıyla, taslak olarak) çoğaltır.
   */
  public async duplicateContent(contentId: string, locale = "tr"): Promise<string | null> {
    const existing = await this.getContentById(contentId, locale);
    if (!existing) return null;
    const newId = `cnt_${existing.type}_${Date.now()}`;
    const { slugHistory: _drop, ...restAttrs } = existing.schemaAttributes as Record<string, unknown>;
    await this.saveContent({
      contentId: newId,
      type: existing.type,
      status: "draft",
      importanceScore: existing.importanceScore,
      schemaType: existing.schemaType,
      schemaAttributes: restAttrs,
      featuredImage: existing.featuredImage,
      locale: existing.locale,
      region: existing.region,
      slug: `${existing.slug}-kopya-${Date.now().toString().slice(-4)}`,
      title: `${existing.title} (Kopya)`,
      excerpt: existing.excerpt ?? undefined,
      tldr: existing.tldr ?? undefined,
      blocks: existing.blocks,
      metaTitle: existing.metaTitle ?? undefined,
      metaDescription: existing.metaDescription ?? undefined,
      noIndex: true,
    });
    return newId;
  }

  /**
   * İçerik kaydedilirken (SEO MOTORU her kayıtta çalışır):
   * 1. Blokları saf Markdown'a (`markdownCache`) derler.
   * 2. SEO Motoru: skor + boşluk bulguları üretir, boş meta açıklamayı otomatik doldurur, slug değişimini 301 geçmişine yazar.
   * 3. `content:beforeSave` kancasını tetikler.
   * 4. Veritabanına yazar ve `content:afterPublish` kancasını tetikler.
   */
  public async saveContent(input: SaveContentInput): Promise<{ contentId: string; markdownCache: string; seoScore: number }> {
    const contentId = input.contentId ?? `cnt_${Date.now()}`;
    const rawMarkdown = compileBlocksToMarkdown(input.blocks, {
      title: input.title,
      tldr: input.tldr,
    });

    const site = await this.getSite();
    const siteSettings = site?.settings ?? resolveSiteSettings({});
    const existing = input.contentId
      ? await this.getContentById(input.contentId, input.locale)
      : null;

    const { db, t } = this.backend;
    // İkincil dil çevirisi: içerik satırı (durum, şema, öznitelikler) varsayılan dile aittir ve bu kayıtla değişmez;
    // çevirinin kendi yayın durumu `translationStatus` ile tutulur.
    const defaultLocale = site?.defaultLocale ?? "tr";
    const contentRowExists = input.contentId
      ? (await db.select({ id: t.contents.id }).from(t.contents).where(and(eq(t.contents.id, input.contentId), eq(t.contents.siteId, this.siteId))).limit(1)).length > 0
      : false;
    const secondary = input.locale !== defaultLocale && contentRowExists;
    const translationStatus = secondary && (input.status ?? "published") !== "published" ? "draft" : "published";
    // --- SEO MOTORU: slug geçmişi (otomatik 301) ---
    const schemaAttributes: Record<string, unknown> = { ...(input.schemaAttributes ?? existing?.schemaAttributes ?? {}) };
    const history = new Set<string>(resolvePublishing(existing?.schemaAttributes).slugHistory);
    // Yeni çeviri kaynak dilin slug geçmişini devralmaz
    if (!(secondary && !existing)) for (const h of resolvePublishing(schemaAttributes).slugHistory) history.add(h);
    if (existing && siteSettings.seo.autoRedirectOnSlugChange && existing.slug !== input.slug) {
      history.add(existing.slug);
    }
    history.delete(input.slug);
    if (history.size > 0) schemaAttributes.slugHistory = Array.from(history);
    else delete schemaAttributes.slugHistory;

    // --- SEO MOTORU: analiz ---
    const pub = resolvePublishing(schemaAttributes);
    const analysis = analyzeSeo({
      locale: input.locale,
      title: input.title,
      slug: input.slug,
      tldr: input.tldr,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      focusKeyword: pub.focusKeyword,
      blocks: input.blocks,
      featuredImageUrl: input.featuredImage ?? pub.featuredImageMeta.url,
      featuredAltText: pub.featuredImageMeta.altText,
      noIndex: input.noIndex,
      schemaType: input.schemaType,
      settings: siteSettings.seo,
    });
    const stats = extractContentStats(input.blocks);
    const autoDescription =
      siteSettings.seo.autoDescription && !input.metaDescription?.trim()
        ? (input.tldr?.trim() || stats.firstParagraph).slice(0, 158)
        : "";
    const finalMetaDescription = input.metaDescription?.trim() || autoDescription || null;

    const hookResult = await cmsHooks.runFilter("content:beforeSave", {
      siteId: this.siteId,
      contentId,
      locale: input.locale,
      title: input.title,
      tldr: input.tldr,
      blocks: input.blocks,
      markdownCache: rawMarkdown,
      seoScore: analysis.score,
    });

    const now = new Date();
    const gapFindings: string[] = [...analysis.gapFindings];
    if (!hookResult.tldr || hookResult.tldr.trim().length < 20) {
      if (!gapFindings.includes("missing_tldr")) gapFindings.push("missing_tldr");
    }
    if (hookResult.markdownCache.length < 300 && !gapFindings.includes("thin_content")) {
      gapFindings.push("thin_content");
    }

    if (!secondary) await db
      .insert(t.contents)
      .values({
        id: contentId,
        siteId: this.siteId,
        type: input.type,
        status: input.status ?? "published",
        importanceScore: input.importanceScore ?? 5,
        schemaType: input.schemaType ?? "WebPage",
        schemaAttributes,
        featuredImage: input.featuredImage ?? null,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: t.contents.id,
        setWhere: eq(t.contents.siteId, this.siteId),
        set: {
          type: input.type,
          status: input.status ?? "published",
          importanceScore: input.importanceScore ?? 5,
          schemaType: input.schemaType ?? "WebPage",
          schemaAttributes,
          featuredImage: input.featuredImage ?? null,
          updatedAt: now,
        },
      });

    // Çeviri satırına özgü öznitelikler; varsayılan dil satırı paylaşılan (içerik satırı) değerleri kullanır
    const localizedAttributes = secondary ? pickLocalizedAttributes(schemaAttributes, [...history]) : {};
    const transId = `tr_${contentId}_${input.locale}`;
    await db
      .insert(t.contentTranslations)
      .values({
        id: transId,
        siteId: this.siteId,
        contentId,
        locale: input.locale,
        // Varsayılan dil geriye uyumlu `TR` bölgesini taşır; çeviriler bölgesiz (yalnızca dil) başlar
        region: input.region ?? (input.locale === defaultLocale ? "TR" : ""),
        slug: input.slug,
        title: hookResult.title,
        excerpt: input.excerpt ?? null,
        tldr: hookResult.tldr ?? null,
        blocks: hookResult.blocks,
        markdownCache: hookResult.markdownCache,
        metaTitle: input.metaTitle ?? hookResult.title,
        metaDescription: finalMetaDescription,
        canonicalUrl: input.canonicalUrl ?? null,
        noIndex: input.noIndex ?? false,
        seoScore: hookResult.seoScore ?? analysis.score,
        gapFindings,
        translationStatus,
        sourceLocale: input.sourceLocale ?? null,
        sourceHash: input.sourceHash ?? null,
        attributes: localizedAttributes,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: t.contentTranslations.id,
        setWhere: eq(t.contentTranslations.siteId, this.siteId),
        set: {
          slug: input.slug,
          title: hookResult.title,
          excerpt: input.excerpt ?? null,
          tldr: hookResult.tldr ?? null,
          blocks: hookResult.blocks,
          markdownCache: hookResult.markdownCache,
          metaTitle: input.metaTitle ?? hookResult.title,
          metaDescription: finalMetaDescription,
          canonicalUrl: input.canonicalUrl ?? null,
          noIndex: input.noIndex ?? false,
          seoScore: hookResult.seoScore ?? analysis.score,
          gapFindings,
          translationStatus,
          attributes: localizedAttributes,
          ...(input.sourceHash ? { sourceLocale: input.sourceLocale ?? null, sourceHash: input.sourceHash } : {}),
          updatedAt: now,
        },
      });
  

    // Revizyon geçmişi: kayıt başarıyla yazıldıktan sonra, hata kaydı asıl işlemi bozmaz
    try {
      await this.recordRevision(
        contentId,
        input.locale,
        {
          title: input.title,
          slug: input.slug,
          tldr: hookResult.tldr ?? null,
          status: input.status ?? "published",
          blocks: hookResult.blocks,
          metaTitle: input.metaTitle ?? hookResult.title ?? null,
          metaDescription: finalMetaDescription ?? null,
          canonicalUrl: input.canonicalUrl ?? null,
          noIndex: input.noIndex ?? false,
          featuredImage: input.featuredImage ?? null,
          schemaType: input.schemaType ?? "WebPage",
          importanceScore: input.importanceScore ?? 5,
          schemaAttributes,
        } satisfies RevisionSnapshot,
        input.actor
      );
    } catch (error) {
      console.warn("[revisions] kaydedilemedi:", error instanceof Error ? error.message : error);
    }

    if ((input.status ?? "published") === "published" && translationStatus === "published") {
      await cmsHooks.runAction("content:afterPublish", {
        siteId: this.siteId,
        contentId,
        locale: input.locale,
        slug: input.slug,
        url: `/${input.locale}/${input.slug}`,
      });
    }

    return { contentId, markdownCache: hookResult.markdownCache, seoScore: hookResult.seoScore ?? analysis.score };
  }
}
