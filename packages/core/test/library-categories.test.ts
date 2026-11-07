import test from "node:test";
import assert from "node:assert/strict";
import { LIBRARY_CATEGORIES, libraryCategoryLabel, normalizeLibraryCategory } from "../src/library-categories";

test("kütüphane kategorileri: kimlikler benzersiz, Türkçe etiketli", () => {
  const ids = LIBRARY_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["accordion", "tabs", "page_title", "menu", "logos", "video_text"]) assert.ok(ids.includes(id), id);
  assert.equal(libraryCategoryLabel("accordion"), "Akordeon");
});

test("eski ve bilinmeyen kategori adları yeni kimliğe çevrilir", () => {
  assert.equal(normalizeLibraryCategory("layout"), "text");
  assert.equal(normalizeLibraryCategory("forms"), "contact");
  assert.equal(normalizeLibraryCategory("pricing"), "pricing");
  assert.ok(LIBRARY_CATEGORIES.some((c) => c.id === normalizeLibraryCategory("yok-boyle-bir-sey")));
});
