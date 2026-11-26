import assert from "node:assert/strict";
import test from "node:test";
import { sitemapArchiveTypes } from "../src/sitemap-archives";

test("etiket haritası kapalıysa veya noindex ise etiket dosyası üretilmez", () => {
  assert.deepEqual(sitemapArchiveTypes({}), ["kategori", "etiket", "yazar", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ sitemapIncludeTags: false }), ["kategori", "yazar", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ sitemapIncludeCategories: false }), ["etiket", "yazar", "archive"]);
  assert.deepEqual(sitemapArchiveTypes({ noIndexTagArchives: true, sitemapIncludeTags: true }), ["kategori", "yazar", "archive"]);
});
