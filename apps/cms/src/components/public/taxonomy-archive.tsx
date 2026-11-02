import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { normalizeDynamicQuery, selectDynamicItems, type DynamicItem } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getThemeManifest, DynamicListView } from "@nexpress/themes";
import { getDynamicCandidates } from "@/lib/dynamic-content";
import { getPublicSite } from "@/lib/public-data";

type Kind = "category" | "tag";

async function load(kind: Kind, locale: string, slug: string) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, terms] = await Promise.all([getPublicSite(siteId), getScopedRepository(siteId).listTaxonomies(kind)]);
  const term = terms.find((t) => t.slug === slug);
  if (!term) return null;
  const candidates = await getDynamicCandidates(siteId, locale);
  const base = { [kind]: term.slug, limit: 24, orderBy: "newest" } as const;
  const items: DynamicItem[] = [
    ...selectDynamicItems(candidates, normalizeDynamicQuery({ ...base, source: "posts" })),
    ...selectDynamicItems(candidates, normalizeDynamicQuery({ ...base, source: "pages" })),
  ]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 24);
  return { site, term, items };
}

/** `/{locale}/kategori/{slug}` ve `/{locale}/etiket/{slug}`: terime ait yayınlar (yalnızca herkese açık, dizine açık içerik). */
export async function archiveMetadata(kind: Kind, params: Promise<{ locale: string; slug: string }>): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await load(kind, locale, slug);
  if (!data) return { robots: { index: false, follow: false } };
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const path = `/${locale}/${kind === "category" ? "kategori" : "etiket"}/${slug}`;
  return {
    title: data.term.seoTitle || `${data.term.name}${data.site?.name ? ` — ${data.site.name}` : ""}`,
    description: data.term.seoDescription || data.term.description || `${data.term.name} ile ilgili yayınlar.`,
    alternates: { canonical: `${base}${path}` },
    // Boş arşiv ince içeriktir: dizine alınmaz
    robots: data.items.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export async function TaxonomyArchive({ kind, params }: { kind: Kind; params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const data = await load(kind, locale, slug);
  if (!data) notFound();
  const tokens = data.site?.designTokens ?? getThemeManifest(data.site?.activeThemeId ?? "corporate-aurora").tokens;
  const query = normalizeDynamicQuery({ source: "posts", layout: "cards", columns: 3, limit: 24, emptyText: "Bu başlık altında henüz yayın yok." });
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{kind === "category" ? "Kategori" : "Etiket"}</p>
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{data.term.name}</h1>
        {data.term.description ? <p className="max-w-2xl text-sm opacity-80">{data.term.description}</p> : null}
      </header>
      <DynamicListView query={query} items={data.items} tokens={tokens} locale={locale} />
    </div>
  );
}
