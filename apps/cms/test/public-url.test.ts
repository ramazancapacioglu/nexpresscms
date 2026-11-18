import test from "node:test";
import assert from "node:assert/strict";
import { publicUrl } from "../src/lib/public-url";

const req = (headers: Record<string, string>) => new Request("https://localhost:3001/api/x", { headers });

test("ters vekil arkasında Host başlığı kullanılır, localhost sızmaz", () => {
  assert.equal(publicUrl("/iletisim?form=sent", req({ host: "akinsoftizmir.com.tr", "x-forwarded-proto": "https" })).href, "https://akinsoftizmir.com.tr/iletisim?form=sent");
  assert.equal(publicUrl("/", req({ "x-forwarded-host": "firma.demo.test", host: "127.0.0.1:3001", "x-forwarded-proto": "https" })).href, "https://firma.demo.test/");
});

test("geçersiz Host başlığında istek adresine döner", () => {
  assert.equal(publicUrl("/a", req({ host: "kotu host/../" })).href, "https://localhost:3001/a");
});
