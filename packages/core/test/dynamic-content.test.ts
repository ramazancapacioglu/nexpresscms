import assert from "node:assert/strict";
import { test } from "node:test";
import { collectDynamicBlocks, normalizeDynamicQuery, selectDynamicItems, termSlug, type DynamicCandidate } from "../src/dynamic-content";

const c = (id: string, over: Partial<DynamicCandidate> = {}): DynamicCandidate => ({ id, kind: "posts", title: `Yazı ${id}`, url: `/tr/${id}`, excerpt: "", categories: [], tags: [], date: `2026-0${(id.charCodeAt(0) % 9) + 1}-01T00:00:00Z`, ...over });

test("sorgu doğrulama: varsayılanlar, sınırlar, bozuk değerler", () => {
  const d = normalizeDynamicQuery({});
  assert.deepEqual([d.source, d.limit, d.orderBy, d.layout, d.columns, d.showImage, d.excludeCurrent], ["posts", 6, "newest", "cards", 3, true, false]);
  const q = normalizeDynamicQuery({ source: "hack", limit: 999, orderBy: "rastgele", layout: "grid", columns: 99, category: "Yapay Zekâ!", heading: "x".repeat(300), showImage: "evet" });
  assert.deepEqual([q.source, q.limit, q.orderBy, q.layout, q.columns, q.showImage], ["posts", 24, "newest", "cards", 4, true]);
  assert.equal(q.heading.length, 100);
  assert.equal(normalizeDynamicQuery({ limit: -5 }).limit, 6, "olumsuz sayı varsayılana düşer");
  assert.equal(normalizeDynamicQuery(null).limit, 6);
  assert.equal(termSlug("Yapay Zekâ & İstanbul"), "yapay-zeka-istanbul");
});

test("süzme: kaynak, kategori, etiket (ad/slug eşleşir), geçerli sayfa dışlama", () => {
  const items = [
    c("a", { categories: ["Rehber"], tags: ["SEO"] }),
    c("b", { categories: ["Haber"] }),
    c("p", { kind: "pages", categories: ["Rehber"] }),
    c("u", { kind: "products", title: "Ürün" }),
  ];
  const ids = (q: object, cur?: string) => selectDynamicItems(items, normalizeDynamicQuery(q), cur).map((x) => x.id).sort();
  assert.deepEqual(ids({}), ["a", "b"]);
  assert.deepEqual(ids({ source: "pages" }), ["p"]);
  assert.deepEqual(ids({ source: "products" }), ["u"]);
  assert.deepEqual(ids({ category: "rehber" }), ["a"]);
  assert.deepEqual(ids({ category: "REHBER" }), ["a"], "büyük/küçük harf gözetmez");
  assert.deepEqual(ids({ tag: "seo" }), ["a"]);
  assert.deepEqual(ids({ category: "rehber", tag: "yok" }), []);
  assert.deepEqual(ids({ excludeCurrent: true }, "a"), ["b"]);
  assert.deepEqual(ids({}, "a"), ["a", "b"], "dışlama kapalıyken geçerli sayfa kalır");
});

test("sıralama ve sınır; sonuçta iç alanlar (tür, terimler) yok", () => {
  const items = [c("a", { title: "Zeta", date: "2026-01-01T00:00:00Z" }), c("b", { title: "Alfa", date: "2026-03-01T00:00:00Z" }), c("c", { title: "Mim", date: "2026-02-01T00:00:00Z" }), c("d", { title: "Beta", date: null })];
  const order = (orderBy: string, limit = 24) => selectDynamicItems(items, normalizeDynamicQuery({ orderBy, limit })).map((x) => x.id);
  assert.deepEqual(order("newest"), ["b", "c", "a", "d"], "tarihsiz en sonda");
  assert.deepEqual(order("oldest"), ["d", "a", "c", "b"]);
  assert.deepEqual(order("title"), ["b", "d", "c", "a"]);
  assert.deepEqual(order("newest", 2), ["b", "c"]);
  const first = selectDynamicItems(items, normalizeDynamicQuery({}))[0]!;
  assert.ok(!("kind" in first) && !("categories" in first) && !("tags" in first));
});

test("dinamik blokları iç içe ağaçta bulur", () => {
  const blocks = [{ id: "s", type: "section", props: {}, children: [{ id: "d1", type: "dynamic_list", props: {} }, { id: "col", type: "columns", props: {}, children: [{ id: "d2", type: "dynamic_list", props: {} }] }] }, { id: "d3", type: "dynamic_list", props: {} }] as never;
  assert.deepEqual(collectDynamicBlocks(blocks).map((b) => b.id), ["d1", "d2", "d3"]);
  assert.deepEqual(collectDynamicBlocks([] as never), []);
});
