import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "@/components/public/link";
import { resolvePublishing } from "@nexpress/core";
import { getPublicMediaFocal, getPublicSite, loadPageForms, listPublicReviews, resolvePublicContent } from "@/lib/public-data";
import { getThemeManifest, ResponsiveImage, RscBlockRenderer } from "@nexpress/themes";
import { buildPageSchemaGraph, resolveSeoMeta } from "@nexpress/seo-core";
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
  searchParams: Promise<{ nx_draft?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { nx_draft } = await searchParams;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
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
    path: `/${locale}/${content.slug}`,
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
    robots: draftMeta ? { index: false, follow: false } : seoMeta.robots,
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
  await trackBotVisit("page");
  await trackAiReferral();

  const draft = await resolveDraftPreview(siteId, locale, slug, sp.nx_draft);
  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    draft ? Promise.resolve({ content: draft, isRedirect: false }) : resolvePublicContent(siteId, slug, locale),
  ]);

  if (!resolved || !resolved.content) {
    return redirectOrNotFound(siteId, `/${locale}/${slug}`);
  }

  if (resolved.isRedirect) {
    permanentRedirect(`/${locale}/${resolved.content.slug}`);
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
  const pageUrl = `${baseUrl}/${locale}/${content.slug}`;

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
  const canvas = content.schemaAttributes?.canvas === true;
  const pageForms = await loadPageForms(siteId, content.blocks);
  const formCtx = { forms: pageForms, path: `/${locale}/${content.slug}`, token: createFormToken(`/${locale}/${content.slug}`), status: sp.form === "sent" || sp.form === "error" ? sp.form : null, blockId: sp.fb ?? null } as const;
  const banner = draft ? <p role="status" className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Taslak önizleme: bu sayfa yayında değil ve yalnızca bu bağlantıyla görüntülenir.</p> : null;
  const switcher = <LanguageSwitcher alternates={await localeSwitcherLinks(siteId, content.contentId, locale)} />;

  if (canvas) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
        />
        {banner}
        {switcher}
        <RscBlockRenderer
          blocks={content.blocks}
          themeId={activeTheme.id}
          tokens={tokens}
          mediaFocal={mediaFocal}
          locale={locale}
          form={formCtx}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      <header className="space-y-4 border-b pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="text-slate-500 hover:underline">
              ← Ana Sayfa
            </Link>
            <span className="text-slate-300">/</span>
            <span
              style={{
                backgroundColor: tokens.colors.muted,
                color: tokens.colors.primary,
              }}
              className="rounded px-2.5 py-0.5 font-mono font-bold uppercase"
            >
              {content.type} • @{content.schemaType}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/${content.slug}?format=md`}
              className="rounded border px-2.5 py-1 font-mono text-xs text-slate-700 hover:bg-slate-100"
            >
              📄 Saf Markdown (?format=md)
            </Link>
            <Link
              href={`/admin/contents?id=${content.id}&type=${content.type}`}
              className="rounded border px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              ✏️ Editörde Düzenle
            </Link>
          </div>
        </div>

        <h1
          style={{ fontFamily: tokens.typography.headingFont }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
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
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600"
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
              className="overflow-hidden border border-slate-200 bg-slate-950"
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
              <figcaption className="text-xs text-slate-500 text-center italic">
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
        form={formCtx}
      />

      {/* Sosyal Paylaşım Çubuğu (0-KB RSC) */}
      {showShareBar && (
        <section
          style={{ borderRadius: tokens.geometry.borderRadius }}
          className="border border-slate-200 bg-slate-50 p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("content.shareHeading")}
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {content.title}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title)}&url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-800 hover:bg-slate-100"
            >
              𝕏 (Twitter)
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-800 hover:bg-slate-100"
            >
              LinkedIn
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(content.title + " " + pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-800 hover:bg-slate-100"
            >
              WhatsApp
            </a>
            <Link
              href={`/${locale}/${content.slug}?format=md`}
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
                className="text-2xl font-bold text-slate-900"
              >
                {t("content.reviewsHeading", { n: approvedReviews.length })}
              </h2>
              <p className="text-sm text-slate-600">
                {t("content.reviewsSubheading")}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5">
              <div className="text-2xl font-extrabold text-amber-600">
                {avgRating}
                <span className="text-xs font-normal text-amber-700"> / 5.0</span>
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
                  className="border border-slate-200 bg-white p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {rev.authorName}
                      </span>
                      {rev.isVerified && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          ✓ {t("content.verified")}
                        </span>
                      )}
                    </div>
                    <div className="text-amber-500 text-xs font-bold">
                      {"★".repeat(rev.rating)} ({rev.rating}/5)
                    </div>
                  </div>
                  {rev.title && (
                    <h3 className="font-bold text-slate-900 text-sm">
                      {rev.title}
                    </h3>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {rev.body}
                  </p>
                  {(rev.pros.length > 0 || rev.cons.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      {rev.pros.length > 0 && (
                        <div className="rounded bg-emerald-50/70 border border-emerald-200/70 p-2.5 text-emerald-900">
                          <strong className="text-emerald-700">+ {t("content.pros")}: </strong>
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
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              {t("content.noReviews")}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
