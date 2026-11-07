import assert from "node:assert/strict";
import { test } from "node:test";
import { isPrefixless, joinBase, localeBase, prefixedFallbackPath, resolveLocaleMode, stripLocaleDeep, stripLocalePath } from "../src/locale-path";

const one = { supportedLocales: ["tr"], defaultLocale: "tr" };
const two = { supportedLocales: ["tr", "en"], defaultLocale: "tr" };

test("ön ek yalnızca tek dilli sitede ve o dilde kalkar; site bilinmiyorsa ön ek korunur", () => {
  assert.equal(isPrefixless(one, "tr"), true);
  assert.equal(isPrefixless(one, "en"), false);
  assert.equal(isPrefixless(two, "tr"), false);
  assert.equal(isPrefixless(null, "tr"), false);
  assert.equal(localeBase(one, "tr"), "");
  assert.equal(localeBase(two, "tr"), "/tr");
});

test("dil kipi okunamazsa tek dil kalır; çok dilde yalnızca birden fazla dil varken ön ek eklenir", () => {
  assert.deepEqual(resolveLocaleMode(null, null), { single: true, locale: "tr" });
  assert.deepEqual(resolveLocaleMode(null, { single: false, locale: "tr" }), { single: false, locale: "tr" });
  assert.deepEqual(resolveLocaleMode({ single: true, locale: "tr" }, { single: false, locale: "en" }), { single: true, locale: "tr" });
  assert.equal(prefixedFallbackPath(1, "tr", "/wolvox-erp"), null);
  assert.equal(prefixedFallbackPath(2, "tr", "/wolvox-erp"), "/tr/wolvox-erp");
  assert.equal(prefixedFallbackPath(2, "tr", "/"), "/tr");
});

test("joinBase: kök adres boşsa / döner; yol eklenir", () => {
  assert.equal(joinBase("", ""), "/");
  assert.equal(joinBase("", "/hakkimizda"), "/hakkimizda");
  assert.equal(joinBase("", "hakkimizda"), "/hakkimizda");
  assert.equal(joinBase("/tr", ""), "/tr");
  assert.equal(joinBase("/tr", "/a?x=1"), "/tr/a?x=1");
  assert.equal(joinBase("", "?q=1"), "?q=1");
});

test("stripLocalePath: yalnızca tam dil segmenti kalkar", () => {
  assert.equal(stripLocalePath("/tr", "tr"), "/");
  assert.equal(stripLocalePath("/tr/a/b?x=1#h", "tr"), "/a/b?x=1#h");
  assert.equal(stripLocalePath("/tr?x=1", "tr"), "/?x=1");
  assert.equal(stripLocalePath("/translate", "tr"), "/translate");
  assert.equal(stripLocalePath("/en/a", "tr"), "/en/a");
  assert.equal(stripLocalePath("https://x.test/tr/a", "tr"), "https://x.test/tr/a");
});

test("stripLocaleDeep: adres alanları ve html href değişir, düz metin ve tarih değişmez", () => {
  const input = { href: "/tr/iletisim", items: [{ url: "/tr" }, { text: "Yol: /tr/iletisim adresi" }], html: '<a href="/tr/a">x</a> <a href="/tr">y</a> <a href="/tr?z=1">z</a> <a href="/en/a">e</a>', at: new Date(0), n: 3 };
  const out = stripLocaleDeep(input, "tr");
  assert.equal(out.href, "/iletisim");
  assert.equal(out.items[0]!.url, "/");
  assert.equal(out.items[1]!.text, "Yol: /tr/iletisim adresi");
  assert.equal(out.html, '<a href="/a">x</a> <a href="/">y</a> <a href="/?z=1">z</a> <a href="/en/a">e</a>');
  assert.ok(out.at instanceof Date && out.n === 3);
  assert.equal(stripLocaleDeep({ md: "[a](/tr/x) [b](/tr) [c](/tr#h) [d](/en/x) [e](https://s.test/tr/x)" }, "tr").md, "[a](/x) [b](/) [c](/#h) [d](/en/x) [e](https://s.test/tr/x)");
  assert.equal(input.href, "/tr/iletisim", "girdi değişmez");
});
