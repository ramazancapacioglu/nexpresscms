import React from "react";
import { createTranslator } from "@nexpress/i18n";
import { normalizeDynamicQuery, type DesignTokens, type DynamicItem, type DynamicMeta, type DynamicQuery } from "@nexpress/core";
import { ResponsiveImage } from "./responsive-image";

const COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

const dateLabel = (iso: string | null | undefined, locale: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return { text: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(d), iso: d.toISOString().slice(0, 10) };
  } catch {
    return { text: d.toISOString().slice(0, 10), iso: d.toISOString().slice(0, 10) };
  }
};

/**
 * Sorgu döngüsü görünümü (RSC): kart ızgarası ya da liste. Başlık `h2`, öğe başlıkları `h3`; öğeler gerçek bağlantılardır
 * (iç bağlantı sinyali). Öğe yoksa yalnızca `emptyText` varsa bir not, yoksa hiçbir şey çizilmez.
 */
export function DynamicListView({ query, items, tokens, locale = "tr", meta }: { query: DynamicQuery; items: DynamicItem[]; tokens: DesignTokens; locale?: string; meta?: DynamicMeta }) {
  if (items.length === 0 && !meta) return query.emptyText ? <p className="text-sm opacity-70">{query.emptyText}</p> : null;
  const t = createTranslator(locale);
  const list = query.layout === "list";
  return (
    <section id={meta ? `nx-dl-${meta.key}` : undefined} aria-label={query.heading || undefined} className="space-y-4">
      {meta ? <QueryControls query={query} meta={meta} t={t} tokens={tokens} /> : null}
      {items.length === 0 ? <p className="text-sm opacity-70">{query.emptyText || t("query.noResults")}</p> : null}
      {query.heading ? <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight">{query.heading}</h2> : null}
      {items.length > 0 ? <ul className={list ? "divide-y divide-current/10" : `grid grid-cols-1 gap-5 ${COLS[query.columns] ?? COLS[3]}`}>
        {items.map((it) => {
          const when = query.showDate ? dateLabel(it.date, locale) : null;
          return (
            <li key={it.id} className={list ? "flex gap-4 py-4" : "overflow-hidden border"} style={list ? undefined : { borderColor: tokens.colors.border, borderRadius: tokens.geometry.borderRadius }}>
              {query.showImage && it.image ? (
                <a href={it.url} tabIndex={-1} aria-hidden="true" className={list ? "block w-28 shrink-0 overflow-hidden" : "block"}>
                  <ResponsiveImage src={it.image} alt="" className={list ? "h-20 w-full object-cover" : "aspect-[16/9] w-full object-cover"} />
                </a>
              ) : null}
              <div className={list ? "min-w-0 flex-1 space-y-1" : "space-y-1.5 p-4"}>
                {when ? <time dateTime={when.iso} className="block text-xs opacity-60">{when.text}</time> : null}
                <h3 className="text-base font-semibold leading-snug"><a href={it.url} className="hover:underline">{it.title}</a></h3>
                {query.showExcerpt && it.excerpt ? <p className="line-clamp-3 text-sm opacity-75">{it.excerpt}</p> : null}
                {it.price ? <p className="text-sm font-semibold">{it.price}</p> : null}
              </div>
            </li>
          );
        })}
      </ul> : null}
      {meta && meta.pages > 1 ? <QueryPager meta={meta} t={t} /> : null}
    </section>
  );
}

type T = ReturnType<typeof createTranslator>;

/** Bu bloğun parametreleri güncellenmiş bir adres (diğer parametreler korunur; sayfa 1'de `page` yazılmaz). */
function hrefFor(meta: DynamicMeta, patch: Partial<Record<"q" | "cat" | "sort" | "page", string>>): string {
  const next = { q: meta.q, cat: meta.cat, sort: meta.sort, page: String(meta.page), ...patch };
  if ("q" in patch || "cat" in patch || "sort" in patch) next.page = patch.page ?? "1";
  const sp = new URLSearchParams(meta.keep);
  if (next.q) sp.set(`${meta.key}_q`, next.q);
  if (next.cat) sp.set(`${meta.key}_cat`, next.cat);
  if (next.sort && next.sort !== "newest") sp.set(`${meta.key}_sort`, next.sort);
  if (next.page && next.page !== "1") sp.set(`${meta.key}_page`, next.page);
  const qs = sp.toString();
  return `${qs ? `?${qs}` : "?"}#nx-dl-${meta.key}`;
}

function QueryControls({ query, meta, t, tokens }: { query: DynamicQuery; meta: DynamicMeta; t: T; tokens: DesignTokens }) {
  const hasForm = query.showSearch || query.showSort;
  return (
    <div className="space-y-3">
      {hasForm ? (
        <form method="get" action={`#nx-dl-${meta.key}`} className="flex flex-wrap items-end gap-2 text-sm">
          {Object.entries(meta.keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {meta.cat ? <input type="hidden" name={`${meta.key}_cat`} value={meta.cat} /> : null}
          {query.showSearch ? (
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t("query.searchLabel")}</span>
              <input type="search" name={`${meta.key}_q`} defaultValue={meta.q} maxLength={80} placeholder={t("query.searchPlaceholder")} className="h-9 w-full border bg-transparent px-3" style={{ borderColor: "currentColor", borderRadius: "0.5rem" }} />
            </label>
          ) : null}
          {query.showSort ? (
            <label>
              <span className="sr-only">{t("query.sortLabel")}</span>
              <select name={`${meta.key}_sort`} defaultValue={meta.sort} className="h-9 border bg-transparent px-2" style={{ borderRadius: "0.5rem" }}>
                <option value="newest">{t("query.sortNewest")}</option>
                <option value="oldest">{t("query.sortOldest")}</option>
                <option value="title">{t("query.sortTitle")}</option>
              </select>
            </label>
          ) : null}
          <button type="submit" className="h-9 px-4 font-semibold" style={{ background: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: "0.5rem" }}>{t("query.apply")}</button>
        </form>
      ) : null}
      {query.showFilters && meta.categories.length > 0 ? (
        <nav aria-label={t("query.filters")} className="flex flex-wrap gap-2 text-sm">
          <a href={hrefFor(meta, { cat: "" })} aria-current={meta.cat === "" ? "true" : undefined} className={`border px-3 py-1 ${meta.cat === "" ? "font-bold" : "opacity-80 hover:opacity-100"}`} style={{ borderRadius: "9999px" }}>{t("query.all")}</a>
          {meta.categories.map((c) => (
            <a key={c.slug} href={hrefFor(meta, { cat: c.slug })} aria-current={meta.cat === c.slug ? "true" : undefined} className={`border px-3 py-1 ${meta.cat === c.slug ? "font-bold" : "opacity-80 hover:opacity-100"}`} style={{ borderRadius: "9999px" }}>
              {c.name} <span className="opacity-60">({c.count})</span>
            </a>
          ))}
        </nav>
      ) : null}
      {hasForm || query.showFilters ? <p className="text-xs opacity-60" role="status">{t("query.results", { n: meta.total })}</p> : null}
    </div>
  );
}

function pageWindow(page: number, pages: number): number[] {
  const set = new Set([1, pages, page - 1, page, page + 1]);
  return [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

function QueryPager({ meta, t }: { meta: DynamicMeta; t: T }) {
  const nums = pageWindow(meta.page, meta.pages);
  return (
    <nav aria-label={t("query.pagination")} className="flex flex-wrap items-center justify-center gap-1.5 border-t pt-4 text-sm">
      {meta.page > 1 ? <a rel="prev" href={hrefFor(meta, { page: String(meta.page - 1) })} className="px-3 py-1 underline">← {t("query.prev")}</a> : null}
      {nums.map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && n - nums[i - 1]! > 1 ? <span aria-hidden="true" className="opacity-50">…</span> : null}
          <a href={hrefFor(meta, { page: String(n) })} aria-current={n === meta.page ? "page" : undefined} className={`min-w-8 border px-2 py-1 text-center ${n === meta.page ? "font-bold" : "opacity-80"}`} style={{ borderRadius: "0.5rem" }}>{n}</a>
        </React.Fragment>
      ))}
      {meta.page < meta.pages ? <a rel="next" href={hrefFor(meta, { page: String(meta.page + 1) })} className="px-3 py-1 underline">{t("query.next")} →</a> : null}
    </nav>
  );
}

export const queryOf = (props: Record<string, unknown> | undefined) => normalizeDynamicQuery(props);
