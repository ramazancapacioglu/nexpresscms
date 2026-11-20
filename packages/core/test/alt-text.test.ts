import assert from "node:assert/strict";
import test from "node:test";
import { ALT_MAX, altTextRequest, parseAltText } from "../src/alt-text";

test("alt metin istemi: dil, sınır ve ipuçları; dosya adı temizlenir", () => {
  const r = altTextRequest({ siteName: "Örnek", title: "Kasa ekranı", filename: "wolvox-kasa_ekrani-1.webp", locale: "tr" });
  assert.match(r.system, /Türkçe/);
  assert.match(r.system, new RegExp(String(ALT_MAX)));
  assert.match(r.user, /Dosya adı ipucu: wolvox kasa ekrani 1\./);
  assert.match(altTextRequest({ locale: "en" }).system, /English/);
});

test("alt metin ayrıştırma: önek/HTML/tırnak temizlenir, sınır kelime sonunda, bozuk yanıt null", () => {
  assert.equal(parseAltText('{"alt":"Görsel: Restoran adisyon ekranında masa siparişi."}'), "Restoran adisyon ekranında masa siparişi");
  assert.equal(parseAltText('{"alt":"<b>Kasa</b> programı ana ekranı"}'), "Kasa programı ana ekranı");
  assert.equal(parseAltText('{"alt":"\\"Fotoğraf - Dükkânda satış yapan görevli\\""}'), "Dükkânda satış yapan görevli");
  const long = parseAltText(JSON.stringify({ alt: "kelime ".repeat(40) }))!;
  assert.ok(long.length <= ALT_MAX && !long.endsWith(" "));
  assert.equal(parseAltText("düz metin"), null);
  assert.equal(parseAltText('{"alt":"ab"}'), null);
});
