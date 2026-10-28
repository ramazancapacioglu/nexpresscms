import { and, eq } from "drizzle-orm";
import { translationSourceHash, translationStateOf, type TranslationState } from "@nexpress/core";
import { CmsContentWriteRepository } from "./content-write";
import type { SaveContentInput } from "./types";

export interface TranslationOverviewRow {
  locale: string;
  state: TranslationState;
  slug: string | null;
  title: string | null;
  updatedAt: Date | null;
}

export type TranslationResult = { ok: true } | { ok: false; error: string };

/** Dil şeridi ve "kaynaktan çeviri oluştur" iş akışı. Çeviri aynı `contentId` altında ayrı satırdır. */
export class CmsTranslationRepository extends CmsContentWriteRepository {
  /**
   * Kaynak dildeki içeriği hedef dile **taslak** olarak kopyalar (metin çevrilmez; çeviri taslağıdır).
   * Kaynağın o anki özeti saklanır: kaynak değişince durum `stale` olur.
   */
  public async createTranslation(
    contentId: string,
    fromLocale: string,
    toLocale: string,
    actor?: SaveContentInput["actor"]
  ): Promise<TranslationResult> {
    const site = await this.getSite();
    const supported = site?.supportedLocales ?? [site?.defaultLocale ?? "tr"];
    const defaultLocale = site?.defaultLocale ?? "tr";
    if (toLocale === fromLocale) return { ok: false, error: "Kaynak ve hedef dil aynı." };
    if (!supported.includes(toLocale)) return { ok: false, error: "Hedef dil sitede etkin değil." };
    if (toLocale === defaultLocale) return { ok: false, error: "Varsayılan dil kaynaktır; ondan çeviri oluşturulamaz." };
    const source = await this.getContentById(contentId, fromLocale);
    if (!source) return { ok: false, error: "Kaynak içerik bulunamadı." };
    if ((await this.getContentById(contentId, toLocale)) !== null) return { ok: false, error: "Bu dilde çeviri zaten var." };

    // Aynı (dil, slug) çifti tek olmalı: çakışırsa dil eki alır
    const taken = (await this.listContents({ locale: toLocale })).some((c) => c.slug === source.slug);
    await this.saveContent({
      actor,
      contentId,
      type: source.type,
      status: "draft",
      importanceScore: source.importanceScore,
      schemaType: source.schemaType,
      featuredImage: source.featuredImage,
      locale: toLocale,
      slug: taken ? `${source.slug}-${toLocale}` : source.slug,
      title: source.title,
      excerpt: source.excerpt ?? undefined,
      tldr: source.tldr ?? undefined,
      blocks: source.blocks,
      metaTitle: source.metaTitle ?? undefined,
      metaDescription: source.metaDescription ?? undefined,
      noIndex: source.noIndex,
      sourceLocale: fromLocale,
      sourceHash: translationSourceHash({ title: source.title, tldr: source.tldr, blocks: source.blocks }),
    });
    return { ok: true };
  }

  /** Sitenin her etkin dili için durum (yok / taslak / yayında / kaynak değişti). */
  public async translationOverview(contentId: string): Promise<TranslationOverviewRow[]> {
    const site = await this.getSite();
    const locales = site?.supportedLocales ?? [site?.defaultLocale ?? "tr"];
    const rows = await this.getTranslationsForContent(contentId);
    const sources = new Map<string, string>();
    for (const r of rows) {
      if (r.sourceLocale && !sources.has(r.sourceLocale)) {
        const s = await this.getContentById(contentId, r.sourceLocale);
        if (s) sources.set(r.sourceLocale, translationSourceHash({ title: s.title, tldr: s.tldr, blocks: s.blocks }));
      }
    }
    return locales.map((locale) => {
      const row = rows.find((r) => r.locale === locale);
      return {
        locale,
        state: translationStateOf(row, row?.sourceLocale ? sources.get(row.sourceLocale) : undefined),
        slug: row?.slug ?? null,
        title: row?.title ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  /** Varsayılan dil çevirisi silinemez (içeriğin kendisidir); diğerleri kiracıya kapalı silinir. */
  public async deleteTranslation(contentId: string, locale: string): Promise<TranslationResult> {
    const site = await this.getSite();
    if (locale === (site?.defaultLocale ?? "tr")) return { ok: false, error: "Varsayılan dil çevirisi silinemez." };
    const { db, t } = this.backend;
    await db
      .delete(t.contentTranslations)
      .where(and(eq(t.contentTranslations.siteId, this.siteId), eq(t.contentTranslations.contentId, contentId), eq(t.contentTranslations.locale, locale)));
    return (await this.getContentById(contentId, locale)) === null ? { ok: true } : { ok: false, error: "Çeviri silinemedi." };
  }
}
