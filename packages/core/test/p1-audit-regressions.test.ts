import test from "node:test";
import assert from "node:assert/strict";
import {
  chunkMarkdown,
  compileBlocksToMarkdown,
  extractProductPricingFromBlocks,
  isPublicListable,
  markdownCacheControl,
  resolveSiteOrigin,
  selectPublicFamily,
} from "../src/index";

test("P1 · markdownCacheControl: yalnızca herkese açık yayındaki içerikler paylaşımlı önbelleğe girer", () => {
  assert.match(
    markdownCacheControl({ status: "published", visibility: "public", allowed: true }),
    /^public, s-maxage=/
  );
  // Parola veya üyelik kapısından geçen başarılı yanıtlar asla paylaşımlı önbellekte tutulmaz
  assert.equal(markdownCacheControl({ status: "published", visibility: "password", allowed: true }), "private, no-store");
  assert.equal(markdownCacheControl({ status: "published", visibility: "members_only", allowed: true }), "private, no-store");
  assert.equal(markdownCacheControl({ status: "published", visibility: "private", allowed: true }), "private, no-store");
  assert.equal(markdownCacheControl({ status: "restricted", visibility: "public", allowed: true }), "private, no-store");
  assert.equal(markdownCacheControl({ status: "published", visibility: "public", allowed: false }), "private, no-store");
});

test("P1 · selectPublicFamily: özel/parolalı/üye üst ve alt sayfalar kırıntı ve konu merkezine sızmaz", () => {
  const rows = [
    { id: "cnt_pub", status: "published", type: "page", schemaAttributes: { _publishing: { visibility: "public", pillar: true } } },
    { id: "cnt_priv", status: "published", type: "page", schemaAttributes: { _publishing: { visibility: "private", pillar: true } } },
    { id: "cnt_c_pub", status: "published", type: "page", schemaAttributes: { _publishing: { visibility: "public", parentId: "cnt_pub" } } },
    { id: "cnt_c_pwd", status: "published", type: "page", schemaAttributes: { _publishing: { visibility: "password", parentId: "cnt_pub" } } },
    { id: "cnt_c_mem", status: "published", type: "page", schemaAttributes: { _publishing: { visibility: "members_only", parentId: "cnt_pub" } } },
    { id: "cnt_c_draft", status: "draft", type: "page", schemaAttributes: { _publishing: { visibility: "public", parentId: "cnt_pub" } } },
  ];

  // Konu merkezinde yalnızca yayında + herkese açık alt sayfalar listelenir
  const hub = selectPublicFamily(rows, "cnt_pub", { pillar: true });
  assert.deepEqual(hub.children.map((x) => x.id), ["cnt_c_pub"]);

  // Üst sayfası `private` olan bir genel sayfanın kırıntısında özel üst sayfa görünmez
  const underPrivate = selectPublicFamily(rows, "cnt_c_pub", { parentId: "cnt_priv" });
  assert.equal(underPrivate.parent, undefined);

  // Üst sayfası herkese açıksa görünür
  const underPublic = selectPublicFamily(rows, "cnt_c_pub", { parentId: "cnt_pub" });
  assert.equal(underPublic.parent?.id, "cnt_pub");

  assert.equal(isPublicListable({ status: "published", type: "template", schemaAttributes: {} }), false);
});

test("P1 · resolveSiteOrigin: çok kiracılı kipte her kiracı kendi doğrulanmış alan adına çözülür", () => {
  const tenantA = resolveSiteOrigin({
    siteId: "firma-a",
    domain: "firma-a.example.com",
    appUrl: "https://merkez.example.com",
    cmsMode: "multi_subdomain",
  });
  const tenantB = resolveSiteOrigin({
    siteId: "firma-b",
    subdomain: "firma-b",
    rootDomain: "demo.example.com",
    appUrl: "https://merkez.example.com",
    cmsMode: "multi_subdomain",
  });
  assert.equal(tenantA, "https://firma-a.example.com");
  assert.equal(tenantB, "https://firma-b.demo.example.com");

  // Tek kiracılı kipte DB'de seed `localhost` kalmışsa NEXT_PUBLIC_APP_URL korunur
  const singleProd = resolveSiteOrigin({
    siteId: "default",
    domain: "localhost",
    appUrl: "https://akinsoftizmir.com.tr",
    cmsMode: "single",
  });
  assert.equal(singleProd, "https://akinsoftizmir.com.tr");
});

test("P2 · chunkMarkdown hash: belge başlığı değişince parça özeti değişir (bayat vektör önlenir)", () => {
  const md = "## Kurulum\n\nProgram kurulumu beş dakika sürer ve otomatik veritabanı bağlantısı kurar.";
  const a = chunkMarkdown(md, { title: "ERP Kurulum Rehberi" });
  const b = chunkMarkdown(md, { title: "Wolvox ERP Kurulum Kılavuzu" });
  assert.ok(a.length > 0 && b.length > 0);
  assert.notEqual(a[0]!.hash, b[0]!.hash);
});

test("P1 · compileBlocksToMarkdown (software_product_card): EUR, KDV dahil, ondalıklı, eksik ve sıfır fiyat", () => {
  const md = compileBlocksToMarkdown([
    {
      id: "spc1",
      type: "software_product_card",
      props: {
        name: "Cloud ERP",
        pricingMode: "starting",
        price: 49.9,
        currency: "EUR",
        vatNote: "KDV dahil",
        priceList: [
          { name: "Temel Paket", listPrice: 59.9, campaignPrice: 49.9 },
          { name: "Kurulum Desteği", listPrice: 0, campaignPrice: 0 },
          { name: "Kurumsal Özel Modül" },
        ],
      },
    },
  ]);

  assert.match(md, /49,90 EUR/);
  assert.match(md, /Para birimi: EUR · KDV dahil/);
  assert.match(md, /Ücretsiz \/ Dahil/);
  assert.match(md, /Teklif alınız/);
  assert.doesNotMatch(md, /\bTL\b/);
  assert.doesNotMatch(md, /KDV hariç/);
});

test("P1 · extractProductPricingFromBlocks: WebMCP için yapısal ürün fiyat verisini sıfır kayıpla çıkarır", () => {
  const products = extractProductPricingFromBlocks([
    {
      id: "sec1",
      type: "section",
      props: {},
      children: [
        {
          id: "spc1",
          type: "software_product_card",
          props: {
            name: "Wolvox ERP",
            sku: "WOL9",
            version: "9.04",
            pricingMode: "starting",
            currency: "TRY",
            vatNote: "+ KDV",
            price: 17290,
            listPrice: 26600,
            priceValidUntil: "2026-12-31",
            priceList: [
              { name: "Ana Paket", listPrice: 26600, campaignPrice: 17290 },
              { name: "Kurulum", listPrice: 0, campaignPrice: 0 },
              { name: "Özel Geliştirme" },
            ],
          },
        },
      ],
    },
  ]);

  assert.equal(products.length, 1);
  assert.equal(products[0]!.name, "Wolvox ERP");
  assert.equal(products[0]!.currency, "TRY");
  assert.equal(products[0]!.vatNote, "+ KDV");
  assert.equal(products[0]!.price, 17290);
  assert.equal(products[0]!.priceList.length, 3);
  assert.equal(products[0]!.priceList[1]!.campaignPrice, 0);
  assert.equal(products[0]!.priceList[2]!.campaignPrice, null);
});
