import test from "node:test";
import assert from "node:assert/strict";
import { termMatches, buildAtomFeed, buildRssFeed, FEED_MAX_ITEMS, sortFeedItems, type FeedInput, type FeedItem } from "../src";

const item = (n: number, extra: Partial<FeedItem> = {}): FeedItem => ({
  title: `Yazı ${n} & <b>`,
  url: `https://x.test/tr/yazi-${n}?a=1&b=2`,
  summary: "Özet \"tırnak\"",
  publishedAt: new Date(Date.UTC(2026, 0, n)),
  updatedAt: new Date(Date.UTC(2026, 1, n)),
  ...extra,
});
const base = (items: FeedItem[]): FeedInput => ({ siteName: "Site", description: "Açıklama", homeUrl: "https://x.test/tr", selfUrl: "https://x.test/feed.xml", language: "tr", items });

test("feed: en yeni önce, sınır uygulanır, geçersiz tarih atılır", () => {
  const many = Array.from({ length: FEED_MAX_ITEMS + 5 }, (_, i) => item((i % 28) + 1));
  const sorted = sortFeedItems([...many, item(1, { publishedAt: new Date("x") })]);
  assert.equal(sorted.length, FEED_MAX_ITEMS);
  assert.ok(sorted[0]!.publishedAt >= sorted[1]!.publishedAt);
});

test("RSS: kaçışlı, pubDate RFC 822, görsel eki ve yazar", () => {
  const xml = buildRssFeed(base([item(3, { author: "Ayşe", imageUrl: "https://x.test/a.png" })]));
  assert.match(xml, /<title>Yazı 3 &amp; &lt;b&gt;<\/title>/);
  assert.match(xml, /<link>https:\/\/x\.test\/tr\/yazi-3\?a=1&amp;b=2<\/link>/);
  assert.match(xml, /<pubDate>Sat, 03 Jan 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<dc:creator>Ayşe<\/dc:creator>/);
  assert.match(xml, /type="image\/png"/);
  assert.match(xml, /rel="self" type="application\/rss\+xml"/);
});

test("Atom: ISO tarihler ve boş besleme geçerli kalır", () => {
  const xml = buildAtomFeed(base([item(2)]));
  assert.match(xml, /<published>2026-01-02T00:00:00\.000Z<\/published>/);
  assert.match(xml, /<updated>2026-02-02T00:00:00\.000Z<\/updated>/);
  assert.match(buildAtomFeed(base([])), /<feed xmlns=/);
  assert.match(buildRssFeed(base([])), /<channel>/);
});

test("besleme terim süzgeci: ad ve slug eşleşir, boş süzgeç hepsini geçirir", () => {
  assert.equal(termMatches(["Haberler", "Rehber"], "haberler"), true);
  assert.equal(termMatches(["Yapay Zeka"], "yapay-zeka"), true);
  assert.equal(termMatches(["İstanbul"], "istanbul"), true);
  assert.equal(termMatches(["Rehber"], "haber"), false);
  assert.equal(termMatches([], "x"), false);
  assert.equal(termMatches([], ""), true);
  assert.equal(termMatches(["a"], "   "), true);
});
