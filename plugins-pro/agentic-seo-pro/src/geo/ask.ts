/** NLWeb `ask` yanıtı (saf mantık): arama sonuçlarını schema.org ItemList olarak döndürür. */
export interface AskContent {
  contentId: string;
  slug: string;
  title: string;
  schemaType: string;
  tldr: string | null;
  /** Dile göre öneksiz yol. Boşsa ana sayfa. */
  publicPath?: string;
}

export function buildAskResult(input: {
  query: string;
  baseUrl: string;
  locale: string;
  /** Tek dilde boş. Verilmezse `/{locale}` kullanılır. */
  localeBase?: string;
  hits: Array<{ contentId: string }>;
  contents: AskContent[];
  ranking: "hybrid" | "vector" | "none";
}) {
  const byId = new Map(input.contents.map((c) => [c.contentId, c]));
  const base = input.baseUrl.replace(/\/$/, "");
  const root = input.localeBase ?? `/${input.locale}`;
  const items = input.hits.flatMap((h, i) => {
    const c = byId.get(h.contentId);
    if (!c) return [];
    const rel = c.publicPath ?? (c.slug === "ana-sayfa" ? "" : `/${c.slug}`);
    const url = `${base}${root}${rel}`.replace(/\/$/, "") || base;
    return [{ "@type": "ListItem", position: i + 1, item: { "@type": c.schemaType || "WebPage", name: c.title, url, ...(c.tldr ? { description: c.tldr } : {}) } }];
  });
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.query,
    numberOfItems: items.length,
    itemListElement: items.map((x, i) => ({ ...x, position: i + 1 })),
    retrieval: input.ranking,
  };
}
