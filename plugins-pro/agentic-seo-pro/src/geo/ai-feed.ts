/** `/ai-feed.json`: önem skoruna göre sıralı AI besleme dosyası (saf mantık). */
export interface FeedSource {
  id: string;
  title: string;
  slug: string;
  type: string;
  schemaType: string;
  importanceScore: number; // 1–10
  tldr: string | null;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface AiFeedItem {
  id: string;
  title: string;
  url: string;
  markdownUrl: string;
  type: string;
  schemaType: string;
  importance: number;
  summary: string | null;
  updated: string;
  freshness: "fresh" | "aging" | "stale";
}

const DAY = 86_400_000;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Blog yazıları yaşa göre 0,7 → 0,4; diğer türler yazarın önem skorundan (1–10 → 0,1–1,0). */
export function importanceOf(item: Pick<FeedSource, "type" | "importanceScore" | "publishedAt" | "updatedAt">, now: Date): number {
  if (item.type === "post") {
    const ageDays = (now.getTime() - (item.publishedAt ?? item.updatedAt).getTime()) / DAY;
    return Number(clamp(0.7 - (ageDays / 365) * 0.3, 0.4, 0.7).toFixed(2));
  }
  return Number(clamp(item.importanceScore / 10, 0.1, 1).toFixed(2));
}

export function freshnessOf(updatedAt: Date, now: Date): AiFeedItem["freshness"] {
  const days = (now.getTime() - updatedAt.getTime()) / DAY;
  return days <= 90 ? "fresh" : days <= 180 ? "aging" : "stale";
}

export function buildAiFeed(input: { siteName: string; baseUrl: string; locale: string; items: FeedSource[]; now?: Date }) {
  const now = input.now ?? new Date();
  const base = input.baseUrl.replace(/\/$/, "");
  const items: AiFeedItem[] = input.items
    .map((c) => {
      const path = c.slug === "ana-sayfa" ? `/${input.locale}` : `/${input.locale}/${c.slug}`;
      return {
        id: c.id,
        title: c.title,
        url: `${base}${path}`,
        markdownUrl: `${base}${path}?format=md`,
        type: c.type,
        schemaType: c.schemaType,
        importance: importanceOf(c, now),
        summary: c.tldr,
        updated: c.updatedAt.toISOString(),
        freshness: freshnessOf(c.updatedAt, now),
      };
    })
    .sort((a, b) => b.importance - a.importance || b.updated.localeCompare(a.updated));
  return { version: "1.0", generated: now.toISOString(), site: input.siteName, locale: input.locale, count: items.length, items };
}
