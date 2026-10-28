import { xmlEscape } from "./sitemap";

export interface FeedItem {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date;
  updatedAt: Date;
  author?: string;
  imageUrl?: string | null;
}

export interface FeedInput {
  siteName: string;
  description: string;
  /** Sitenin dil kök adresi (ör. https://x.test/tr). */
  homeUrl: string;
  /** Beslemenin kendi adresi. */
  selfUrl: string;
  language: string;
  items: FeedItem[];
}

export const FEED_MAX_ITEMS = 50;

/** En yeni yayından başlayarak sınırlı sayıda öğe; geçersiz tarihli öğeler atılır. */
export function sortFeedItems(items: FeedItem[]): FeedItem[] {
  return items
    .filter((i) => !Number.isNaN(i.publishedAt.getTime()))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, FEED_MAX_ITEMS);
}

const enclosureType = (url: string) => (/\.png(\?|$)/i.test(url) ? "image/png" : /\.webp(\?|$)/i.test(url) ? "image/webp" : /\.gif(\?|$)/i.test(url) ? "image/gif" : "image/jpeg");

export function buildRssFeed(input: FeedInput): string {
  const items = sortFeedItems(input.items);
  const e = xmlEscape;
  const last = items[0]?.updatedAt ?? new Date(0);
  const body = items
    .map(
      (i) =>
        `    <item>\n      <title>${e(i.title)}</title>\n      <link>${e(i.url)}</link>\n      <guid isPermaLink="true">${e(i.url)}</guid>\n      <pubDate>${i.publishedAt.toUTCString()}</pubDate>\n      <description>${e(i.summary)}</description>${i.author ? `\n      <dc:creator>${e(i.author)}</dc:creator>` : ""}${i.imageUrl ? `\n      <enclosure url="${e(i.imageUrl)}" type="${enclosureType(i.imageUrl)}" length="0"/>` : ""}\n    </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n  <channel>\n    <title>${e(input.siteName)}</title>\n    <link>${e(input.homeUrl)}</link>\n    <description>${e(input.description)}</description>\n    <language>${e(input.language)}</language>\n    <lastBuildDate>${last.toUTCString()}</lastBuildDate>\n    <atom:link href="${e(input.selfUrl)}" rel="self" type="application/rss+xml"/>\n${body}\n  </channel>\n</rss>\n`;
}

export function buildAtomFeed(input: FeedInput): string {
  const items = sortFeedItems(input.items);
  const e = xmlEscape;
  const last = items[0]?.updatedAt ?? new Date(0);
  const body = items
    .map(
      (i) =>
        `  <entry>\n    <title>${e(i.title)}</title>\n    <link href="${e(i.url)}"/>\n    <id>${e(i.url)}</id>\n    <published>${i.publishedAt.toISOString()}</published>\n    <updated>${i.updatedAt.toISOString()}</updated>\n    <summary>${e(i.summary)}</summary>${i.author ? `\n    <author><name>${e(i.author)}</name></author>` : ""}\n  </entry>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${e(input.language)}">\n  <title>${e(input.siteName)}</title>\n  <subtitle>${e(input.description)}</subtitle>\n  <link href="${e(input.homeUrl)}"/>\n  <link href="${e(input.selfUrl)}" rel="self" type="application/atom+xml"/>\n  <id>${e(input.homeUrl)}</id>\n  <updated>${last.toISOString()}</updated>\n${body}\n</feed>\n`;
}
