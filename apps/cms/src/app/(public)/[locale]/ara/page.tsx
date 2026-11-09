import React from "react";
import { siteLocaleBase } from "@/lib/locale-url";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { bm25Rank, makeSnippet, resolvePublishing, synthesizeSearchAnswer, templateHasBlock } from "@nexpress/core";
import { createTranslator } from "@nexpress/i18n";
import { getThemeManifest, RscBlockRenderer } from "@nexpress/themes";
import { Link } from "@/components/public/link";
import { getResolvedMenu } from "@/lib/menu-data";
import { getPublicSite, listPublishedContents } from "@/lib/public-data";
import { buildTemplateContext } from "@/lib/template-context";
import { recordSupportMiss } from "@/lib/support-miss";
import { templateFor } from "@/lib/templates";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTranslator(locale)("search.title"), robots: { index: false, follow: true } };
}

const MAX_QUERY = 120;

/** Site içi arama: sunucuda BM25 (anahtar kelime); istemci JS'i yok, form düz GET'tir. */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const q = ((await searchParams).q ?? "").trim().slice(0, MAX_QUERY);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const lb = await siteLocaleBase(siteId, locale);

  let results: Array<{ id: string; slug: string; title: string; snippet: string; tldr?: string | null; body: string }> = [];
  if (q) {
    const contents = (await listPublishedContents(siteId, locale)).filter(
      (c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public"
    );
    const byId = new Map(contents.map((c) => [c.contentId, c]));
    const hits = bm25Rank(contents.map((c) => ({ id: c.contentId, title: c.title, body: c.markdownCache })), q, 20);
    results = hits.flatMap((h) => {
      const c = byId.get(h.id);
      return c
        ? [{ id: c.contentId, slug: c.slug, title: c.title, snippet: c.tldr || makeSnippet(c.markdownCache, q), tldr: c.tldr, body: c.markdownCache }]
        : [];
    });
    if (results.length === 0) {
      try {
        await recordSupportMiss(siteId, q);
      } catch {
        // Arama sayfası kayıt hatasıyla düşmez.
      }
    }
  }
  const directAnswer = q && results.length > 0 ? synthesizeSearchAnswer(results, q) : null;

  const tpl = await templateFor(siteId, "search", null, { locale, slug: "ara" });
  if (tpl && templateHasBlock(tpl.blocks, "tpl_archive_list")) {
    const site = await getPublicSite(siteId);
    const theme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
    const tokens = site?.designTokens ?? theme.tokens;
    const ctx = buildTemplateContext({ lb,
      site: site ? { name: site.name, tagline: site.tagline } : null,
      locale,
      menu: await getResolvedMenu(siteId, locale),
      tokens,
      menuLabel: t("site.menu"),
      breadcrumbs: [{ name: "Ana sayfa", href: (lb || "/") }, { name: t("search.title"), href: `${lb}/ara` }],
      archive: {
        title: q ? `"${q}" — ${t("search.title")}` : t("search.title"),
        description: q ? `${results.length} sonuç bulundu.` : t("search.placeholder"),
        kindLabel: t("search.title"),
        items: results.map((r) => ({
          id: r.id,
          title: r.title,
          url: `${lb}/${r.slug === "ana-sayfa" ? "" : r.slug}`.replace(/\/$/, ""),
          excerpt: r.snippet,
        })),
        page: 1,
        pages: 1,
        pageHref: () => `${lb}/ara${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      },
    });
    return <RscBlockRenderer blocks={tpl.blocks} themeId={theme.id} tokens={tokens} locale={locale} tpl={ctx} />;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("search.title")}</h1>
      <form method="get" action={`${lb}/ara`} role="search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={MAX_QUERY}
          placeholder={t("search.placeholder")}
          aria-label={t("common.siteSearch")}
          className="h-10 flex-1 rounded-md border px-3"
        />
        <button type="submit" className="h-10 rounded-md border px-4 font-medium">
          {t("search.button")}
        </button>
      </form>
      {q && results.length === 0 && <p>{t("search.noResults", { q })}</p>}
      {directAnswer && (
        <aside className="rounded-lg border p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{t("search.directAnswer")}</p>
          <p className="text-sm leading-relaxed">{directAnswer.summary}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="opacity-70">{t("search.sources")}:</span>
            {directAnswer.citations.map((c) => (
              <Link key={c.slug} href={`${lb}/${c.slug === "ana-sayfa" ? "" : c.slug}`.replace(/\/$/, "")} className="underline underline-offset-2">
                [{c.index}] {c.title}
              </Link>
            ))}
          </div>
        </aside>
      )}
      {results.length > 0 && (
        <ol className="space-y-5">
          {results.map((r) => (
            <li key={r.slug}>
              <Link href={`${lb}/${r.slug === "ana-sayfa" ? "" : r.slug}`.replace(/\/$/, "")} className="text-lg font-semibold underline-offset-2 hover:underline">
                {r.title}
              </Link>
              <p className="text-sm opacity-80">{r.snippet}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
