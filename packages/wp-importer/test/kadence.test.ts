import test from "node:test";
import assert from "node:assert/strict";
import { looksLikeBotEntry, parseReviewCard, parseEntryIds, parseEntryPage, parseKadenceForm, parseRankMathRedirects, parseTrDate } from "../src/kadence";

test("Kadence form alanları türe, zorunluluğa ve seçeneğe çevrilir", () => {
  const raw = `<!-- wp:kadence/advanced-form {"uniqueID":"1"} -->
<!-- wp:kadence/advanced-form-text {"uniqueID":"aa-1","label":"Ad","required":true} /-->
<!-- wp:kadence/advanced-form-telephone {"uniqueID":"bb-2","label":"Telefon","placeholder":"543"} /-->
<!-- wp:kadence/advanced-form-select {"uniqueID":"cc-3","label":"Konu","options":[{"value":"","label":"Fiyat"},{"value":"","label":"Destek"}]} /-->
<!-- wp:kadence/advanced-form-accept {"uniqueID":"dd-4","label":"Açık Rıza","required":true} /-->
<!-- wp:kadence/advanced-form-submit {"label":"Talep Gönder"} /-->`;
  const form = parseKadenceForm(raw);
  assert.equal(form.submitLabel, "Talep Gönder");
  assert.deepEqual(form.fields.map((field) => [field.name, field.type, field.required]), [
    ["ad", "text", true],
    ["telefon", "tel", false],
    ["konu", "select", false],
    ["acik_riza", "checkbox", true],
  ]);
  assert.deepEqual(form.fields[2]?.options, ["Fiyat", "Destek"]);
});

test("aynı etiket benzersiz alan adı alır", () => {
  const raw = `<!-- wp:kadence/advanced-form-text {"label":"Şehir"} /--><!-- wp:kadence/advanced-form-text {"label":"Şehir"} /-->`;
  assert.deepEqual(parseKadenceForm(raw).fields.map((field) => field.name), ["sehir", "sehir_2"]);
});

test("Türkçe tarih İstanbul saatinden UTC'ye çevrilir", () => {
  assert.equal(parseTrDate("16 Kasım 2026 01:34")?.toISOString(), "2026-11-15T22:34:00.000Z");
  assert.equal(parseTrDate("yok"), null);
});

test("girdi sayfası alan, form ve tarih verir", () => {
  const html = `<h2 class="hndle"> <span>Demo Talebi : Entry #7</span> </h2>
  <table><tbody><tr class="kadence-forms-entry-field"><th><strong>Ad:</strong> Ayşe</th></tr><tr class="kadence-forms-entry-field"><th><strong>Telefon:</strong> 5551112233</th></tr></tbody></table>
  <p data-form-id="6801">Form ID</p><p>Submitted: <strong>3 Mart 2026 10:05</strong></p>`;
  const entry = parseEntryPage(html, "7");
  assert.equal(entry?.formId, "6801");
  assert.equal(entry?.formName, "Demo Talebi");
  assert.deepEqual(entry?.fields, [{ label: "Ad", value: "Ayşe" }, { label: "Telefon", value: "5551112233" }]);
  assert.equal(entry?.createdAt?.toISOString(), "2026-03-03T07:05:00.000Z");
  assert.deepEqual(parseEntryIds('a view-entry=7 b view-entry=7 c view-entry=9'), ["7", "9"]);
});

test("bot girdisi rastgele harf yığınından ayrılır", () => {
  const bot = [
    { label: "Ad", value: "HmwYRQqLyQYmOvWlGgOILvO" },
    { label: "Soyad", value: "TSusVxMgVpmieAosEQR" },
    { label: "Firma", value: "rjvqxEoANRBBUvzNfNTcjWgn" },
  ];
  assert.equal(looksLikeBotEntry(bot), true);
  assert.equal(looksLikeBotEntry([{ label: "Ad", value: "Ayşe Yılmaz" }, { label: "Mesaj", value: "Fiyat almak istiyorum" }]), false);
});

test("Rank Math yönlendirmesi kalıp ve durumla okunur", () => {
  const json = JSON.stringify({ id: "90", sources: [{ pattern: "eski/", comparison: "exact" }, { pattern: "kampanya", comparison: "contains" }], url_to: "https://ornek.test/yeni/", header_code: "301", status: "active" });
  const html = `<a data-redirection="${json.replace(/"/g, "&quot;")}">x</a>`;
  const rows = parseRankMathRedirects(html);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => [row.from, row.exact, row.active, row.code]), [["eski/", true, true, 301], ["kampanya", false, true, 301]]);
});

test("yorum kartı başlık, yıldız ve gövdeye ayrılır", () => {
  const html = `<div class="review-card-display" style="x"><div class="review-header-display" style="y"><h4 style="m">Fiyat bilgisi verildi</h4><div style="color:#f59e0b;">★★★★☆</div></div><div style="color:#4a5568; line-height:1.6;">Akınsoft&#8217;a ilginiz için teşekkürler.</div></div>`;
  const card = parseReviewCard(html);
  assert.equal(card?.title, "Fiyat bilgisi verildi");
  assert.equal(card?.stars, 4);
  assert.equal(card?.body, "Akınsoft’a ilginiz için teşekkürler.");
  assert.equal(parseReviewCard("<p>Merhaba</p>"), null);
});
