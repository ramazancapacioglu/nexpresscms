import test from "node:test";
import assert from "node:assert/strict";
import { collectFormIds } from "../src/forms";
import { lastPathSegment, pickContactCampaign, collectDynamicBlocks, type DynamicCandidate } from "../src/dynamic-content";

const camp = (over: Partial<DynamicCandidate>): DynamicCandidate => ({ id: "c", kind: "campaigns", title: "K", url: "/kampanya/restoran-kampanyasi", excerpt: "", categories: [], tags: [], isExpired: false, ...over });

test("adres son parçası dil önekinden ve alan adından bağımsızdır", () => {
  assert.equal(lastPathSegment("https://www.x.test/tr/akinsoft-wolvox-restoran-yonetimi/"), "akinsoft-wolvox-restoran-yonetimi");
  assert.equal(lastPathSegment("/akinsoft-wolvox-restoran-yonetimi?utm=1"), "akinsoft-wolvox-restoran-yonetimi");
  assert.equal(lastPathSegment(""), "");
});

test("model, ürün sayfası eşleşen süresi dolmamış kampanyayı seçer", () => {
  const list = [
    camp({ id: "a", productUrl: "https://x.test/mobil-satis/", url: "/kampanya/a" }),
    camp({ id: "b", productUrl: "https://x.test/akinsoft-wolvox-restoran-yonetimi/", url: "/kampanya/b", isExpired: true }),
    camp({ id: "c", productUrl: "/akinsoft-wolvox-restoran-yonetimi", url: "/kampanya/c" }),
  ];
  assert.equal(pickContactCampaign(list, { productUrl: "/akinsoft-wolvox-restoran-yonetimi" })?.id, "c");
  assert.equal(pickContactCampaign(list, { currentUrl: "/tr/mobil-satis" })?.id, "a");
  assert.equal(pickContactCampaign(list, { campaignSlug: "a" })?.id, "a");
  assert.equal(pickContactCampaign(list, { productUrl: "/yok" }), null);
  assert.equal(pickContactCampaign(list, {}), null);
});

test("form kimliği alt çizgi içerebilir ve model formunu da toplar", () => {
  const ids = collectFormIds([
    { type: "form_block", props: { formId: "frm_wp_12625" } },
    { type: "section", children: [{ type: "contact_campaign", props: { formId: "frm_wp_6685" } }] },
    { type: "form_block", props: { formId: "kötü id" } },
  ]);
  assert.deepEqual([...ids].sort(), ["frm_wp_12625", "frm_wp_6685"]);
  assert.equal(collectDynamicBlocks([{ id: "m", type: "contact_campaign", props: {} }]).length, 1);
});
