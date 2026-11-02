import React from "react";
import { normalizeDynamicQuery, type DesignTokens, type DynamicItem, type DynamicQuery } from "@nexpress/core";
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
export function DynamicListView({ query, items, tokens, locale = "tr" }: { query: DynamicQuery; items: DynamicItem[]; tokens: DesignTokens; locale?: string }) {
  if (items.length === 0) return query.emptyText ? <p className="text-sm opacity-70">{query.emptyText}</p> : null;
  const list = query.layout === "list";
  return (
    <section aria-label={query.heading || undefined} className="space-y-4">
      {query.heading ? <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl font-bold tracking-tight">{query.heading}</h2> : null}
      <ul className={list ? "divide-y divide-current/10" : `grid grid-cols-1 gap-5 ${COLS[query.columns] ?? COLS[3]}`}>
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
      </ul>
    </section>
  );
}

export const queryOf = (props: Record<string, unknown> | undefined) => normalizeDynamicQuery(props);
