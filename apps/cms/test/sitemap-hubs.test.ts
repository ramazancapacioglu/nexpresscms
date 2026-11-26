import test from "node:test";
import assert from "node:assert/strict";
import { authorSitemapEntries, builtInHubEntries } from "../src/lib/sitemap-hubs";

const authors = { "hatice-arslan": { name: "Hatice Arslan" }, "ali-veli": { name: "Ali Veli" } };
const item = (over: Record<string, unknown>) => ({ type: "post", slug: "a", noIndex: false, authorName: "Hatice Arslan", schemaAttributes: {}, updatedAt: "2026-11-01T00:00:00Z", ...over });

test("yazar girdileri: yalnızca içeriği olan, kayıtlı yazarlar; dizin ve son tarih eklenir", () => {
  const out = authorSitemapEntries(
    [
      item({ updatedAt: "2026-11-01T00:00:00Z" }),
      item({ slug: "b", type: "ai_prompt", updatedAt: "2026-11-20T00:00:00Z" }),
      item({ slug: "c", authorName: "Ali Veli", noIndex: true }), // dizine kapalı: sayılmaz
      item({ slug: "d", authorName: "Kayıtsız Kişi" }), // yazar sayfası açılmaz
      item({ slug: "e", type: "page" }), // sayfa türünde yazar yok
    ],
    authors,
    "tr"
  );
  const slugs = out.map((e) => `${e.pathPrefix ?? ""}/${e.slug}`).sort();
  assert.deepEqual(slugs, ["/yazar", "yazar/hatice-arslan"]);
  const person = out.find((e) => e.slug === "hatice-arslan")!;
  assert.equal(person.updatedAt.toISOString(), "2026-11-20T00:00:00.000Z");
  assert.equal(out.find((e) => e.slug === "yazar")!.updatedAt.toISOString(), "2026-11-20T00:00:00.000Z");
});

test("yazarlı içerik yoksa ya da gizliyse hiçbir yazar girdisi çıkmaz", () => {
  assert.deepEqual(authorSitemapEntries([], authors, "tr"), []);
  assert.deepEqual(authorSitemapEntries([item({ schemaAttributes: { publishing: { visibility: "private" } } })], authors, "tr"), []);
});

test("yerleşik liste sayfaları: kampanya ve soru yalnızca içerik varsa; soru arşivi eklentisi kapalıysa girmez", () => {
  const on = builtInHubEntries({ campaignDates: ["2026-11-01T00:00:00Z", "2026-11-10T00:00:00Z"], questionDates: ["2026-10-01T00:00:00Z"], questionsArchiveOn: true, locale: "tr" });
  assert.deepEqual(on.map((e) => e.slug), ["kampanyalar", "sorular"]);
  assert.equal(on[0]!.updatedAt.toISOString(), "2026-11-10T00:00:00.000Z");
  const off = builtInHubEntries({ campaignDates: [], questionDates: ["2026-10-01T00:00:00Z"], questionsArchiveOn: false, locale: "tr" });
  assert.deepEqual(off, []);
});
