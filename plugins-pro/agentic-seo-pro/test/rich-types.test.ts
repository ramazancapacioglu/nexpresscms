import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRichNodes, patchEntity, type RichContext } from "../src/schema/rich-types";

const NOW = new Date("2026-11-02T10:00:00Z");
const ctx = (over: Partial<RichContext> = {}): RichContext => ({ url: "https://x.test/tr/a", title: "Sayfa", tldr: "Bu sayfa, sorunun kısa ve doğrudan yanıtını verir.", now: NOW, enabled: { "faq-qa": true, "campaign-offer": true, "tech-article": true, "software-app": true }, ...over });

test("QAPage: başlık soru, TL;DR cevap; kısa TL;DR veya kapalı modül düğüm üretmez", () => {
  const r = buildRichNodes({ qa: { enabled: true } }, ctx());
  assert.equal(r.extra[0]!["@type"], "QAPage");
  assert.equal((r.extra[0]!.mainEntity as { name: string }).name, "Sayfa");
  assert.equal(buildRichNodes({ qa: { enabled: true } }, ctx({ tldr: "kısa" })).extra.length, 0);
  assert.equal(buildRichNodes({ qa: { enabled: true } }, ctx({ enabled: { "faq-qa": false, "campaign-offer": true, "tech-article": true, "software-app": true } })).extra.length, 0);
  assert.equal(buildRichNodes({ qa: { enabled: false } }, ctx()).extra.length, 0);
});

test("Offer: süresi dolan kampanya kendiliğinden kalkar; fiyat/para birimi doğrulanır", () => {
  const base = { price: "99,90", currency: "try", validThrough: "2026-12-31", availability: "InStock" };
  const live = buildRichNodes({ offer: base }, ctx()).extra[0]!;
  assert.equal(live["@type"], "Offer");
  assert.equal(live.price, "99.90");
  assert.equal(live.priceCurrency, "TRY");
  assert.equal(live.priceValidUntil, "2026-12-31");
  assert.equal(live.availability, "https://schema.org/InStock");
  assert.equal(buildRichNodes({ offer: { ...base, validThrough: "2026-11-01" } }, ctx()).extra.length, 0, "dün bitti");
  assert.equal(buildRichNodes({ offer: { ...base, validThrough: "2026-11-02" } }, ctx()).extra.length, 1, "bitiş günü hâlâ geçerli");
  assert.equal(buildRichNodes({ offer: { ...base, price: "ücretsiz" } }, ctx()).extra.length, 0);
  assert.equal(buildRichNodes({ offer: { ...base, currency: "TL" } }, ctx()).extra.length, 0);
  assert.equal(buildRichNodes({ offer: { ...base, validThrough: "yarın" } }, ctx()).extra.length, 0);
  assert.equal(buildRichNodes({ offer: { ...base, url: "javascript:alert(1)" } }, ctx()).extra[0]!.url, "https://x.test/tr/a", "güvensiz adres yok sayılır");
  assert.equal(buildRichNodes({ offer: { ...base, availability: "Hack" } }, ctx()).extra[0]!.availability, "https://schema.org/InStock");
});

test("TechArticle yaması ve SoftwareApplication", () => {
  const r = buildRichNodes({ tech: { level: "Expert", dependencies: "Node.js 20" }, software: { category: "BusinessApplication", os: "Web", price: "0", currency: "USD", features: "Hızlı\n\n Güvenli " } }, ctx());
  assert.deepEqual(r.entityPatch, { proficiencyLevel: "Expert", dependencies: "Node.js 20" });
  const app = r.extra.find((n) => n["@type"] === "SoftwareApplication")!;
  assert.deepEqual(app.featureList, ["Hızlı", "Güvenli"]);
  assert.deepEqual(app.offers, { "@type": "Offer", price: "0", priceCurrency: "USD" });
  assert.equal(buildRichNodes({ software: { category: "", os: "Web" } }, ctx()).extra.length, 0, "kategori zorunlu");
  assert.equal(buildRichNodes({ tech: { level: "Guru" } }, ctx()).entityPatch.proficiencyLevel, undefined);

  const nodes = [{ "@type": "TechArticle", url: "https://x.test/tr/a" }, { "@type": "WebPage", url: "https://x.test/tr/a" }];
  assert.equal(patchEntity(nodes, "https://x.test/tr/a", r.entityPatch)[0]!.proficiencyLevel, "Expert");
  assert.equal(patchEntity(nodes, "https://x.test/tr/a", r.entityPatch)[1]!.proficiencyLevel, undefined);
});

test("boş/yok girdi hiçbir şey üretmez", () => {
  assert.deepEqual(buildRichNodes(null, ctx()), { extra: [], entityPatch: {} });
  assert.deepEqual(buildRichNodes({}, ctx()), { extra: [], entityPatch: {} });
});

test("SoftwareApplication: ad ve adres alanları (güvensiz adres atılır)", () => {
  const ok = buildRichNodes({ software: { category: "BusinessApplication", os: "Web", name: "Uygulamam", url: "https://x.test/indir" } }, ctx()).extra[0]!;
  assert.equal(ok.name, "Uygulamam");
  assert.equal(ok.url, "https://x.test/indir");
  const bad = buildRichNodes({ software: { category: "BusinessApplication", os: "Web", url: "javascript:x" } }, ctx()).extra[0]!;
  assert.equal(bad.name, "Sayfa", "ad boşsa sayfa başlığı");
  assert.equal("url" in bad, false);
});
