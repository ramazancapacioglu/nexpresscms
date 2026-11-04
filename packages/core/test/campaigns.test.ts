import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveCampaignData,
  buildCampaignOfferJsonLd,
  buildCampaignsItemListJsonLd,
} from "../src";

test("resolveCampaignData: hem modern hem legacy camp_* alanlarını doğru çözümler", () => {
  const ref = new Date("2026-06-15T12:00:00Z");
  const raw = {
    id: "cnt_1",
    contentId: "cnt_1",
    title: "Wolvox Restoran Haziran Kampanyası",
    slug: "wolvox-restoran-haziran-kampanyasi",
    tldr: "Haziran ayına özel %35 indirim ve hediye modül",
    status: "published",
    schemaAttributes: {
      camp_discount: "%35",
      camp_gift: "1 Yıllık QR Menü Modülü",
      camp_product_name: "Wolvox Restoran",
      camp_product_url: "/wolvox-restoran",
      camp_start: "2026-06-01",
      camp_end: "2026-06-30",
      camp_terms: "Yalnızca yeni lisans alımlarında geçerlidir.\nDiğer kampanyalarla birleştirilemez.",
      badge: "Sınırlı Fırsat",
    },
  };

  const resolved = resolveCampaignData(raw, ref);

  assert.equal(resolved.discount, "%35");
  assert.equal(resolved.gift, "1 Yıllık QR Menü Modülü");
  assert.equal(resolved.productName, "Wolvox Restoran");
  assert.equal(resolved.badge, "Sınırlı Fırsat");
  assert.equal(resolved.isExpired, false);
  assert.equal(resolved.daysRemaining, 16);
  assert.equal(resolved.formattedValidity, "01.06.2026 – 30.06.2026");
  assert.deepEqual(resolved.termsList, [
    "Yalnızca yeni lisans alımlarında geçerlidir.",
    "Diğer kampanyalarla birleştirilemez.",
  ]);
});

test("resolveCampaignData: süresi dolmuş kampanya isExpired=true ve 0 gün döner", () => {
  const ref = new Date("2026-07-05T12:00:00Z");
  const raw = {
    title: "Eski Kampanya",
    schemaAttributes: {
      endDate: "2026-06-30",
      discount: "5.000 TL",
    },
  };

  const resolved = resolveCampaignData(raw, ref);
  assert.equal(resolved.isExpired, true);
  assert.equal(resolved.daysRemaining, 0);
});

test("buildCampaignOfferJsonLd: Google Schema.org Offer üretir", () => {
  const resolved = resolveCampaignData({
    title: "ERP Geçiş Kampanyası",
    slug: "erp-gecis-kampanyasi",
    schemaAttributes: {
      discount: "%40",
      productName: "Wolvox ERP",
      productUrl: "/wolvox-erp",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    },
  }, new Date("2026-05-01T00:00:00Z"));

  const offer = buildCampaignOfferJsonLd(resolved, {
    siteUrl: "https://example.com",
    pageUrl: "https://example.com/tr/kampanya/erp-gecis-kampanyasi",
    siteName: "Örnek Bilişim",
  });

  assert.equal(offer["@type"], "Offer");
  assert.equal(offer.name, "ERP Geçiş Kampanyası");
  assert.equal(offer.validFrom, "2026-01-01");
  assert.equal(offer.validThrough, "2026-12-31");
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.ok((offer.itemOffered as Record<string, unknown>)?.name === "Wolvox ERP");
});

test("buildCampaignsItemListJsonLd: ItemList şeması üretir", () => {
  const c1 = resolveCampaignData({ title: "K1", slug: "k1" });
  const c2 = resolveCampaignData({ title: "K2", slug: "k2" });

  const itemList = buildCampaignsItemListJsonLd([c1, c2], {
    archiveUrl: "https://example.com/tr/kampanyalar",
    siteUrl: "https://example.com",
  });

  assert.equal(itemList["@type"], "ItemList");
  assert.equal(itemList.numberOfItems, 2);
  assert.equal((itemList.itemListElement as unknown[]).length, 2);
});

