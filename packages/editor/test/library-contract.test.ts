import test from "node:test";
import assert from "node:assert/strict";
import { AI_BLOCK_CATALOG, lintDesign } from "@nexpress/core";
import { NEXPRESS_DESIGN_LIBRARY } from "../src/library";

/** AI kataloğu ile gerçek tasarım kütüphanesi ayrışmasın: kütüphanedeki katalog blokları, katalog doğrulayıcısından hatasız geçer. */
test("tasarım kütüphanesindeki katalog blokları AI doğrulayıcısından hatasız geçer", () => {
  // form_block: kütüphane örneği eski satır içi alanlıdır; AI yalnızca var olan bir forma (formId) bağlanabilir
  const covered = NEXPRESS_DESIGN_LIBRARY.filter((i) => i.block.type in AI_BLOCK_CATALOG && i.block.type !== "form_block");
  assert.ok(covered.length >= 10, `kapsanan blok sayısı: ${covered.length}`);
  for (const item of covered) {
    const r = lintDesign([{ ...item.block, id: "x" }], "section", {});
    // Kütüphane örnek görselleri harici adrestir; AI için medya kitaplığı kuralı bilerek daha katıdır
    const errors = r.errors.filter((e) => !e.includes("medya kitaplığından"));
    assert.deepEqual(errors, [], `${item.id} (${item.block.type}): ${errors.join(" | ")}`);
    // Doğrulayıcı gerçek içeriği bozmaz: metin alanları aynen korunur (kısaltma yok)
    const warn = r.warnings.filter((w) => w.includes("kısaltıldı") || w.includes("atıldı"));
    assert.deepEqual(warn, [], `${item.id}: ${warn.join(" | ")}`);
  }
});

test("modern kütüphane: kimlikler benzersiz, bloklar geçerli, görseller satır içi, bantlar tam genişlik", async () => {
  const { BLOCK_TYPES } = await import("@nexpress/core");
  const { LIBRARY_GROUPS } = await import("../src/library-types");
  const known = new Set(LIBRARY_GROUPS.flatMap((g) => g.categories));
  const ids = NEXPRESS_DESIGN_LIBRARY.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, "yinelenen kütüphane kimliği");
  const modern = NEXPRESS_DESIGN_LIBRARY.filter((i) => i.id.startsWith("lib_mod_"));
  assert.ok(modern.length >= 28, `modern öğe sayısı: ${modern.length}`);
  assert.ok(modern.filter((i) => i.category === "contact" || i.category === "subscribe").length >= 8, "form tasarımı sayısı");
  const walk = (b: { id?: string; type: string; children?: unknown[] }, seen: string[]): void => {
    assert.ok((BLOCK_TYPES as readonly string[]).includes(b.type), `bilinmeyen tür: ${b.type}`);
    if (b.id) seen.push(b.id);
    for (const c of (b.children ?? []) as Array<{ id?: string; type: string; children?: unknown[] }>) walk(c, seen);
  };
  for (const item of modern) {
    assert.ok(known.has(item.category), `${item.id}: kategori ${item.category} hiçbir grupta yok`);
    const seen: string[] = [];
    walk(item.block as never, seen);
    assert.equal(new Set(seen).size, seen.length, `${item.id}: yinelenen blok kimliği`);
    const json = JSON.stringify(item.block);
    assert.ok(!/https?:\/\/images\./.test(json), `${item.id}: harici görsel kullanılmamalı`);
    assert.ok(item.block.type === "section" || item.block.type === "columns" || item.block.type === "form_block", `${item.id}: üst blok türü ${item.block.type}`);
  }
});

test("kütüphane: kısa adlar, yinelenen yok, başlangıç paketleri var olan öğelere bağlı, her bölüm düzenlenebilir", async () => {
  const { NEXPRESS_STARTER_PAGE_PACKS } = await import("../src/starter-packs");
  assert.ok(NEXPRESS_DESIGN_LIBRARY.length >= 100);
  for (const item of NEXPRESS_DESIGN_LIBRARY) {
    assert.ok(item.name.length <= 26, `${item.id}: ad çok uzun (${item.name.length})`);
    assert.ok(!item.id.startsWith("lib_yf_"), "temaya bağlı eski kayıt");
  }
  // Başlangıç paketi `pick` ile bulunamayan kimlikte ilk öğeye düşer: pakette aynı blok iki kez olmamalı
  for (const pack of NEXPRESS_STARTER_PAGE_PACKS) {
    const json = pack.blocks.map((b) => JSON.stringify(b));
    assert.equal(new Set(json).size, json.length, `${pack.id}: yinelenen bölüm (bulunamayan kimlik?)`);
  }
  // Özel arayüzü olan blok türlerinin metin alanları denetçide karşılığı olan anahtarlardır
  const COVERED: Record<string, string[]> = {
    hero: ["badge", "title", "subtitle", "primaryCtaLabel", "primaryCtaHref", "secondaryCtaLabel", "secondaryCtaHref"],
    button_element: ["label", "href", "styleVariant", "align", "icon", "iconSide", "openInNewTab"],
    heading_element: ["text", "html", "level", "align"], heading: ["text", "html", "level", "align"],
    paragraph_element: ["text", "html"], paragraph: ["text", "html"],
  };
  const walk = (b: { type: string; props?: Record<string, unknown>; children?: unknown[] }, id: string): void => {
    const allowed = COVERED[b.type];
    if (allowed) for (const [k, v] of Object.entries(b.props ?? {})) if (typeof v === "string") assert.ok(allowed.includes(k), `${id}: ${b.type}.${k} denetçide düzenlenemez`);
    for (const c of (b.children ?? []) as never[]) walk(c, id);
  };
  for (const item of NEXPRESS_DESIGN_LIBRARY) walk(item.block as never, item.id);
});

test("kütüphane: `column` yalnızca `columns` (ya da sekme paneli) içinde; iç içe sütun editörde düzenlenemez", () => {
  const bad: string[] = [];
  const walk = (b: { type: string; children?: Array<{ type: string; children?: unknown[] }> }, parent: string, id: string): void => {
    if (b.type === "column" && parent !== "columns" && parent !== "tabs") bad.push(`${id}: ${parent} içinde column`);
    if (b.type === "columns" && (b.children ?? []).some((c) => c.type !== "column")) bad.push(`${id}: columns içinde column olmayan çocuk`);
    for (const c of b.children ?? []) walk(c as never, b.type, id);
  };
  for (const item of NEXPRESS_DESIGN_LIBRARY) walk(item.block as never, "root", item.id);
  assert.deepEqual(bad, []);
});

test("kütüphane: her Türkçe kategori dolu, geçerli ve akordeon/sekme tasarımları çeşitli", async () => {
  const { LIBRARY_CATEGORIES } = await import("@nexpress/core");
  const ids = new Set(LIBRARY_CATEGORIES.map((c) => c.id));
  for (const item of NEXPRESS_DESIGN_LIBRARY) assert.ok(ids.has(item.category), `${item.id}: geçersiz kategori ${item.category}`);
  for (const c of LIBRARY_CATEGORIES) {
    if (c.id === "custom") continue; // kullanıcı tasarımları sonradan eklenir
    const count = NEXPRESS_DESIGN_LIBRARY.filter((i) => i.category === c.id).length;
    assert.ok(count >= (c.id === "schema" || c.id === "template" ? 1 : 2), `${c.id}: en az 2 tasarım olmalı (${count})`);
  }
  const accStyles = new Set<string>();
  const tabStyles = new Set<string>();
  const walk = (b: { type: string; props?: Record<string, unknown>; children?: unknown[] }) => {
    if (b.type === "accordion") accStyles.add(String(b.props?.accordionStyle));
    if (b.type === "tabs") tabStyles.add(String(b.props?.tabStyle));
    for (const c of (b.children ?? []) as Array<typeof b>) walk(c);
  };
  for (const i of NEXPRESS_DESIGN_LIBRARY) walk(i.block as never);
  assert.ok(accStyles.size >= 6, `akordeon görünümü: ${[...accStyles]}`);
  assert.ok(tabStyles.size >= 6, `sekme görünümü: ${[...tabStyles]}`);
});
