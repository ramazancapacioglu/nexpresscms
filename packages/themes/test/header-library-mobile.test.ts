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
