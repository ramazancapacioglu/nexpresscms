import test from "node:test";
import assert from "node:assert/strict";
import { slugFromTitle, uniqueSlug } from "../src";

test("başlıktan adres: Türkçe harfler, noktalama, boşluk; boş başlık boş adres", () => {
  assert.equal(slugFromTitle("Çok Güzel Bir Başlık: İyi Mi? Şüphesiz!"), "cok-guzel-bir-baslik-iyi-mi-suphesiz");
  assert.equal(slugFromTitle("  ---  "), "");
  assert.equal(slugFromTitle(""), "");
  assert.equal(slugFromTitle("E-Fatura & e-Arşiv 2026"), "e-fatura-e-arsiv-2026");
});

test("uzun başlık kelime sınırında kesilir, tire ile bitmez", () => {
  const s = slugFromTitle("Bu çok uzun bir başlık ".repeat(10), 40);
  assert.ok(s.length <= 40 && !s.endsWith("-") && !s.startsWith("-"));
  assert.ok(/^[a-z0-9-]+$/.test(s));
  assert.equal(slugFromTitle("a".repeat(100), 30).length, 30);
});

test("benzersiz adres: boşsa aynen, doluysa -2, -3…", () => {
  assert.equal(uniqueSlug("hakkimizda", new Set()), "hakkimizda");
  assert.equal(uniqueSlug("hakkimizda", new Set(["hakkimizda"])), "hakkimizda-2");
  assert.equal(uniqueSlug("hakkimizda", new Set(["hakkimizda", "hakkimizda-2", "hakkimizda-3"])), "hakkimizda-4");
});
