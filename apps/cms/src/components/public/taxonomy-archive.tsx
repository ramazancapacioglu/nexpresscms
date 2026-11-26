import React from "react";
import { localeBase, resolveLocalizedSiteIdentity, resolveSiteSettings } from "@nexpress/core";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { filterDynamicItems, normalizeDynamicQuery, paginate, type DynamicItem } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { buildPageSchemaGraph, jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, DynamicListView, RscBlockRenderer } from "@nexpress/themes";
import { getDynamicCandidates } from "@/lib/dynamic-content";
import { getResolvedMenu } from "@/lib/menu-data";
import { organizationFor } from "@/lib/organization-schema";
import { templateFor } from "@/lib/templates";
import { buildTemplateContext } from "@/lib/template-context";
import { getPublicSite } from "@/lib/public-data";
import { INDEXABLE_ROBOTS, metaDescription, NOINDEX_ROBOTS, titleWithSite } from "@/lib/robots-meta";

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
  const lb = localeBase(data.site, locale);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const path = `${lb}/${kind === "category" ? "kategori" : "etiket"}/${slug}`;
  return {
    // Kısa terim adına ("Makaleler") site adı eklenir; uzun açıklama arama sonucunda kesilmesin diye kelime sınırında 160'a indirilir
    title: titleWithSite(data.term.seoTitle || `${data.term.name}${data.site?.name ? ` — ${data.site.name}` : ""}`, resolveLocalizedSiteIdentity(data.site, locale).name),
    description: metaDescription(data.term.seoDescription || data.term.description || `${data.term.name} ile ilgili yayınlar.`),
    alternates: { canonical: `${base}${path}${data.paged.page > 1 ? `?sayfa=${data.paged.page}` : ""}` },
    // Boş arşiv ve 3'ten az yayınlı etiket ince içeriktir (dizine girmez, bağlantılar izlenir). Etiket noindex ayarı da dizini kapatır.
    robots:
      data.paged.total === 0 || (kind === "tag" && (data.paged.total < 3 || resolveSiteSettings(data.site?.settings).seo.noIndexTagArchives))
        ? NOINDEX_ROBOTS
        : INDEXABLE_ROBOTS,
  };
}

export async function TaxonomyArchive({ kind, params, searchParams }: { kind: Kind; params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ sayfa?: string }> }) {
  const { locale, slug } = await params;
  const page = Number((await searchParams).sayfa) || 1;
  const data = await load(kind, locale, slug, page);
  if (!data) notFound();
  const lb = localeBase(data.site, locale);
  const tokens = data.site?.designTokens ?? getThemeManifest(data.site?.activeThemeId ?? "corporate-aurora").tokens;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const prefix = kind === "category" ? "kategori" : "etiket";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const pageUrl = `${baseUrl}${lb}/${prefix}/${slug}${data.paged.page > 1 ? `?sayfa=${data.paged.page}` : ""}`;
  const localized = resolveLocalizedSiteIdentity(data.site, locale);
  const schemaGraph = await buildPageSchemaGraph({
    siteId,
    siteName: localized.name,
    siteUrl: baseUrl,
    locale,
    pageUrl,
    breadcrumbs: [
      { name: "Ana sayfa", url: `${baseUrl}${lb || "/"}` },
      { name: kind === "category" ? "Kategoriler" : "Etiketler", url: `${baseUrl}${lb}/${prefix}` },
      { name: data.term.name, url: pageUrl },
    ],
    organization: organizationFor(localized.seo),
    content: {
      id: `taxonomy:${kind}:${slug}`,
      title: data.term.seoTitle || data.term.name,
      tldr: data.term.seoDescription || data.term.description || `${data.term.name} ile ilgili içerikler.`,
      schemaType: "CollectionPage",
    },
  });
  const nodes = schemaGraph["@graph"] as Array<Record<string, unknown>>;
  const collectionNode = nodes.find((n) => n["@type"] === "CollectionPage");
  if (data.paged.items.length > 0) {
    const listId = `${pageUrl}#itemlist`;
    if (collectionNode) collectionNode.mainEntity = { "@id": listId };
    nodes.push({
      "@type": "ItemList",
      "@id": listId,
      name: data.term.name,
      numberOfItems: data.paged.total,
      itemListElement: data.paged.items.map((item, idx) => ({
        "@type": "ListItem",
        position: (data.paged.page - 1) * PAGE_SIZE + idx + 1,
        url: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
        name: item.title,
      })),
    });
  }
  const schemaScript = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schemaGraph) }} />;

  // Tema oluşturucu şablonu: terimin seçtiği şablon → türün varsayılanı → yerleşik görünüm
  const tpl = await templateFor(siteId, kind, data.term.templateId, { locale, slug, ...(kind === "category" ? { categories: [slug] } : { tags: [slug] }) });
  if (tpl) {
    const menu = await getResolvedMenu(siteId, locale);
    const ctx = buildTemplateContext({ lb,
      site: data.site ? { name: data.site.name, tagline: data.site.tagline } : null,
      locale,
      menu,
      tokens,
      menuLabel: "Menü",
      breadcrumbs: [{ name: "Ana sayfa", href: (lb || "/") }, { name: kind === "category" ? "Kategoriler" : "Etiketler", href: `${lb}/${prefix}` }, { name: data.term.name, href: `${lb}/${prefix}/${slug}` }],
      archive: {
        title: data.term.name,
        description: data.term.description,
        kindLabel: kind === "category" ? "Kategori" : "Etiket",
        items: data.paged.items,
        page: data.paged.page,
        pages: data.paged.pages,
        pageHref: (n) => `${lb}/${prefix}/${slug}${n > 1 ? `?sayfa=${n}` : ""}`,
      },
    });
    return (
      <>
        {schemaScript}
        <RscBlockRenderer blocks={tpl.blocks} themeId={data.site?.activeThemeId ?? "corporate-aurora"} tokens={tokens} locale={locale} tpl={ctx} />
      </>
    );
  }
  const query = normalizeDynamicQuery({ source: "posts", layout: "cards", columns: 3, limit: 24, emptyText: "Bu başlık altında henüz yayın yok." });
  return (
    <div className="space-y-6">
      {schemaScript}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{kind === "category" ? "Kategori" : "Etiket"}</p>
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{data.term.name}</h1>
        {data.term.description ? <p className="max-w-2xl text-sm opacity-80">{data.term.description}</p> : null}
      </header>
      <DynamicListView query={query} items={data.paged.items} tokens={tokens} locale={locale} />
      {data.paged.pages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
          {data.paged.page > 1 ? <a rel="prev" href={`${lb}/${kind === "category" ? "kategori" : "etiket"}/${slug}${data.paged.page > 2 ? `?sayfa=${data.paged.page - 1}` : ""}`} className="underline">← Yeni yayınlar</a> : <span />}
          <span className="opacity-70">Sayfa {data.paged.page} / {data.paged.pages}</span>
          {data.paged.page < data.paged.pages ? <a rel="next" href={`${lb}/${kind === "category" ? "kategori" : "etiket"}/${slug}?sayfa=${data.paged.page + 1}`} className="underline">Eski yayınlar →</a> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
