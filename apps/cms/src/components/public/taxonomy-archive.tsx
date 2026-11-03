import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { filterDynamicItems, normalizeDynamicQuery, paginate, type DynamicItem } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getThemeManifest, DynamicListView, RscBlockRenderer } from "@nexpress/themes";
import { getDynamicCandidates } from "@/lib/dynamic-content";
import { getResolvedMenu } from "@/lib/menu-data";
import { templateFor } from "@/lib/templates";
import { buildTemplateContext } from "@/lib/template-context";
import { getPublicSite } from "@/lib/public-data";

type Kind = "category" | "tag";

const PAGE_SIZE = 12;

async function load(kind: Kind, locale: string, slug: string, page = 1) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, terms] = await Promise.all([getPublicSite(siteId), getScopedRepository(siteId).listTaxonomies(kind)]);
  const term = terms.find((t) => t.slug === slug);
  if (!term) return null;
  const candidates = await getDynamicCandidates(siteId, locale);
  const base = { [kind]: term.slug, orderBy: "newest" } as const;
  const all: DynamicItem[] = [
    ...filterDynamicItems(candidates, normalizeDynamicQuery({ ...base, source: "posts" })),
    ...filterDynamicItems(candidates, normalizeDynamicQuery({ ...base, source: "pages" })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return { site, term, paged: paginate(all, page, PAGE_SIZE) };
}

/** `/{locale}/kategori/{slug}` ve `/{locale}/etiket/{slug}`: terime ait yayınlar (yalnızca herkese açık, dizine açık içerik). */
export async function archiveMetadata(kind: Kind, params: Promise<{ locale: string; slug: string }>, searchParams: Promise<{ sayfa?: string }>): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = Number((await searchParams).sayfa) || 1;
  const data = await load(kind, locale, slug, page);
  if (!data) return { robots: { index: false, follow: false } };
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const path = `/${locale}/${kind === "category" ? "kategori" : "etiket"}/${slug}`;
  return {
    title: data.term.seoTitle || `${data.term.name}${data.site?.name ? ` — ${data.site.name}` : ""}`,
    description: data.term.seoDescription || data.term.description || `${data.term.name} ile ilgili yayınlar.`,
    alternates: { canonical: `${base}${path}${data.paged.page > 1 ? `?sayfa=${data.paged.page}` : ""}` },
    // Boş arşiv ince içeriktir: dizine alınmaz
    robots: data.paged.total === 0 ? { index: false, follow: true } : undefined,
  };
}

export async function TaxonomyArchive({ kind, params, searchParams }: { kind: Kind; params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ sayfa?: string }> }) {
  const { locale, slug } = await params;
  const page = Number((await searchParams).sayfa) || 1;
  const data = await load(kind, locale, slug, page);
  if (!data) notFound();
  const tokens = data.site?.designTokens ?? getThemeManifest(data.site?.activeThemeId ?? "corporate-aurora").tokens;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  // Tema oluşturucu şablonu: terimin seçtiği şablon → türün varsayılanı → yerleşik görünüm
  const tpl = await templateFor(siteId, kind, data.term.templateId, { locale, slug, ...(kind === "category" ? { categories: [slug] } : { tags: [slug] }) });
  if (tpl) {
    const menu = await getResolvedMenu(siteId, locale);
    const prefix = kind === "category" ? "kategori" : "etiket";
    const ctx = buildTemplateContext({
      site: data.site ? { name: data.site.name, tagline: data.site.tagline } : null,
      locale,
      menu,
      tokens,
      menuLabel: "Menü",
      breadcrumbs: [{ name: "Ana sayfa", href: `/${locale}` }, { name: kind === "category" ? "Kategoriler" : "Etiketler", href: `/${locale}/${prefix}` }, { name: data.term.name, href: `/${locale}/${prefix}/${slug}` }],
      archive: {
        title: data.term.name,
        description: data.term.description,
        kindLabel: kind === "category" ? "Kategori" : "Etiket",
        items: data.paged.items,
        page: data.paged.page,
        pages: data.paged.pages,
        pageHref: (n) => `/${locale}/${prefix}/${slug}${n > 1 ? `?sayfa=${n}` : ""}`,
      },
    });
    return <RscBlockRenderer blocks={tpl.blocks} themeId={data.site?.activeThemeId ?? "corporate-aurora"} tokens={tokens} locale={locale} tpl={ctx} />;
  }
  const query = normalizeDynamicQuery({ source: "posts", layout: "cards", columns: 3, limit: 24, emptyText: "Bu başlık altında henüz yayın yok." });
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{kind === "category" ? "Kategori" : "Etiket"}</p>
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{data.term.name}</h1>
        {data.term.description ? <p className="max-w-2xl text-sm opacity-80">{data.term.description}</p> : null}
      </header>
      <DynamicListView query={query} items={data.paged.items} tokens={tokens} locale={locale} />
      {data.paged.pages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
          {data.paged.page > 1 ? <a rel="prev" href={`/${locale}/${kind === "category" ? "kategori" : "etiket"}/${slug}${data.paged.page > 2 ? `?sayfa=${data.paged.page - 1}` : ""}`} className="underline">← Yeni yayınlar</a> : <span />}
          <span className="opacity-70">Sayfa {data.paged.page} / {data.paged.pages}</span>
          {data.paged.page < data.paged.pages ? <a rel="next" href={`/${locale}/${kind === "category" ? "kategori" : "etiket"}/${slug}?sayfa=${data.paged.page + 1}`} className="underline">Eski yayınlar →</a> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
