import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { BlockNode, DesignTokens } from "@nexpress/core";
import { renderStudioCatalogBlock } from "../src/catalog-blocks";

const tokens = { colors: { border: "#ddd" }, geometry: { borderRadius: "8px" }, typography: {} } as unknown as DesignTokens;
const html = (props: Record<string, unknown>) => renderToStaticMarkup(renderStudioCatalogBlock({ id: "t", type: "data_table", props } as BlockNode, tokens)!);

test("tablo: caption, sütun başlıkları scope=col, kaydırılabilir bölge odaklanabilir", () => {
  const out = html({ title: "Fiyatlar", headers: ["Plan", "Ücret"], rows: [["Başlangıç", "0"], ["Pro", "499"]] });
  assert.ok(out.includes("<caption") && out.includes("Fiyatlar"));
  assert.equal((out.match(/scope="col"/g) ?? []).length, 2);
  assert.ok(out.includes('role="region"') && out.includes('tabindex="0"') && out.includes('aria-label="Fiyatlar"'));
});

test("tablo: ilk sütun satır başlığı, çizgili satır, sayısal hücre sağa hizalı", () => {
  const out = html({ headers: ["Plan", "Ücret"], rows: [["A", "10"], ["B", "20"], ["C", "30"]], firstColumnHeader: true, striped: true });
  assert.equal((out.match(/scope="row"/g) ?? []).length, 3);
  assert.equal((out.match(/bg-nx-subtle/g) ?? []).length, 1);
  assert.ok(out.includes("text-right"));
  assert.ok(!html({ headers: ["x"], rows: [["12"]], alignNumbers: false }).includes("text-right"));
});

test("tablo: başlıksız ve boş veri çökmez", () => {
  assert.ok(html({ rows: [["a"]] }).includes("<tbody>"));
  assert.doesNotThrow(() => html({}));
});
