import assert from "node:assert/strict";
import test from "node:test";
import { canonicalHostRedirect } from "../src/host-redirect";

test("www ile apeks, yapılandırılmış ada 308 kökü döner", () => {
  assert.equal(canonicalHostRedirect("www.ileriseo.com", "https://ileriseo.com"), "https://ileriseo.com");
  assert.equal(canonicalHostRedirect("ileriseo.com", "https://www.ileriseo.com"), "https://www.ileriseo.com");
  assert.equal(canonicalHostRedirect("WWW.Ornek.test:443", "https://ornek.test/yol"), "https://ornek.test");
});

test("aynı ada, localhost'a ve kiracı alt alanına dokunulmaz", () => {
  assert.equal(canonicalHostRedirect("ileriseo.com", "https://ileriseo.com"), null);
  assert.equal(canonicalHostRedirect("www.localhost", "http://localhost:3000"), null);
  assert.equal(canonicalHostRedirect("firma.demo.nexpress.com", "https://demo.nexpress.com"), null);
  assert.equal(canonicalHostRedirect("evil.test", "https://ileriseo.com"), null);
  assert.equal(canonicalHostRedirect(null, "https://ileriseo.com"), null);
  assert.equal(canonicalHostRedirect("www.ileriseo.com", ""), null);
});
