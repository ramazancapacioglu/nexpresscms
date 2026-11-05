import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HEADER_ZONES, deriveMobileZones, resolveHeaderZones, resolveMobileHeaderZones, zonesToWidgets } from "../src/header-layout";

test("boş diziler şerit varsayılanına düşer", () => {
  const zones = resolveHeaderZones({ leftWidgets: [], centerWidgets: [], rightWidgets: [] }, DEFAULT_HEADER_ZONES.main);
  assert.deepEqual(zones, DEFAULT_HEADER_ZONES.main);
});

test("yalnızca bilinmeyen kimlik varsa varsayılan kullanılır", () => {
  const zones = resolveHeaderZones({ leftWidgets: ["geo_selector"], centerWidgets: [], rightWidgets: [] }, DEFAULT_HEADER_ZONES.top);
  assert.deepEqual(zones, DEFAULT_HEADER_ZONES.top);
});

test("eski kimlikler kanonik öğeye çevrilir ve sıra korunur", () => {
  const zones = resolveHeaderZones(
    {
      leftWidgets: ["logo"],
      centerWidgets: ["mega_menu"],
      rightWidgets: ["search_bar", "cta_button", "contact_info"],
    },
    DEFAULT_HEADER_ZONES.main,
  );
  assert.deepEqual(zones, { left: ["logo"], center: ["menu"], right: ["search", "cta", "contact"] });
});

test("aynı öğe iki bölgedeyse soldan sağa ilk konum kalır", () => {
  const zones = resolveHeaderZones(
    { leftWidgets: ["campaign_links"], centerWidgets: ["links", "category_drawer"], rightWidgets: [] },
    DEFAULT_HEADER_ZONES.bottom,
  );
  assert.deepEqual(zones, { left: ["links"], center: [], right: [] });
});

test("bölgeler widget dizisine geri yazılır", () => {
  const widgets = zonesToWidgets({ left: ["logo"], center: ["menu"], right: ["cta"] });
  assert.deepEqual(widgets, { leftWidgets: ["logo"], centerWidgets: ["menu"], rightWidgets: ["cta"] });
});

test("mobil düzen yazılmamışsa logo solda, kalan öğeler sağda", () => {
  const desktop = { left: ["logo"] as const, center: ["menu"] as const, right: ["search", "cta"] as const };
  assert.deepEqual(deriveMobileZones(desktop), { left: ["logo"], center: [], right: ["menu", "search", "cta"] });
  assert.deepEqual(resolveMobileHeaderZones({}, desktop), { left: ["logo"], center: [], right: ["menu", "search", "cta"] });
});

test("yazılı mobil dizi masaüstünü ezer", () => {
  const zones = resolveMobileHeaderZones(
    { mobileLeftWidgets: ["logo", "search"], mobileRightWidgets: ["menu"] },
    { left: ["logo"], center: ["menu"], right: ["cta"] },
  );
  assert.deepEqual(zones, { left: ["logo", "search"], center: [], right: ["menu"] });
});
