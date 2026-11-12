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
