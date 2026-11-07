import test from "node:test";
import assert from "node:assert/strict";
import { hasExplicitMobileZones, resolveHeaderZones, resolveMobileHeaderZones } from "@nexpress/core";
import { HEADER_LIBRARY } from "../src/chrome-library";

test("her hazır header ana şeritte tasarlanmış mobil dizi taşır", () => {
  assert.ok(HEADER_LIBRARY.length >= 7);
  for (const item of HEADER_LIBRARY) {
    assert.equal(hasExplicitMobileZones(item.value.mainBar), true, item.id);
    const desktop = resolveHeaderZones(item.value.mainBar, { left: ["logo"], center: ["menu"], right: ["cta"] });
    const mobile = resolveMobileHeaderZones(item.value.mainBar, desktop);
    assert.ok(mobile.left.includes("logo"), item.id);
    assert.equal(mobile.left.includes("menu"), false, item.id);
  }
});

test("sade şerit mobilde çağrıyı bırakır, doküman şeridi aramayı ortaya alır", () => {
  const plain = HEADER_LIBRARY.find((item) => item.id === "header-plain")!;
  const docs = HEADER_LIBRARY.find((item) => item.id === "header-docs")!;
  const catalog = HEADER_LIBRARY.find((item) => item.id === "header-catalog")!;
  assert.deepEqual(plain.value.mainBar.mobileRightWidgets, ["menu"]);
  assert.deepEqual(docs.value.mainBar.mobileCenterWidgets, ["search"]);
  assert.deepEqual(docs.value.mainBar.mobileRightWidgets, ["menu"]);
  assert.deepEqual(catalog.value.bottomBar.mobileLeftWidgets, ["links"]);
  assert.equal(hasExplicitMobileZones(HEADER_LIBRARY.find((item) => item.id === "header-announce")!.value.topBar), true);
});

test("modern header ve footer şablonları: benzersiz kimlik, tam mobil dizi, geçerli sütun dizini", async () => {
  const { FOOTER_LAYOUT_PRESETS } = await import("@nexpress/core");
  const { FOOTER_LIBRARY } = await import("../src/chrome-library");
  const modernHeaders = HEADER_LIBRARY.filter((h) => h.category === "modern");
  assert.ok(modernHeaders.length >= 6);
  assert.equal(new Set(HEADER_LIBRARY.map((h) => h.id)).size, HEADER_LIBRARY.length);
  for (const h of modernHeaders) {
    for (const key of ["topBar", "bottomBar"] as const) if (h.value[key].enabled) assert.equal(hasExplicitMobileZones(h.value[key]), true, `${h.id}.${key}`);
  }
  assert.equal(new Set(FOOTER_LIBRARY.map((f) => f.id)).size, FOOTER_LIBRARY.length);
  for (const f of FOOTER_LIBRARY.filter((x) => x.id.startsWith("footer-") && ["footer-cta-brand", "footer-centered-brand", "footer-newsletter-split", "footer-trust-three", "footer-local-business"].includes(x.id))) {
    const preset = FOOTER_LAYOUT_PRESETS.find((p) => p.id === (f.value.layoutPreset ?? "brand-wide-4"))!;
    const widgets = f.value.widgets ?? [];
    assert.ok(widgets.length >= 2, f.id);
    for (const w of widgets) assert.ok((w.columnIndex ?? 0) < preset.columnCount, `${f.id}: ${w.id} sütun dışı`);
    assert.equal(new Set(widgets.map((w) => w.id)).size, widgets.length, `${f.id}: yinelenen widget`);
  }
});
