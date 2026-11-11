import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteSettings, sanitizeThemeChrome } from "../src/index";

const snap = (id: string) => ({
  capturedFromThemeId: id,
  headerConfig: { topBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [] }, mainBar: { enabled: true, leftWidgets: ["logo"], centerWidgets: ["menu"], rightWidgets: [] }, bottomBar: { enabled: false, leftWidgets: [], centerWidgets: [], rightWidgets: [] } },
  menuItems: [],
  menus: [],
  footerConfig: { columns: [], showNewsletter: false, showLocalBusinessCard: false, copyrightText: "", bottomLinks: [] },
  sidebarConfig: { enabled: false, position: "right", title: "", links: [] },
  customizer: { buttons: {}, header: {}, footer: {}, layout: {} },
});

test("tema başına şerit: geçerli kayıtlar kalır, bozuk kimlik ve kayıt atılır", () => {
  const out = sanitizeThemeChrome({ "corporate-aurora": snap("corporate-aurora"), "../kotu": snap("x"), "bozuk": { headerConfig: 1 } });
  assert.deepEqual(Object.keys(out), ["corporate-aurora"]);
  assert.deepEqual(sanitizeThemeChrome(null), {});
  assert.deepEqual(sanitizeThemeChrome([1, 2]), {});
});

test("en çok 16 tema saklanır ve ayarlar çözümünde korunur", () => {
  const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`tema-${i}`, snap(`tema-${i}`)]));
  assert.equal(Object.keys(sanitizeThemeChrome(many)).length, 16);
  const settings = resolveSiteSettings({ general: { themeChrome: { "ink-grid": snap("ink-grid") } } });
  assert.deepEqual(Object.keys(settings.general.themeChrome ?? {}), ["ink-grid"]);
  assert.deepEqual(resolveSiteSettings({}).general.themeChrome, {});
});
