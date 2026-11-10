import assert from "node:assert/strict";
import test from "node:test";
import type { BlockNode } from "@nexpress/core";
import { appendDatasetLists, remapDatasetAsset, remapDatasetImageUrls } from "../src/lib/wp-bridge/dataset-images";

test("veri kümesi görsel adresi url alanını da yerel dosyaya çevirir", () => {
  const files = new Set(["a.webp"]);
  const blocks: BlockNode[] = [
    {
      id: "g",
      type: "gallery",
      props: { items: [{ url: "https://ornek.site/wp-content/uploads/a.webp", alt: "A" }] },
    },
    { id: "i", type: "image_figure", props: { url: "https://ornek.site/wp-content/uploads/a.webp" } },
  ];
  const mapped = remapDatasetImageUrls(blocks, files);
  const gallery = mapped[0]?.props?.items as Array<{ url: string }>;
  assert.equal(gallery[0]?.url, "/images/a.webp");
  assert.equal(mapped[1]?.props?.url, "/images/a.webp");
  assert.equal(remapDatasetAsset("https://ornek.site/b.webp", files), "https://ornek.site/b.webp");
});

test("kampanya listesi yalnızca veri kümesi katmanında eklenir", () => {
  const blocks: BlockNode[] = [{ id: "s", type: "section", props: { anchorId: "akinsoft-kampanyalar" }, children: [{ id: "h", type: "heading", props: { text: "Kampanyalar" } }] }];
  const next = appendDatasetLists(blocks);
  assert.equal(next[0]?.children?.[1]?.type, "dynamic_list");
  const other = appendDatasetLists([{ id: "s2", type: "section", props: { anchorId: "baska" }, children: [] }]);
  assert.equal(other[0]?.children?.length, 0);
});
