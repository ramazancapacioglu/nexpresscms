import test from "node:test";
import assert from "node:assert/strict";
import { buildGradient, compileBlockStylesToCss, type BlockNode } from "../src";

const b = (style: BlockNode["style"], id = "b1"): BlockNode[] => [{ id, type: "paragraph", props: {}, style }];

test("tipografi, metin gölgesi, arka plan ve dönüşüm CSS'e derlenir", () => {
  const css = compileBlockStylesToCss(b({ fontFamily: "Inter, sans-serif", fontWeight: "700", lineHeight: "1.2", letterSpacing: "-0.02em", textTransform: "uppercase", textShadow: "md", backgroundImage: "/media/x.jpg", backgroundSize: "contain", backgroundPosition: "top left", backgroundFixed: true, translateY: "-4px", scale: 1.05, rotate: "2deg", marginLeft: "auto", marginRight: "auto" }));
  for (const frag of ["font-family:Inter, sans-serif", "font-weight:700", "line-height:1.2", "letter-spacing:-0.02em", "text-transform:uppercase", "text-shadow:0 2px 8px", "background-size:contain", "background-position:top left", "background-attachment:fixed", "transform:translateY(-4px) scale(1.05) rotate(2deg)", "margin-left:auto", "margin-right:auto"]) assert.ok(css.includes(frag), frag);
});

test("blok genişliği site kapsayıcısı ya da tam ekran olur", () => {
  const site = compileBlockStylesToCss(b({ blockWidth: "site" }));
  assert.ok(site.includes("max-width:var(--nx-container,1200px)"));
  assert.ok(site.includes("margin-left:auto"));
  const nested = compileBlockStylesToCss([
    { id: "row", type: "columns", props: {}, children: [{ id: "ic", type: "paragraph", props: {}, style: { blockWidth: "full" } }] },
  ]);
  assert.ok(nested.includes('[data-nx-b="ic"]{width:100vw'));
  assert.ok(nested.includes("margin-left:-50vw"));
  assert.ok(compileBlockStylesToCss(b({ fullWidth: true })).includes("width:100vw"));
  assert.ok(!compileBlockStylesToCss(b({})).includes("100vw"));
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

test("gradyan oluşturucu: doğrulanmış CSS; geçersiz renk atılır; tek durak boş", () => {
  assert.equal(buildGradient({ type: "linear", angle: 135, stops: [{ color: "#2563eb", pos: 0 }, { color: "#4f46e5", pos: 100 }] }), "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)");
  assert.equal(buildGradient({ type: "radial", angle: 0, stops: [{ color: "rgba(0,0,0,.5)", pos: 0 }, { color: "transparent", pos: 70 }] }), "radial-gradient(circle at center, rgba(0,0,0,.5) 0%, transparent 70%)");
  assert.equal(buildGradient({ type: "linear", angle: -90, stops: [{ color: "#fff", pos: -5 }, { color: "red;}body{x:y", pos: 50 }, { color: "#000", pos: 200 }] }), "linear-gradient(270deg, #fff 0%, #000 100%)");
  assert.equal(buildGradient({ type: "linear", angle: 0, stops: [{ color: "#fff", pos: 0 }] }), "");
});

test("kapsayıcının metin rengi içteki başlık ve paragraflara kalıtılır", () => {
  const css = compileBlockStylesToCss(b({ textColor: "#fff" }));
  assert.ok(css.includes("color:#fff"));
  assert.ok(css.includes(":is(h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,.nx-rich){color:inherit}"));
  assert.ok(!compileBlockStylesToCss(b({ paddingTop: "8px" })).includes("color:inherit"));
});

test("metin bloğunda yazı ölçüsü ve ağırlığı içteki öğeye kalıtılır; kapsayıcıda kalıtılmaz", () => {
  const leaf: BlockNode[] = [{ id: "h", type: "heading_element", props: {}, style: { fontSize: "48px", fontWeight: "800", mobile: { fontSize: "30px" } } }];
  const css = compileBlockStylesToCss(leaf);
  assert.ok(css.includes("font-size:inherit;font-weight:inherit"));
  const box: BlockNode[] = [{ id: "s", type: "section", props: {}, style: { fontSize: "48px" } }];
  assert.ok(!compileBlockStylesToCss(box).includes("font-size:inherit"));
});
