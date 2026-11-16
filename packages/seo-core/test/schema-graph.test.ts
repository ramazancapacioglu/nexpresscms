import assert from "node:assert/strict";
import test from "node:test";
import { buildPageSchemaGraph } from "../src/index";

const input = {
  siteId: "default",
  siteName: "Örnek Site",
  siteUrl: "https://ornek.test",
  locale: "tr",
  pageUrl: "https://ornek.test/yazi",
  autoSchema: true,
  breadcrumbs: [{ name: "Ana sayfa", url: "https://ornek.test/" }, { name: "Yazı", url: "https://ornek.test/yazi" }],
  content: {
    id: "c1",
    title: "Yazı başlığı",
    tldr: "Kısa özet metni",
    schemaType: "BlogPosting",
    schemaAttributes: { wpId: "11238", wpKind: "post", migratedFrom: "wordpress", importedAt: "x", operatingSystem: "Windows", _demo: { a: 1 }, canvas: true },
    updatedAt: new Date("2026-11-10T00:00:00Z"),
    publishedAt: new Date("2026-07-03T11:23:13Z"),
    imageUrl: "https://ornek.test/og?title=Yazi",
  },
};

test("yazı şeması: yayın tarihi, kırıntı, görsel ve kuruluş yazarı; içe aktarma izleri sızmaz", async () => {
  const graph = await buildPageSchemaGraph(input as never);
  const nodes = graph["@graph"];
  const post = nodes.find((n) => n["@type"] === "BlogPosting") as Record<string, unknown>;
  assert.equal(post.datePublished, "2026-07-03T11:23:13.000Z");
  assert.equal(post.dateModified, "2026-11-10T00:00:00.000Z");
  assert.deepEqual(post.author, { "@id": "https://ornek.test/#organization" }, "yazar adı yoksa uydurma kişi yazılmaz");
  assert.ok(post.image);
  for (const leaked of ["wpId", "wpKind", "migratedFrom", "importedAt", "_demo", "canvas"]) assert.equal(leaked in post, false, leaked);
  assert.equal(post.operatingSystem, "Windows", "gerçek özellikler korunur");
  const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList") as { itemListElement: Array<{ position: number; name: string }> };
  assert.deepEqual(crumbs.itemListElement.map((i) => [i.position, i.name]), [[1, "Ana sayfa"], [2, "Yazı"]]);
});

test("yazar adı varsa Person; kök adreste @id eğik çizgili", async () => {
  const withAuthor = await buildPageSchemaGraph({ ...input, content: { ...input.content, authorName: " Ayşe Yılmaz " } } as never);
  const post = withAuthor["@graph"].find((n) => n["@type"] === "BlogPosting") as Record<string, unknown>;
  assert.deepEqual(post.author, { "@type": "Person", name: "Ayşe Yılmaz" });
  const home = await buildPageSchemaGraph({ ...input, pageUrl: "https://ornek.test", content: { ...input.content, schemaType: "WebPage" } } as never);
  const page = home["@graph"].find((n) => n["@type"] === "WebPage") as Record<string, unknown>;
  assert.equal(page["@id"], "https://ornek.test/#webpage");
});

test("kuruluş düğümü logo, sameAs ve yerel işletme alanlarını taşır; temel kimlik ezilmez", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    organization: {
      name: "Örnek Bayi",
      logo: "https://ornek.test/logo.png",
      sameAs: ["https://facebook.com/ornek"],
      schema: { "@type": ["LocalBusiness", "Organization"], telephone: "+902320000000", priceRange: "₺₺", url: "https://kotu.test", name: "Ezme" },
    },
  } as never);
  const org = graph["@graph"].find((n) => n["@id"] === "https://ornek.test/#organization") as Record<string, unknown>;
  assert.deepEqual(org["@type"], ["LocalBusiness", "Organization"]);
  assert.equal(org.name, "Örnek Bayi");
  assert.equal(org.url, "https://ornek.test");
  assert.equal(org.telephone, "+902320000000");
  assert.deepEqual(org.sameAs, ["https://facebook.com/ornek"]);
});

test("sayfada soru listesi varsa tek FAQPage düğümü üretilir, başlıktan uydurma soru yazılmaz", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    content: { ...input.content, schemaType: "WebPage", schemaAttributes: { richSchema: { qa: { enabled: true, faqList: [{ question: "Neden biz?", answer: "Hızlıyız." }, { question: "", answer: "boş" }] } } } },
  } as never);
  const faq = graph["@graph"].find((n) => n["@type"] === "FAQPage") as { mainEntity: Array<{ name: string }> };
  assert.deepEqual(faq.mainEntity.map((q) => q.name), ["Neden biz?"]);
  assert.equal(graph["@graph"].some((n) => n["@type"] === "Question"), false);
});
