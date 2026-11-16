import test from "node:test";
import assert from "node:assert/strict";
import { findDates, parseCampaignFields, parseCampaignText } from "../src/campaign-text";

test("indirim yüzdesi ve Türkçe tarih aralığı okunur", () => {
  assert.deepEqual(parseCampaignText("Restoran Programı Kampanyası kapsamındaki %40 indirim. Kampanya 1 Ekim 2026 - 27 Kasım 2026 tarihleri arasındadır."), { discount: "%40 İndirim", startDate: "2026-10-01", endDate: "2026-11-27" });
});

test("tek tarih yalnızca bitiş sözcüğüyle bitiş sayılır", () => {
  assert.equal(parseCampaignText("%20 indirim. Kampanya bitiş tarihi 31 Temmuz 2026").endDate, "2026-07-31");
  assert.equal(parseCampaignText("31.08.2025 tarihinden önce alım yapmış kullanıcılara ilave modül").endDate, undefined);
});

test("noktalı tarih ve Yüzde yazımı", () => {
  assert.deepEqual(findDates("01.03.2026 ile 15/03/2026"), ["2026-03-01", "2026-03-15"]);
  assert.equal(parseCampaignText("Yüzde 50 indirim").discount, "%50 İndirim");
  assert.deepEqual(parseCampaignText("Her zaman geçerli."), {});
});

test("kampanya özel alanları düzenleme ekranından okunur; boş alan verilmez", () => {
  const html = `<input type="text" name="camp_name" value="Wolvox Restoran İndirim">
  <input name="camp_discount" value="40"><input name="camp_gift" value="">
  <input name="camp_product_url" value="https://www.ornek.test/restoran/"><input name="camp_start" value="2026-10-01"><input name="camp_end" value="2026-10-27">
  <textarea name="camp_terms">Yeni lisans &amp; modül alımlarında geçerlidir.</textarea>`;
  const out = parseCampaignFields(html);
  assert.deepEqual(out, { name: "Wolvox Restoran İndirim", discount: "%40", productUrl: "https://www.ornek.test/restoran/", startDate: "2026-10-01", endDate: "2026-10-27", terms: "Yeni lisans & modül alımlarında geçerlidir." });
  assert.deepEqual(parseCampaignFields('<input name="camp_discount" value="abc"><input name="camp_end" value="yarın">'), {});
});
