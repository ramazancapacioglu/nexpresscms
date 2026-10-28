import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { bm25Rank, makeSnippet, resolvePublishing } from "@nexpress/core";
import { Link } from "@/components/public/link";
import { listPublishedContents } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Ara",
  robots: { index: false, follow: true },
};

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
  const q = ((await searchParams).q ?? "").trim().slice(0, MAX_QUERY);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";

  let results: Array<{ slug: string; title: string; snippet: string }> = [];
  if (q) {
    const contents = (await listPublishedContents(siteId, locale)).filter(
      (c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public"
    );
    const byId = new Map(contents.map((c) => [c.contentId, c]));
    const hits = bm25Rank(contents.map((c) => ({ id: c.contentId, title: c.title, body: c.markdownCache })), q, 20);
    results = hits.flatMap((h) => {
      const c = byId.get(h.id);
      return c ? [{ slug: c.slug, title: c.title, snippet: c.tldr || makeSnippet(c.markdownCache, q) }] : [];
    });
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Ara</h1>
      <form method="get" action={`/${locale}/ara`} role="search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={MAX_QUERY}
          placeholder="Aramak istediğiniz sözcükler"
          aria-label="Site içi arama"
          className="h-10 flex-1 rounded-md border px-3"
        />
        <button type="submit" className="h-10 rounded-md border px-4 font-medium">
          Ara
        </button>
      </form>
      {q && results.length === 0 && <p>“{q}” için sonuç bulunamadı.</p>}
      {results.length > 0 && (
        <ol className="space-y-5">
          {results.map((r) => (
            <li key={r.slug}>
              <Link href={`/${locale}/${r.slug === "ana-sayfa" ? "" : r.slug}`.replace(/\/$/, "")} className="text-lg font-semibold underline-offset-2 hover:underline">
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
