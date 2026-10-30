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
