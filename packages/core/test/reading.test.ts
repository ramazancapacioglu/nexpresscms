import assert from "node:assert/strict";
import test from "node:test";
import { pickFrontSlug, sanitizeChromeSnapshot, sanitizeReadingSlug } from "../src/reading";

test("sayfa adresi sade slug olur", () => {
  assert.equal(sanitizeReadingSlug(" Blog "), "blog");
  assert.equal(sanitizeReadingSlug("../etc"), "");
  assert.equal(sanitizeReadingSlug(""), "");
});

test("öne çıkan sayfa seçilmezse tema yedeği kalır", () => {
  assert.equal(pickFrontSlug("", "ana-sayfa"), "ana-sayfa");
  assert.equal(pickFrontSlug("akinsoft", "ana-sayfa"), "akinsoft");
});

test("eksik kabuk anlık görüntüsü yok sayılır", () => {
  assert.equal(sanitizeChromeSnapshot({ capturedFromThemeId: "aurora" }), null);
  assert.ok(sanitizeChromeSnapshot({
    capturedFromThemeId: "aurora",
    headerConfig: { mainBar: { enabled: true } },
    menuItems: [],
    footerConfig: { columns: [] },
    sidebarConfig: { areas: [] },
    customizer: { header: { height: 64 }, layout: { contentLayout: "boxed" } },
  }));
});
