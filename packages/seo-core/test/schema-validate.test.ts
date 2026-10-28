import test from "node:test";
import assert from "node:assert/strict";
import { validateSchemaGraph } from "../src";

const errs = (nodes: Parameters<typeof validateSchemaGraph>[0]) => validateSchemaGraph(nodes).filter((i) => i.level === "error").map((i) => i.message);

test("geçerli FAQPage ve BreadcrumbList sorunsuz", () => {
  const issues = validateSchemaGraph([
    { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "S?", acceptedAnswer: { "@type": "Answer", text: "C" } }] },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ana", item: "https://x.test" }, { "@type": "ListItem", position: 2, name: "Yazı" }] },
  ]);
  assert.deepEqual(issues, []);
});

test("FAQPage: boş mainEntity ve cevapsız soru hata", () => {
  assert.deepEqual(errs([{ "@type": "FAQPage", mainEntity: [] }]), [`"mainEntity" boş; en az bir soru gerekir.`]);
  assert.match(errs([{ "@type": "FAQPage", mainEntity: [{ name: "S" }] }])[0]!, /acceptedAnswer\.text/);
});

test("Article: headline zorunlu, uzun başlık ve eksik tarih uyarı", () => {
  assert.match(errs([{ "@type": "BlogPosting" }])[0]!, /headline/);
  const w = validateSchemaGraph([{ "@type": "Article", headline: "x".repeat(120) }]).filter((i) => i.level === "warning");
  assert.ok(w.some((i) => /110/.test(i.message)) && w.some((i) => /datePublished/.test(i.message)));
});

test("Product: teklif fiyatı/para birimi; Review: puan; BreadcrumbList: sıra", () => {
  assert.equal(errs([{ "@type": "Product", name: "A" }]).length, 1);
  assert.equal(errs([{ "@type": "Product", name: "A", offers: { price: "10" } }]).length, 1);
  assert.equal(errs([{ "@type": "Product", name: "A", offers: { price: "10", priceCurrency: "TRY" } }]).length, 0);
  assert.equal(errs([{ "@type": "Review", itemReviewed: { name: "A" }, reviewRating: { ratingValue: "abc" } }]).length, 1);
  assert.match(errs([{ "@type": "BreadcrumbList", itemListElement: [{ position: 2, name: "A", item: "u" }] }])[0]!, /position/);
});

test("türsüz düğüm hata verir; çoklu tür desteklenir", () => {
  assert.deepEqual(errs([{ "@type": [] as unknown as string }]), ["@type eksik."]);
  assert.match(errs([{ "@type": ["Thing", "HowTo"] }])[0]!, /name/);
});
