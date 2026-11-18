import test from "node:test";
import assert from "node:assert/strict";
import { headingRepeatsTitle } from "../src/heading-match";

test("aynı veya içeren başlık tekrar sayılır", () => {
  assert.equal(headingRepeatsTitle("Hakkımızda", "Hakkımızda"), true);
  assert.equal(headingRepeatsTitle("E-Dönüşüm", "E-Dönüşüm Çözümleri"), true);
  assert.equal(headingRepeatsTitle("Akınsoft Wolvox Restoran Yönetimi", "Akınsoft Wolvox Restoran Yönetimi"), true);
});

test("farklı konu tekrar sayılmaz", () => {
  assert.equal(headingRepeatsTitle("Akınsoft", "Türkiye’nin Yerli Yazılım Markası Akınsoft — İzmir Ana Bayi"), true);
  assert.equal(headingRepeatsTitle("İletişim", "Bize ulaşın"), false);
  assert.equal(headingRepeatsTitle("", "x"), false);
});
