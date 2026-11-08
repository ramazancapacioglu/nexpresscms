import test from "node:test";
import assert from "node:assert/strict";
import { drawLayout } from "../src/bridge-draw";
import { parseBridgePush } from "../src/bridge-parse";

test("satır tam genişlik ve sütun olarak çizilir; tanınmayan düğüm metne düşer", () => {
  const drawn = drawLayout([
    {
      type: "section",
      full: true,
      background: "#0b4f8a",
      children: [
        {
          type: "columns",
          children: [
            { type: "column", level: 6, children: [{ type: "heading", level: 1, text: "Başlık" }] },
            { type: "column", level: 6, children: [{ type: "image", url: "https://cdn.ornek.test/a.jpg", alt: "Görsel" }] },
          ],
        },
      ],
    },
    { type: "ozel-kutu", text: "Düz metin kaldı" },
    { type: "product", text: "fiyat" },
  ]);
  const section = drawn.blocks.find((block) => block.type === "section");
  assert.equal(section?.style?.blockWidth, "full");
  assert.equal(section?.style?.backgroundColor, "#0b4f8a");
  const columns = section?.children?.find((block) => block.type === "columns");
  assert.equal(columns?.children?.length, 2);
  assert.equal(drawn.unknown, 2);
  assert.deepEqual(drawn.images, ["https://cdn.ornek.test/a.jpg"]);
});

test("ürün paketi yazılmaz, sayfa kalır", () => {
  const parsed = parseBridgePush({
    kind: "content",
    items: [
      { wpId: "9", kind: "product", title: "Ürün", slug: "urun" },
      { wpId: "4", kind: "page", title: "Hakkımızda", slug: "hakkimizda", status: "publish" },
    ],
  });
  assert.ok(!("error" in parsed));
  if ("error" in parsed) return;
  assert.equal(parsed.notes.products, 1);
  assert.equal(parsed.push.kind, "content");
  if (parsed.push.kind !== "content") return;
  assert.equal(parsed.push.items.length, 1);
  assert.equal(parsed.push.items[0]?.title, "Hakkımızda");
});
