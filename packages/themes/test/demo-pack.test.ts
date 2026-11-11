import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { YF_DEMO_HOME_SLUG, getThemeDemoPack } from "../src/demo-pack";
import { YF_FOOTER, YF_HEADER_MENU, YF_LEGACY_THEME_ID, YF_QUICK_MENU, YF_THEME_ID } from "../src/yazilim-firmasi";
import { getThemeManifest } from "../src/registry";

test("Yazılım Firması demo paketi benzersiz adresler ve ayrı vitrin kullanır", () => {
  const pack = getThemeDemoPack("yazilim-firmasi");
  assert.ok(pack);
  assert.equal(pack.homeSlug, YF_DEMO_HOME_SLUG);
  assert.notEqual(pack.homeSlug, "ana-sayfa");
  const slugs = pack.entries.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(slugs.includes(YF_DEMO_HOME_SLUG));
  assert.ok(pack.entries.some((entry) => entry.type === "post"));
  assert.ok(pack.entries.some((entry) => entry.slug === "e-donusum"));
  assert.equal(getThemeDemoPack("bilinmeyen-tema"), null);
});

test("Yazılım Firması: menü, footer ve sayfa bağlantıları demo adreslerine çıkar; görseller var", () => {
  const pack = getThemeDemoPack("yazilim-firmasi")!;
  const slugs = new Set(pack.entries.map((entry) => entry.slug));
  const json = JSON.stringify([pack.entries, YF_HEADER_MENU, YF_QUICK_MENU, YF_FOOTER]);
  const missing = [...new Set([...json.matchAll(/\/tr\/([a-z0-9-]+)/g)].map((m) => m[1]!))].filter((slug) => !slugs.has(slug) && !["kampanyalar", "kampanya"].includes(slug)); // kampanya yolları Kampanyalar eklentisinindir
  assert.deepEqual(missing, []);
  const art = [...new Set([...json.matchAll(/\/demo\/yazilim-firmasi\/([a-z0-9-]+\.svg)/g)].map((m) => m[1]!))];
  assert.ok(art.length > 5);
  for (const file of art) assert.ok(existsSync(new URL(`../../../apps/cms/public/demo/yazilim-firmasi/${file}`, import.meta.url)), file);
});

test("Yazılım Firması: tuval sayfalarında tek hero (makale ve kampanyada yok) ve eski kimlik yeni temaya yönlenir", () => {
  const pack = getThemeDemoPack("yazilim-firmasi")!;
  for (const entry of pack.entries) assert.equal(entry.blocks.filter((b) => b.type === "hero").length, entry.canvas === false || entry.type === "campaign" ? 0 : 1, entry.slug);
  assert.equal(getThemeManifest(YF_LEGACY_THEME_ID).id, YF_THEME_ID);
});

test("Yazılım Firması: kampanyalar eklenti kaydı, vitrin blokları ve yazılar yerleşik düzende", () => {
  const pack = getThemeDemoPack("yazilim-firmasi")!;
  const camps = pack.entries.filter((e) => e.type === "campaign");
  assert.ok(camps.length >= 3);
  for (const c of camps) assert.ok(c.campaign && c.campaign.endsInDays > 0 && c.image, c.slug);
  assert.ok(JSON.stringify(pack.entries.find((e) => e.slug === YF_DEMO_HOME_SLUG)).includes("campaign_showcase"));
  const posts = pack.entries.filter((e) => e.type === "post");
  assert.ok(posts.every((p) => p.canvas === false && p.image && p.categories?.length));
});
