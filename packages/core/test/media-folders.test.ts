import test from "node:test";
import assert from "node:assert/strict";
import { buildFolderTree, checkFolderPlacement, folderDepth, folderSubtreeIds, normalizeFolderName } from "../src";

const F = [
  { id: "a", parentId: null, name: "Ürünler" },
  { id: "b", parentId: "a", name: "Kapak" },
  { id: "c", parentId: "b", name: "2026" },
  { id: "z", parentId: null, name: "Blog" },
];

test("klasör adı: boşluk sadeleşir, kontrol karakteri atılır, uzunluk sınırlanır", () => {
  assert.equal(normalizeFolderName("  Ürün \n  görselleri\u0000 "), "Ürün görselleri");
  assert.equal(normalizeFolderName("x".repeat(200)).length, 60);
  assert.equal(normalizeFolderName("   "), "");
});

test("derinlik ve alt ağaç", () => {
  assert.equal(folderDepth(F, null), 0);
  assert.equal(folderDepth(F, "a"), 1);
  assert.equal(folderDepth(F, "c"), 3);
  assert.equal(folderDepth([{ id: "x", parentId: "y", name: "x" }, { id: "y", parentId: "x", name: "y" }], "x"), Infinity);
  assert.deepEqual(folderSubtreeIds(F, "a").sort(), ["a", "b", "c"]);
  assert.deepEqual(folderSubtreeIds(F, "z"), ["z"]);
});

test("yerleştirme: boş ad, olmayan üst, kendi içine/alt klasörüne taşıma, en çok 3 düzey, aynı kardeş adı (büyük/küçük harf duyarsız)", () => {
  const bad = (i: Parameters<typeof checkFolderPlacement>[1]) => (checkFolderPlacement(F, i) as { error?: string }).error;
  assert.ok(bad({ id: null, parentId: null, name: "  " }));
  assert.ok(bad({ id: null, parentId: "yok", name: "x" }));
  assert.ok(bad({ id: "a", parentId: "a", name: "Ürünler" }));
  assert.match(bad({ id: "a", parentId: "c", name: "Ürünler" })!, /alt klasörüne/);
  assert.match(bad({ id: null, parentId: "c", name: "Yeni" })!, /3 düzey/, "dördüncü düzey yok");
  assert.match(bad({ id: "z", parentId: "c", name: "Blog" })!, /3 düzey/);
  assert.match(bad({ id: "a", parentId: "z", name: "Ürünler" }) ?? "3 düzey", /3 düzey/, "a (3 düzeyli alt ağaç) z altına girerse 4 olur");
  assert.match(bad({ id: null, parentId: null, name: "BLOG" })!, /aynı adla|bu adla/);
  assert.equal(checkFolderPlacement(F, { id: "z", parentId: "a", name: "Blog" }).ok, true);
  assert.equal(checkFolderPlacement(F, { id: "b", parentId: null, name: "Kapak" }).ok, true, "kendi adıyla kendisi çakışma sayılmaz");
  assert.equal(checkFolderPlacement(F, { id: null, parentId: "b", name: "Yeni" }).ok, true);
});

test("ağaç: ada göre sıralı, düzey numaralı; bozuk üst başvurusu köke düşer", () => {
  const tree = buildFolderTree([...F, { id: "q", parentId: "silinmis", name: "Yetim" }]);
  assert.deepEqual(tree.map((n) => n.name), ["Blog", "Ürünler", "Yetim"]);
  const u = tree.find((n) => n.id === "a")!;
  assert.equal(u.children[0]!.children[0]!.depth, 3);
});
