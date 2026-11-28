import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getThemeManifest } from "../src/registry";
import { SoftwareProductCardBlock } from "../src/software-product-card-block";

const tokens = getThemeManifest("corporate-aurora").tokens;

test("P1 · SoftwareProductCardBlock: EUR, KDV dahil, ondalıklı, eksik ve sıfır fiyat doğruluğu", () => {
  const html = renderToStaticMarkup(
    React.createElement(SoftwareProductCardBlock, {
      id: "erp-test",
      tokens,
      locale: "tr",
      props: {
        name: "Aurora ERP",
        pricingMode: "starting",
        price: 49.9,
        listPrice: 59.9,
        currency: "EUR",
        vatNote: "KDV dahil",
        brochureUrl: "https://example.com/pricing",
        highlights: ["Çoklu depo takibi"],
        priceList: [
          { name: "Başlangıç", listPrice: 59.9, campaignPrice: 49.9 },
          { name: "Eğitim", listPrice: 0, campaignPrice: 0 },
          { name: "Özel Entegrasyon" },
        ],
      },
    })
  );

  // Para birimi ve KDV notu girdiyle eşleşir; sabit TL / KDV hariç / 2026 / Abaküs sızmaz
  assert.match(html, /49,90 EUR/);
  assert.match(html, /59,90 EUR/);
  assert.match(html, /Para birimi: EUR · KDV dahil/);
  assert.match(html, /Ücretsiz \/ Dahil/);
  assert.match(html, /Teklif alınız/);
  assert.doesNotMatch(html, /Tüm fiyatlar TL/);
  assert.doesNotMatch(html, /KDV hariç/);
  assert.doesNotMatch(html, /2026 Güncel Liste/);
  assert.doesNotMatch(html, /Abaküs/);
});

test("P2 · SoftwareProductCardBlock: native radio erişilebilirliği ve İngilizce i18n", () => {
  const html = renderToStaticMarkup(
    React.createElement(SoftwareProductCardBlock, {
      id: "a11y-test",
      tokens,
      locale: "en",
      props: {
        name: "Cloud Suite",
        currency: "EUR",
        vatNote: "VAT included",
        demoUrl: "/contact",
        highlights: ["Multi-warehouse"],
        priceList: [{ name: "Starter", listPrice: 100, campaignPrice: 80 }],
      },
    })
  );

  // role="tablist" yerine native fieldset + legend + radio grubu + focus-visible
  assert.doesNotMatch(html, /role="tablist"/);
  assert.match(html, /<fieldset/);
  assert.match(html, /<legend[^>]*>Cloud Suite detail sections<\/legend>/);
  assert.match(html, /:focus-visible/);
  // İngilizce arayüz metinleri
  assert.match(html, /Request Free Demo/);
  assert.match(html, /Price List/);
  assert.match(html, /Currency: EUR · VAT included/);
});
