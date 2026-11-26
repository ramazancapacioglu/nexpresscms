import assert from "node:assert/strict";
import { test } from "node:test";
import { editorialChanged, type EditorialSnapshot } from "../src/content-changes";

const base: EditorialSnapshot = {
  status: "published",
  slug: "wolvox-erp",
  title: "Wolvox ERP",
  excerpt: null,
  tldr: "Özet",
  blocks: [{ id: "a", type: "paragraph", props: { text: "Merhaba", html: "<p>Merhaba</p>" } }],
  metaTitle: "Wolvox ERP",
  metaDescription: "Açıklama",
  canonicalUrl: null,
  noIndex: false,
  schemaType: "SoftwareApplication",
  schemaAttributes: { campaign: { endDate: "2026-11-30" }, tags: ["erp"] },
  featuredImage: null,
  authorName: "Hatice Arslan",
};

test("aynı içerik yeniden kaydedilince değişmiş sayılmaz", () => {
  assert.equal(editorialChanged(base, structuredClone(base)), false);
});

test("anahtar sırası, null/undefined/boş dize ve Date biçimi farkı değişiklik değildir", () => {
  const reordered: EditorialSnapshot = {
    ...base,
    excerpt: "",
    canonicalUrl: undefined,
    noIndex: undefined,
    schemaAttributes: { tags: ["erp"], campaign: { endDate: "2026-11-30" } },
  };
  assert.equal(editorialChanged(base, reordered), false);
  assert.equal(
    editorialChanged({ ...base, schemaAttributes: { at: new Date("2026-01-01T00:00:00Z") } }, { ...base, schemaAttributes: { at: "2026-01-01T00:00:00.000Z" } }),
    false
  );
});

test("başlık, metin, meta, durum ve şema alanı değişince değişmiş sayılır", () => {
  assert.equal(editorialChanged(base, { ...base, title: "Wolvox ERP 26" }), true);
  assert.equal(editorialChanged(base, { ...base, tldr: "Yeni özet" }), true);
  assert.equal(editorialChanged(base, { ...base, metaDescription: "Başka" }), true);
  assert.equal(editorialChanged(base, { ...base, status: "draft" }), true);
  assert.equal(editorialChanged(base, { ...base, noIndex: true }), true);
  assert.equal(editorialChanged(base, { ...base, slug: "wolvox-erp-26" }), true);
  assert.equal(editorialChanged(base, { ...base, authorName: "Başka Yazar" }), true);
});

test("blok metni ve kampanya bitiş tarihi değişince değişmiş sayılır", () => {
  assert.equal(
    editorialChanged(base, { ...base, blocks: [{ id: "a", type: "paragraph", props: { text: "Yeni", html: "<p>Yeni</p>" } }] }),
    true
  );
  assert.equal(editorialChanged(base, { ...base, schemaAttributes: { campaign: { endDate: "2026-12-31" }, tags: ["erp"] } }), true);
});
