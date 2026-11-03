import assert from "node:assert/strict";
import { test } from "node:test";
import { STARTER_TEMPLATES, TEMPLATE_KINDS, TEMPLATE_KIND_IDS, cloneStarterBlocks, readTemplateMeta, resolveTemplate, templateHasBlock, validateTemplate, type TemplateRecord } from "../src/templates";

const rec = (id: string, kind: string, isDefault = false): TemplateRecord => ({ id, name: id, meta: { kind: kind as never, isDefault }, blocks: [] });

test("çözümleme: atanmış (türü uyuyorsa) → türün varsayılanı → null", () => {
  const all = [rec("a", "post"), rec("b", "post", true), rec("c", "page", true)];
  assert.equal(resolveTemplate("post", all, "a")!.id, "a");
  assert.equal(resolveTemplate("post", all, "c")!.id, "b", "başka türden şablon atanamaz, varsayılana düşer");
  assert.equal(resolveTemplate("post", all, "yok")!.id, "b");
  assert.equal(resolveTemplate("post", all)!.id, "b");
  assert.equal(resolveTemplate("tag", all), null);
  assert.equal(resolveTemplate("post", [rec("a", "post")]), null, "varsayılan yoksa yerleşik görünüm");
});

test("meta okuma: geçersiz tür reddedilir", () => {
  assert.deepEqual(readTemplateMeta({ template: { kind: "post", isDefault: true } }), { kind: "post", isDefault: true });
  assert.equal(readTemplateMeta({ template: { kind: "hack" } }), null);
  assert.equal(readTemplateMeta(null), null);
  assert.deepEqual(readTemplateMeta({ template: { kind: "page" } }), { kind: "page", isDefault: false });
});

test("her hazır şablon kendi türü için geçerlidir ve benzersiz kimlikli kopyalanır", () => {
  assert.ok(STARTER_TEMPLATES.length >= 12);
  for (const kind of TEMPLATE_KIND_IDS) assert.ok(STARTER_TEMPLATES.some((s) => s.kind === kind), `${kind} için hazır şablon yok`);
  for (const s of STARTER_TEMPLATES) {
    assert.deepEqual(validateTemplate(s.kind, s.blocks).filter((i) => i.level === "error"), [], s.id);
    const ids = (blocks: typeof s.blocks): string[] => blocks.flatMap((b) => [b.id, ...ids((b.children ?? []) as never)]);
    const a = ids(cloneStarterBlocks(s.blocks, "x1")), b2 = ids(cloneStarterBlocks(s.blocks, "x2"));
    assert.equal(new Set(a).size, a.length, `${s.id}: kimlikler tekil`);
    assert.ok(a.every((id) => !b2.includes(id)), "iki kopya kimlik paylaşmaz");
  }
});

test("doğrulama: zorunlu yuva eksik/çift, header'da içerik yuvası, başlık uyarıları", () => {
  const post = STARTER_TEMPLATES.find((s) => s.id === "post-default")!;
  assert.deepEqual(validateTemplate("post", post.blocks), []);
  assert.ok(validateTemplate("post", [{ id: "x", type: "paragraph", props: {} }] as never).some((i) => i.level === "error" && i.message.includes("İçerik")));
  const dup = [...post.blocks, { id: "c2", type: "tpl_post_content", props: {} }] as never;
  assert.ok(validateTemplate("post", dup).some((i) => i.message.includes("yalnızca bir kez")));
  assert.ok(validateTemplate("header", [{ id: "x", type: "tpl_post_content", props: {} }] as never).some((i) => i.level === "error"));
  assert.ok(validateTemplate("page", [{ id: "c", type: "tpl_post_content", props: {} }] as never).some((i) => i.level === "warning" && i.message.includes("h1")));
  assert.equal(templateHasBlock(post.blocks, "tpl_post_meta"), true);
  assert.ok(Object.keys(TEMPLATE_KINDS).length >= 11);
});

test("ürün/mağaza şablonları: satın alma kutusu yoksa uyarı, mağaza listesinde arşiv yuvası zorunlu", () => {
  const prod = STARTER_TEMPLATES.find((s) => s.id === "product-default")!;
  assert.deepEqual(validateTemplate("product", prod.blocks), []);
  assert.ok(templateHasBlock(prod.blocks, "tpl_product_buy"));
  const noBuy = validateTemplate("product", [{ id: "t", type: "tpl_post_title", props: {} }] as never);
  assert.ok(noBuy.some((i) => i.level === "warning" && i.message.includes("tpl_product_buy")));
  assert.ok(validateTemplate("shop", [{ id: "t", type: "tpl_archive_title", props: {} }] as never).some((i) => i.level === "error"));
  for (const id of ["product-related", "shop-grid", "shop-list"]) assert.ok(STARTER_TEMPLATES.some((s) => s.id === id), id);
});
