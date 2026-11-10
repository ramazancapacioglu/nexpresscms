import assert from "node:assert/strict";
import test from "node:test";
import { renderPermalinkHtaccess, sanitizePermalinkStructure, stripPermalinkPrefix } from "../src/permalinks";

test("bilinmeyen yapı yazı adına düşer", () => {
  assert.equal(sanitizePermalinkStructure("evil"), "postname");
  assert.equal(sanitizePermalinkStructure("dayname"), "dayname");
});

test("tarih ön eki slug yoluna iner", () => {
  assert.equal(stripPermalinkPrefix("/2026/11/10/iletisim", "dayname"), "/iletisim");
  assert.equal(stripPermalinkPrefix("/tr/2026/11/iletisim", "monthname"), "/tr/iletisim");
  assert.equal(stripPermalinkPrefix("/arsiv/42/iletisim", "numeric"), "/iletisim");
  assert.equal(stripPermalinkPrefix("/iletisim", "dayname"), "/iletisim");
  assert.equal(stripPermalinkPrefix("/2026/11/10/iletisim", "postname"), "/2026/11/10/iletisim");
});

test("htaccess wordpress index.php kuralı taşımaz", () => {
  const body = renderPermalinkHtaccess("postname", "2026-11-10T00:00:00.000Z");
  assert.equal(body.includes("RewriteRule . /index.php"), false);
  assert.equal(body.includes("index.php kuralı yoktur"), true);
  assert.equal(body.includes("yapı: postname"), true);
  assert.equal(body.includes("Nginx okumaz"), true);
});
