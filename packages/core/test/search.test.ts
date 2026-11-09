import test from "node:test";
import assert from "node:assert/strict";
import { bm25Rank, foldTr, makeSnippet, rrfFuse, searchTokens, synthesizeSearchAnswer } from "../src";

test("Türkçe katlama: aksanlar ve ı/İ eşleşir", () => {
  assert.equal(foldTr("ŞEKER Sıcak ÇİĞ"), "seker sicak cig");
  assert.deepEqual(searchTokens("Sıcak ve soğuk"), ["sicak", "soguk"]);
});

const docs = [
  { id: "a", title: "Sıcak kahve rehberi", body: "Kahve demleme yöntemleri ve sıcak içecekler." },
  { id: "b", title: "Çay", body: "Çay demleme rehberi. Demleme süresi önemlidir." },
  { id: "c", title: "Ayrık konu", body: "Hiç ilgisi olmayan bir metin." },
];

test("BM25: başlık eşleşmesi öne çıkar, ilgisiz belge elenir, aksansız sorgu çalışır", () => {
  const r = bm25Rank(docs, "sicak kahve");
  assert.equal(r[0]!.id, "a");
  assert.ok(!r.some((h) => h.id === "c"));
  assert.deepEqual(bm25Rank(docs, "   "), []);
});

test("RRF: iki listede de üstte olan birleşimde birinci olur", () => {
  const fused = rrfFuse([[{ id: "x" }, { id: "y" }, { id: "z" }], [{ id: "y" }, { id: "x" }, { id: "w" }]], 4);
  assert.deepEqual(fused.slice(0, 2).map((h) => h.id).sort(), ["x", "y"]);
  assert.equal(fused.length, 4);
  assert.ok(fused[0]!.score > fused[3]!.score);
});

test("özet: eşleşen terimin çevresini verir", () => {
  const s = makeSnippet("# Başlık\n" + "alfa ".repeat(60) + "kahve burada " + "beta ".repeat(60), "KAHVE", 30);
  assert.match(s, /kahve burada/);
  assert.ok(s.startsWith("…") && s.endsWith("…"));
});

test("synthesizeSearchAnswer: en iyi eşleşmelerden kaynak numaralı ([1], [2]) doğrudan yanıt üretir", () => {
  const ans = synthesizeSearchAnswer(
    [
      { id: "a", title: "Kahve Rehberi", slug: "kahve-rehberi", tldr: "Filtre kahve 92-96 derece su ile 4 dakikada demlenir.", body: "" },
      { id: "b", title: "Espresso", slug: "espresso", tldr: "Espresso 9 bar basınç altında 25-30 saniyede çekilir.", body: "" },
    ],
    "kahve demleme"
  );
  assert.ok(ans);
  assert.match(ans.summary, /\[1\]/);
  assert.match(ans.summary, /\[2\]/);
  assert.equal(ans.citations.length, 2);
  assert.equal(ans.citations[0]!.slug, "kahve-rehberi");
});
