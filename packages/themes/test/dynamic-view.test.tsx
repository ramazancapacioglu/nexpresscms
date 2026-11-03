import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeDynamicQuery, type BlockNode, type DesignTokens, type DynamicItem, type DynamicMeta } from "@nexpress/core";
import { DynamicListView } from "../src/dynamic-list";
import { renderLayoutBlock } from "../src/blocks-layout";

const tokens = { colors: { border: "#ddd", primary: "#26e", primaryForeground: "#fff" }, geometry: { borderRadius: "8px" }, typography: { headingFont: "x" } } as unknown as DesignTokens;
const items: DynamicItem[] = [1, 2, 3].map((n) => ({ id: `i${n}`, title: `Öğe ${n}`, url: `/tr/o${n}`, excerpt: "özet", image: null, date: null, price: `${n}00 TL` }));
const meta = (over: Partial<DynamicMeta> = {}): DynamicMeta => ({ key: "qabc", total: 3, page: 1, pages: 1, q: "", sort: "newest", cat: "", categories: [], keep: {}, ...over });
const view = (props: Record<string, unknown>, m?: DynamicMeta) => renderToStaticMarkup(<DynamicListView query={normalizeDynamicQuery(props)} items={items} tokens={tokens} meta={m} />);

test("atlıkarınca: kaydırılabilir bölge odaklanabilir, öğeler yakalama noktalı", () => {
  const out = view({ layout: "carousel", columns: 3, heading: "Ürünler" });
  assert.ok(out.includes('role="region"') && out.includes('tabindex="0"') && out.includes("snap-x") && out.includes("snap-start"));
});

test("kart stilleri: sade çerçevesiz, görsel üstü, ilk büyük", () => {
  assert.ok(!view({ cardStyle: "minimal" }).includes("border-nx") && view({ cardStyle: "minimal" }).includes("overflow-hidden"));
  assert.ok(view({ cardStyle: "featured", columns: 3 }).includes("sm:col-span-2"));
  const withImg = renderToStaticMarkup(<DynamicListView query={normalizeDynamicQuery({ cardStyle: "overlay" })} items={[{ ...items[0]!, image: "/media/x.jpg" }]} tokens={tokens} />);
  assert.ok(withImg.includes("from-black/80"));
});

test("fiyat süzgeci: min/max alanları ve değerler forma yazılır; başlık denetimlerden önce gelir", () => {
  const out = view({ source: "products", showPriceFilter: true, heading: "Mağaza" }, meta({ price: { min: 100, max: null, lo: 50, hi: 999 } }));
  assert.ok(out.includes('name="qabc_min"') && out.includes('name="qabc_max"') && out.includes('value="100"'));
  assert.ok(out.indexOf("<h2") < out.indexOf("<form"));
});

test("bölüm arka plan videosu: yalnızca güvenli adres; kapak yedeği; mobil/hareket azaltma kuralı", () => {
  const render = (props: Record<string, unknown>) => {
    const el = renderLayoutBlock({ block: { id: "s", type: "section", props, children: [] } as BlockNode, themeId: "corporate-aurora", tokens, isEditorial: false, isCommerce: false, renderChild: () => null } as never);
    return el ? renderToStaticMarkup(el) : "";
  };
  const ok = render({ bgVideo: "/media/a.mp4", bgPoster: "/media/a.jpg" });
  assert.ok(ok.includes("<video") && /autoplay/i.test(ok) && ok.includes("muted") && ok.includes("prefers-reduced-motion"));
  assert.ok(ok.includes("background-image"));
  assert.ok(!render({ bgVideo: "javascript:alert(1).mp4" }).includes("<video"));
  assert.ok(!render({ bgVideo: "//evil.test/a.mp4" }).includes("<video"));
  assert.ok(!render({ bgVideo: "/media/a.exe" }).includes("<video"));
  assert.ok(!render({}).includes("<video"));
});
