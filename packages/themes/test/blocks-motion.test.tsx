import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ICON_NAMES, ICON_PATHS, type BlockNode } from "@nexpress/core";
import { renderMotionBlock, SHAPE_NAMES } from "../src/blocks-motion";

const html = (type: string, props: Record<string, unknown>) => {
  const el = renderMotionBlock({ id: "b1", type, props } as BlockNode);
  return el ? renderToStaticMarkup(el) : "";
};

test("simge: yalnızca yerleşik kümeden çizilir; bilinmeyen ad yol üretmez; renk doğrulanır", () => {
  assert.ok(html("single_icon", { icon: "check" }).includes(`d="${ICON_PATHS.check}"`));
  assert.ok(!html("single_icon", { icon: "<script>" }).includes("<path"));
  assert.ok(!html("single_icon", { icon: "check", color: "red;}</style>" }).includes("</style>"));
  assert.ok(html("single_icon", { icon: "check", href: "javascript:alert(1)" }).indexOf("href") === -1);
  assert.ok(ICON_NAMES.length >= 20 && ICON_NAMES.every((n) => ICON_PATHS[n]));
});

test("sayaç: nihai değer metinde (JS'siz erişilebilir), animasyon yalnızca @supports altında", () => {
  const out = html("countup", { value: 1250, suffix: "+", label: "Müşteri" });
  assert.ok(out.includes("1.250") && out.includes("+") && out.includes("Müşteri"));
  assert.ok(out.includes("@supports (animation-timeline:view())"));
});

test("marquee: liste iki kez, ikincisi aria-hidden; boş liste çizilmez; hareket azaltma desteklenir", () => {
  const out = html("marquee", { items: ["A", "B"], speed: 20 });
  assert.equal((out.match(/<li>/g) ?? []).length, 4);
  assert.ok(out.includes('aria-hidden="true"') && out.includes("prefers-reduced-motion"));
  assert.equal(html("marquee", { items: [] }), "");
});

test("şekil ayırıcı: bilinen şekiller, bilinmeyen dalgaya düşer, renk doğrulanır", () => {
  for (const s of SHAPE_NAMES) assert.ok(html("shape_divider", { shape: s }).includes("<path"));
  assert.ok(html("shape_divider", { shape: "x" }).includes("<path"));
  assert.ok(!html("shape_divider", { color: "red\" onload=\"x" }).includes("onload"));
});

test("başka tür blok için undefined döner", () => {
  assert.equal(renderMotionBlock({ id: "x", type: "paragraph", props: {} } as BlockNode), undefined);
});
