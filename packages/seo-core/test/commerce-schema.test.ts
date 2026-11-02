import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProductGraph, jsonLdString, schemaImageUrl, type ProductSchemaInput } from "../src";

const base: ProductSchemaInput = { baseUrl: "https://x.test/", url: "https://x.test/tr/magaza/ayakkabi", name: "Kırmızı Ayakkabı", description: "Rahat <b>günlük</b> ayakkabı", images: ["/media/med_abc123?w=1000&h=1000", "https://cdn.test/2.jpg", "data:image/png;base64,xx", null, "/media/med_abc123?w=1000&h=1000"], sku: "AYK-1", priceCents: 129900, currency: "try", stockStatus: "instock", breadcrumbs: [{ name: "Ana sayfa", url: "https://x.test/tr" }, { name: "Mağaza", url: "https://x.test/tr/magaza" }, { name: "Kırmızı Ayakkabı", url: "https://x.test/tr/magaza/ayakkabi" }] };
const node = (i: ProductSchemaInput) => buildProductGraph(i)["@graph"];

test("temel ürün: ad, düz metin açıklama, tekil mutlak görseller, sku, tek Offer", () => {
  const [p, crumbs] = node(base) as [Record<string, any>, Record<string, any>];
  assert.equal(p["@type"], "Product");
  assert.equal(p.description, "Rahat günlük ayakkabı");
  assert.deepEqual(p.image, ["https://x.test/media/med_abc123/1280.jpg", "https://cdn.test/2.jpg"]);
  assert.equal(p.sku, "AYK-1");
  assert.deepEqual(p.offers, { "@type": "Offer", price: "1299.00", priceCurrency: "TRY", availability: "https://schema.org/InStock", url: base.url });
  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.equal(crumbs.itemListElement.length, 3);
  assert.equal(crumbs.itemListElement[2].position, 3);
});

test("stok durumları ve fiyat farklı varyasyonlar (AggregateOffer)", () => {
  const out = (node({ ...base, stockStatus: "outofstock" })[0] as any).offers;
  assert.equal(out.availability, "https://schema.org/OutOfStock");
  assert.equal((node({ ...base, stockStatus: "onbackorder" })[0] as any).offers.availability, "https://schema.org/BackOrder");
  const agg = (node({ ...base, variants: [{ priceCents: 99900 }, { priceCents: 159900 }] })[0] as any).offers;
  assert.deepEqual([agg["@type"], agg.lowPrice, agg.highPrice, agg.offerCount], ["AggregateOffer", "999.00", "1599.00", 3]);
  const same = (node({ ...base, variants: [{ priceCents: 129900 }] })[0] as any).offers;
  assert.equal(same["@type"], "Offer", "tek fiyat: basit Offer");
});

test("uydurma yok: fiyatsız/para birimsiz ürün Offer üretmez; puan yalnızca gerçek ve geçerliyse", () => {
  assert.equal("offers" in (node({ ...base, priceCents: 0 })[0] as object), false);
  assert.equal("offers" in (node({ ...base, currency: "TL" })[0] as object), false);
  const noDesc = node({ ...base, description: "<p> </p>", images: [], sku: null })[0] as Record<string, unknown>;
  for (const k of ["description", "image", "sku"]) assert.equal(k in noDesc, false, k);
  assert.equal("aggregateRating" in noDesc, false);
  const r = (node({ ...base, rating: { value: 4.666, count: 12 } })[0] as any).aggregateRating;
  assert.deepEqual([r.ratingValue, r.reviewCount], [4.7, 12]);
  assert.equal("aggregateRating" in (node({ ...base, rating: { value: 4.5, count: 0 } })[0] as object), false);
  assert.equal("aggregateRating" in (node({ ...base, rating: { value: 9, count: 3 } })[0] as object), false);
  assert.equal(schemaImageUrl("//evil.test/x.png", "https://x.test"), null);
  assert.equal(schemaImageUrl("javascript:x", "https://x.test"), null);
});

test("jsonLdString: betik kapatma dizileri kaçışlanır, değer ayrıştırınca aynı kalır", () => {
  const evil = { name: "</script><script>alert(1)</script>", d: "a & b > c \u2028 x" };
  const out = jsonLdString(evil);
  assert.ok(!out.includes("</script>") && !out.includes("<") && !out.includes(">") && !out.includes("&"));
  assert.deepEqual(JSON.parse(out), evil);
});
