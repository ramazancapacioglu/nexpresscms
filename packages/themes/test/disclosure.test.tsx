import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import { renderStudioCatalogBlock } from "../src/catalog-blocks";
import { ACCORDION_STYLES, TAB_STYLES } from "../src/blocks-disclosure";

const tokens = { colors: { border: "#ddd", primary: "#4f46e5", primaryForeground: "#fff", muted: "#f1f5f9", foreground: "#0f172a" }, geometry: { borderRadius: "8px" }, typography: { headingFont: "inherit" } } as unknown as DesignTokens;
const render = (block: Partial<BlockNode>) => renderToStaticMarkup(renderStudioCatalogBlock({ id: "t1", props: {}, ...block } as BlockNode, tokens)!);

test("akordeon: her görünüm CSS'i yalnız kendi sınıfına yazar, ilk madde açık, JS yok", () => {
  for (const style of ACCORDION_STYLES) {
    const out = render({ type: "accordion", props: { accordionStyle: style, items: [{ title: "S1", body: "Y1" }, { title: "S2", body: "Y2" }] } });
    assert.ok(out.includes("<details") && out.includes("nx-acc-t1"), style);
    assert.equal((out.match(/<details[^>]* open/g) ?? []).length, 1, style);
    assert.ok(!out.includes("<script"), style);
  }
  const closed = render({ type: "accordion", props: { openFirst: false, items: [{ title: "S", body: "Y" }] } });
  assert.ok(!/<details[^>]* open/.test(closed));
});

test("sekmeler: her görünüm radyo + etiket üretir ve ilk panel seçili gelir", () => {
  for (const style of TAB_STYLES) {
    const out = render({ type: "tabs", props: { tabStyle: style, items: [{ label: "A", body: "a" }, { label: "B", body: "b" }] } });
    assert.equal((out.match(/type="radio"/g) ?? []).length, 2, style);
    assert.ok(out.includes("checked"), style);
    assert.ok(out.includes("nx-tabs-t1-panel-1"), style);
  }
  assert.ok(render({ type: "tabs", props: { tabStyle: "bilinmeyen", items: [{ label: "A" }] } }).includes("<label"));
});

test("akordeon: açılış modu (ilk/hepsi kapalı/hepsi açık) ve tek-açık grup adı", () => {
  const items = [{ title: "A", body: "a" }, { title: "B", body: "b" }, { title: "C", body: "c" }];
  const open = (props: Record<string, unknown>, type = "accordion") =>
    (render({ type, props: { items: type === "accordion" ? items : items.map((i) => ({ question: i.title, answer: i.body })), ...props } }).match(/<details[^>]* open/g) ?? []).length;
  assert.equal(open({}), 1);
  assert.equal(open({ openMode: "none" }), 0);
  assert.equal(open({ openMode: "all" }), 3);
  assert.equal(open({ openFirst: false }), 0);
  assert.ok(render({ type: "accordion", props: { exclusive: true, items } }).includes('name="nx-acc-t1"'));
  assert.ok(!render({ type: "accordion", props: { exclusive: true, openMode: "all", items } }).includes(" name="));
});
