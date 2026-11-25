import test from "node:test";
import assert from "node:assert/strict";
import { compileBlocksToMarkdown } from "../src/markdown-compiler";

test("markdown-compiler: software_product_card, sectors_grid ve comparison_table kayıpsız derlenir", () => {
  const md = compileBlocksToMarkdown(
    [
      { id: "p1", type: "paragraph", props: { text: "Wolvox ERP işletmenizin tüm süreçlerini yönetir." } },
      {
        id: "card1",
        type: "software_product_card",
        props: {
          name: "Akınsoft Wolvox ERP 26",
          version: "26.0",
          pricingMode: "starting",
          price: 17290,
          listPrice: 26600,
          currency: "TRY",
          vatNote: "+ KDV",
          operatingSystem: "Windows 10/11",
          priceList: [
            { name: "Wolvox ERP Temel Paket", group: "Ana Paket", listPrice: 26600, campaignPrice: 17290 },
            { name: "WolvoxAI Rapor Asistanı", group: "Ek Modül", listPrice: 8200, campaignPrice: 5330 },
          ],
          highlights: ["Çoklu şube yönetimi"],
        },
      },
      {
        id: "sec1",
        type: "sectors_grid",
        props: {
          title: "Uygun Sektörler",
          items: [{ name: "Üretim", badge: "MRP", summary: "Reçete ve iş emri takibi", useCases: ["Maliyet", "Fason"] }],
        },
      },
      {
        id: "tbl1",
        type: "comparison_table",
        props: {
          title: "Paket Karşılaştırma",
          columns: ["Özellik", "Temel", "Kurumsal"],
          rows: [["e-Fatura", "Var", "Var"]],
        },
      },
    ],
    { title: "Wolvox ERP" }
  );

  assert.match(md, /Wolvox ERP işletmenizin tüm süreçlerini yönetir/);
  assert.match(md, /17\.290 TL/);
  assert.match(md, /\| Wolvox ERP Temel Paket \| Ana Paket \| 26\.600 TL \| 17\.290 TL \(%35 indirim\) \|/);
  assert.match(md, /5\.330 TL/);
  assert.match(md, /## Uygun Sektörler/);
  assert.match(md, /\*\*Üretim \(MRP\):\*\* Reçete ve iş emri takibi — Kullanım: Maliyet, Fason/);
  assert.match(md, /\| Özellik \| Temel \| Kurumsal \|/);
});
