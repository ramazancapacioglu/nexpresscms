import test from "node:test";
import assert from "node:assert/strict";
import { applyStylePreset, extractPresetStyle, resolveSiteSettings, sanitizeStylePresets, type BlockStyle } from "../src";

test("ön ayara yalnızca görsel stil girer; bloğa özel alanlar ve bilinmeyen anahtarlar atılır", () => {
  const s = extractPresetStyle({ backgroundColor: "#111", fontWeight: "700", tablet: { paddingTop: "8px" }, hover: { scale: 1.04, evil: "x" } as never, animation: "fade-up", transitionMs: 99999, anchorId: "hero", customCss: "selector{x:y}", hideOn: ["mobile"], bogus: "x" } as BlockStyle);
  assert.deepEqual(s, { backgroundColor: "#111", fontWeight: "700", tablet: { paddingTop: "8px" }, hover: { scale: 1.04 }, animation: "fade-up", transitionMs: 3000 });
});

test("uygulama: stil ön ayar olur, bloğa özel alanlar korunur; kopya paylaşılmaz", () => {
  const preset = { id: "p_abcd", name: "Kart", style: { backgroundColor: "#fff", hover: { scale: 1.02 } } };
  const out = applyStylePreset({ paddingTop: "99px", anchorId: "x", customCss: "selector{a:b}", hideOn: ["tablet"] } as BlockStyle, preset);
  assert.equal(out.paddingTop, undefined);
  assert.equal(out.backgroundColor, "#fff");
  assert.equal(out.anchorId, "x");
  assert.equal(out.customCss, "selector{a:b}");
  out.hover!.scale = 5;
  assert.equal(preset.style.hover!.scale, 1.02);
});

test("liste doğrulama: kimlik biçimi, yinelenen, boş ad, üst sınır", () => {
  const many = Array.from({ length: 80 }, (_, i) => ({ id: `id_${String(i).padStart(4, "0")}`, name: `n${i}`, style: { opacity: 1 } }));
  const out = sanitizeStylePresets([{ id: "x", name: "kısa kimlik" }, { id: "good_1", name: "  " }, { id: "good_2", name: "Tamam", style: { textColor: "#000", junk: 1 } }, { id: "good_2", name: "Yinelenen" }, ...many]);
  assert.equal(out.length, 50);
  assert.equal(out[0]!.id, "good_2");
  assert.deepEqual(out[0]!.style, { textColor: "#000" });
  assert.deepEqual(sanitizeStylePresets("x"), []);
});

test("site ayarları: ön ayarlar çözülürken doğrulanır, yoksa boş", () => {
  assert.deepEqual(resolveSiteSettings({}).customizer.stylePresets, []);
  assert.equal(resolveSiteSettings({ customizer: { stylePresets: [{ id: "abcd", name: "A", style: { opacity: 0.5 } }] } }).customizer.stylePresets.length, 1);
});
