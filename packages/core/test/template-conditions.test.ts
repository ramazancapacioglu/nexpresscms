import test from "node:test";
import assert from "node:assert/strict";
import { contentWidthStyle, sanitizeBehavior, conditionScore, readTemplateMeta, resolveTemplate, sanitizeConditions, type TemplateRecord } from "../src";

const rec = (id: string, include: Array<{ type: string; value: string }> = [], exclude: Array<{ type: string; value: string }> = [], isDefault = false): TemplateRecord => ({
  id, name: id, blocks: [],
  meta: { kind: "header", isDefault, conditions: sanitizeConditions({ include, exclude }) },
});

test("koşul temizleme: türü bilinmeyen/boş atılır, slug biçimlenir, sınır uygulanır", () => {
  const c = sanitizeConditions({ include: [{ type: "category", value: "Çok Güzel!" }, { type: "evil", value: "x" }, { type: "slug", value: "" }, ...Array.from({ length: 40 }, (_, i) => ({ type: "tag", value: `t${i}` }))], exclude: "x" });
  assert.equal(c.include[0]!.value, "cok-guzel");
  assert.equal(c.include.length, 20);
  assert.deepEqual(c.exclude, []);
  assert.ok(!c.include.some((x) => (x.type as string) === "evil"));
});

test("özgüllük: slug > kategori > etiket > tür > dil; dışlama kazanır; bilinmeyen alan eşleşmez", () => {
  const ctx = { locale: "en", slug: "iletisim", contentType: "page", categories: ["Rehber"], tags: [] };
  assert.equal(conditionScore(sanitizeConditions({ include: [{ type: "locale", value: "en" }] }), ctx), 30);
  assert.equal(conditionScore(sanitizeConditions({ include: [{ type: "locale", value: "en" }, { type: "slug", value: "iletisim" }] }), ctx), 100);
  assert.equal(conditionScore(sanitizeConditions({ include: [{ type: "category", value: "rehber" }], exclude: [{ type: "locale", value: "en" }] }), ctx), 0);
  assert.equal(conditionScore(sanitizeConditions({ include: [{ type: "tag", value: "x" }] }), { locale: "en" }), 0);
  assert.equal(conditionScore(undefined, ctx), 0);
});

test("çözümleme: atama > koşul (en özgül) > varsayılan > yerleşik", () => {
  const list = [rec("a-default", [], [], true), rec("b-en", [{ type: "locale", value: "en" }]), rec("c-guide", [{ type: "category", value: "rehber" }])];
  assert.equal(resolveTemplate("header", list, "b-en", { locale: "tr" })!.id, "b-en"); // atama
  assert.equal(resolveTemplate("header", list, null, { locale: "en", categories: ["Rehber"] })!.id, "c-guide"); // özgül kazanır
  assert.equal(resolveTemplate("header", list, null, { locale: "en" })!.id, "b-en");
  assert.equal(resolveTemplate("header", list, null, { locale: "tr" })!.id, "a-default");
  assert.equal(resolveTemplate("header", list, null)!.id, "a-default"); // bağlam yoksa koşul yok sayılır
  assert.equal(resolveTemplate("header", [rec("x", [{ type: "locale", value: "en" }])], null, { locale: "tr" }), null);
});

test("meta okuma: koşul ve davranış doğrulanır, boşsa alan yazılmaz", () => {
  const m = readTemplateMeta({ template: { kind: "header", isDefault: false, conditions: { include: [{ type: "locale", value: "EN" }] }, behavior: { sticky: false, glass: "x" } } })!;
  assert.deepEqual(m.conditions!.include, [{ type: "locale", value: "en" }]);
  assert.deepEqual(m.behavior, { sticky: false });
  assert.equal(readTemplateMeta({ template: { kind: "header", conditions: { include: [] } } })!.conditions, undefined);
});

test("şablon davranışı: yalnızca bilinen alan ve değerler; genişlik stilleri", () => {
  assert.deepEqual(sanitizeBehavior({ sticky: false, transparent: true, tone: "light", contentWidth: "wide", evil: 1 }), { sticky: false, transparent: true, tone: "light", contentWidth: "wide" });
  assert.equal(sanitizeBehavior({ tone: "red", contentWidth: "huge", sticky: "yes" }), undefined);
  assert.equal(contentWidthStyle("default"), undefined);
  assert.equal(contentWidthStyle("narrow")!.maxWidth, "720px");
  assert.ok(contentWidthStyle("full")!.width === "100vw");
});
