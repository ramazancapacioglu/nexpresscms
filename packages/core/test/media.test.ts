import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMediaRef,
  buildPictureSpec,
  parseMediaRef,
  parseVariantFile,
  thumbnailUrl,
  variantPath,
  widthsFor,
} from "../src/media";

test("başvuru gidiş-dönüş ve saydamlık işareti", () => {
  const ref = { id: "abc123XYZ", width: 1600, height: 900, hasAlpha: false };
  assert.equal(buildMediaRef(ref), "/media/abc123XYZ?w=1600&h=900");
  assert.deepEqual(parseMediaRef(buildMediaRef(ref)), ref);
  const alpha = { ...ref, hasAlpha: true };
  assert.equal(buildMediaRef(alpha), "/media/abc123XYZ?w=1600&h=900&a=1");
  assert.deepEqual(parseMediaRef(buildMediaRef(alpha)), alpha);
});

test("geçersiz veya dış başvurular null döner", () => {
  for (const bad of [
    "https://cdn.example.com/a.jpg",
    "/media/abc123XYZ",
    "/media/abc123XYZ?w=0&h=10",
    "/media/abc123XYZ?w=10.5&h=10",
    "/media/../etc?w=10&h=10",
    "/media/ab?w=10&h=10",
    "/uploads/x.png",
    "",
    null,
  ]) {
    assert.equal(parseMediaRef(bad as string | null), null, String(bad));
  }
});

test("türev dosya adı yalnızca izinli basamak ve biçimlerle çözülür", () => {
  assert.deepEqual(parseVariantFile("1280.webp"), { width: 1280, format: "webp" });
  assert.deepEqual(parseVariantFile("320.avif"), { width: 320, format: "avif" });
  for (const bad of ["1281.webp", "99999.webp", "1280.gif", "../1280.webp", "1280.webp.txt", "orig", "0320.webp"]) {
    assert.equal(parseVariantFile(bad), null, bad);
  }
});

test("genişlik basamakları özgünü aşmaz, küçük görselde en az bir basamak kalır", () => {
  assert.deepEqual(widthsFor(1000), [320, 480, 640, 768]);
  assert.deepEqual(widthsFor(5000).at(-1), 2560);
  assert.deepEqual(widthsFor(100), [320]);
});

test("picture: avif+webp kaynakları, jpg yedek; saydam görselde png yedek", () => {
  const spec = buildPictureSpec({ id: "img_123456", width: 1600, height: 900, hasAlpha: false });
  assert.deepEqual(spec.sources.map((s) => s.type), ["image/avif", "image/webp"]);
  assert.match(spec.sources[0]!.srcSet, /\/media\/img_123456\/320\.avif 320w/);
  assert.match(spec.sources[0]!.srcSet, /1600\.avif 1600w$/);
  assert.match(spec.img.src, /\.jpg$/);
  assert.equal(spec.img.width, 1600);
  assert.equal(spec.img.height, 900);
  const alpha = buildPictureSpec({ id: "img_123456", width: 800, height: 800, hasAlpha: true });
  assert.match(alpha.img.src, /\.png$/);
});

test("küçük resim adresi yerel başvuruyu çevirir, dış adresi olduğu gibi bırakır", () => {
  assert.equal(thumbnailUrl("/media/abc123XYZ?w=10&h=10"), variantPath("abc123XYZ", 320, "webp"));
  assert.equal(thumbnailUrl("https://x.com/a.jpg"), "https://x.com/a.jpg");
});
