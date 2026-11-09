import assert from "node:assert/strict";
import test from "node:test";
import { auditCustomizerPerformance, inspectBlocks, weighContent } from "../src/content-weight";

test("görsel alt metni, CLS boyut eksiği, gömülü iframe ve ilk ekran LCP riski tespit edilir", () => {
  const found = inspectBlocks([
    {
      type: "video_embed",
      props: { url: "https://youtube.com/watch?v=1" },
    },
    {
      type: "section",
      children: [
        { type: "image_figure", props: { url: "/external.jpg", altText: "" } },
        { type: "image_figure", props: { url: "/media/med_abc123?w=1200&h=800", altText: "Boyutlu" } },
      ],
    },
  ]);
  assert.equal(found.blockCount, 4);
  assert.equal(found.imageCount, 2);
  assert.equal(found.imagesMissingAlt, 1);
  assert.equal(found.imagesMissingDimensions, 1);
  assert.equal(found.embedCount, 1);
  assert.equal(found.firstFoldHeavy, true);
  assert.equal(found.maxDepth, 2);
});

test("uzun metin kritik, eksik meta veya CLS/LCP uyarısı ağır, sade sayfa hafif", () => {
  const base = { id: "c", title: "A", slug: "a", type: "page", imageCount: 0, imagesMissingAlt: 0, seoScore: 80 };
  const light = weighContent({ ...base, markdownChars: 500, blockCount: 4, missingMeta: false });
  assert.equal(light.band, "light");
  assert.ok(light.estimatedHtmlKb >= 1);

  const clsHeavy = weighContent({
    ...base,
    markdownChars: 500,
    blockCount: 4,
    missingMeta: false,
    imagesMissingDimensions: 2,
  });
  assert.equal(clsHeavy.band, "heavy");
  assert.ok(clsHeavy.notes.some((n) => n.includes("CLS")));

  assert.equal(weighContent({ ...base, markdownChars: 70_000, blockCount: 2, missingMeta: false }).band, "critical");
});

test("auditCustomizerPerformance: özel betik ve aşırı CSS için 0-KB uyarısı üretir", () => {
  const clean = auditCustomizerPerformance({ customCss: ".a{color:red}", headerScripts: "", footerScripts: "" });
  assert.equal(clean.zeroKbClean, true);
  assert.equal(clean.warnings.length, 0);

  const dirty = auditCustomizerPerformance({ customCss: "", headerScripts: "<script src='x'></script>" });
  assert.equal(dirty.zeroKbClean, false);
  assert.equal(dirty.hasHeaderScripts, true);
  assert.equal(dirty.warnings.length, 1);
});
