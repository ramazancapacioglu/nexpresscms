import assert from "node:assert/strict";
import test from "node:test";
import { BlockNodeSchema, ICON_NAMES, flattenBlocks } from "@nexpress/core";
import { getThemeDemoPack } from "../src/demo-pack";
import { OFFICIAL_THEME_STORE } from "../src/registry";
import { getThemeChromePreset } from "../src/theme-chrome";
import { YF_THEME_ID } from "../src/yazilim-firmasi";

const OFFICIAL = OFFICIAL_THEME_STORE.map((theme) => theme.id);
/** Eklenti ve çekirdek yolları: demo paketinde sayfası yoktur. */
const CORE_ROUTES = new Set(["magaza", "kampanyalar", "kampanya", "kategori", "etiket", "ara", "yazar"]);

test("her resmi temanın demo paketi var ve adresleri benzersiz", () => {
  for (const id of OFFICIAL) {
    const pack = getThemeDemoPack(id);
    assert.ok(pack, `${id}: demo paketi yok`);
    assert.equal(pack.themeId, id);
    const slugs = pack.entries.map((entry) => entry.slug);
    assert.equal(new Set(slugs).size, slugs.length, `${id}: yinelenen adres`);
    assert.ok(pack.homeSlug && slugs.includes(pack.homeSlug), `${id}: ana sayfa kaydı yok`);
    assert.notEqual(pack.homeSlug, "ana-sayfa");
    assert.ok(pack.entries.length >= 5, `${id}: en az beş kayıt`);
  }
});

test("demo blokları şemaya uyar, simgeler geçerli, kuralları bozmaz", () => {
  const icons = new Set<string>(ICON_NAMES);
  for (const id of OFFICIAL) {
    for (const entry of getThemeDemoPack(id)!.entries) {
      for (const block of entry.blocks) assert.ok(BlockNodeSchema.safeParse(block).success, `${id}/${entry.slug}: ${block.type}`);
      const flat = flattenBlocks(entry.blocks).map((b) => b.block);
      for (const b of flat) {
        const icon = (b.props as Record<string, unknown>).icon;
        if (typeof icon === "string" && icon) assert.ok(icons.has(icon), `${id}/${entry.slug}: simge ${icon}`);
      }
      // Tuval sayfasında tek hero (h1 kaynağı); yazı ve kampanyada hero yok
      const heroes = flat.filter((b) => b.type === "hero").length;
      assert.equal(heroes, entry.canvas === false || entry.type === "campaign" ? 0 : 1, `${id}/${entry.slug}: hero sayısı`);
      if (id !== YF_THEME_ID) assert.ok(entry.title.length >= 5 && entry.tldr.length >= 40, `${id}/${entry.slug}: başlık/özet kısa`);
    }
  }
});

test("demo bağlantıları paket içindeki sayfalara çıkar", () => {
  for (const id of OFFICIAL) {
    const pack = getThemeDemoPack(id)!;
    if (id === YF_THEME_ID) continue; // kendi testi var
    const slugs = new Set(pack.entries.map((entry) => entry.slug));
    const json = JSON.stringify(pack.entries);
    const missing = [...new Set([...json.matchAll(/"\/tr\/([a-z0-9-]+)"/g)].map((m) => m[1]!))].filter((slug) => !slugs.has(slug) && !CORE_ROUTES.has(slug));
    assert.deepEqual(missing, [], `${id}: pakette olmayan adresler`);
  }
});

test("Yazılım Firması dışındaki resmi temaların hazır başlık/altlık düzeni var", () => {
  for (const id of OFFICIAL) {
    const preset = getThemeChromePreset(id);
    if (id === YF_THEME_ID) {
      assert.equal(preset, null);
      continue;
    }
    assert.ok(preset, `${id}: şerit düzeni yok`);
    assert.ok(preset.header.mainBar.enabled);
    assert.ok(preset.footer.columns.length > 0 || (preset.footer.widgets?.length ?? 0) > 0 || preset.footer.copyrightText.trim() !== "", `${id}: altlık boş`);
  }
  assert.equal(getThemeChromePreset("yuklenen-tema"), null);
});
