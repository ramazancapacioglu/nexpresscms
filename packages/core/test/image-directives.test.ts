import assert from "node:assert/strict";
import { test } from "node:test";
import { parseImageDirectives, parseMediaRef, stripImageDirectives, thumbnailUrl, withImageDirectives } from "../src/media";

const REF = "/media/med_abcdef123456?w=1600&h=900";

test("yönerge yoksa adres değişmez", () => {
  assert.deepEqual(parseImageDirectives(REF), { url: REF, directives: {} });
  assert.equal(withImageDirectives(REF, {}), REF);
});

test("yönerge yazılır ve geri okunur; varsayılanlar yazılmaz", () => {
  const url = withImageDirectives(REF, { fit: "contain", x: 30, y: 70, zoom: 1.4 });
  assert.equal(url, `${REF}#nx:fit=contain;x=30;y=70;z=1.4`);
  assert.deepEqual(parseImageDirectives(url), { url: REF, directives: { fit: "contain", x: 30, y: 70, zoom: 1.4 } });
  assert.equal(withImageDirectives(url, { fit: "cover", x: 50, y: 50, zoom: 1 }), REF);
});

test("sınır dışı ve bozuk değerler kenara çekilir ya da atılır", () => {
  const parsed = parseImageDirectives(`${REF}#nx:fit=zoom;x=400;y=-5;z=9;q=1`);
  assert.deepEqual(parsed.directives, { x: 100, y: 0, zoom: 3 });
});

test("yönergeli adres medya başvurusu olarak çözülür, küçük resim ve Markdown yönergesiz verir", () => {
  const url = `${REF}#nx:x=20`;
  assert.equal(parseMediaRef(url)?.id, "med_abcdef123456");
  assert.equal(stripImageDirectives(url), REF);
  assert.equal(thumbnailUrl(url), "/media/med_abcdef123456/320.webp");
  assert.equal(thumbnailUrl("https://x.test/a.jpg#nx:z=2"), "https://x.test/a.jpg");
});
