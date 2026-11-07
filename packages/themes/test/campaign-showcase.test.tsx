import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { CampaignShowcaseView } from "../src/campaign-showcase";
import { RscSingleBlock } from "../src/renderer";

const tokens = {
  colors: {
    border: "#e2e8f0",
    primary: "#2563eb",
    primaryForeground: "#ffffff",
  },
  geometry: { borderRadius: "12px" },
  typography: { headingFont: "Inter" },
} as unknown as DesignTokens;

const testItems: DynamicItem[] = [
  {
    id: "camp_1",
    title: "Restoran ERP Kampanyası",
    url: "/kampanya/restoran-erp",
    excerpt: "Restoran otomasyonunda kaçırılmayacak fırsat.",
    image: "/media/restaurant.jpg",
    discount: "%40",
    badge: "ÖZEL FIRSAT",
    gift: "1 Yıllık QR Menü Hediyeli",
    daysRemaining: 25,
    isExpired: false,
    ctaText: "Hemen Başvur",
    ctaUrl: "/kampanya/restoran-erp",
    contactWhatsapp: "905551234567",
    contactPhone: "02120000000",
  },
  {
    id: "camp_2",
    title: "E-Ticaret Paketi",
    url: "/kampanya/eticaret-paketi",
    excerpt: "Pazaryeri entegrasyonu ile tam otomatik e-ticaret.",
    image: null,
    discount: "%30",
    badge: "SINIRLI",
    daysRemaining: null,
    isExpired: false,
    ctaText: "İncele",
  },
];

test("campaign_showcase: carousel görünümünde CSS snap-x ve öğelerde snap-start bulunur", () => {
  const html = renderToStaticMarkup(
    <CampaignShowcaseView
      props={{ layout: "carousel", columns: 3, heading: "Fırsatlar" }}
      items={testItems}
      tokens={tokens}
    />
  );

  assert.ok(html.includes("snap-x"), "snap-x sınıfı bulunmalı");
  assert.ok(html.includes("snap-start"), "snap-start sınıfı bulunmalı");
  assert.ok(html.includes("Restoran ERP Kampanyası"), "Başlık görünmeli");
  assert.ok(html.includes("%40 İndirim"), "İndirim rozeti görünmeli");
  assert.ok(html.includes("Bitmesine 25 gün kaldı"), "Geri sayım görünmeli");
  assert.ok(html.includes("1 Yıllık QR Menü Hediyeli"), "Hediye avantajı görünmeli");
});

test("campaign_showcase: spotlight (vitrin kartı) düzeni ana kampanyayı büyük öne çıkarır", () => {
  const html = renderToStaticMarkup(
    <CampaignShowcaseView
      props={{
        layout: "spotlight",
        heading: "Günün Fırsatı",
        showWhatsapp: true,
        showPhone: true,
      }}
      items={testItems}
      tokens={tokens}
    />
  );

  assert.ok(html.includes("Günün Fırsatı"), "Spotlight başlığı olmalı");
  assert.ok(html.includes("Hemen Başvur"), "CTA butonu olmalı");
  assert.ok(html.includes("wa.me/905551234567"), "WhatsApp bağlantısı olmalı");
  assert.ok(html.includes("tel:02120000000"), "Telefon bağlantısı olmalı");
});

test("campaign_showcase: ticker düzeni indirim ve başlığı duyuru şeridi olarak çizer", () => {
  const html = renderToStaticMarkup(
    <CampaignShowcaseView
      props={{ layout: "ticker" }}
      items={testItems}
      tokens={tokens}
    />
  );

  assert.ok(html.includes("FIRSAT"), "Ticker rozeti olmalı");
  assert.ok(html.includes("Restoran ERP Kampanyası"), "Başlık yer almalı");
  assert.ok(html.includes("%40 İndirim"), "İndirim bilgisi olmalı");
});

test("campaign_showcase: preview modunda öğe yoksa örnek kampanyalarla zengin önizleme verir", () => {
  const html = renderToStaticMarkup(
    <CampaignShowcaseView
      props={{ layout: "carousel", heading: "Editör Önizlemesi" }}
      items={[]}
      tokens={tokens}
      preview={true}
    />
  );

  assert.ok(html.includes("Editör Önizlemesi"), "Önizleme başlığı olmalı");
  assert.ok(html.includes("snap-x"), "Atlıkarınca snap-x olmalı");
  assert.ok(html.includes("İndirim"), "Örnek indirim rozetleri bulunmalı");
});

test("RscSingleBlock: campaign_showcase bloğunu başarıyla render eder", () => {
  const block = {
    id: "cs_block_1",
    type: "campaign_showcase",
    props: {
      heading: "En Yeni Kampanyalar",
      layout: "grid",
      columns: 2,
    },
  };

  const dynamic = {
    cs_block_1: {
      items: testItems,
      meta: { key: "cs_block_1", total: 2, page: 1, pages: 1, q: "", cat: "", sort: "newest", keep: "" },
    },
  };

  const html = renderToStaticMarkup(
    <RscSingleBlock
      block={block as any}
      themeId="corporate-clean"
      tokens={tokens}
      isEditorial={false}
      isCommerce={false}
      dynamic={dynamic as any}
    />
  );

  assert.ok(html.includes("En Yeni Kampanyalar"), "Blok başlığı basılmalı");
  assert.ok(html.includes("Restoran ERP Kampanyası"), "Kampanya içeriği bulunmalı");
});
