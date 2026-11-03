import test from "node:test";
import assert from "node:assert/strict";
import { assignStringsToTexts, collectEditableStrings, normalizeText, patchAtPath } from "../src";

const hero = { badge: "YENİ", title: "WordPress ve Elementor'u Tarihe Gömen CMS", subtitle: "İnsan ziyaretçiler için hız.", primaryCtaLabel: "Yönetim Paneline Geç", primaryCtaHref: "/admin", stats: [{ value: "100 / 100", label: "Lighthouse" }, { value: "0 KB", label: "JS" }], align: "center", url: "https://x.test/a" };

test("metin toplama: yalnızca görünen metin; adres/yapı alanları ve kısa değerler atlanır; sıra korunur", () => {
  const got = collectEditableStrings(hero);
  assert.deepEqual(got.map((g) => g.path.join(".")), ["badge", "title", "subtitle", "primaryCtaLabel", "stats.0.value", "stats.0.label", "stats.1.value", "stats.1.label"]);
  assert.ok(!got.some((g) => g.value.startsWith("/admin") || g.value === "center"));
  assert.deepEqual(collectEditableStrings({ a: "x", b: "" , c: null }), []);
});

test("eşleştirme: aynı metin tekrar ederse sırayla; bulunmayan atlanır", () => {
  const strings = collectEditableStrings({ a: "Tekrar", b: "Tekrar", c: "Yok" });
  const m = assignStringsToTexts(strings, ["Başka", "Tekrar", "Tekrar"]);
  assert.deepEqual([...m.entries()].map(([i, p]) => [i, p.join(".")]), [[1, "a"], [2, "b"]]);
  assert.equal(normalizeText("  a \n b  "), "a b");
});

test("geri yazma: üst düzey ve iç içe yollar; geçersiz yol null; kaynak değişmez", () => {
  assert.deepEqual(patchAtPath(hero, ["title"], "Yeni"), { key: "title", value: "Yeni" });
  const r = patchAtPath(hero, ["stats", 1, "label"], "Betik")!;
  assert.equal(r.key, "stats");
  assert.equal((r.value as typeof hero.stats)[1]!.label, "Betik");
  assert.equal(hero.stats[1]!.label, "JS");
  assert.equal(patchAtPath(hero, ["stats", 9, "label"], "x"), null);
  assert.equal(patchAtPath(hero, [0 as never], "x"), null);
});
