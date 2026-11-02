import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMerchantFeed, selectMerchantProducts, type MerchantProduct } from "../src/commerce/merchant-feed";

const p = (over: Partial<MerchantProduct> = {}): MerchantProduct => ({ id: "p1", sku: "SKU-1", name: "Kırmızı <Ayakkabı> & Çanta", shortDescription: "Rahat <b>günlük</b> ayakkabı", descriptionHtml: "", slug: "kirmizi-ayakkabi", priceCents: 129900, compareAtCents: null, currency: "try", stockStatus: "instock", imageUrl: "/media/med_abc123?w=1000&h=1000", galleryUrls: ["https://cdn.test/2.jpg", "javascript:x"], ...over });
const feed = (products: MerchantProduct[]) => buildMerchantFeed({ siteName: "Mağaza & Co", baseUrl: "https://x.test/", locale: "tr", products });

test("temel ürün: kimlik, bağlantı, mutlak görsel, fiyat biçimi, stok eşlemesi, kaçışlar", () => {
  const xml = feed([p()]);
  assert.ok(xml.includes('xmlns:g="http://base.google.com/ns/1.0"'));
  assert.ok(xml.includes("<g:id>SKU-1</g:id>"));
  assert.ok(xml.includes("<g:title>Kırmızı &lt;Ayakkabı&gt; &amp; Çanta</g:title>"));
  assert.ok(xml.includes("<g:description>Rahat günlük ayakkabı</g:description>"), "HTML ayıklanır");
  assert.ok(xml.includes("<g:link>https://x.test/tr/magaza/kirmizi-ayakkabi</g:link>"));
  assert.ok(xml.includes("<g:image_link>https://x.test/media/med_abc123/1280.jpg</g:image_link>"));
  assert.ok(xml.includes("<g:additional_image_link>https://cdn.test/2.jpg</g:additional_image_link>"));
  assert.ok(!xml.includes("javascript:"), "güvensiz ek görsel atlanır");
  assert.ok(xml.includes("<g:price>1299.00 TRY</g:price>"));
  assert.ok(xml.includes("<g:availability>in_stock</g:availability>"));
  assert.ok(xml.includes("<title>Mağaza &amp; Co</title>"));
});

test("indirimli ürün: price = eski fiyat, sale_price = güncel; stok durumları", () => {
  const xml = feed([p({ compareAtCents: 159900, priceCents: 129900, stockStatus: "outofstock" })]);
  assert.ok(xml.includes("<g:price>1599.00 TRY</g:price>") && xml.includes("<g:sale_price>1299.00 TRY</g:sale_price>"));
  assert.ok(xml.includes("out_of_stock"));
  assert.ok(feed([p({ stockStatus: "onbackorder" })]).includes("<g:availability>backorder</g:availability>"));
  assert.ok(!feed([p({ compareAtCents: 100000 })]).includes("sale_price"), "eski fiyat daha düşükse indirim yok");
});

test("eksik veri: fiyatsız, görselsiz, açıklamasız, geçersiz para birimi ürünler beslemeye girmez ve nedeni söylenir", () => {
  const { ok, skipped } = selectMerchantProducts([p({ id: "a", priceCents: 0 }), p({ id: "b", imageUrl: null }), p({ id: "c", shortDescription: "", descriptionHtml: "<p> </p>" }), p({ id: "d", currency: "TL" }), p({ id: "e", imageUrl: "data:image/png;base64,xx" }), p({ id: "ok" })], "https://x.test");
  assert.deepEqual(ok.map((x) => x.id), ["ok"]);
  assert.deepEqual(skipped.map((s) => s.id), ["a", "b", "c", "d", "e"]);
  assert.ok(!feed([p({ priceCents: 0 })]).includes("<item>"));
});
