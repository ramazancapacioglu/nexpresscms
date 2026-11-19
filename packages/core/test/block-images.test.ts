import assert from "node:assert/strict";
import test from "node:test";
import { collectBlockImages } from "../src/block-images";
import type { BlockNode } from "../src/types";

const blocks = [
  { id: "a", type: "section", props: {}, children: [
    { id: "b", type: "image_figure", props: { url: "/media/med_abc123?w=800", altText: "Ekran görüntüsü", caption: "Ana ekran", titleText: "Ana ekran" } },
    { id: "c", type: "gallery", props: { items: [{ url: "/media/med_x1", altText: "Bir" }, { src: "https://cdn.test/a.webp", alt: "İki" }, { url: "/media/med_abc123", altText: "yinelenen" }] } },
    { id: "d", type: "heading", props: { text: "Başlık", url: "/iletisim" } },
  ] },
] as unknown as BlockNode[];

test("blok görselleri: görsel, galeri ve iç içe bloklar sırayla toplanır; yinelenen ve görsel olmayan adres atlanır", () => {
  const images = collectBlockImages(blocks);
  assert.deepEqual(images.map((i) => i.url), ["/media/med_abc123?w=800", "/media/med_x1", "https://cdn.test/a.webp"]);
  assert.equal(images[0]!.alt, "Ekran görüntüsü");
  assert.equal(images[0]!.caption, "Ana ekran");
  assert.equal(images[2]!.alt, "İki");
  assert.equal(collectBlockImages(blocks, 1).length, 1);
  assert.deepEqual(collectBlockImages(null), []);
});
