import assert from "node:assert/strict";
import test from "node:test";
import { sitemapArchiveTypes } from "../src/sitemap-archives";

test("etiket haritası kapalıysa veya noindex ise etiket dosyası üretilmez", () => {
  assert.deepEqual(sitemapArchiveTypes({}), ["kategori", "etiket", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ sitemapIncludeTags: false }), ["kategori", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ sitemapIncludeCategories: false }), ["etiket", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ noIndexTagArchives: true, sitemapIncludeTags: true }), ["kategori", "archive"]);
});
