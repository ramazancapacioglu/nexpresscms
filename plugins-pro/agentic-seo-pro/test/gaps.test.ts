import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeContentGaps, jaccard, type GapInput } from "../src/content-ops/gaps";

const NOW = new Date("2026-11-02T00:00:00Z");
const long = "kelime ".repeat(200);
const item = (id: string, over: Partial<GapInput> = {}): GapInput => ({ id, title: `Başlık ${id}`, slug: `s-${id}`, type: "page", tldr: ["alfa", "beta", "gama", "delta", "epsilon", "zeta", "teta"].map((w) => `${id}${w}`).join(" "), markdown: long, updatedAt: new Date("2026-10-01T00:00:00Z"), ...over });

test("temiz içerik açık üretmez; ana sayfa öksüz sayılmaz", () => {
  const r = analyzeContentGaps([item("a", { isHome: true, markdown: `${long} [b](/tr/s-b)` }), item("b", { markdown: `${long} [a](/tr/s-a)` })], NOW);
  assert.equal(r.items.length, 0);
});

test("TL;DR eksik/kısa, bayat, ince ve öksüz ayrı ayrı bulunur", () => {
  const r = analyzeContentGaps([
    item("a", { tldr: "kısa", markdown: `${long} [b](/tr/s-b)` }),
    item("b", { updatedAt: new Date("2026-01-01T00:00:00Z"), markdown: `${long} [a](/tr/s-a)` }),
    item("c", { markdown: "az sözcük" }),
  ], NOW);
  const kinds = Object.fromEntries(r.items.map((i) => [i.id, i.kinds]));
  assert.deepEqual(kinds.a, ["no-tldr"]);
  assert.deepEqual(kinds.b, ["stale"]);
  assert.deepEqual(kinds.c, ["orphan", "thin"].filter((k) => kinds.c!.includes(k as never)), "c hem ince hem öksüz");
  assert.ok(kinds.c!.includes("thin") && kinds.c!.includes("orphan"));
  assert.equal(r.counts.stale, 1);
});

test("iç bağlantılar: mutlak adres, sorgu/çapa ve kendine bağlantı doğru sayılır", () => {
  const r = analyzeContentGaps([
    item("a", { markdown: `${long} [b](https://x.test/tr/s-b?utm=1#bolum) [kendim](/tr/s-a)` }),
    item("b", { markdown: `${long} [dış](https://baska.test/s-a)` }),
  ], NOW, "https://x.test");
  const byId = Object.fromEntries(r.items.map((i) => [i.id, i.kinds]));
  assert.equal(byId.b, undefined, "b, a'dan bağlantı alıyor");
  assert.deepEqual(byId.a, ["orphan"], "kendine ve dış siteye verilen bağlantı sayılmaz");
});

test("kopya kümeler: benzer başlık+özet birleşir, farklılar ayrı kalır", () => {
  const a = item("a", { title: "İstanbul'da en iyi kahve dükkanları rehberi", tldr: "İstanbul kahve dükkanları için kapsamlı en iyi rehber ve öneriler." });
  const b = item("b", { title: "İstanbul'da en iyi kahve dükkanları rehberi 2026", tldr: "İstanbul kahve dükkanları için kapsamlı en iyi rehber ve öneriler." });
  const c = item("c", { title: "Kurumsal e-posta kurulumu", tldr: "Alan adı, MX kayıtları ve doğrulama adımlarıyla e-posta kurulumunu anlatır." });
  const r = analyzeContentGaps([a, b, c], NOW);
  assert.deepEqual(r.duplicateClusters.map((g) => g.sort()), [["a", "b"]]);
  assert.equal(r.counts.duplicate, 2);
  assert.equal(jaccard(new Set(), new Set(["x"])), 0);
});
