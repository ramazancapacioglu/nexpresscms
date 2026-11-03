import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createTranslator } from "@nexpress/i18n";
import { filterDynamicItems, normalizeDynamicQuery, type DynamicCandidate } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { getThemeManifest } from "@nexpress/themes";
import { getDynamicCandidates } from "@/lib/dynamic-content";
import { getPublicSite } from "@/lib/public-data";

type Kind = "category" | "tag";

interface Row { id: string; slug: string; name: string; description: string | null; parentId: string | null; count: number }

async function load(kind: Kind, locale: string) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, terms, candidates] = await Promise.all([getPublicSite(siteId), getScopedRepository(siteId).listTaxonomies(kind), getDynamicCandidates(siteId, locale)]);
  const countOf = (slug: string, pool: DynamicCandidate[]) => (["posts", "pages"] as const).reduce((n, source) => n + filterDynamicItems(pool, normalizeDynamicQuery({ source, [kind]: slug })).length, 0);
  // Yalnızca en az bir herkese açık yayını olan terimler listelenir (boş arşivler site haritasında da yoktur)
  const rows: Row[] = terms.map((t) => ({ id: t.id, slug: t.slug, name: t.name, description: t.description ?? null, parentId: t.parentId ?? null, count: countOf(t.slug, candidates) })).filter((r) => r.count > 0);
  return { site, rows };
}

/** `/{locale}/kategori` ve `/{locale}/etiket`: tüm kategori (ağaç) ve etiket listesi — arşiv sayfalarına giden indeks. */
export async function taxonomyIndexMetadata(kind: Kind, params: Promise<{ locale: string }>): Promise<Metadata> {
  const { locale } = await params;
  const t = createTranslator(locale);
  const { site, rows } = await load(kind, locale);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const title = kind === "category" ? t("taxonomy.categoriesTitle") : t("taxonomy.tagsTitle");
  return {
    title: `${title}${site?.name ? ` — ${site.name}` : ""}`,
    alternates: { canonical: `${base}/${locale}/${kind === "category" ? "kategori" : "etiket"}` },
    robots: rows.length === 0 ? { index: false, follow: true } : undefined,
  };
}

function Tree({ rows, parent, depth, locale, prefix, t }: { rows: Row[]; parent: string | null; depth: number; locale: string; prefix: string; t: ReturnType<typeof createTranslator> }) {
  const level = rows.filter((r) => (r.parentId ?? null) === parent).sort((a, b) => a.name.localeCompare(b.name, locale));
  if (level.length === 0 || depth > 4) return null;
  return (
    <ul className={depth === 0 ? "grid gap-3 sm:grid-cols-2" : "mt-2 space-y-1 border-l border-nx-line pl-4"}>
      {level.map((r) => (
        <li key={r.id} className={depth === 0 ? "rounded-lg border border-nx-line bg-nx-card p-4" : undefined}>
          <a href={`/${locale}/${prefix}/${r.slug}`} className="font-semibold text-nx-link hover:underline">{r.name}</a>
          <span className="ml-2 text-xs text-nx-muted">{t("taxonomy.itemCount", { n: r.count })}</span>
          {r.description && depth === 0 ? <p className="mt-1 text-sm text-nx-soft">{r.description}</p> : null}
          <Tree rows={rows} parent={r.id} depth={depth + 1} locale={locale} prefix={prefix} t={t} />
        </li>
      ))}
    </ul>
  );
}

export async function TaxonomyIndex({ kind, params }: { kind: Kind; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const { site, rows } = await load(kind, locale);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const prefix = kind === "category" ? "kategori" : "etiket";
  const title = kind === "category" ? t("taxonomy.categoriesTitle") : t("taxonomy.tagsTitle");
  // Kategoriler üst/alt ilişkisiyle ağaç; etiketler düz liste. Üstü listede olmayan (boş) kategori kökte gösterilir.
  const ids = new Set(rows.map((r) => r.id));
  const normalized = rows.map((r) => (r.parentId && !ids.has(r.parentId) ? { ...r, parentId: null } : r));
  return (
    <div className="space-y-6">
      <nav aria-label="Sayfa yolu" className="text-xs text-nx-muted">
        <a href={`/${locale}`} className="hover:underline">{t("taxonomy.home")}</a> <span aria-hidden="true">/</span> <span aria-current="page">{title}</span>
      </nav>
      <h1 style={{ fontFamily: tokens.typography.headingFont }} className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-nx-soft">{t("taxonomy.indexEmpty", { kind: kind === "category" ? t("taxonomy.kindCategory") : t("taxonomy.kindTag") })}</p>
      ) : kind === "category" ? (
        <Tree rows={normalized} parent={null} depth={0} locale={locale} prefix={prefix} t={t} />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {[...rows].sort((a, b) => a.name.localeCompare(b.name, locale)).map((r) => (
            <li key={r.id}><a href={`/${locale}/${prefix}/${r.slug}`} className="inline-block rounded-full border border-nx-line px-3 py-1 text-sm text-nx-link hover:underline">{r.name} <span className="text-xs text-nx-muted">({r.count})</span></a></li>
          ))}
        </ul>
      )}
    </div>
  );
}
