import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultWidget,
  FOOTER_LAYOUT_PRESETS,
  resolveActiveSidebarArea,
  resolveAllSidebarAreas,
  resolveFooterWidgets,
  resolveSidebarWidgets,
  SITE_WIDGET_TYPES,
  WIDGET_CATALOG,
} from "../src/index";

describe("widgets (sidebar ve footer bileşen sistemi)", () => {
  it("her SITE_WIDGET_TYPES türü WIDGET_CATALOG içinde tanımlıdır ve benzersiz kimlikle üretilir", () => {
    for (const type of SITE_WIDGET_TYPES) {
      const entry = WIDGET_CATALOG.find((w) => w.type === type);
      assert.ok(entry, `${type} katalogda bulunmalı`);
      const w1 = createDefaultWidget(type, 0);
      const w2 = createDefaultWidget(type, 1);
      assert.notEqual(w1.id, w2.id);
      assert.equal(w1.type, type);
      assert.equal(w2.columnIndex, 1);
      assert.equal(w1.enabled, true);
    }
  });

  it("FOOTER_LAYOUT_PRESETS sütun toplamları 12'lik ızgaraya uyar", () => {
    for (const preset of FOOTER_LAYOUT_PRESETS) {
      const sum = preset.colSpans.reduce((a, b) => a + b, 0);
      assert.equal(sum, 12, `${preset.id} toplamı 12 olmalı`);
      assert.equal(preset.colSpans.length, preset.columnCount);
    }
  });

  it("resolveSidebarWidgets ve resolveFooterWidgets eski kayıtları bileşen dizisine dönüştürür", () => {
    const sbWidgets = resolveSidebarWidgets({
      enabled: true,
      position: "right",
      title: "Rehber",
      links: [{ id: "l1", label: "Test", href: "/tr" }],
    });
    assert.ok(sbWidgets.length >= 4);
    assert.ok(sbWidgets.some((w) => w.type === "categories"));
    assert.ok(sbWidgets.some((w) => w.type === "recent_posts"));
    assert.ok(sbWidgets.some((w) => w.type === "campaigns"));

    const ftWidgets = resolveFooterWidgets(
      {
        columns: [{ id: "c1", title: "Kurumsal", colSpan: 1, links: [{ label: "Hakkımızda", href: "/tr/kurumsal" }] }],
        showNewsletter: true,
        showLocalBusinessCard: false,
        copyrightText: "© 2026",
        bottomLinks: [],
      },
      "Test Site"
    );
    assert.ok(ftWidgets.some((w) => w.type === "about_brand"));
    assert.ok(ftWidgets.some((w) => w.type === "newsletter"));
    assert.ok(ftWidgets.some((w) => w.type === "nav_menu"));
  });

  it("resolveAllSidebarAreas ve resolveActiveSidebarArea çoklu kenar çubuğu alanlarını (blog, shop, archive, faq, page) yönetir", () => {
    const areas = resolveAllSidebarAreas({
      enabled: true,
      position: "left",
      title: "Ana Sidebar",
      links: [],
    });
    assert.ok(areas.length >= 6);
    assert.ok(areas.some((a) => a.id === "primary"));
    assert.ok(areas.some((a) => a.id === "blog"));
    assert.ok(areas.some((a) => a.id === "shop"));
    assert.ok(areas.some((a) => a.id === "archive"));
    assert.ok(areas.some((a) => a.id === "faq"));
    assert.ok(areas.some((a) => a.id === "page"));

    const blogArea = resolveActiveSidebarArea({ enabled: true, position: "left", title: "Site", links: [] }, "blog");
    assert.equal(blogArea.id, "blog");
    assert.equal(blogArea.position, "left");
    assert.ok((blogArea.widgets ?? []).length > 0);

    const shopArea = resolveActiveSidebarArea(null, "shop");
    assert.equal(shopArea.id, "shop");
    assert.ok((shopArea.widgets ?? []).some((w) => w.type === "featured_products"));

    const fallbackArea = resolveActiveSidebarArea(null, "bilinmeyen-alan");
    assert.equal(fallbackArea.id, "primary");
  });
});

