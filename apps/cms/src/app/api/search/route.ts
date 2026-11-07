import { bm25Rank, makeSnippet, resolvePublishing } from "@nexpress/core";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { siteLocaleBase } from "@/lib/locale-url";
import { getPublicSite, listPublishedContents } from "@/lib/public-data";

const quiet = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/** Yazılım firması arama penceresi: yayındaki sayfalarda BM25, en fazla 8 sonuç. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ items: [] }, { headers: quiet });

  const h = await headers();
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  // `/api/...` yolu ara katmanda dil sanılabiliyor; yalnızca sitede açık bir dili kabul et.
  const hinted = h.get("x-nexpress-locale");
  const locale = (hinted && site?.supportedLocales?.includes(hinted) ? hinted : null) || site?.defaultLocale || "tr";
  const lb = await siteLocaleBase(siteId, locale);
  const contents = (await listPublishedContents(siteId, locale)).filter(
    (c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public",
  );
  const byId = new Map(contents.map((c) => [c.contentId, c]));
  const hits = bm25Rank(
    contents.map((c) => ({ id: c.contentId, title: c.title, body: c.markdownCache })),
    q,
    8,
  );
  const items = hits.flatMap((hit) => {
    const c = byId.get(hit.id);
    if (!c) return [];
    const path = c.slug === "ana-sayfa" ? "" : c.slug;
    const href = `${lb}/${path}`.replace(/\/$/, "") || "/";
    return [{ title: c.title, href, snippet: c.tldr || makeSnippet(c.markdownCache, q) }];
  });
  return NextResponse.json({ items }, { headers: quiet });
}
