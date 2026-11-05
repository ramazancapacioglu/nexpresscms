import assert from "node:assert/strict";
import { test } from "node:test";
import { clusterByVectors, clusterKeywords, proposeCatalogCopy, rankingDrops, toCtr100, toPosition10 } from "../src/content-ops/intel";
import { extractReadable, gateImportUrl } from "../src/content-ops/import-url";
import { enrichWithGoogleReviews } from "../src/schema/google-reviews";

test("yüzde ve oran aynı ctr100 değerine iner", () => {
  assert.equal(toCtr100(5.92), 592);
  assert.equal(toCtr100(0.0592), 592);
  assert.equal(toCtr100(0), 0);
  assert.equal(toPosition10(4.2), 42);
});

test("örtüşen kelimeler aynı kümede, ilgisizler ayrı", () => {
  const groups = clusterKeywords([
    { keyword: "ön muhasebe programı fiyat", impressions: 10 },
    { keyword: "ön muhasebe programı karşılaştırma", impressions: 40 },
    { keyword: "restoran adisyon sistemi", impressions: 5 },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.label, "ön muhasebe programı karşılaştırma");
  assert.equal(groups[0]?.members.length, 2);
});

test("yakın vektörler birleşir, uzaklar ayrı kalır", () => {
  const groups = clusterByVectors(
    [
      { keyword: "a", impressions: 2 },
      { keyword: "b", impressions: 9 },
      { keyword: "c", impressions: 1 },
    ],
    [
      [1, 0],
      [0.99, 0.1],
      [0, 1],
    ],
    0.82,
  );
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.members.includes("a"), true);
});

test("sıra düşüşü önceki kayda göre okunur", () => {
  const drops = rankingDrops([
    { keyword: "eski", position10: 80, prevPosition10: 20 },
    { keyword: "yeni", position10: 20, prevPosition10: 0 },
    { keyword: "aynı", position10: 30, prevPosition10: 28 },
  ]);
  assert.deepEqual(drops.map((row) => row.keyword), ["eski"]);
});

test("katalog önerisi uzun başlığı keser, kısa metne cümle eklemez", () => {
  const long = proposeCatalogCopy({ title: "Bu ürün başlığı bilinçli olarak yetmiş karakter sınırının oldukça üzerine taşındı", tldr: "", body: "" });
  assert.ok(long.title.length <= 70);
  assert.equal(long.tldr, "");
  const short = proposeCatalogCopy({ title: "Kısa", tldr: "az", body: "yeterli gövde metni burada seksen karakteri geçecek kadar uzun tutuldu ki kısa yanıt buradan gelsin." });
  assert.equal(short.title, "Kısa");
  assert.ok(short.tldr.length >= 80);
});

test("içe aktarma kapısı iç adresi ve kimlikli adresi reddeder", () => {
  assert.equal("error" in gateImportUrl("http://127.0.0.1/gizli"), true);
  assert.equal("error" in gateImportUrl("http://user:pass@example.com/a"), true);
  assert.equal("error" in gateImportUrl("file:///etc/passwd"), true);
  const ok = gateImportUrl("https://example.com/yazi");
  assert.equal("href" in ok, true);
});

test("okunur metin başlık ve gövdeden gelir, betik düşer", () => {
  const extracted = extractReadable("<html><head><title>Yedek alma</title><script>secret()</script></head><body><article><p>Firebird yedeği her gece alınır.</p></article></body></html>");
  assert.equal(extracted.title, "Yedek alma");
  assert.match(extracted.text, /Firebird/);
  assert.equal(extracted.text.includes("secret"), false);
});

test("google yorumu boş ayarda düğümü olduğu gibi bırakır", () => {
  const node = { "@type": "LocalBusiness", name: "A" };
  assert.deepEqual(enrichWithGoogleReviews(node, {}), node);
  const enriched = enrichWithGoogleReviews(node, { googleRating: 4.6, googleReviewCount: 12, reviews: [{ author: "Ada", rating: 5, date: "2026-01-01", text: "İyi" }] });
  assert.equal((enriched as { aggregateRating?: { ratingValue: number } }).aggregateRating?.ratingValue, 4.6);
});
