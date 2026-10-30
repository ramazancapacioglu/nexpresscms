import test from "node:test";
import assert from "node:assert/strict";
import { createTranslator, format, getMessages } from "../src";
import { en } from "../src/messages/en";
import { tr } from "../src/messages/tr";

const keysOf = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [`${p}${k}`] : keysOf(v as object, `${p}${k}.`)));

test("her dil kataloğu Türkçe ile aynı anahtarlara sahip", () => {
  assert.deepEqual(keysOf(en).sort(), keysOf(tr).sort());
});

test("değişken ve çoğul biçimleme", () => {
  assert.equal(format("Merhaba {ad}", { ad: "Ayşe" }), "Merhaba Ayşe");
  assert.equal(format("{n, plural, one {# kayıt} other {# kayıt}}", { n: 3 }, "tr"), "3 kayıt");
  assert.equal(format("{n, plural, one {# entry} other {# entries}}", { n: 1 }, "en"), "1 entry");
  assert.equal(format("{n, plural, one {# entry} other {# entries}}", { n: 2 }, "en"), "2 entries");
  assert.equal(format("{yok}"), "{yok}", "eksik değişken olduğu gibi kalır");
});

test("çevirici: dil seçimi, bölge yedeği ve bilinmeyen dilde Türkçe", () => {
  assert.equal(createTranslator("en")("shop.title"), "Store");
  assert.equal(createTranslator("en-GB")("shop.title"), "Store");
  assert.equal(createTranslator("de")("shop.title"), "Mağaza");
  assert.equal(createTranslator("en")("content.ratingSummary", { avg: "4.5", n: 2 }), "4.5 / 5.0 (2 reviews)");
  assert.equal(getMessages("tr"), tr);
});

import { isUiLocale, UI_LOCALES } from "../src";

test("panel dili: yalnızca kataloğu olan diller geçerli", () => {
  assert.deepEqual([...UI_LOCALES].sort(), ["en", "tr"]);
  assert.equal(isUiLocale("en"), true);
  assert.equal(isUiLocale("de"), false);
  assert.equal(isUiLocale(null), false);
  assert.equal(createTranslator("en")("admin.nav.translations"), "Translations");
});

test("geçersiz dil etiketi çeviriciyi bozmaz (ör. /favicon.ico yol parçası)", () => {
  assert.equal(createTranslator("favicon.ico")("common.notFoundTitle").length > 0, true);
});
