import assert from "node:assert/strict";
import test from "node:test";
import { inspectBlocks, weighContent } from "../src/content-weight";

test("görsel alt metni boşsa sayılır, doluysa sayılmaz", () => {
  const found = inspectBlocks([
    { type: "section", children: [{ type: "image_figure", props: { url: "/a.jpg", altText: "" } }] },
    { type: "image", props: { alt: "Kapak" } },
  ]);
  assert.equal(found.blockCount, 3);
  assert.equal(found.imageCount, 2);
  assert.equal(found.imagesMissingAlt, 1);
});

test("uzun metin kritik, eksik meta ağır, sade sayfa hafif", () => {
  const base = { id: "c", title: "A", slug: "a", type: "page", imageCount: 0, imagesMissingAlt: 0, seoScore: 80 };
  assert.equal(weighContent({ ...base, markdownChars: 10, blockCount: 2, missingMeta: false }).band, "light");
  assert.equal(weighContent({ ...base, markdownChars: 10, blockCount: 2, missingMeta: true }).band, "heavy");
  assert.equal(weighContent({ ...base, markdownChars: 70_000, blockCount: 2, missingMeta: false }).band, "critical");
});
