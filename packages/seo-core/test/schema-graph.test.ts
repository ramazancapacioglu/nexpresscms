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
  assert.deepEqual(post.author, { "@type": "Organization", "@id": "https://ornek.test/#organization", name: "Örnek Site", url: "https://ornek.test" }, "yazar adı yoksa uydurma kişi yazılmaz");
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
  assert.equal((apps[0]!.image as { url: string }).url, "https://ornek.test/media/med_x/1280.webp");
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
  assert.equal(org.logo.contentUrl, "https://ornek.test/media/med_logo/1280.webp");
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
  assert.equal(app.image.contentUrl, "https://ornek.test/media/med_main/1280.webp");
  assert.equal(app.screenshot.length, 1, "birincil görselin kopyası gövdeden elenir");
  assert.equal(app.screenshot[0].contentUrl, "https://ornek.test/media/med_a1/1280.webp");
  assert.equal(app.screenshot[0].encodingFormat, "image/webp");
  assert.equal(app.screenshot[0].caption, "Ana ekran");
  const page = nodes.find((n) => n["@type"] === "WebPage")!;
  assert.deepEqual(page.primaryImageOfPage, { "@id": "https://ornek.test/yazi#primaryimage" });
  assert.deepEqual(page.mainEntity, { "@id": app["@id"] });
  assert.deepEqual(page.breadcrumb, { "@id": "https://ornek.test/yazi#breadcrumb" });
  assert.deepEqual(app.mainEntityOfPage, { "@id": "https://ornek.test/yazi#webpage" });

  const post = await buildPageSchemaGraph({ ...input, content: { ...input.content, authorName: "Örnek Site" } } as never);
  const blog = (post["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "BlogPosting")!;
  assert.deepEqual(blog.author, { "@type": "Organization", "@id": "https://ornek.test/#organization", name: "Örnek Site", url: "https://ornek.test" });
});

test("ana sayfa: ürün kataloğu kuruluşa OfferCatalog olarak bağlanır", async () => {
  const graph = await buildPageSchemaGraph({ ...input, offerCatalog: [{ name: "Ürün A", url: "https://ornek.test/a" }] } as never);
  const org = graph["@graph"].find((n) => n["@id"] === "https://ornek.test/#organization") as Record<string, any>;
  assert.equal(org.hasOfferCatalog.itemListElement[0].itemOffered.url, "https://ornek.test/a");
});

test("SSS: soru/cevap düz metin olur (HTML yok) ve yinelenen soru bir kez yazılır", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    content: { ...input.content, blocks: [{ id: "f", type: "faq_accordion", props: { items: [
      { question: "<strong>Nereden alırım ?</strong>", answer: "<p>Bayiden &amp; web.</p>" },
      { question: "Nereden alırım ?", answer: "Tekrar" },
      { question: "Fiyat?", answer: "Teklif" },
    ] } }] },
  } as never);
  const faq = (graph["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "FAQPage")!;
  assert.deepEqual(faq.mainEntity.map((q: any) => q.name), ["Nereden alırım ?", "Fiyat?"]);
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "Bayiden & web.");
});

test("görsel hakları: yaratıcı, kredi, telif, lisans ve lisans edinme sayfası; ölçek 1280 sınırı; yazar adresi", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    organization: { name: "Örnek Ltd", imageRights: { licenseUrl: "https://ornek.test/lisans" } },
    images: [{ url: "/media/med_big", alt: "Geniş", width: 2560, height: 1440 }],
    content: { ...input.content, imageUrl: "/media/med_cover", authorName: "Ayşe Yılmaz", authorUrl: "/yazar/ayse-yilmaz" },
  } as never);
  const nodes = graph["@graph"] as Array<Record<string, any>>;
  const post = nodes.find((n) => n["@type"] === "BlogPosting")!;
  for (const image of [post.image, post.associatedMedia[0]]) {
    assert.deepEqual(image.creator, { "@type": "Organization", name: "Örnek Ltd" });
    assert.equal(image.creditText, "Örnek Ltd");
    assert.match(image.copyrightNotice, /^© \d{4} Örnek Ltd$/);
    assert.equal(image.license, "https://ornek.test/lisans");
    assert.equal(image.acquireLicensePage, "https://ornek.test/yazi");
  }
  assert.equal(post.associatedMedia[0].width, 1280);
  assert.equal(post.associatedMedia[0].height, 720);
  assert.equal(post.author.url, "https://ornek.test/yazar/ayse-yilmaz");
  const bare = await buildPageSchemaGraph({ ...input, content: { ...input.content, imageUrl: "/media/med_cover" } } as never);
  assert.equal((bare["@graph"].find((n) => n["@type"] === "BlogPosting") as any).image.creator, undefined, "ayar yoksa hak alanı yazılmaz");
});

test("ürün göndermesi: fiyat + yazılım bilgisi varsa geçerli SoftwareApplication, yoksa Thing", async () => {
  const { softwareReference, softwareFactsOf } = await import("../src/index");
  assert.equal((softwareReference({ name: "A", url: "https://o.test/a" }) as any)["@type"], "Thing");
  assert.equal((softwareReference({ name: "A", url: "https://o.test/a", applicationCategory: "BusinessApplication", operatingSystem: "Windows 11" }) as any)["@type"], "Thing");
  const full = softwareReference({ name: "A", url: "https://o.test/a", applicationCategory: "BusinessApplication", operatingSystem: "Windows 11", price: "9900", currency: "TRY" }) as any;
  assert.equal(full["@type"], "SoftwareApplication");
  assert.equal(full.operatingSystem, "Windows 11");
  assert.equal(full.offers.price, "9900");
  assert.equal(full.offers.priceCurrency, "TRY");
  const fromCard = softwareFactsOf({}, [{ type: "software_product_card", props: { category: "BusinessApplication", operatingSystem: "Windows", pricingMode: "starting", price: "24900", currency: "TRY" } }]);
  assert.equal(fromCard.price, "24900");
  assert.equal(fromCard.applicationCategory, "BusinessApplication");
});

test("yazar profili: Person ünvan, biyografi, uzmanlık, sameAs, avatar ve kuruluşa bağ taşır; profil yoksa yalın kalır", async () => {
  const { buildAuthorPerson } = await import("../src/index");
  const graph = await buildPageSchemaGraph({
    ...input,
    content: {
      ...input.content,
      authorName: "Ayşe Yılmaz",
      authorUrl: "/yazar/ayse-yilmaz",
      authorProfile: { jobTitle: "Yazılım Danışmanı", bio: "10 yıldır ERP kurulumu yapıyor.", expertise: ["ERP", "e-Fatura"], sameAs: ["https://www.linkedin.com/in/ayse"], avatarUrl: "/media/med_ayse" },
    },
  } as never);
  const post = (graph["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "BlogPosting")!;
  assert.equal(post.author["@id"], "https://ornek.test/yazar/ayse-yilmaz#person");
  assert.equal(post.author.jobTitle, "Yazılım Danışmanı");
  assert.equal(post.author.description, "10 yıldır ERP kurulumu yapıyor.");
  assert.deepEqual(post.author.knowsAbout, ["ERP", "e-Fatura"]);
  assert.deepEqual(post.author.sameAs, ["https://www.linkedin.com/in/ayse"]);
  assert.equal(post.author.image.contentUrl, "https://ornek.test/media/med_ayse/1280.webp");
  assert.deepEqual(post.author.worksFor, { "@id": "https://ornek.test/#organization" });
  const bare = buildAuthorPerson({ baseUrl: "https://ornek.test", orgId: "https://ornek.test/#organization", name: "Ali" }) as Record<string, unknown>;
  assert.deepEqual(bare, { "@type": "Person", name: "Ali" });
});

test("görsel adresi: kitaplık dosya adı varsa anlamlı ad taşır, yoksa 1280.webp", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    images: [{ url: "/media/med_a1", alt: "Ekran", filename: "wolvox-restoran-kampanyasi-10-2026.webp" }, { url: "/media/med_b2", alt: "Diğer", filename: "7.png" }],
  } as never);
  const post = (graph["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "BlogPosting")!;
  assert.equal(post.associatedMedia[0].contentUrl, "https://ornek.test/media/med_a1/wolvox-restoran-kampanyasi-10-2026.webp");
  assert.equal(post.associatedMedia[1].contentUrl, "https://ornek.test/media/med_b2/1280.webp");
});

test("soru-cevap sayfası: tek QAPage; gerçek soru, tam cevap, oy, yazar ve künye; FAQPage/ikinci soru düğümü yok", async () => {
  const graph = await buildPageSchemaGraph({
    ...input,
    pageUrl: "https://ornek.test/soru",
    content: {
      ...input.content,
      title: "Uzun SEO odaklı başlık: e-fatura kesildi mi?",
      schemaType: "QAPage",
      authorName: "Hatice",
      schemaAttributes: {
        _qa: { upvotes: 5 },
        richSchema: { qa: { enabled: true, question: "E-Fatura kesildiğini nasıl anlarız?", shortAnswer: "GİB durum kodlarına bakılır.", detail: "Başarılı, Kabul Edildi gibi durumlar olumludur.\nHata ve Red olumsuzdur.", about: "E-Fatura kontrolü", audience: "Mali müşavirler", areaServed: "TR", serviceType: "Bilgi içeriği", faqList: [{ question: "Başka soru?", answer: "Başka cevap." }] } },
      },
    },
  } as never);
  const nodes = graph["@graph"] as Array<Record<string, any>>;
  assert.equal(nodes.filter((n) => n["@type"] === "QAPage").length, 1);
  assert.equal(nodes.some((n) => n["@type"] === "FAQPage" || n["@type"] === "Question"), false);
  const qa = nodes.find((n) => n["@type"] === "QAPage")!;
  assert.equal(qa.mainEntity.name, "E-Fatura kesildiğini nasıl anlarız?");
  assert.match(qa.mainEntity.acceptedAnswer.text, /GİB durum kodlarına bakılır\.\n\nBaşarılı, Kabul Edildi/);
  assert.equal(qa.mainEntity.upvoteCount, 5);
  assert.equal(qa.mainEntity.acceptedAnswer.upvoteCount, 5);
  assert.equal(qa.mainEntity.author["@type"], "Person");
  assert.equal(qa.mainEntity.author.name, "Hatice");
  assert.equal(qa.audience.audienceType, "Mali müşavirler");
  assert.equal(qa.about[1].serviceType, "Bilgi içeriği");
  assert.equal(qa.spatialCoverage.name, "TR");
});

test("soru-cevap: cevap yoksa QAPage mainEntity uydurulmaz", async () => {
  const graph = await buildPageSchemaGraph({ ...input, content: { ...input.content, tldr: "", schemaType: "QAPage", schemaAttributes: { richSchema: { qa: { enabled: true } } } } } as never);
  const qa = (graph["@graph"] as Array<Record<string, any>>).find((n) => n["@type"] === "QAPage");
  assert.equal(qa?.mainEntity, undefined);
});
