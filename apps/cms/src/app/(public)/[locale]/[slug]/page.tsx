import React from "react";
import { siteLocaleBase } from "@/lib/locale-url";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "@/components/public/link";
import { contentWidthStyle, hasDynamicQueryParams, resolvePublishing, termSlug } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getPublicMediaFocal, getPublicSite, loadPageForms, listPublicReviews, resolvePublicContent } from "@/lib/public-data";
import { getThemeManifest, ResponsiveImage, RscBlockRenderer } from "@nexpress/themes";
import { loadDynamicData } from "@/lib/dynamic-content";
import { getResolvedMenu } from "@/lib/menu-data";
import { templateFor, getSyncedPatternsMap } from "@/lib/templates";
import { buildTemplateContext, coverTemplateContext } from "@/lib/template-context";
import { getSession } from "@/lib/auth/session";
import { jsonLdString, buildPageSchemaGraph, resolveSeoMeta } from "@nexpress/seo-core";
import { trackAiReferral, trackBotVisit } from "@/lib/bot-log";
import { createTranslator } from "@nexpress/i18n";
import { redirectOrNotFound } from "@/lib/redirect-runtime";
import { createFormToken } from "@/lib/form-token";
import { resolveDraftPreview } from "@/lib/draft-preview";
import { getPreviewTheme } from "@/lib/public-theme";
import { hreflangAlternates, localeSwitcherLinks } from "@/lib/alternates";
import { LanguageSwitcher } from "@/components/public/language-switcher";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp0 = await searchParams;
  const nx_draft = typeof sp0.nx_draft === "string" ? sp0.nx_draft : undefined;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const lb = await siteLocaleBase(siteId, locale);
  const draftMeta = await resolveDraftPreview(siteId, locale, slug, nx_draft);
  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    draftMeta ? Promise.resolve({ content: draftMeta, isRedirect: false }) : resolvePublicContent(siteId, slug, locale),
  ]);

  if (!resolved || !resolved.content) {
    return { title: `${createTranslator(locale)("common.notFoundTitle")} | NexPress CMS` };
  }

  const content = resolved.content;
  const pub = resolvePublishing(content.schemaAttributes);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const seoMeta = resolveSeoMeta({
    siteName: site?.name ?? "NexPress CMS",
    tagline: site?.tagline,
    baseUrl,
    locale,
    path: `${lb}/${content.slug}`,
    title: content.title,
    tldr: content.tldr,
    excerpt: content.excerpt,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
    canonicalUrl: content.canonicalUrl,
    noIndex: content.noIndex,
    imageUrl:
      content.featuredImage ??
      pub.featuredImageUrl ??
      `/og?title=${encodeURIComponent(content.title)}&site=${encodeURIComponent(site?.name ?? "")}`,
    settings: site?.settings?.seo,
  });

  return {
    title: seoMeta.title,
    description: seoMeta.description,
    alternates: {
      canonical: seoMeta.canonical,
      languages: await hreflangAlternates(siteId, content.contentId, baseUrl),
    },
    robots: draftMeta ? { index: false, follow: false } : hasDynamicQueryParams(sp0) ? { index: false, follow: true } : seoMeta.robots,
    openGraph: {
      title: seoMeta.openGraph.title,
      description: seoMeta.openGraph.description,
      url: seoMeta.openGraph.url,
      siteName: seoMeta.openGraph.siteName,
      locale: seoMeta.openGraph.locale,
      type: seoMeta.openGraph.type,
      images: seoMeta.openGraph.images,
    },
    twitter: {
      card: seoMeta.twitter.card,
      title: seoMeta.twitter.title,
      description: seoMeta.twitter.description,
      images: seoMeta.twitter.images,
    },
  };
}

export default async function PublicDynamicContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ form?: string; fb?: string; nx_draft?: string }>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const lb = await siteLocaleBase(siteId, locale);
  await trackBotVisit("page");
  await trackAiReferral();

  const draft = await resolveDraftPreview(siteId, locale, slug, sp.nx_draft);
  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    draft ? Promise.resolve({ content: draft, isRedirect: false }) : resolvePublicContent(siteId, slug, locale),
  ]);

  if (!resolved || !resolved.content) {
    return redirectOrNotFound(siteId, `${lb}/${slug}`);
  }

  if (resolved.isRedirect) {
    permanentRedirect(`${lb}/${resolved.content.slug}`);
  }

  const content = resolved.content;
  const mediaFocal = await getPublicMediaFocal(siteId);

  const reviews = await listPublicReviews(siteId, content.id);
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const avgRating =
    approvedReviews.length > 0
      ? (
          approvedReviews.reduce((acc, r) => acc + r.rating, 0) /
          approvedReviews.length
        ).toFixed(1)
      : "–";

  const pub = resolvePublishing(content.schemaAttributes);
  const categories: string[] =
    pub.categories;
  const tags: string[] =
    pub.tags;
  const featuredImageUrl = content.featuredImage ?? pub.featuredImageUrl ?? null;
  const featuredAlt = String(pub.featuredImageAlt ?? content.title);
  const featuredTitle = String(pub.featuredImageAlt ?? content.title);
  const featuredCaption = String(pub.featuredImageCaption ?? "");
  const showShareBar = pub.showShareButtons !== false;
  const allowReviews = pub.allowReviews !== false;
  const allowComments = pub.allowComments !== false;

  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const tokens = (await getPreviewTheme(siteId))?.tokens ?? site?.designTokens ?? activeTheme.tokens;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}${lb}/${content.slug}`;

  const schemaGraph = await buildPageSchemaGraph({
    siteId,
    siteName: site?.name ?? "NexPress CMS",
    siteUrl: baseUrl,
    locale,
    pageUrl,
    autoSchema: site?.settings?.seo?.autoSchema !== false,
    aggregateRating:
      approvedReviews.length > 0
        ? {
            ratingValue: Number(avgRating),
            reviewCount: approvedReviews.length,
          }
        : undefined,
    content: {
      id: content.id,
      title: content.title,
      tldr: content.tldr,
      schemaType: content.schemaType,
      schemaAttributes: content.schemaAttributes,
      authorName: content.authorName,
      updatedAt: content.updatedAt,
      blocks: content.blocks,
      imageUrl: featuredImageUrl,
    },
  });

  const t = createTranslator(locale);
  const cover = coverTemplateContext({
    site: site ? { name: site.name, tagline: site.tagline } : null,
    locale,
    lb,
    tokens,
    title: content.title,
    excerpt: content.tldr,
    featuredImage: featuredImageUrl ? { url: featuredImageUrl, alt: featuredAlt, caption: featuredCaption } : null,
  });
  const canvas = content.schemaAttributes?.canvas === true;
  const pageForms = await loadPageForms(siteId, content.blocks);
  const canEdit = Boolean(await getSession());
  const pageSchema = { title: content.title, tldr: content.tldr ?? "", rich: ((content.schemaAttributes as Record<string, unknown>)?.richSchema ?? {}) as never };
  const dynamicData = await loadDynamicData(siteId, locale, content.blocks, content.contentId, sp);
  const formCtx = { forms: pageForms, path: `${lb}/${content.slug}`, token: createFormToken(`${lb}/${content.slug}`), status: sp.form === "sent" || sp.form === "error" ? sp.form : null, blockId: sp.fb ?? null } as const;
  const banner = draft ? <p role="status" className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Taslak önizleme: bu sayfa yayında değil ve yalnızca bu bağlantıyla görüntülenir.</p> : null;
  const switcher = <LanguageSwitcher alternates={await localeSwitcherLinks(siteId, content.contentId, locale)} />;

  // Tema oluşturucu şablonu (sayfa / yazı / ürün): tam genişlik tuval tasarımlarında uygulanmaz; sayfada "none" seçilmişse yerleşik görünüm
  const tplKind = content.type === "product" ? "product" : content.type === "campaign" ? "campaign" : content.type === "kb_tech" ? "kb_tech" : content.type === "ai_prompt" ? "ai_prompt" : content.type === "page" ? "page" : "post";
  const syncedPatterns = await getSyncedPatternsMap(siteId);
  const tpl = canvas ? null : await templateFor(siteId, tplKind, typeof content.schemaAttributes?._template === "string" ? (content.schemaAttributes._template as string) : null, { locale, slug: content.slug, contentType: content.type, categories: resolvePublishing(content.schemaAttributes).categories, tags: resolvePublishing(content.schemaAttributes).tags });
  if (tpl) {
    const [menu, catIndex] = await Promise.all([getResolvedMenu(siteId, locale), getScopedRepository(siteId).listTaxonomies("category")]);
    const ctx = buildTemplateContext({ lb,
      site: site ? { name: site.name, tagline: site.tagline } : null,
      locale,
      menu,
      tokens,
      menuLabel: t("site.menu"),
      breadcrumbs: [{ name: "Ana sayfa", href: (lb || "/") }, { name: content.title, href: `${lb}/${content.slug}` }],
      post: {
        title: content.title,
        content: <RscBlockRenderer blocks={content.blocks} themeId={activeTheme.id} tokens={tokens} lcp={!featuredImageUrl} mediaFocal={mediaFocal} locale={locale} dynamic={dynamicData} pageSchema={pageSchema} patterns={syncedPatterns} form={formCtx} tpl={cover} />,
        featuredImage: featuredImageUrl ? { url: featuredImageUrl, alt: featuredAlt, caption: featuredCaption } : null,
        excerpt: content.tldr,
        date: (content.publishedAt ?? content.createdAt) ? new Date(content.publishedAt ?? content.createdAt).toISOString() : null,
        author: pub.authorName || content.authorName || null,
        categories: categories.map((name) => ({ name, href: `${lb}/kategori/${catIndex.find((c) => c.name === name)?.slug ?? termSlug(name)}` })),
      },
    });
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schemaGraph) }} />
        {banner}
        {switcher}
        <div style={contentWidthStyle(tpl.meta.behavior?.contentWidth)}>
          <RscBlockRenderer blocks={tpl.blocks} themeId={activeTheme.id} tokens={tokens} locale={locale} tpl={ctx} patterns={syncedPatterns} />
        </div>
      </>
    );
  }

  if (canvas) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(schemaGraph) }}
        />
        {banner}
        {switcher}
        <RscBlockRenderer
          blocks={content.blocks}
          themeId={activeTheme.id}
          tokens={tokens}
          mediaFocal={mediaFocal}
          locale={locale}
          dynamic={dynamicData} pageSchema={pageSchema}
          patterns={syncedPatterns}
          form={formCtx}
          tpl={cover}
        />
      </>
    );
  }

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      {banner}
      {switcher}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schemaGraph) }}
      />

      <header className="space-y-4 border-b pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Link href={(lb || "/")} className="text-nx-muted hover:underline">
              ← Ana Sayfa
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`${lb}/${content.slug}?format=md`}
              className="rounded border px-2.5 py-1 font-mono text-xs text-nx-soft hover:bg-nx-subtle"
            >
              Markdown
            </Link>
            {canEdit ? (
            <Link
              href={`/admin/contents?id=${content.id}&type=${content.type}`}
              className="rounded border px-2.5 py-1 text-xs font-medium text-nx-link bg-blue-50 hover:bg-blue-100"
            >
              ✏️ Editörde Düzenle
            </Link>
            ) : null}
          </div>
        </div>

        <h1
          style={{ fontFamily: tokens.typography.headingFont }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-nx-fg"
        >
          {content.title}
        </h1>

        {/* Kategori, Etiket ve AggregateRating Özet Şeridi */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {categories.map((cat) => (
              <span
                key={cat}
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.primaryForeground,
                }}
                className="rounded px-2.5 py-0.5 font-semibold"
              >
                {cat}
              </span>
            ))}
            {tags.map((tg) => (
              <span
                key={tg}
                className="rounded border border-nx-line bg-nx-subtle px-2 py-0.5 font-mono text-[11px] text-nx-soft"
              >
                #{tg}
              </span>
            ))}
          </div>

          {approvedReviews.length > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="text-amber-500">★★★★★</span>
              <span>
                {t("content.ratingSummary", { avg: avgRating, n: approvedReviews.length })}
              </span>
            </div>
          )}
        </div>

        {/* Öne Çıkan Görsel (Featured Image + Görsel SEO Figcaption) */}
        {featuredImageUrl && (
          <figure className="pt-3 space-y-2">
            <div
              style={{ borderRadius: tokens.geometry.borderRadius }}
              className="overflow-hidden border border-nx-line bg-slate-950"
            >
              <ResponsiveImage
                src={featuredImageUrl}
                alt={featuredAlt}
                title={featuredTitle}
                priority
                focal={mediaFocal}
                sizes="(min-width: 1024px) 896px, 100vw"
                className="w-full max-h-[420px] object-cover"
              />
            </div>
            {featuredCaption && (
              <figcaption className="text-xs text-nx-muted text-center italic">
                {featuredCaption}
              </figcaption>
            )}
          </figure>
        )}
      </header>

      {/* Kısıtlı / Taslak Yayın Bildirimi */}
      {content.status === "restricted" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>🔒 {t("content.restricted")}:</strong> {t("content.restrictedBody")}
        </div>
      )}

      <RscBlockRenderer
        blocks={content.blocks}
        themeId={activeTheme.id}
        tokens={tokens}
        lcp={!featuredImageUrl}
        mediaFocal={mediaFocal}
        locale={locale}
        dynamic={dynamicData} pageSchema={pageSchema}
        patterns={syncedPatterns}
        form={formCtx}
        tpl={cover}
      />

      {/* Sosyal Paylaşım Çubuğu (0-KB RSC) */}
      {showShareBar && (
        <section
          style={{ borderRadius: tokens.geometry.borderRadius }}
          className="border border-nx-line bg-nx-subtle p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold uppercase tracking-wider text-nx-muted">
              {t("content.shareHeading")}
            </div>
            <div className="text-sm font-semibold text-nx-fg">
              {content.title}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title)}&url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
            >
              𝕏 (Twitter)
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
            >
              LinkedIn
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(content.title + " " + pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
            >
              WhatsApp
            </a>
            <Link
              href={`${lb}/${content.slug}?format=md`}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-white hover:bg-slate-800 font-mono"
            >
              Markdown (.md)
            </Link>
          </div>
        </section>
      )}

      {/* Müşteri İncelemeleri, 5 Yıldızlı Değerlendirme & Yorumlar Bölümü */}
      {(allowReviews || allowComments) && (
        <section className="space-y-6 border-t pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2
                style={{ fontFamily: tokens.typography.headingFont }}
                className="text-2xl font-bold text-nx-fg"
              >
                {t("content.reviewsHeading", { n: approvedReviews.length })}
              </h2>
              <p className="text-sm text-nx-soft">
                {t("content.reviewsSubheading")}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5">
              <div className="text-2xl font-extrabold text-amber-800">
                {avgRating}
                <span className="text-xs font-normal text-amber-800"> / 5.0</span>
              </div>
              <div className="text-xs text-amber-900 font-semibold">
                <div className="text-amber-500 tracking-widest">★★★★★</div>
                <div>{t("content.approvedCount", { n: approvedReviews.length })}</div>
              </div>
            </div>
          </div>

          {approvedReviews.length > 0 ? (
            <div className="space-y-4">
              {approvedReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{ borderRadius: tokens.geometry.borderRadius }}
                  className="border border-nx-line bg-nx-card p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-nx-fg text-sm">
                        {rev.authorName}
                      </span>
                      {rev.isVerified && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          ✓ {t("content.verified")}
                        </span>
                      )}
                    </div>
                    <div className="text-amber-500 text-xs font-bold">
                      {"★".repeat(rev.rating)} ({rev.rating}/5)
                    </div>
                  </div>
                  {rev.title && (
                    <h3 className="font-bold text-nx-fg text-sm">
                      {rev.title}
                    </h3>
                  )}
                  <p className="text-sm text-nx-soft leading-relaxed">
                    {rev.body}
                  </p>
                  {(rev.pros.length > 0 || rev.cons.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      {rev.pros.length > 0 && (
                        <div className="rounded bg-emerald-50/70 border border-emerald-200/70 p-2.5 text-emerald-900">
                          <strong className="text-emerald-800">+ {t("content.pros")}: </strong>
                          {rev.pros.join(" • ")}
                        </div>
                      )}
                      {rev.cons.length > 0 && (
                        <div className="rounded bg-rose-50/70 border border-rose-200/70 p-2.5 text-rose-900">
                          <strong className="text-rose-700">− Eksiler: </strong>
                          {rev.cons.join(" • ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-nx-line p-6 text-center text-sm text-nx-muted">
              {t("content.noReviews")}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
