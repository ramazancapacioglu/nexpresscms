import assert from "node:assert/strict";
import { test } from "node:test";
import { draftSignature, draftStorageKey, parseStoredDraft, recoveryDecision, snapshotToDraftFields, type EditorDraftFields, type StoredDraft } from "../src/editor-draft";

const fields = (over: Partial<EditorDraftFields> = {}): EditorDraftFields => ({
  title: "Başlık", slug: "baslik", tldr: "Özet", blocks: [{ id: "a", type: "paragraph", props: { text: "x" } }],
  metaTitle: "", metaDescription: "", canonicalUrl: "", noIndex: false, schemaType: "WebPage", importanceScore: 5,
  featuredImageUrl: "", featuredImageAlt: "", featuredImageCaption: "", focusKeyword: "", visibility: "public",
  scheduledAt: "", categories: ["a"], tags: [], allowComments: true, allowReviews: true, showShareButtons: true, ...over,
});

test("imza kararlıdır; her düzenlenebilir alandaki değişiklik imzayı değiştirir", () => {
  const base = draftSignature(fields());
  assert.equal(base, draftSignature(fields()), "aynı içerik aynı imza");
  const changes: Array<Partial<EditorDraftFields>> = [
    { title: "B" }, { slug: "b" }, { tldr: "b" }, { blocks: [] }, { metaTitle: "m" }, { metaDescription: "m" }, { canonicalUrl: "https://x" },
    { noIndex: true }, { schemaType: "Article" }, { importanceScore: 9 }, { featuredImageUrl: "/x" }, { featuredImageAlt: "a" },
    { featuredImageCaption: "c" }, { focusKeyword: "k" }, { visibility: "private" }, { scheduledAt: "2026-01-01" },
    { categories: ["b"] }, { tags: ["t"] }, { allowComments: false }, { allowReviews: false }, { showShareButtons: false },
  ];
  const seen = new Set([base]);
  for (const c of changes) {
    const sig = draftSignature(fields(c));
    assert.ok(!seen.has(sig), `imza değişmedi: ${JSON.stringify(c)}`);
    seen.add(sig);
  }
  assert.equal(draftSignature(fields({ categories: ["a", "b"] })) === draftSignature(fields({ categories: ["b", "a"] })), false, "dizi sırası anlamlıdır");
});

test("depolama anahtarı kiracı ve içeriğe özeldir; yeni içerik türe göre ayrılır", () => {
  assert.equal(draftStorageKey("default", "cnt_1", "page"), "nx:draft:default:cnt_1");
  assert.equal(draftStorageKey("default", undefined, "post"), "nx:draft:default:new-post");
  assert.notEqual(draftStorageKey("a", "cnt_1", "page"), draftStorageKey("b", "cnt_1", "page"));
});

test("depodan okunan ham metin doğrulanır", () => {
  const good: StoredDraft = { v: 1, signature: "s", at: 1, baseUpdatedAt: 1, fields: fields() };
  assert.deepEqual(parseStoredDraft(JSON.stringify(good)), good);
  for (const bad of [null, "", "{", "[]", JSON.stringify({ ...good, v: 2 }), JSON.stringify({ ...good, fields: { ...good.fields, blocks: "x" } }), JSON.stringify({ ...good, at: "yok" })]) {
    assert.equal(parseStoredDraft(bad as string | null), null, String(bad));
  }
});

test("kurtarma kararı: farklı ve güncel taslak önerilir; aynı veya eskimiş taslak atılır", () => {
  const stored: StoredDraft = { v: 1, signature: "taslak", at: 2000, baseUpdatedAt: 1000, fields: fields() };
  assert.equal(recoveryDecision(null, "x", 0), "none");
  assert.equal(recoveryDecision(stored, "kayit", 1000), "offer", "kayıttan farklı ve kayıt değişmemiş");
  assert.equal(recoveryDecision(stored, "taslak", 1000), "discard", "kayıtla aynı");
  assert.equal(recoveryDecision(stored, "kayit", 1500), "discard", "kayıt, taslaktan sonra başka yerde güncellenmiş");
});

test("revizyon görüntüsü editör alanlarına çevrilir; yayın öznitelikleri _publishing altından okunur, eksikler varsayılan olur", () => {
  const f = snapshotToDraftFields({
    title: "T", slug: "t", tldr: null, blocks: [{ id: "a" }], metaTitle: null, metaDescription: "md", canonicalUrl: null, noIndex: true,
    featuredImage: "/media/x?w=1&h=1", schemaType: "Article", importanceScore: 7,
    schemaAttributes: { _publishing: { visibility: "private", categories: ["c1"], tags: ["t1", "t2"], focusKeyword: "kelime", featuredImageAlt: "alt", allowComments: false, scheduledAt: "2026-12-01T10:00" } },
  });
  assert.equal(f.tldr, "");
  assert.equal(f.metaTitle, "");
  assert.equal(f.metaDescription, "md");
  assert.equal(f.featuredImageUrl, "/media/x?w=1&h=1");
  assert.equal(f.featuredImageAlt, "alt");
  assert.equal(f.visibility, "private");
  assert.deepEqual(f.categories, ["c1"]);
  assert.deepEqual(f.tags, ["t1", "t2"]);
  assert.equal(f.focusKeyword, "kelime");
  assert.equal(f.allowComments, false);
  assert.equal(f.allowReviews, true, "belirtilmeyen alan varsayılan açık");
  assert.equal(f.scheduledAt, "2026-12-01T10:00");
  const empty = snapshotToDraftFields({ title: "", slug: "", tldr: "", blocks: [], metaTitle: "", metaDescription: "", canonicalUrl: "", noIndex: false, featuredImage: null, schemaType: "WebPage", importanceScore: 5, schemaAttributes: {} });
  assert.equal(empty.visibility, "public");
  assert.deepEqual(empty.categories, []);
});

test("taslak anahtarı: varsayılan dil eski biçimi korur, çeviri kendi anahtarını alır", () => {
  assert.equal(draftStorageKey("default", "c1", "page"), "nx:draft:default:c1");
  assert.equal(draftStorageKey("default", "c1", "page", "en"), "nx:draft:default:c1:en");
  assert.equal(draftStorageKey("default", undefined, "post", "en"), "nx:draft:default:new-post:en");
});
