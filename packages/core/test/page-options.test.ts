import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PAGE_OPTIONS, pageMaxWidth, readPageOptions, writePageOptions } from "../src/index";

test("kayıt yoksa varsayılan; bozuk değerler varsayılana düşer", () => {
  assert.deepEqual(readPageOptions(undefined), DEFAULT_PAGE_OPTIONS);
  assert.deepEqual(readPageOptions({ _page: { header: "evil", width: 7, hideTitle: "yes", sidebar: "top" } }), DEFAULT_PAGE_OPTIONS);
});

test("yalnızca varsayılandan farklı değerler yazılır; hepsi varsayılansa anahtar kalkar", () => {
  const out = writePageOptions({ canvas: true }, { ...DEFAULT_PAGE_OPTIONS, header: "transparent", headerTone: "dark", width: "full", flush: true });
  assert.deepEqual(out._page, { header: "transparent", headerTone: "dark", width: "full", flush: true });
  assert.equal(out.canvas, true);
  const cleared = writePageOptions(out, DEFAULT_PAGE_OPTIONS);
  assert.equal("_page" in cleared, false);
  assert.equal(cleared.canvas, true);
});

test("şeffaf olmayan header'da ton saklanmaz; yazılanlar geri okunur", () => {
  const out = writePageOptions({}, { ...DEFAULT_PAGE_OPTIONS, headerTone: "dark", footer: "hidden" });
  assert.deepEqual(out._page, { footer: "hidden" });
  assert.equal(readPageOptions(out).footer, "hidden");
});

test("eski _sidebar anahtarı okunur; yeni kenar çubuğu seçimi eskisinin yerine geçer", () => {
  assert.equal(readPageOptions({ _sidebar: { position: "left" } }).sidebar, "left");
  const out = writePageOptions({ _sidebar: { position: "left" } }, { ...DEFAULT_PAGE_OPTIONS, sidebar: "none" });
  assert.equal("_sidebar" in out, false);
  assert.equal(readPageOptions(out).sidebar, "none");
});

test("genişlik değerleri", () => {
  assert.equal(pageMaxWidth("default"), undefined);
  assert.equal(pageMaxWidth("narrow"), "760px");
  assert.equal(pageMaxWidth("full"), "100%");
});
