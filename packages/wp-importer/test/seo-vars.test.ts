import test from "node:test";
import assert from "node:assert/strict";
import { expandSeoTemplate, schemaFromBridge } from "../src/seo-vars";

test("seo şablonu başlığı açar, yüzdeyi olduğu gibi bırakır", () => {
  const title = expandSeoTemplate("%title% | %40 İndirim", { title: "Wolvox Kampanya", siteName: "Akınsoft" });
  assert.equal(title, "Wolvox Kampanya | %40 İndirim");
  const full = expandSeoTemplate("%title% %sep% %sitename%", { title: "E-Fatura", siteName: "Akınsoft İzmir" });
  assert.equal(full, "E-Fatura | Akınsoft İzmir");
});

test("yazı BlogPosting, soru sayfası SSS kartı olur", () => {
  const post = schemaFromBridge({ kind: "post", schemaType: "Article", name: "", description: "", os: "", category: "", price: "", currency: "", faqs: [] });
  assert.equal(post.schemaType, "BlogPosting");
  const faq = schemaFromBridge({
    kind: "page",
    schemaType: "QAPage",
    name: "",
    description: "",
    os: "",
    category: "",
    price: "",
    currency: "",
    faqs: [{ q: "Kurulum ne kadar sürer?", a: "Aynı gün." }],
  });
  assert.equal(faq.schemaType, "FAQPage");
  assert.equal((faq.richSchema?.qa as { faqList: Array<{ question: string }> }).faqList[0]?.question, "Kurulum ne kadar sürer?");
});
