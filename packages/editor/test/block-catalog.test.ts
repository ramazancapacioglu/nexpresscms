import test from "node:test";
import assert from "node:assert/strict";
import { canInsertInto, moveBlockTo, placeNewBlock, type BlockNode } from "@nexpress/core";
import { BLOCK_CATALOG, BLOCK_CATEGORIES, ROW_TEMPLATES, buildRow, searchCatalog } from "../src/block-catalog";

test("katalog: benzersiz kimlik, bilinen kategori, kökte eklenebilir tür", () => {
  const ids = new Set(BLOCK_CATALOG.map((i) => i.id));
  assert.equal(ids.size, BLOCK_CATALOG.length);
  const cats = new Set(BLOCK_CATEGORIES.map((c) => c.id));
  for (const i of BLOCK_CATALOG) {
    assert.ok(cats.has(i.category), i.id);
    assert.ok(canInsertInto(null, i.block.type), i.id);
    assert.ok(i.block.props && Object.keys(i.block.props).length > 0, `${i.id} düzenlenebilir props taşımalı`);
  }
  assert.ok(BLOCK_CATALOG.length >= 40);
});

test("satır şablonları: sütun yüzdeleri ~100, her sütun düzenlenebilir içerik taşır", () => {
  for (const t of ROW_TEMPLATES) {
    const row = buildRow(t.layout, t.widths, t.opts);
    assert.equal(row.type, "columns");
    assert.ok(Math.abs(t.widths.reduce((a, b) => a + b, 0) - 100) < 0.5, t.id);
    assert.ok(row.children!.every((c) => c.type === "column" && (c.children?.length ?? 0) >= 2), t.id);
  }
});

test("arama: Türkçe i/ı ve aksan duyarsız", () => {
  assert.ok(searchCatalog("SSS").some((i) => i.id === "faq"));
  assert.ok(searchCatalog("fiyatlandirma").some((i) => i.id === "pricing"));
  assert.ok(searchCatalog("ızgara").length >= 2);
  assert.equal(searchCatalog("").length, BLOCK_CATALOG.length);
});

test("sürükle-bırak: yeni blok yalnızca uygun kapsayıcıya girer, taşıma döngü oluşturmaz", () => {
  const col = (id: string, children: BlockNode[] = []): BlockNode => ({ id, type: "column", children });
  const doc: BlockNode[] = [
    { id: "r", type: "columns", children: [col("c1", [{ id: "p1", type: "paragraph" }]), col("c2")] },
    { id: "s", type: "section", children: [] },
  ];
  const p: BlockNode = { id: "n", type: "paragraph" };
  assert.equal(placeNewBlock(doc, p, "r", 0), null); // satıra yalnızca sütun
  assert.equal(placeNewBlock(doc, { id: "x", type: "column" }, null, 0), null); // kökte sütun yok
  assert.equal(placeNewBlock(doc, p, "yok", 0), null);
  const ok = placeNewBlock(doc, p, "c2", 0)!;
  assert.equal(ok[0]!.children![1]!.children![0]!.id, "n");
  const moved = moveBlockTo(doc, "p1", "s", 0);
  assert.equal(moved[1]!.children![0]!.id, "p1");
  assert.equal(moveBlockTo(doc, "s", "s", 0), doc); // kendi içine
});

import { BLOCK_TYPES, BlockNodeSchema } from "@nexpress/core";

test("tek kaynak: katalogdaki her tür BLOCK_TYPES'ta ve içe aktarma şemasından geçer", () => {
  const known = new Set<string>(BLOCK_TYPES);
  for (const i of BLOCK_CATALOG) {
    assert.ok(known.has(i.block.type), `${i.id}: ${i.block.type} BLOCK_TYPES'ta yok`);
    assert.ok(BlockNodeSchema.safeParse({ ...i.block, id: "x" }).success, `${i.id} şemadan geçmedi`);
  }
  for (const t of ROW_TEMPLATES) assert.ok(BlockNodeSchema.safeParse(buildRow(t.layout, t.widths, t.opts)).success, t.id);
});
