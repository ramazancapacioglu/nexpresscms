import React from "react";
import { siteLocaleBase } from "@/lib/locale-url";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "@/components/public/link";
import { contentWidthStyle, hasDynamicQueryParams, readPageOptions, resolveLocalizedSiteIdentity, resolvePublishing, resolveSiteSettings, sanitizeReadingSlug, schemaPlacementFor, termSlug } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getPublicMediaFocal, getPublicSite, loadPageForms, listPublicReviews, resolvePublicContent } from "@/lib/public-data";
import { getThemeManifest, ResponsiveImage, RscBlockRenderer } from "@nexpress/themes";
import { loadDynamicData } from "@/lib/dynamic-content";
import { getResolvedMenu } from "@/lib/menu-data";
import { templateFor, getSyncedPatternsMap } from "@/lib/templates";
import { buildTemplateContext, coverTemplateContext } from "@/lib/template-context";
import { getSession } from "@/lib/auth/session";
import { PostsIndex } from "@/components/public/posts-index";
import { jsonLdString, buildPageSchemaGraph, resolveSeoMeta } from "@nexpress/seo-core";
import { trackAiReferral, trackBotVisit } from "@/lib/bot-log";
import { createTranslator } from "@nexpress/i18n";
import { redirectOrNotFound } from "@/lib/redirect-runtime";
import { createFormToken } from "@/lib/form-token";
import { resolveDraftPreview } from "@/lib/draft-preview";
import { getPreviewTheme, officialPreviewId } from "@/lib/public-theme";
import { hreflangAlternates, localeSwitcherLinks } from "@/lib/alternates";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { PostDiscussion } from "@/components/public/post-discussion";
import { ContentAccessGate, ContentShareBar, checkVisitorContentAccess } from "@/components/public/content-access-gate";
import { authorSlug } from "@/lib/author-slug";

/** Sayfa başlığı zaten h1 ise içerikteki vitrin (hero) başlığı h2'ye düşer: sayfada tek h1 kalır (SEO ve erişilebilirlik). */
function demoteHeroTitles<T extends { type: string; props: Record<string, unknown>; children?: T[] }>(nodes: T[]): T[] {
  return nodes.map((node) => ({
    ...node,
    ...(node.type === "hero" ? { props: { ...node.props, demoteTitle: true } } : {}),
    // İçerikteki 1. düzey başlık da h2 olur (sayfa başlığı h1'i tek kalır)
    ...((node.type === "heading" || node.type === "heading_element") && /^(h?1)$/i.test(String(node.props.level ?? "")) ? { props: { ...node.props, level: typeof node.props.level === "number" ? 2 : "h2" } } : {}),
    ...(node.children ? { children: demoteHeroTitles(node.children) } : {}),
  }));
}

function treeHas(nodes: Array<{ type: string; children?: unknown[] }>, type: string): boolean {
  for (const node of nodes) {
    if (node.type === type) return true;
    if (Array.isArray(node.children) && treeHas(node.children as Array<{ type: string; children?: unknown[] }>, type)) return true;
  }
  return false;
}

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
  const localizedSite = resolveLocalizedSiteIdentity(site, locale);

  const seoMeta = resolveSeoMeta({
    siteName: localizedSite.name,
    tagline: localizedSite.tagline,
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
    ogType: content.type === "post" || /Article|BlogPosting/i.test(content.schemaType) ? "article" : "website",
    publishedTime: content.publishedAt ?? content.createdAt ?? null,
    modifiedTime: content.updatedAt ?? null,
    imageUrl:
      content.featuredImage ??
      pub.featuredImageUrl ??
      `/og?title=${encodeURIComponent(content.title)}&site=${encodeURIComponent(localizedSite.name)}`,
    settings: localizedSite.seo,
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
      ...(seoMeta.openGraph.type === "article"
        ? { publishedTime: seoMeta.openGraph.publishedTime, modifiedTime: seoMeta.openGraph.modifiedTime }
        : {}),
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
  searchParams: Promise<{ form?: string; fb?: string; nx_draft?: string; yorum?: string; pwd?: string; c_sort?: string }>;
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
  const commentEntries = approvedReviews.filter((entry) => entry.entryType === "comment");
  const reviewEntries = approvedReviews.filter((entry) => entry.entryType !== "comment" && entry.rating > 0);
  const avgRating =
    reviewEntries.length > 0
      ? (reviewEntries.reduce((acc, entry) => acc + entry.rating, 0) / reviewEntries.length).toFixed(1)
      : "–";

  const pub = resolvePublishing(content.schemaAttributes);
  const categories: string[] =
    pub.categories;
  const tags: string[] =
    pub.tags;
  const featuredImageUrl = pub.showFeaturedImage === false ? null : content.featuredImage ?? pub.featuredImageUrl ?? null;
  const featuredAlt = String(pub.featuredImageAlt ?? content.title);
  const featuredTitle = String(pub.featuredImageAlt ?? content.title);
  const featuredCaption = String(pub.featuredImageCaption ?? "");
  const showShareBar = pub.showShareButtons !== false;
  const allowReviews = pub.allowReviews !== false;
  const allowComments = pub.allowComments !== false;

  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const preview = await getPreviewTheme(siteId);
  const skinId = officialPreviewId(preview?.themeId) ?? activeTheme.id;
  const tokens = preview?.tokens ?? site?.designTokens ?? activeTheme.tokens;
  const postsPageSlug = sanitizeReadingSlug(resolveSiteSettings(site?.settings).general.postsPageSlug);
  if (!draft && postsPageSlug && postsPageSlug === content.slug && content.type === "page") {
    return <PostsIndex siteId={siteId} locale={locale} title={content.title} tokens={tokens} />;
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}${lb}/${content.slug}`;
  const localizedSite = resolveLocalizedSiteIdentity(site, locale);

  const placement = schemaPlacementFor(resolveSiteSettings(site?.settings).seo.schemaPlacements, {
    type: content.type,
    schemaType: content.schemaType,
    categories: pub.categories,
  });
  const t = createTranslator(locale);
  const cover = coverTemplateContext({
    site: site ? { name: localizedSite.name, tagline: localizedSite.tagline } : null,
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
  const access = await checkVisitorContentAccess({
    siteId,
    contentId: content.id,
    status: content.status,
    visibility: pub.visibility,
    accessPassword: pub.accessPassword,
    hasSession: canEdit,
    isDraftPreview: Boolean(draft),
  });
  const pageSchema = { title: content.title, tldr: content.tldr ?? "", rich: ((content.schemaAttributes as Record<string, unknown>)?.richSchema ?? {}) as never };
  const dynamicData = await loadDynamicData(siteId, locale, content.blocks, content.contentId, sp);
  const formCtx = { forms: pageForms, path: `${lb}/${content.slug}`, token: createFormToken(`${lb}/${content.slug}`), status: sp.form === "sent" || sp.form === "error" ? sp.form : null, blockId: sp.fb ?? null } as const;
  const banner = draft ? <p role="status" className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Taslak önizleme: bu sayfa yayında değil ve yalnızca bu bağlantıyla görüntülenir.</p> : null;
  const switcher = <LanguageSwitcher alternates={await localeSwitcherLinks(siteId, content.contentId, locale)} />;

  if (!access.allowed && access.gate !== "none") {
    return (
      <>
        {banner}
        {switcher}
        <ContentAccessGate
          gate={access.gate}
          contentId={content.id}
          locale={locale}
          slug={content.slug}
          pagePath={`${lb}/${content.slug}`}
          title={content.title}
          tokens={tokens}
          t={t}
          hasError={sp.pwd === "error"}
        />
      </>
    );
  }

  // Tema oluşturucu şablonu (sayfa / yazı / ürün): tam genişlik tuval tasarımlarında uygulanmaz; sayfada "none" seçilmişse yerleşik görünüm
  const tplKind = content.type === "product" ? "product" : content.type === "campaign" ? "campaign" : content.type === "kb_tech" ? "kb_tech" : content.type === "ai_prompt" ? "ai_prompt" : content.type === "page" ? "page" : "post";
  const syncedPatterns = await getSyncedPatternsMap(siteId);
  const tpl = canvas ? null : await templateFor(siteId, tplKind, typeof content.schemaAttributes?._template === "string" ? (content.schemaAttributes._template as string) : null, { locale, slug: content.slug, contentType: content.type, categories: resolvePublishing(content.schemaAttributes).categories, tags: resolvePublishing(content.schemaAttributes).tags });
  // Sayfa başlığını h1 yapan düzende (yerleşik makale ya da başlık yuvalı şablon) içerikteki vitrin başlığı h2 olur
  const contentBlocks = !canvas && (!tpl || treeHas(tpl.blocks, "tpl_post_title")) ? demoteHeroTitles(content.blocks) : content.blocks;
  const authorName = pub.authorName || content.authorName;
  const authorHref = content.type === "post" && authorName ? `${lb}/yazar/${authorSlug(authorName)}` : null;
  const family = pub.parentId || pub.pillar ? await getScopedRepository(siteId).listContents({ locale }) : [];
  const parent = pub.parentId ? family.find((item) => item.id === pub.parentId && item.status === "published") : undefined;

  const schemaGraph = await buildPageSchemaGraph({
    siteId,
    siteName: localizedSite.name,
    siteUrl: baseUrl,
    locale,
    pageUrl,
    // Kırıntı: Ana sayfa › (üst sayfa) › bu sayfa. Aynı liste ziyaretçiye de basılır (şablon kırıntı bloğu)
    breadcrumbs: [
      { name: t("taxonomy.home"), url: `${baseUrl}${lb || "/"}` },
      ...(parent ? [{ name: parent.title, url: `${baseUrl}${lb}/${parent.slug}` }] : []),
      { name: content.title, url: pageUrl },
    ],
    autoSchema: localizedSite.seo.autoSchema !== false,
    aggregateRating:
      reviewEntries.length > 0
        ? {
            ratingValue: Number(avgRating),
            reviewCount: reviewEntries.length,
          }
        : undefined,
    content: {
      id: content.id,
      title: content.title,
      tldr: content.tldr,
      schemaType: placement?.schemaType ?? content.schemaType,
      schemaAttributes: content.schemaAttributes,
      authorName: pub.authorName || content.authorName,
      updatedAt: content.updatedAt,
      publishedAt: content.publishedAt ?? content.createdAt ?? null,
      blocks: content.blocks,
      // Öne çıkan görsel yoksa meta ile aynı üretilmiş paylaşım görseli (Article için görsel önerilir)
      imageUrl: featuredImageUrl ?? `${baseUrl}/og?title=${encodeURIComponent(content.title)}&site=${encodeURIComponent(localizedSite.name)}`,
    },
  });

  const children = pub.pillar ? family.filter((item) => item.id !== content.id && item.status === "published" && resolvePublishing(item.schemaAttributes).parentId === content.id) : [];
  const pillarList = children.length > 0 ? (
    <section className="mx-auto max-w-4xl space-y-3 px-4 py-6">
      <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl font-bold">{t("content.pillarHeading")}</h2>
      <ul className="space-y-2 text-sm">
        {children.map((item) => <li key={item.id}><a className="hover:underline" href={`${lb}/${item.slug}`}>{item.title}</a></li>)}
      </ul>
    </section>
  ) : null;
  const when = (value: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(value);
  const sortOrder = sp.c_sort === "newest" || sp.c_sort === "oldest" ? sp.c_sort : "popular";
  const isDiscussionContentType = content.type === "post" || content.type === "product" || content.type === "kb_tech" || content.type === "ai_prompt";
  const shouldRenderDiscussion =
    (allowComments || allowReviews) &&
    (isDiscussionContentType || commentEntries.length > 0 || reviewEntries.length > 0 || sp.yorum === "bekliyor");
  const discussion = shouldRenderDiscussion ? (
    <PostDiscussion
      t={t}
      headingFont={tokens.typography.headingFont}
      radius={tokens.geometry.borderRadius}
      authorName={tpl && content.type === "post" && authorName && !treeHas(tpl.blocks, "tpl_post_meta") ? authorName : null}
      authorHref={authorHref}
      comments={
        allowComments
          ? commentEntries.map((entry) => ({
              id: entry.id,
              parentId: entry.parentId,
              authorName: entry.authorName,
              body: entry.body,
              isVerified: entry.isVerified,
              dateLabel: entry.createdAt ? when(entry.createdAt) : undefined,
              createdAtMs: entry.createdAt ? new Date(entry.createdAt).getTime() : 0,
              tags: entry.tags,
            }))
          : []
      }
      reviews={
        allowReviews
          ? reviewEntries.map((entry) => ({
              id: entry.id,
              authorName: entry.authorName,
              body: entry.body,
              title: entry.title,
              rating: entry.rating,
              pros: entry.pros,
              cons: entry.cons,
              isVerified: entry.isVerified,
              dateLabel: entry.createdAt ? when(entry.createdAt) : undefined,
              createdAtMs: entry.createdAt ? new Date(entry.createdAt).getTime() : 0,
              tags: entry.tags,
            }))
          : []
      }
      avgRating={avgRating}
      reply={allowComments || allowReviews ? { contentId: content.id, locale, slug: content.slug } : null}
      allowComments={allowComments}
      allowReviews={allowReviews && (content.type === "product" || reviewEntries.length > 0 || pub.allowReviews === true)}
      sort={sortOrder}
      pagePath={`${lb}/${content.slug}`}
      notice={sp.yorum === "bekliyor" ? t("content.replySent") : null}
    />
  ) : null;
  if (tpl) {
    const [menu, catIndex] = await Promise.all([getResolvedMenu(siteId, locale), getScopedRepository(siteId).listTaxonomies("category")]);
    const ctx = buildTemplateContext({ lb,
      site: site ? { name: site.name, tagline: site.tagline } : null,
      locale,
      menu,
      tokens,
      menuLabel: t("site.menu"),
      breadcrumbs: [{ name: "Ana sayfa", href: (lb || "/") }, ...(parent ? [{ name: parent.title, href: `${lb}/${parent.slug}` }] : []), { name: content.title, href: `${lb}/${content.slug}` }],
      post: {
        title: content.title,
        content: <RscBlockRenderer blocks={contentBlocks} themeId={skinId} tokens={tokens} lcp={!featuredImageUrl} mediaFocal={mediaFocal} locale={locale} dynamic={dynamicData} pageSchema={pageSchema} patterns={syncedPatterns} form={formCtx} tpl={cover} />,
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
          <RscBlockRenderer blocks={tpl.blocks} themeId={skinId} tokens={tokens} locale={locale} tpl={ctx} patterns={syncedPatterns} />
        </div>
        {pillarList}
        {discussion}
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
          blocks={contentBlocks}
          themeId={skinId}
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
          className={readPageOptions(content.schemaAttributes as Record<string, unknown>).hideTitle ? "sr-only" : "text-3xl sm:text-4xl font-extrabold tracking-tight text-nx-fg"}
        >
          {content.title}
        </h1>
        {content.type === "post" && authorName ? <p className="text-sm text-nx-soft"><a href={authorHref ?? "#"} className="hover:underline">{t("content.authorBy", { name: authorName })}</a></p> : null}
        {parent ? <p className="text-sm"><a className="hover:underline" href={`${lb}/${parent.slug}`}>{t("content.parentPage")}: {parent.title}</a></p> : null}

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

          {reviewEntries.length > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="text-amber-500">★★★★★</span>
              <span>
                {t("content.ratingSummary", { avg: avgRating, n: reviewEntries.length })}
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
        blocks={contentBlocks}
        themeId={skinId}
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
        <ContentShareBar
          title={content.title}
          pageUrl={pageUrl}
          markdownHref={`${lb}/${content.slug}?format=md`}
          borderRadius={tokens.geometry.borderRadius}
          shareHeading={t("content.shareHeading")}
        />
      )}

      {pillarList}
      {discussion}
    </article>
  );
}
