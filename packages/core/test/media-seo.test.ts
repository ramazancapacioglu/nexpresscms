import test from "node:test";
import assert from "node:assert/strict";
import { isGenericFilename, kindOfMime, scoreMediaSeo, seoFileSlug, sniffFileMime, titleFromFilename } from "../src/media-seo";

const bytes = (...a: number[]) => Uint8Array.from([...a, ...new Array(Math.max(0, 16 - a.length)).fill(0)]);
const str = (s: string, at = 0) => { const b = new Uint8Array(16); [...s].forEach((c, i) => { b[at + i] = c.charCodeAt(0); }); return b; };

test("içerik başlığından tür tanıma; uzantıya güvenilmez, bilinmeyen null", () => {
  assert.equal(sniffFileMime(str("%PDF-1.7")), "application/pdf");
  assert.equal(sniffFileMime(str("ftypisom", 4)), "video/mp4");
  assert.equal(sniffFileMime(Uint8Array.from([0, 0, 0, 24, ...[..."ftypavif"].map((c) => c.charCodeAt(0)), 0, 0, 0, 0])), null, "AVIF görsel video sayılmaz");
  assert.equal(sniffFileMime(bytes(0x1a, 0x45, 0xdf, 0xa3)), "video/webm");
  assert.equal(sniffFileMime(str("ID3")), "audio/mpeg");
  assert.equal(sniffFileMime(str("OggS")), "audio/ogg");
  const wav = str("RIFF"); [..."WAVE"].forEach((c, i) => { wav[8 + i] = c.charCodeAt(0); });
  assert.equal(sniffFileMime(wav), "audio/wav");
  assert.equal(sniffFileMime(str("MZ\u0090 yürütülebilir")), null);
  assert.equal(sniffFileMime(str("<svg xmlns")), null);
  assert.equal(sniffFileMime(new Uint8Array(4)), null);
  assert.equal(kindOfMime("image/webp"), "image");
  assert.equal(kindOfMime("application/pdf"), "document");
  assert.equal(kindOfMime("video/mp4"), "video");
});

test("SEO dostu dosya adı ve başlık", () => {
  assert.equal(seoFileSlug("Kırmızı Ayakkabı (Yeni) .JPG"), "kirmizi-ayakkabi-yeni");
  assert.equal(seoFileSlug("İSTANBUL Şehir Rehberi.pdf"), "istanbul-sehir-rehberi");
  assert.equal(seoFileSlug("!!!"), "dosya");
  assert.ok(seoFileSlug("a".repeat(200)).length <= 60);
  assert.equal(titleFromFilename("kirmizi-ayakkabi_01.jpg"), "Kirmizi ayakkabi 01");
});

test("anlamsız dosya adları", () => {
  for (const n of ["IMG_1234.jpg", "DSC0001.JPG", "WhatsApp Image 2026-01-01.jpeg", "Screenshot 2026.png", "20260101_123456.jpg", "a.png"]) assert.equal(isGenericFilename(n), true, n);
  for (const n of ["kirmizi-ayakkabi.jpg", "ofis-ekibi-toplanti.webp", "Resim yazısı rehberi.png"]) assert.equal(isGenericFilename(n), false, n);
});

test("görsel puanı: alt yok = hata, iyi veri = 100, alt uyarıları", () => {
  const good = { kind: "image" as const, filename: "ofis-ekibi.jpg", altText: "Ofiste toplantı yapan beş kişilik ekip", titleText: "Ofis ekibi", width: 1600, height: 900, sizeBytes: 300_000, mimeType: "image/jpeg" };
  assert.equal(scoreMediaSeo(good).score, 100);
  const noAlt = scoreMediaSeo({ ...good, altText: "" });
  assert.ok(noAlt.score <= 65 && noAlt.issues.some((i) => i.code === "alt-missing" && i.severity === "error"));
  assert.ok(scoreMediaSeo({ ...good, altText: "x".repeat(130) }).issues.some((i) => i.code === "alt-long"));
  assert.ok(scoreMediaSeo({ ...good, altText: "Görsel: ofis" }).issues.some((i) => i.code === "alt-prefix"));
  assert.ok(scoreMediaSeo({ ...good, filename: "IMG_2231.jpg" }).issues.some((i) => i.code === "filename-generic"));
  assert.ok(scoreMediaSeo({ ...good, width: 300 }).issues.some((i) => i.code === "too-small"));
  assert.ok(scoreMediaSeo({ kind: "image", filename: "IMG_1.jpg", altText: "", sizeBytes: 9_000_000, width: 100, mimeType: "image/jpeg" }).score >= 0);
});

test("belge/video puanı: başlık ve açıklama beklenir", () => {
  const doc = { kind: "document" as const, filename: "fiyat-listesi.pdf", altText: "", titleText: "Fiyat listesi", description: "2026 yılı güncel ürün fiyatları.", sizeBytes: 1000, mimeType: "application/pdf" };
  assert.equal(scoreMediaSeo(doc).score, 100);
  assert.ok(scoreMediaSeo({ ...doc, titleText: "" }).issues.some((i) => i.code === "title-missing"));
  assert.ok(scoreMediaSeo({ ...doc, description: "" }).issues.some((i) => i.code === "description-missing"));
  assert.ok(scoreMediaSeo({ ...doc, kind: "video" }).issues.some((i) => i.code === "transcript-missing"));
});

test("media_file bloğu Markdown'a bağlantı olarak derlenir", async () => {
  const { compileBlocksToMarkdown } = await import("../src/markdown-compiler");
  const md = compileBlocksToMarkdown([{ id: "m1", type: "media_file", props: { url: "/media/med_x/fiyat-listesi.pdf", kind: "document", title: "Fiyat listesi", description: "2026 fiyatları" } }] as never);
  assert.ok(md.includes("[Fiyat listesi](/media/med_x/fiyat-listesi.pdf) — 2026 fiyatları"));
});
