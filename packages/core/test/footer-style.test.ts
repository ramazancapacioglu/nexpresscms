import assert from "node:assert/strict";
import test from "node:test";
import { expandFooterText, footerRowColors, resolveFooterStyle } from "../src/index";

const tk = { primary: "#2563eb", primaryForeground: "#ffffff", muted: "#f1f5f9" };

test("varsayılanlar: eski kayıt (options yok) önceki görünümü korur", () => {
  const s = resolveFooterStyle(undefined);
  assert.deepEqual([s.main.background, s.main.paddingY, s.main.divider, s.main.full], ["default", 48, false, false]);
  assert.deepEqual([s.bottom.paddingY, s.bottom.divider, s.bottom.centered, s.bottom.backToTop, s.gapPx], [20, true, false, false, 32]);
});

test("bozuk değerler beyaz listeye iner: zemin, renk, boşluk", () => {
  const s = resolveFooterStyle({
    main: { background: "javascript:x" as never, paddingY: 9999 },
    bottom: { background: "custom", customColor: "red;} body{display:none", paddingY: -5, layout: "centered" },
    gap: "xl" as never,
  });
  assert.equal(s.main.background, "default");
  assert.equal(s.main.paddingY, 120);
  assert.equal(s.bottom.background, "default", "geçersiz özel renk sayfa zeminine düşer");
  assert.equal(s.bottom.customColor, null);
  assert.equal(s.bottom.paddingY, 8);
  assert.equal(s.bottom.centered, true);
  assert.equal(s.gapPx, 32);
  assert.equal(resolveFooterStyle({ main: { paddingY: Number.NaN } }).main.paddingY, 48);
});

test("zemin rengine göre yazı rengi: koyu zeminde açık, açık özel renkte koyu", () => {
  assert.deepEqual(footerRowColors({ background: "default", customColor: null }, tk), { background: null, color: null });
  assert.equal(footerRowColors({ background: "primary", customColor: null }, tk).color, "#ffffff");
  assert.equal(footerRowColors({ background: "dark", customColor: null }, tk).color, "#e2e8f0");
  assert.equal(footerRowColors({ background: "custom", customColor: "#fff" }, tk).color, "#0f172a");
  assert.equal(footerRowColors({ background: "custom", customColor: "#111827" }, tk).color, "#f8fafc");
});

test("telif yer tutucuları", () => {
  assert.equal(expandFooterText("© {year} {site}. Tüm hakları saklıdır.", "Acme", 2026), "© 2026 Acme. Tüm hakları saklıdır.");
  assert.equal(expandFooterText(undefined, "Acme", 2026), "");
});

test("alt çubuk: sosyal bağlantılar yalnızca https; menü kimliği güvenli biçimde", () => {
  const s = resolveFooterStyle({ bottom: { socials: { x: "https://x.com/acme", linkedin: "javascript:alert(1)", github: "http://github.com/a", youtube: "https://u:p@youtube.com/c", instagram: "  https://instagram.com/acme  ", facebook: "" }, menuId: "mnu_1" } });
  assert.deepEqual(s.bottom.socials.map((x) => [x.id, x.label]), [["x", "X"], ["instagram", "Instagram"]]);
  assert.equal(s.bottom.menuId, "mnu_1");
  assert.equal(resolveFooterStyle({ bottom: { menuId: "a b<script>" } }).bottom.menuId, null);
  assert.deepEqual(resolveFooterStyle(undefined).bottom.socials, []);
  assert.equal(resolveFooterStyle(undefined).bottom.menuId, null);
});
