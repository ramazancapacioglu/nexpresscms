import assert from "node:assert/strict";
import { test } from "node:test";
import type { MediaAssetDto } from "@nexpress/database";
import { queryMedia, DEFAULT_QUERY, formatBytes } from "../src/components/admin/media/media-filter";

const mk = (id: string, p: Partial<MediaAssetDto> = {}): MediaAssetDto => ({ id, siteId: "default", filename: `${id}.jpg`, url: `/media/${id}?w=1&h=1`, mimeType: "image/jpeg", width: 1000, height: 600, sizeBytes: 1000, altText: "alt", titleText: null, caption: null, description: null, kind: "image", focalPoint: { x: 50, y: 50 }, seoScore: 90, folderId: null, createdAt: new Date(2026, 0, 1), ...p });

test("arama: ad, başlık, alt metin, açıklama; büyük/küçük harf ve aksan gözetmez", () => {
  const items = [mk("a", { filename: "Kırmızı-ayakkabı.jpg" }), mk("b", { titleText: "Ofis" }), mk("c", { description: "Fiyat listesi 2026", kind: "document" })];
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, search: "KIRMIZI" }).map((x) => x.id), ["a"]);
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, search: "ofis" }).map((x) => x.id), ["b"]);
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, search: "fiyat" }).map((x) => x.id), ["c"]);
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, search: "FIYAT" }).map((x) => x.id), ["c"], "büyük I ile arama");
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, search: "FİYAT" }).map((x) => x.id), ["c"], "İ ile arama");
});

test("tür ve sorun süzgeçleri", () => {
  const items = [mk("a"), mk("b", { altText: "" }), mk("c", { kind: "document", mimeType: "application/pdf", altText: "", seoScore: 50 })];
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, kind: "document" }).map((x) => x.id), ["c"]);
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, problem: "noalt" }).map((x) => x.id), ["b"], "belgede alt metin beklenmez");
  assert.deepEqual(queryMedia(items, { ...DEFAULT_QUERY, problem: "lowscore" }).map((x) => x.id), ["c"]);
});

test("sıralama", () => {
  const items = [mk("a", { createdAt: new Date(2026, 0, 2), sizeBytes: 5, seoScore: 70, filename: "b.jpg" }), mk("b", { createdAt: new Date(2026, 0, 3), sizeBytes: 9, seoScore: 40, filename: "a.jpg" })];
  const ids = (sort: "newest" | "oldest" | "name" | "size" | "score") => queryMedia(items, { ...DEFAULT_QUERY, sort }).map((x) => x.id);
  assert.deepEqual(ids("newest"), ["b", "a"]);
  assert.deepEqual(ids("oldest"), ["a", "b"]);
  assert.deepEqual(ids("name"), ["b", "a"]);
  assert.deepEqual(ids("size"), ["b", "a"]);
  assert.deepEqual(ids("score"), ["b", "a"], "en düşük puan önce");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(formatBytes(3 * 1024 * 1024), "3.0 MB");
});
