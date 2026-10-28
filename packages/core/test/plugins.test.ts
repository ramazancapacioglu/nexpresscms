import test from "node:test";
import assert from "node:assert/strict";
import { isModuleActive, isPluginModuleEnabled, pluginRegistry, pluginSummary, resolvePluginState, type PluginManifest } from "../src";

const manifest: PluginManifest = {
  id: "@x/demo", name: "Demo", version: "1.0.0", vendor: "T", license: "pro", description: "d", icon: "Blocks",
  modules: [
    { id: "a", label: "A", description: "", group: "g", status: "ready", defaultEnabled: true },
    { id: "b", label: "B", description: "", group: "g", status: "ready", defaultEnabled: false },
    { id: "c", label: "C", description: "", group: "g", status: "planned", defaultEnabled: true },
  ],
};

test("kayıt yoksa manifest varsayılanları; kayıt modülü ezer", () => {
  assert.deepEqual(resolvePluginState(manifest).modules, { a: true, b: false, c: true });
  assert.deepEqual(resolvePluginState(manifest, { enabled: true, modules: { b: true, a: false } }).modules, { a: false, b: true, c: true });
});

test("kapalı eklenti hiçbir modülü etkinleştirmez; yakında modülü hiç etkin değildir; builtin kapatılamaz", () => {
  const off = resolvePluginState(manifest, { enabled: false, modules: {} });
  assert.equal(isModuleActive(manifest, off, "a"), false);
  const on = resolvePluginState(manifest);
  assert.equal(isModuleActive(manifest, on, "a"), true);
  assert.equal(isModuleActive(manifest, on, "b"), false);
  assert.equal(isModuleActive(manifest, on, "c"), false, "planned");
  assert.equal(isModuleActive(manifest, on, "yok"), false);
  assert.equal(resolvePluginState({ ...manifest, builtin: true }, { enabled: false, modules: {} }).enabled, true);
});

test("özet sayıları ve kapı: bağlı değilse açık, bağlıysa kapıya sorar", async () => {
  assert.deepEqual(pluginSummary(manifest, resolvePluginState(manifest)), { total: 3, ready: 2, planned: 1, active: 1 });
  pluginRegistry.gate = null;
  assert.equal(await isPluginModuleEnabled("s", "p", "m"), true);
  pluginRegistry.gate = async (_s, _p, m) => m === "ok";
  assert.equal(await isPluginModuleEnabled("s", "p", "ok"), true);
  assert.equal(await isPluginModuleEnabled("s", "p", "no"), false);
  pluginRegistry.gate = null;
});

import { pluginRoutes } from "../src";

test("eklenti rotası: işleyici yoksa veya null dönerse 404, varsa yanıt", async () => {
  const ctx = { siteId: "s", request: new Request("http://x.test/a") };
  assert.equal((await pluginRoutes.dispatch("yok", ctx)).status, 404);
  pluginRoutes.register("t", "@x/demo", () => null);
  assert.equal((await pluginRoutes.dispatch("t", ctx)).status, 404);
  pluginRoutes.register("t", "@x/demo", () => new Response("tamam"));
  assert.equal(await (await pluginRoutes.dispatch("t", ctx)).text(), "tamam");
});

import { normalizePluginSettings, type PluginSettingField } from "../src";

test("ayar normalleştirme: tür dönüşümü, sınırlar, bilinmeyen anahtar atılır", () => {
  const fields: PluginSettingField[] = [
    { key: "city", label: "Şehir", type: "text", module: "m", group: "g", maxLength: 5 },
    { key: "lat", label: "Enlem", type: "number", module: "m", group: "g", min: -90, max: 90 },
    { key: "on", label: "Açık", type: "boolean", module: "m", group: "g" },
    { key: "mode", label: "Mod", type: "select", module: "m", group: "g", options: [{ value: "a", label: "A" }] },
  ];
  const ok = normalizePluginSettings(fields, { city: "  İzmir ", lat: "38.4", on: "true", mode: "a", baska: "x" });
  assert.deepEqual(ok, { values: { city: "İzmir", lat: 38.4, on: true, mode: "a" }, errors: {} });
  const bad = normalizePluginSettings(fields, { city: "çok uzun şehir", lat: 120, mode: "z" });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["city", "lat", "mode"]);
  assert.deepEqual(bad.values, {});
  assert.equal(normalizePluginSettings(fields, { lat: "" }).values.lat, "");
});

import { pluginActions } from "../src";

test("eklenti eylemi: kayıtsızsa disabled, hata fırlatırsa failed, başarıda veri", async () => {
  const ctx = { siteId: "s", userId: "u", input: { a: 1 } };
  assert.deepEqual(await pluginActions.run("yok", ctx), { ok: false, error: "Bu eylem kullanılamıyor (eklenti kurulu değil).", code: "disabled" });
  pluginActions.register("boom", "@x/demo", () => { throw new Error("patladı"); });
  assert.deepEqual(await pluginActions.run("boom", ctx), { ok: false, error: "patladı", code: "failed" });
  pluginActions.register("ok", "@x/demo", async (c) => ({ ok: true, data: c.input }));
  assert.deepEqual(await pluginActions.run("ok", ctx), { ok: true, data: { a: 1 } });
});
