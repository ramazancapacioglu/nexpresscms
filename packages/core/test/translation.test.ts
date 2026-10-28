import test from "node:test";
import assert from "node:assert/strict";
import { buildHreflang, effectiveStatus, isValidLocaleTag, localeDirection, translationSourceHash, translationStateOf } from "../src";

test("kaynak özeti: içerik değişince değişir, aynı içerikte sabit", () => {
  const a = translationSourceHash({ title: "T", tldr: "x", blocks: [{ id: "1" }] });
  assert.equal(a, translationSourceHash({ title: "T", tldr: "x", blocks: [{ id: "1" }] }));
  assert.notEqual(a, translationSourceHash({ title: "T", tldr: "x", blocks: [{ id: "2" }] }));
  assert.notEqual(a, translationSourceHash({ title: "T2", tldr: "x", blocks: [{ id: "1" }] }));
});

test("çeviri durumu: yok, taslak, yayında, kaynak değişti", () => {
  assert.equal(translationStateOf(undefined, "h"), "none");
  assert.equal(translationStateOf({ translationStatus: "draft" }, "h"), "draft");
  assert.equal(translationStateOf({ translationStatus: "published", sourceHash: "h" }, "h"), "published");
  assert.equal(translationStateOf({ translationStatus: "published", sourceHash: "eski" }, "h"), "stale");
  assert.equal(translationStateOf({ translationStatus: "published", sourceHash: null }, "h"), "published", "elle yazılmış çeviri bayatlamaz");
});

test("etkin durum, yön ve dil etiketi", () => {
  assert.equal(effectiveStatus("published", "draft"), "draft");
  assert.equal(effectiveStatus("published", "published"), "published");
  assert.equal(effectiveStatus("draft", "published"), "draft");
  assert.equal(localeDirection("ar"), "rtl");
  assert.equal(localeDirection("he-IL"), "rtl");
  assert.equal(localeDirection("tr"), "ltr");
  assert.ok(isValidLocaleTag("pt-br") && isValidLocaleTag("tr") && !isValidLocaleTag("../x") && !isValidLocaleTag("T"));
});

test("hreflang: karşılıklı küme + x-default; tek dilde boş", () => {
  const url = (l: { locale: string; slug: string }) => `https://x.test/${l.locale}/${l.slug}`;
  assert.deepEqual(buildHreflang([{ locale: "tr", slug: "a" }], "tr", url), []);
  assert.deepEqual(buildHreflang([{ locale: "en", slug: "a-en" }, { locale: "tr", slug: "a" }], "tr", url), [
    { hreflang: "en", href: "https://x.test/en/a-en" },
    { hreflang: "tr", href: "https://x.test/tr/a" },
    { hreflang: "x-default", href: "https://x.test/tr/a" },
  ]);
});

import { pickLocale } from "../src";

test("dil seçimi: etkin dil kabul, geçersiz/boş varsayılana düşer", () => {
  assert.equal(pickLocale("EN", ["tr", "en"], "tr"), "en");
  assert.equal(pickLocale("de", ["tr", "en"], "tr"), "tr");
  assert.equal(pickLocale("../etc", ["tr"], "tr"), "tr");
  assert.equal(pickLocale(null, ["tr"], "tr"), "tr");
});

import { mergeLocalizedAttributes, pickLocalizedAttributes } from "../src";

test("çeviriye özgü öznitelikler: seçme, birleştirme, kaynak dil değerleri sızmaz", () => {
  const shared = { slugHistory: ["eski-tr"], schemaX: 1, _publishing: { categories: ["a"], featuredImageAlt: "Türkçe alt", focusKeyword: "anahtar", featuredImageMeta: { url: "/u.png", altText: "Türkçe alt", caption: "Alt yazı" } } };
  const picked = pickLocalizedAttributes({ _publishing: { featuredImageAlt: "English alt", focusKeyword: "keyword" } }, ["old-en"]);
  assert.deepEqual(picked, { _localized: true, featuredImageAlt: "English alt", featuredImageCaption: undefined, focusKeyword: "keyword", slugHistory: ["old-en"] });
  const merged = mergeLocalizedAttributes(shared, picked) as typeof shared;
  assert.equal(merged._publishing.featuredImageAlt, "English alt");
  assert.equal(merged._publishing.featuredImageMeta.altText, "English alt");
  assert.equal(merged._publishing.featuredImageMeta.caption, "", "Türkçe alt yazı İngilizceye sızmaz");
  assert.equal(merged._publishing.featuredImageMeta.url, "/u.png", "görsel adresi paylaşılır");
  assert.deepEqual(merged._publishing.categories, ["a"]);
  assert.deepEqual(merged.slugHistory, ["old-en"]);
  assert.equal(mergeLocalizedAttributes(shared, {}), shared, "yerelleştirilmemiş satır paylaşılanı verir");
  assert.equal((mergeLocalizedAttributes(shared, { _localized: true, slugHistory: [] }) as Record<string, unknown>).slugHistory, undefined);
});
