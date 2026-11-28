import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGeoRoiFunnel,
  chunkMarkdown,
  compileBlocksToMarkdown,
  extractProductPricingFromBlocks,
  isPublicListable,
  markdownCacheControl,
  mergeBingAiSnapshots,
  normalizeRoiPath,
  parseBingAiPerformanceCsv,
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

test("GEO ROI Hunisi: bot taramaları, AI yönlendirmeleri ve spam dışı form dönüşümlerini yol bazında birleştirir", () => {
  assert.equal(normalizeRoiPath("/tr/wolvox-erp/?utm_source=chatgpt", "tr"), "/wolvox-erp");
  assert.equal(normalizeRoiPath("/tr", "tr"), "/");

  const funnel = buildGeoRoiFunnel({
    defaultLocale: "tr",
    botPages: [
      { path: "/tr/wolvox-erp", hits: 14, kind: "markdown" },
      { path: "/wolvox-erp", hits: 20, kind: "page" },
      { path: "/e-fatura", hits: 8, kind: "page" },
    ],
    aiPaths: [
      { path: "/tr/wolvox-erp", hits: 5 },
      { path: "/e-fatura", hits: 2 },
    ],
    forms: [
      { pagePath: "/wolvox-erp", status: "new" },
      { pagePath: "/tr/wolvox-erp", status: "read" },
      { pagePath: "/wolvox-erp", status: "spam" },
    ],
  });

  assert.equal(funnel.totalBotHits, 42);
  assert.equal(funnel.totalMarkdownHits, 14);
  assert.equal(funnel.totalAiVisits, 7);
  assert.equal(funnel.totalConversions, 2);
  assert.equal(funnel.rows[0]!.path, "/wolvox-erp");
  assert.equal(funnel.rows[0]!.conversions, 2);
  assert.equal(funnel.rows[0]!.conversionRatePct, 40);
});

test("Bing AI Performance CSV: Cited Pages ve Grounding Queries CSV'lerini ayrıştırır, birleştirir ve GEO ROI hunisine ekler", () => {
  const pagesCsv = [
    "Page URL,Citations,Last Seen",
    "https://www.akinsoftizmir.com.tr/wolvox-erp,18,2026-11-27",
    "\"https://www.akinsoftizmir.com.tr/tr/wolvox-erp/?ref=bing\",4,2026-11-28",
    "https://www.akinsoftizmir.com.tr/servis-yonetimi,9,2026-11-26",
  ].join("\n");

  const queriesCsv = "\uFEFFGrounding Query;Atıf;Ort Sıra\r\nwolvox erp fiyatları 2026;14;1,5\r\nakınsoft teknik servis programı;8;2,0\r\n";

  const pagesSnap = parseBingAiPerformanceCsv(pagesCsv, {
    defaultLocale: "tr",
    fileName: "bing-cited-pages.csv",
    nowIso: "2026-11-28T12:00:00Z",
  });
  assert.equal(pagesSnap.citedPages.length, 2);
  assert.equal(pagesSnap.citedPages[0]!.path, "/wolvox-erp");
  assert.equal(pagesSnap.citedPages[0]!.citations, 22);
  assert.equal(pagesSnap.totalCitations, 31);

  const queriesSnap = parseBingAiPerformanceCsv(queriesCsv, {
    defaultLocale: "tr",
    fileName: "bing-grounding-queries.csv",
    nowIso: "2026-11-28T12:05:00Z",
  });
  assert.equal(queriesSnap.groundingQueries.length, 2);
  assert.equal(queriesSnap.groundingQueries[0]!.query, "wolvox erp fiyatları 2026");
  assert.equal(queriesSnap.groundingQueries[0]!.citations, 14);
  assert.equal(queriesSnap.groundingQueries[0]!.avgPosition, 1.5);

  const merged = mergeBingAiSnapshots(pagesSnap, queriesSnap);
  assert.equal(merged.citedPages.length, 2);
  assert.equal(merged.groundingQueries.length, 2);
  assert.equal(merged.totalCitations, 31);

  const funnel = buildGeoRoiFunnel({
    defaultLocale: "tr",
    botPages: [{ path: "/wolvox-erp", hits: 10, kind: "page" }],
    aiPaths: [{ path: "/wolvox-erp", hits: 3 }],
    forms: [],
    bingCitations: merged.citedPages,
  });
  assert.equal(funnel.totalBingCitations, 31);
  assert.equal(funnel.rows[0]!.path, "/wolvox-erp");
  assert.equal(funnel.rows[0]!.bingCitations, 22);
  assert.equal(funnel.rows[1]!.path, "/servis-yonetimi");
  assert.equal(funnel.rows[1]!.bingCitations, 9);
});
