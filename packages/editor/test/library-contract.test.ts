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
  assert.ok(modern.filter((i) => i.category === "forms").length >= 8, "form tasarımı sayısı");
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
