import test from "node:test";
import assert from "node:assert/strict";
import { compileBlockStylesToCss, type BlockNode } from "../src";

const b = (style: BlockNode["style"], id = "b1"): BlockNode[] => [{ id, type: "paragraph", props: {}, style }];

test("tipografi, metin gölgesi, arka plan ve dönüşüm CSS'e derlenir", () => {
  const css = compileBlockStylesToCss(b({ fontFamily: "Inter, sans-serif", fontWeight: "700", lineHeight: "1.2", letterSpacing: "-0.02em", textTransform: "uppercase", textShadow: "md", backgroundImage: "/media/x.jpg", backgroundSize: "contain", backgroundPosition: "top left", backgroundFixed: true, translateY: "-4px", scale: 1.05, rotate: "2deg", marginLeft: "auto", marginRight: "auto" }));
  for (const frag of ["font-family:Inter, sans-serif", "font-weight:700", "line-height:1.2", "letter-spacing:-0.02em", "text-transform:uppercase", "text-shadow:0 2px 8px", "background-size:contain", "background-position:top left", "background-attachment:fixed", "transform:translateY(-4px) scale(1.05) rotate(2deg)", "margin-left:auto", "margin-right:auto"]) assert.ok(css.includes(frag), frag);
});

test("kenarlık biçimi yalnızca kalınlıkla birlikte ve izinli değerlerle yazılır", () => {
  assert.ok(compileBlockStylesToCss(b({ borderWidth: "2px", borderStyle: "dashed" })).includes("border-style:dashed"));
  assert.ok(!compileBlockStylesToCss(b({ borderStyle: "dashed" })).includes("dashed"));
  assert.ok(!compileBlockStylesToCss(b({ borderWidth: "2px", borderStyle: "x;color:red" as never })).includes("color:red"));
});

test("hover yalnızca hover:hover ortamında; geçiş süresi sınırlı", () => {
  const css = compileBlockStylesToCss(b({ hover: { backgroundColor: "#111", scale: 1.04 }, transitionMs: 99999 }));
  assert.ok(css.includes("@media (hover:hover){[data-nx-b=\"b1\"]:hover{background-color:#111;transform:scale(1.04)}}"));
  assert.ok(css.includes("transition:all 3000ms ease"));
});

test("giriş animasyonu: anahtar kareler bir kez, @supports ile kaydırmaya bağlı", () => {
  const two: BlockNode[] = [...b({ animation: "fade-up" }, "a"), ...b({ animation: "fade-up" }, "b")];
  const css = compileBlockStylesToCss(two);
  assert.equal(css.match(/@keyframes nx-fade-up/g)?.length, 1);
  assert.ok(css.includes("@supports (animation-timeline:view())"));
  assert.ok(!compileBlockStylesToCss(b({ animation: "evil" as never })).includes("@keyframes"));
});

test("zararlı değerler temizlenir", () => {
  const css = compileBlockStylesToCss(b({ fontFamily: "x;}body{display:none", translateY: "1px}</style>", scale: 99 }));
  assert.ok(!css.includes("}body{") && !css.includes("</style>") && !css.includes("scale(99)"));
});
