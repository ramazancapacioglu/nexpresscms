import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { YF_DEMO_HOME_SLUG, getThemeDemoPack } from "../src/demo-pack";
import { YF_FOOTER, YF_HEADER_MENU, YF_LEGACY_THEME_ID, YF_QUICK_MENU, YF_THEME_ID } from "../src/yazilim-firmasi";
import { getThemeManifest } from "../src/registry";
import { getThemeChromePreset } from "../src/theme-chrome";

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

test("Yazılım Bayi: ayrı vitrin, çözüm ailesi sayfaları, kampanya ve yazılar; görseller diskte var; bağlantılar pakete çıkar", () => {
  const pack = getThemeDemoPack("yazilim-bayi")!;
  assert.equal(pack.homeSlug, "yb-vitrin");
  const slugs = new Set(pack.entries.map((entry) => entry.slug));
  assert.equal(slugs.size, pack.entries.length);
  for (const slug of ["yb-erp", "yb-muhasebe", "yb-sektorel", "yb-e-donusum", "yb-bulut", "yb-demo-talebi", "yb-destek-talebi"]) assert.ok(slugs.has(slug), slug);
  assert.ok(pack.entries.filter((e) => e.type === "campaign").length >= 3);
  const posts = pack.entries.filter((e) => e.type === "post");
  assert.ok(posts.length >= 4 && posts.every((p) => p.canvas === false && p.image && p.categories?.length));
  const home = JSON.stringify(pack.entries.find((e) => e.slug === pack.homeSlug));
  assert.ok(home.includes("campaign_showcase") && home.includes("mosaic"));
  const chrome = getThemeChromePreset("yazilim-bayi")!;
  const json = JSON.stringify(pack.entries);
  const missing = [...new Set([...json.matchAll(/\/tr\/([a-z0-9-]+)/g)].map((m) => m[1]!))].filter((slug) => !slugs.has(slug) && slug !== "kampanyalar");
  assert.deepEqual(missing, []);
  // Başlık, menü ve altlık kaynak sitenin gerçek bilgisini taşır (yolları kaynak sitedekidir, demo sayfalarına bakmaz)
  assert.ok(chrome.customizer.header.logoImage && existsSync(new URL(`../../../apps/cms/public${chrome.customizer.header.logoImage}`, import.meta.url)));
  assert.ok(chrome.menuItems && chrome.menuItems.length === 5 && chrome.menuItems.every((m) => m.children?.length));
  assert.ok(chrome.footer.options?.bottom?.socials?.facebook?.startsWith("https://"));
  assert.ok(chrome.header.bottomBar.links?.some((l) => l.children?.length));
  const art = [...new Set([...json.matchAll(/\/demo\/yazilim-bayi\/([a-z0-9-]+\.svg)/g)].map((m) => m[1]!))];
  assert.ok(art.length > 5);
  for (const file of art) assert.ok(existsSync(new URL(`../../../apps/cms/public/demo/yazilim-bayi/${file}`, import.meta.url)), file);
});
