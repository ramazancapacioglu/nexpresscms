import assert from "node:assert/strict";
import { test } from "node:test";
import { SCHEMA_CARD_KINDS, SCHEMA_STARTERS, featureLines, schemaCardReady, type PageSchemaData } from "../src/page-schema";

const NOW = new Date("2026-11-02T10:00:00Z");
const d = (rich: PageSchemaData["rich"], tldr = "Bu sayfa sorunun kısa ve doğrudan yanıtını verir."): PageSchemaData => ({ title: "Başlık", tldr, rich });

test("kart hazırlığı: eksik veri kartı gizler, tam veri gösterir", () => {
  assert.equal(schemaCardReady("software", d({}), NOW), false);
  assert.equal(schemaCardReady("software", d({ software: { category: "BusinessApplication" } }), NOW), false, "işletim sistemi zorunlu");
  assert.equal(schemaCardReady("software", d({ software: { category: "BusinessApplication", os: "Web" } }), NOW), true);
  assert.equal(schemaCardReady("qa", d({ qa: { enabled: true } }), NOW), true);
  assert.equal(schemaCardReady("qa", d({ qa: { enabled: true } }, "kısa"), NOW), false);
  assert.equal(schemaCardReady("qa", d({ qa: { enabled: false } }), NOW), false);
  assert.equal(schemaCardReady("tech", d({ tech: { level: "Expert" } }), NOW), true);
  assert.equal(schemaCardReady("tech", d({ tech: {} }), NOW), false);
});

test("kampanya kartı bitiş gününden sonra kendiliğinden kalkar (şemadaki Offer ile aynı kural)", () => {
  const o = (validThrough: string) => d({ offer: { price: "99,90", currency: "TRY", validThrough } });
  assert.equal(schemaCardReady("offer", o("2026-12-31"), NOW), true);
  assert.equal(schemaCardReady("offer", o("2026-11-02"), NOW), true, "bitiş günü hâlâ geçerli");
  assert.equal(schemaCardReady("offer", o("2026-11-01"), NOW), false);
  assert.equal(schemaCardReady("offer", o(""), NOW), false);
  assert.equal(schemaCardReady("offer", o("yarın"), NOW), false);
  assert.equal(schemaCardReady("offer", d({ offer: { validThrough: "2026-12-31" } }), NOW), false, "fiyat zorunlu");
});

test("özellik satırları ve hazır başlangıç verileri", () => {
  assert.deepEqual(featureLines("A\n\n B \r\nC"), ["A", "B", "C"]);
  assert.equal(featureLines("x\n".repeat(50)).length, 20);
  assert.deepEqual(featureLines(undefined), []);
  for (const k of SCHEMA_CARD_KINDS) assert.ok(SCHEMA_STARTERS[k].schemaType, k);
  assert.equal(schemaCardReady("software", d(SCHEMA_STARTERS.software.rich), NOW), true, "yazılım başlangıç verisi kartı hazır yapar");
  assert.equal(schemaCardReady("qa", d(SCHEMA_STARTERS.qa.rich), NOW), true);
  assert.equal(schemaCardReady("offer", d(SCHEMA_STARTERS.offer.rich), NOW), false, "kampanya başlangıcında bitiş günü boş: kullanıcı girene kadar görünmez (sahte tarih yok)");
});
