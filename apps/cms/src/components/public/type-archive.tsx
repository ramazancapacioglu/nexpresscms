import React from "react";
import { filterDynamicItems, findTypeByArchiveSlug, localeBase, normalizeDynamicQuery, paginate, resolveSiteSettings } from "@nexpress/core";
import type { Metadata } from "next";
import { getThemeManifest, DynamicListView } from "@nexpress/themes";
import { jsonLdString } from "@nexpress/seo-core";
import { getDynamicCandidates } from "@/lib/dynamic-content";
import { getPublicSite } from "@/lib/public-data";

const PAGE_SIZE = 12;

/** Adres bir özel türün arşiv adresiyse veriyi yükler; değilse `null` (çağıran 404/yönlendirme akışına devam eder). */
export async function loadTypeArchive(siteId: string, locale: string, slug: string, page = 1) {
  const site = await getPublicSite(siteId);
  const def = findTypeByArchiveSlug(resolveSiteSettings(site?.settings).general.contentTypes, slug);
  if (!def) return null;
  const candidates = await getDynamicCandidates(siteId, locale);
  const all = filterDynamicItems(candidates, normalizeDynamicQuery({ source: `type:${def.id}`, orderBy: "newest" }));
  return { site, def, paged: paginate(all, Math.max(1, Math.floor(page) || 1), PAGE_SIZE) };
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadTypeArchive>>>;

const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function typeArchiveMetadata(data: Loaded, locale: string): Metadata {
  const lb = localeBase(data.site, locale);
  const path = `${lb}/${data.def.archiveSlug}`;
  const title = `${data.def.labelPlural}${data.site?.name ? ` — ${data.site.name}` : ""}`;
  const description = data.def.archiveIntro || `${data.def.labelPlural} listesi.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl()}${path}${data.paged.page > 1 ? `?sayfa=${data.paged.page}` : ""}` },
    // Boş arşiv ince içeriktir: dizine alınmaz
    robots: data.paged.total === 0 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: `${baseUrl()}${path}`, type: "website", siteName: data.site?.name },
  };
}

/** `/{dil}/{arşiv-adresi}`: özel türün yayınlanmış kayıtları, sayfalı liste + CollectionPage/ItemList JSON-LD. */
export function TypeArchiveView({ data, locale }: { data: Loaded; locale: string }) {
  const { def, paged, site } = data;
  const lb = localeBase(site, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const path = `${lb}/${def.archiveSlug}`;
  const query = normalizeDynamicQuery({ source: `type:${def.id}`, layout: "cards", columns: 3, limit: PAGE_SIZE, emptyText: `Henüz yayınlanmış ${def.label.toLocaleLowerCase(locale)} yok.` });
  const graph = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: def.labelPlural,
    url: `${baseUrl()}${path}`,
    ...(def.archiveIntro ? { description: def.archiveIntro } : {}),
    isPartOf: { "@type": "WebSite", name: site?.name, url: baseUrl() },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: paged.total,
      itemListElement: paged.items.map((item, i) => ({ "@type": "ListItem", position: (paged.page - 1) * PAGE_SIZE + i + 1, url: item.url.startsWith("http") ? item.url : `${baseUrl()}${item.url}`, name: item.title })),
    },
  };
  const href = (n: number) => `${path}${n > 1 ? `?sayfa=${n}` : ""}`;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(graph) }} />
      <header className="space-y-2">
        <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{def.labelPlural}</h1>
        {def.archiveIntro ? <p className="max-w-2xl text-sm opacity-80">{def.archiveIntro}</p> : null}
      </header>
      <DynamicListView query={query} items={paged.items} tokens={tokens} locale={locale} />
      {paged.pages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
          {paged.page > 1 ? <a rel="prev" href={href(paged.page - 1)} className="underline">← Önceki</a> : <span />}
          <span className="opacity-70">Sayfa {paged.page} / {paged.pages}</span>
          {paged.page < paged.pages ? <a rel="next" href={href(paged.page + 1)} className="underline">Sonraki →</a> : <span />}
        </nav>
      ) : null}
    </div>
  );
}

