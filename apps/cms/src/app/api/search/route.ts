import { bm25Rank, contentPath, makeSnippet, resolveSiteSettings } from "@nexpress/core";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { siteLocaleBase } from "@/lib/locale-url";
import { getPublicSite, listPublicKeywordDocs } from "@/lib/public-data";

const quiet = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/** Site içi canlı arama: `blocks` taşımayan, yalnızca yayında + herkese açık + `!noIndex` havuzda BM25, en fazla 8 sonuç. */
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
  const types = resolveSiteSettings(site?.settings).general.contentTypes;
  const docs = await listPublicKeywordDocs(siteId, locale);
  const byId = new Map(docs.map((c) => [c.contentId, c]));
  const hits = bm25Rank(
    docs.map((c) => ({ id: c.contentId, title: c.title, body: c.markdownCache })),
    q,
    8
  );
  const items = hits.flatMap((hit) => {
    const c = byId.get(hit.id);
    if (!c) return [];
    const rel =
      c.slug === "ana-sayfa"
        ? ""
        : c.type === "campaign"
          ? `/kampanya/${c.slug}`
          : contentPath(types, c);
    const href = `${lb}${rel}`.replace(/\/$/, "") || "/";
    return [{ title: c.title, href, snippet: c.tldr || makeSnippet(c.markdownCache, q) }];
  });
  return NextResponse.json({ items }, { headers: quiet });
}
