import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSitemapIndex,
  buildUrlset,
  entryPath,
  parseSitemapFileName,
  sitemapFileName,
  splitIntoFiles,
  xmlEscape,
  type SitemapEntry,
} from "../src/sitemap";

const at = new Date("2026-10-28T10:00:00.000Z");
const e = (over: Partial<SitemapEntry>): SitemapEntry => ({
  contentId: "c1", type: "page", locale: "tr", region: "TR", slug: "hakkimizda", updatedAt: at, ...over,
});

test("yol: ana sayfa kök dile gider", () => {
  assert.equal(entryPath(e({ slug: "ana-sayfa" })), "/tr");
  assert.equal(entryPath(e({})), "/tr/hakkimizda");
  assert.equal(entryPath(e({ slug: "a b&c/ç" })), "/tr/a%20b%26c%2F%C3%A7", "slug URL için kodlanır");
});

test("dosya adı gidiş-dönüş ve geçersiz adlar", () => {
  assert.equal(sitemapFileName("kb_tech", 3), "kb_tech-3.xml");
  assert.deepEqual(parseSitemapFileName("kb_tech-3.xml"), { type: "kb_tech", page: 3 });
  for (const bad of ["page-0.xml", "page.xml", "../x-1.xml", "Page-1.xml", "page-1.xml.txt", "page--1.xml"]) {
    assert.equal(parseSitemapFileName(bad), null, bad);
  }
});

test("türe göre ayırır, izinsiz türleri atar, sayfalara böler", () => {
  const entries = [
    ...Array.from({ length: 5 }, (_, i) => e({ contentId: `p${i}`, slug: `s${i}` })),
    e({ contentId: "x", type: "post", slug: "yazi" }),
    e({ contentId: "y", type: "product", slug: "urun" }),
  ];
  const files = splitIntoFiles(entries, ["page", "post"], 2);
  assert.deepEqual(files.map((f) => `${f.type}-${f.page}:${f.entries.length}`), ["page-1:2", "page-2:2", "page-3:1", "post-1:1"]);
});

test("indeks lastmod'u dosyadaki en yeni tarihtir ve adresleri kaçışlar", () => {
  const newer = new Date("2026-11-01T00:00:00.000Z");
  const files = splitIntoFiles([e({}), e({ contentId: "c2", slug: "b", updatedAt: newer })], ["page"]);
  const xml = buildSitemapIndex("https://ex.com", files);
  assert.match(xml, /<loc>https:\/\/ex\.com\/sitemaps\/page-1\.xml<\/loc>/);
  assert.match(xml, /<lastmod>2026-11-01T00:00:00\.000Z<\/lastmod>/);
  assert.equal(xmlEscape(`a&b<"c">'`), "a&amp;b&lt;&quot;c&quot;&gt;&apos;");
});

test("hreflang karşılıklıdır, başka dosyadaki çeviriyi de içerir ve x-default varsayılan dile gider", () => {
  const tr = e({ contentId: "c1", type: "page", locale: "tr", region: "TR", slug: "hakkimizda" });
  const en = e({ contentId: "c1", type: "page", locale: "en", region: "US", slug: "about" });
  const all = [tr, en];
  const [file] = splitIntoFiles([tr], ["page"]);
  const xml = buildUrlset("https://ex.com", file!, all, "tr");
  assert.match(xml, /<loc>https:\/\/ex\.com\/tr\/hakkimizda<\/loc>/);
  assert.match(xml, /hreflang="tr-TR" href="https:\/\/ex\.com\/tr\/hakkimizda"/);
  assert.match(xml, /hreflang="en-US" href="https:\/\/ex\.com\/en\/about"/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/ex\.com\/tr\/hakkimizda"/);
  assert.ok(!xml.includes("<loc>https://ex.com/en/about"), "diğer dil bu dosyada ayrı <url> değil");
});

test("tek dilli içerik kendine ve x-default'a bağlanır", () => {
  const only = e({});
  const [file] = splitIntoFiles([only], ["page"]);
  const xml = buildUrlset("https://ex.com", file!, [only], "tr");
  assert.equal((xml.match(/hreflang=/g) ?? []).length, 2);
});

import { hreflangOf as hreflangOfRegion } from "../src";

test("hreflang: bölge varsa tr-TR, yoksa yalnızca dil", () => {
  assert.equal(hreflangOfRegion({ locale: "tr", region: "TR" }), "tr-TR");
  assert.equal(hreflangOfRegion({ locale: "en", region: "" }), "en");
  assert.equal(hreflangOfRegion({ locale: "en", region: "us" }), "en-US");
});
