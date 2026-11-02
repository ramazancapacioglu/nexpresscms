import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEditorFields, emptyItem, getPath, inferField, moveItem, setPath } from "../src/block-fields";

test("katalogdaki blok: sözleşmeden alanlar (tür, sınır, liste öğesi alanları)", () => {
  const f = buildEditorFields("pricing_table", { title: "Planlar", plans: [{ name: "A", price: "9", featured: true }] });
  assert.equal(f[0]!.key, "title");
  const plans = f.find((x) => x.key === "plans")!;
  assert.equal(plans.kind, "list");
  assert.deepEqual(plans.fields!.map((x) => [x.key, x.kind]), [["name", "text"], ["price", "text"], ["description", "textarea"], ["ctaLabel", "text"], ["featured", "boolean"]]);
  const callout = buildEditorFields("callout", { tone: "TIP", text: "x" });
  assert.deepEqual(callout.find((x) => x.key === "tone")!.options, ["TIP", "NOTE", "IMPORTANT", "WARNING"]);
});

test("katalogda olmayan blok: mevcut değerlerden çıkarım; hiçbir alan gizli kalmaz, iç alanlar gizlenir", () => {
  const props = { title: "Yorumlar", html: "<p>x</p>", width: 100, imageUrl: "/media/a", ctaHref: "/tr/x", accent: "#112233", note: "x".repeat(150), items: [{ quote: "Harika", author: "Ayşe", rating: 5, avatar: "/media/b" }], tags: ["a", "b"], grid: [["1", "2"]], opts: { show: true, size: 3 } };
  const f = Object.fromEntries(buildEditorFields("testimonial_grid", props).map((x) => [x.key, x]));
  assert.equal(f.html, undefined);
  assert.equal(f.width, undefined);
  assert.equal(f.imageUrl!.kind, "image");
  assert.equal(f.ctaHref!.kind, "url");
  assert.equal(f.accent!.kind, "color");
  assert.equal(f.note!.kind, "textarea");
  assert.equal(f.tags!.kind, "strings");
  assert.equal(f.grid!.kind, "matrix");
  assert.equal(f.opts!.kind, "group");
  assert.deepEqual(f.items!.fields!.map((x) => [x.key, x.kind]), [["quote", "textarea"], ["author", "text"], ["rating", "number"], ["avatar", "image"]]);
  assert.equal(inferField("x", null), null);
  assert.equal(inferField("etiket", "a")!.label, "Etiket");
});

test("yeni öğe ve yol işlemleri değişmezdir", () => {
  const item = emptyItem(buildEditorFields("pricing_table", {}).find((x) => x.key === "plans")!.fields!);
  assert.deepEqual(item, { name: "", price: "", description: "", ctaLabel: "", featured: false });
  const root = { plans: [{ name: "A" }, { name: "B" }], t: "x" };
  const next = setPath(root, ["plans", 1, "name"], "Z");
  assert.equal((next.plans[1] as { name: string }).name, "Z");
  assert.equal(root.plans[1]!.name, "B", "orijinal değişmez");
  assert.equal(next.plans[0], root.plans[0], "dokunulmayan dal paylaşılır");
  assert.equal(getPath(next, ["plans", 1, "name"]), "Z");
  assert.equal(getPath(next, ["yok", 3]), undefined);
  assert.deepEqual(moveItem([1, 2, 3], 0, 2), [2, 3, 1]);
  assert.deepEqual(moveItem([1, 2], 0, 5), [1, 2]);
});
