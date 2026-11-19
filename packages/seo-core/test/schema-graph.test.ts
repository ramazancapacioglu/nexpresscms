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

test("ana varlık SoftwareApplication ise zengin yazılım alanları aynı düğüme işlenir; görsel adresi mutlaktır", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    content: {
      ...input.content,
      schemaType: "SoftwareApplication",
      imageUrl: "/media/med_x?w=1200&h=800",
      schemaAttributes: { richSchema: { software: { os: "Windows 11", category: "FinanceApplication", price: "19490" } } },
    },
  } as never);
  const apps = graph["@graph"].filter((n) => n["@type"] === "SoftwareApplication") as Array<Record<string, unknown>>;
  assert.equal(apps.length, 1, "ikinci SoftwareApplication düğümü yok");
  assert.equal(apps[0]!.applicationCategory, "FinanceApplication");
  assert.deepEqual(apps[0]!.offers, { "@type": "Offer", price: "19490", priceCurrency: "TRY", url: "https://ornek.test/yazi", availability: "https://schema.org/InStock", seller: { "@id": "https://ornek.test/#organization" } });
  assert.equal((apps[0]!.image as { url: string }).url, "https://ornek.test/media/med_x?w=1200&h=800");
});

test("kuruluş: açıklama ve görsel korunur, logo @id alır, iletişim noktası ve çalışan sayısı sayısal üretilir; WebSite arama eylemi taşır", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    searchUrlTemplate: "https://ornek.test/ara?q={search_term_string}",
    organization: { name: "Örnek Ltd", logo: "/media/med_logo", schema: { "@type": ["LocalBusiness"], description: "İzmir bayisi", telephone: "+90232", email: "a@ornek.test", numberOfEmployees: { "@type": "QuantitativeValue", value: "5" } } },
  } as never);
  const org = graph["@graph"].find((n) => n["@id"] === "https://ornek.test/#organization") as Record<string, any>;
  assert.equal(org.description, "İzmir bayisi");
  assert.equal(org.logo["@id"], "https://ornek.test/#logo");
  assert.equal(org.logo.contentUrl, "https://ornek.test/media/med_logo");
  assert.deepEqual(org.image, { "@id": "https://ornek.test/#logo" });
  assert.equal(org.contactPoint[0].telephone, "+90232");
  assert.equal(org.numberOfEmployees.value, 5);
  const site = graph["@graph"].find((n) => n["@type"] === "WebSite") as Record<string, any>;
  assert.equal(site.potentialAction.target.urlTemplate, "https://ornek.test/ara?q={search_term_string}");
  assert.equal(site.potentialAction["query-input"], "required name=search_term_string");
});

test("ürün sayfası: WebPage düğümü, birincil görsel (boyutlu), gövde görselleri screenshot; yazar kuruluşsa Person yazılmaz", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    images: [
      { url: "/media/med_a1", alt: "Ana ekran", width: 1280, height: 720, mime: "image/webp" },
      { url: "/media/med_main?w=1200", alt: "yinelenen birincil" },
    ],
    content: { ...input.content, schemaType: "SoftwareApplication", imageUrl: "/media/med_main?w=1200", imageMeta: { alt: "Kapak", width: 1200, height: 800, mime: "image/webp" } },
  } as never);
  const nodes = graph["@graph"] as Array<Record<string, any>>;
  const app = nodes.find((n) => n["@type"] === "SoftwareApplication")!;
  assert.equal(app.image["@id"], "https://ornek.test/yazi#primaryimage");
  assert.equal(app.image.width, 1200);
  assert.equal(app.image.contentUrl, "https://ornek.test/media/med_main");
  assert.equal(app.screenshot.length, 1, "birincil görselin kopyası gövdeden elenir");
  assert.equal(app.screenshot[0].contentUrl, "https://ornek.test/media/med_a1");
  assert.equal(app.screenshot[0].caption, "Ana ekran");
  const page = nodes.find((n) => n["@type"] === "WebPage")!;
  assert.deepEqual(page.primaryImageOfPage, { "@id": "https://ornek.test/yazi#primaryimage" });
  assert.deepEqual(page.mainEntity, { "@id": app["@id"] });
  assert.deepEqual(page.breadcrumb, { "@id": "https://ornek.test/yazi#breadcrumb" });
  assert.deepEqual(app.mainEntityOfPage, { "@id": "https://ornek.test/yazi#webpage" });

  const post = await buildPageSchemaGraph({ ...input, content: { ...input.content, authorName: "Örnek Site" } } as never);
  const blog = (post["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "BlogPosting")!;
  assert.deepEqual(blog.author, { "@id": "https://ornek.test/#organization" });
});

test("ana sayfa: ürün kataloğu kuruluşa OfferCatalog olarak bağlanır", async () => {
  const graph = await buildPageSchemaGraph({ ...input, offerCatalog: [{ name: "Ürün A", url: "https://ornek.test/a" }] } as never);
  const org = graph["@graph"].find((n) => n["@id"] === "https://ornek.test/#organization") as Record<string, any>;
  assert.equal(org.hasOfferCatalog.itemListElement[0].itemOffered.url, "https://ornek.test/a");
});
