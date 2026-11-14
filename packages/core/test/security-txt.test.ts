import assert from "node:assert/strict";
import test from "node:test";
import { buildSecurityTxt, normalizeSecurityContact } from "../src/security-txt";

const expires = new Date("2027-11-14T00:00:00.000Z");

test("iletişim: düz e-posta mailto olur; javascript ve http reddedilir", () => {
  assert.equal(normalizeSecurityContact("  a@b.test "), "mailto:a@b.test");
  assert.equal(normalizeSecurityContact("mailto:a@b.test"), "mailto:a@b.test");
  assert.equal(normalizeSecurityContact("https://ornek.test/guvenlik"), "https://ornek.test/guvenlik");
  assert.equal(normalizeSecurityContact("http://ornek.test/g"), null);
  assert.equal(normalizeSecurityContact("javascript:alert(1)"), null);
  assert.equal(normalizeSecurityContact(""), null);
});

test("belge: iletişim yoksa üretilmez; alanlar RFC sırasında", () => {
  assert.equal(buildSecurityTxt({ contact: "", canonical: "https://ornek.test/.well-known/security.txt", expires }), null);
  const body = buildSecurityTxt({ contact: "a@b.test", canonical: "https://ornek.test/.well-known/security.txt", expires });
  assert.equal(
    body,
    "Contact: mailto:a@b.test\nExpires: 2027-11-14T00:00:00Z\nCanonical: https://ornek.test/.well-known/security.txt\nPreferred-Languages: tr, en\n"
  );
});
