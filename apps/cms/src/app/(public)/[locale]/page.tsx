import { hasDynamicQueryParams } from "@nexpress/core";
import React from "react";
import { headers } from "next/headers";
import { Link } from "@/components/public/link";
import { getPublicContentBySlug, getPublicMediaFocal, getPublicSite, listPublishedContents, loadPageForms } from "@/lib/public-data";
import { getThemeManifest, INK_GRID_HOME_SLUG, INK_GRID_ID, AKINSOFT_DEMO_HOME_SLUG, AKINSOFT_THEME_ID, RscBlockRenderer } from "@nexpress/themes";
import { jsonLdString, buildPageSchemaGraph } from "@nexpress/seo-core";
import { getSyncedPatternsMap } from "@/lib/templates";
import type { Metadata } from "next";
import { createTranslator } from "@nexpress/i18n";
import { getPreviewTheme } from "@/lib/public-theme";
import { createFormToken } from "@/lib/form-token";
import { loadDynamicData } from "@/lib/dynamic-content";
import { trackAiReferral, trackBotVisit } from "@/lib/bot-log";
import { hreflangAlternates, localeSwitcherLinks } from "@/lib/alternates";
import { LanguageSwitcher } from "@/components/public/language-switcher";

/** Tema demosu varsa onu, yoksa klasik ana sayfa adresini kullanır. */
async function resolveHomeSlug(siteId: string, themeId: string, locale: string) {
  if (themeId === INK_GRID_ID) return INK_GRID_HOME_SLUG;
  if (themeId === AKINSOFT_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, AKINSOFT_DEMO_HOME_SLUG, locale);
    if (demo) return AKINSOFT_DEMO_HOME_SLUG;
  }
  return "ana-sayfa";
}

/** Ana sayfa: dil başına canonical ve karşılıklı hreflang (yalnızca yayındaki çeviriler). */
export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { locale } = await params;
  const sp0 = await searchParams;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const site = await getPublicSite(siteId);
  const themeId = site?.activeThemeId ?? "corporate-aurora";
  const home = await getPublicContentBySlug(siteId, await resolveHomeSlug(siteId, themeId, locale), locale);
  return {
    ...(hasDynamicQueryParams(sp0) ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      ...(home ? { languages: await hreflangAlternates(siteId, home.contentId, baseUrl) } : {}),
    },
  };
}

export default async function PublicHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ form?: string; fb?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = createTranslator(locale);
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  await trackBotVisit("page");
  await trackAiReferral();

  const site = await getPublicSite(siteId);
  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const isInk = activeTheme.id === INK_GRID_ID;
  const isAkinsoft = activeTheme.id === AKINSOFT_THEME_ID;
  const preview = await getPreviewTheme(siteId);
  const tokens = preview?.tokens ?? site?.designTokens ?? activeTheme.tokens;
  const homeContent = await getPublicContentBySlug(siteId, await resolveHomeSlug(siteId, activeTheme.id, locale), locale);
  const mediaFocal = await getPublicMediaFocal(siteId);
  const allContents = isInk || isAkinsoft ? [] : await listPublishedContents(siteId, locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const switcher = homeContent ? <LanguageSwitcher alternates={await localeSwitcherLinks(siteId, homeContent.contentId, locale)} /> : null;

  const schemaGraph = await buildPageSchemaGraph({
    siteId,
    siteName: site?.name ?? "NexPress CMS",
    siteUrl: baseUrl,
    locale,
    pageUrl: `${baseUrl}/${locale}`,
    content: homeContent
      ? {
          id: homeContent.id,
          title: homeContent.title,
          tldr: homeContent.tldr,
          schemaType: homeContent.schemaType,
          schemaAttributes: homeContent.schemaAttributes,
        }
      : undefined,
  });

  return (
    <div className={isInk || isAkinsoft ? "" : "space-y-14"}>
      {/* Bağlantılı Schema.org JSON-LD Grafiği */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(schemaGraph) }}
      />

      {switcher}
      {homeContent ? (
        <RscBlockRenderer
          blocks={homeContent.blocks}
          themeId={activeTheme.id}
          tokens={tokens}
          mediaFocal={mediaFocal}
          locale={locale}
          patterns={await getSyncedPatternsMap(siteId)}
          dynamic={await loadDynamicData(siteId, locale, homeContent.blocks, homeContent.contentId, sp)}
          pageSchema={{ title: homeContent.title, tldr: homeContent.tldr ?? "", rich: ((homeContent.schemaAttributes as Record<string, unknown>)?.richSchema ?? {}) as never }}
          form={{ forms: await loadPageForms(siteId, homeContent.blocks), path: `/${locale}`, token: createFormToken(`/${locale}`), status: sp.form === "sent" || sp.form === "error" ? sp.form : null, blockId: sp.fb ?? null }}
        />
      ) : (
        <div className="rounded-xl border p-8 text-center">
          <h1 className="text-2xl font-bold">{t("site.homeReady")}</h1>
          <p className="mt-2 text-sm text-nx-soft">
            {t("site.homeSeed", { cmd: "pnpm db:seed" })}
          </p>
        </div>
      )}

      {isInk || isAkinsoft ? null : (
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-2xl font-bold text-nx-fg"
            >
              {t("site.homeListTitle")}
            </h2>
            <p className="text-sm text-nx-muted">
              {t("site.homeListBody", { md: "?format=md" })}
            </p>
          </div>
          <Link
            href="/admin/contents"
            className="text-xs font-semibold underline"
            style={{ color: tokens.colors.primary }}
          >
            {t("site.homeEdit")}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {allContents
            .filter((c) => c.slug !== "ana-sayfa")
            .map((item) => (
              <article
                key={item.id}
                style={{
                  borderRadius: tokens.geometry.borderRadius,
                  borderColor: tokens.colors.border,
                }}
                className="flex flex-col justify-between border bg-nx-card p-6 shadow-xs transition hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      style={{
                        backgroundColor: tokens.colors.muted,
                        color: tokens.colors.primary,
                      }}
                      className="rounded px-2.5 py-0.5 font-mono font-semibold uppercase"
                    >
                      {item.type} • @{item.schemaType}
                    </span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      SEO: {item.seoScore}/100
                    </span>
                  </div>
                  <Link
                    href={`/${locale}/${item.slug}`}
                    style={{ fontFamily: tokens.typography.headingFont }}
                    className="block text-lg font-bold text-nx-fg hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.tldr && (
                    <p className="text-xs text-nx-soft line-clamp-3 leading-relaxed">
                      {item.tldr}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs">
                  <Link
                    href={`/${locale}/${item.slug}`}
                    style={{ color: tokens.colors.primary }}
                    className="font-semibold hover:underline"
                  >
                    {t("site.openPage")}
                  </Link>
                  <Link
                    href={`/${locale}/${item.slug}?format=md`}
                    className="font-mono text-nx-muted hover:text-nx-fg"
                  >
                    ?format=md (0ms)
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </section>
      )}
    </div>
  );
}
