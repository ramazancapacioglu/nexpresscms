import test from "node:test";
import assert from "node:assert/strict";
import type { BlockNode } from "@nexpress/core";
import { assignHeadingAnchors, buildAnchorNav, colorInPalette, parseTocEntries, sanitizeBlockColors, stripTags, tidyFaqBlocks } from "../src/page-tidy";

const palette = ["#0c644e", "#042646", "#0b4f8a"];
const node = (type: string, props: Record<string, unknown> = {}, extra: Partial<BlockNode> = {}): BlockNode => ({ id: Math.random().toString(36).slice(2), type: type as never, props, ...extra });

test("turuncu palet dışıdır; gri, beyaz ve palet renkleri serbest", () => {
  assert.equal(colorInPalette("#f76a0c", palette), false);
  assert.equal(colorInPalette("#ff8f00", palette), false);
  assert.equal(colorInPalette("#ffffff", palette), true);
  assert.equal(colorInPalette("#1a202c", palette), true);
  assert.equal(colorInPalette("#0c644e", palette), true);
  assert.equal(colorInPalette("rgba(238,248,247,0.28)", palette), true);
});

test("palet dışı renk bloktan ve satır içi HTML'den kalkar", () => {
  const blocks = [node("paragraph", { html: '<span style="color:#f76a0c;font-weight:700">x</span>' }, { style: { textColor: "#f76a0c", backgroundColor: "#ffffff" } })];
  const out = sanitizeBlockColors(blocks, palette);
  assert.equal(out.blocks[0]?.style?.textColor, undefined);
  assert.equal(out.blocks[0]?.style?.backgroundColor, "#ffffff");
  assert.ok(!String(out.blocks[0]?.props.html).includes("f76a0c"));
  assert.ok(out.removed >= 2);
});

test("SSS: soru düz metin, cevap süzülmüş HTML, tek açık", () => {
  const blocks = [node("faq_accordion", { items: [{ question: "<strong>Neden</strong> biz?", answer: "<p onclick=\"x()\">Çünkü <strong>hızlı</strong></p><script>1</script>" }] })];
  const out = tidyFaqBlocks(blocks);
  const item = (out.blocks[0]?.props.items as Array<{ question: string; answer: string }>)[0];
  assert.equal(item?.question, "Neden biz?");
  assert.ok(!item?.answer.includes("onclick") && !item?.answer.includes("script"));
  assert.ok(item?.answer.includes("<strong>hızlı</strong>"));
  assert.equal(out.blocks[0]?.props.exclusive, true);
  assert.equal(out.fixed, 1);
});

test("çapa menüsü hedefi olan bağlantılardan kurulur", () => {
  const section = (id: string) => node("section", {}, { style: { anchorId: id } });
  const link = (title: string, href: string) => node("info_box", { title, href });
  const out = buildAnchorNav([link("Restoran", "#restoran"), link("Otel", "#otel"), link("Market", "#market"), link("Yok", "#yok"), section("restoran"), section("otel"), section("market")]);
  assert.deepEqual((out?.props.items as Array<{ href: string }>).map((item) => item.href), ["#restoran", "#otel", "#market"]);
  assert.equal(out?.props.sticky, true);
  assert.equal(buildAnchorNav([link("A", "#a"), link("B", "#b"), section("a"), section("b")]), null);
});

test("çapa menüsü kart listesindeki (items) bağlantıları da bulur", () => {
  const cards = node("bento_features", { items: [{ title: "Restoran", href: "#restoran" }, { title: "Otel", href: "#otel" }, { title: "Servis", href: "#servis" }] });
  const sec = (id: string) => node("section", {}, { style: { anchorId: id } });
  const out = buildAnchorNav([cards, sec("restoran"), sec("otel"), sec("servis")]);
  assert.deepEqual((out?.props.items as Array<{ label: string }>).map((item) => item.label), ["Restoran", "Otel", "Servis"]);
});

test("içindekiler girdileri başlıklara çapa olur", () => {
  const html = '<nav class="kb-table-of-content-nav"><ul><li><a href="#kayitlar">Kayıtlar</a></li><li><a href="#uye-takip">Üye&nbsp;Takip</a></li></ul></nav>';
  const entries = parseTocEntries(html);
  assert.equal(entries.length, 2);
  const out = assignHeadingAnchors([node("heading", { text: "Kayıtlar" }), node("heading", { text: "Üye Takip" })], entries);
  assert.equal(out.blocks[0]?.style?.anchorId, "kayitlar");
  assert.deepEqual(out.items.map((item) => item.href), ["#kayitlar", "#uye-takip"]);
  assert.equal(stripTags("<b>A&nbsp;B</b>"), "A B");
});

import { cardifyPlainBlocks } from "../src/cardify";

test("düz metin sayfada uzun listeler kart olur, başlık + metin öbekleri kart bandına sarılır; ikinci çalıştırma değiştirmez", () => {
  const items = ["a", "b", "c", "d", "e"];
  const page = [
    node("section", {}, { children: [node("heading", { level: "h1", text: "Başlık" }), node("paragraph", { text: "giriş" }), node("heading", { level: "h2", text: "Bir" }), node("paragraph", { text: "x" }), node("list_element", { listType: "check", items }), node("heading", { level: "h2", text: "İki" }), node("paragraph", { text: "y" })] }),
  ];
  const first = cardifyPlainBlocks(page);
  assert.equal(first.lists, 1);
  assert.equal(first.groups, 2);
  const section = first.blocks[0]!.children!;
  assert.equal(section.length, 4);
  assert.equal(section[2]!.style?.cssClass?.includes("nx-text-card"), true);
  const again = cardifyPlainBlocks(first.blocks);
  assert.equal(JSON.stringify(again.blocks), JSON.stringify(first.blocks));
  assert.equal(again.groups, 0);
});

test("zengin sayfaya (kart, form, vitrin) öbek kartı eklenmez; yalnızca uzun liste kartlanır", () => {
  const page = [node("bento_features", {}), node("bento_features", {}), node("heading", { level: "h2", text: "A" }), node("paragraph", { text: "x" }), node("heading", { level: "h2", text: "B" }), node("paragraph", { text: "y" })];
  assert.equal(cardifyPlainBlocks(page).groups, 0);
});

import { explodeLineParagraphs } from "../src/cardify";

test("<br> ile satırlanmış paragraf: madde satırları liste, kısa kalın satır başlık, uzun cümle paragraf olur", () => {
  const html = "Giriş cümlesi burada.<br />• Birinci madde burada.<br />• İkinci madde burada.<br />• Üçüncü madde burada.<br /><strong>Alt başlık</strong><br />Bir önceki cümleye bağlı kısa satır.";
  const out = explodeLineParagraphs([node("paragraph", { html })]);
  assert.equal(out.exploded, 1);
  const types = out.blocks.map((b) => b.type);
  assert.deepEqual(types.slice(0, 1), ["list_element"]);
  assert.ok(types.includes("heading"));
  const list = out.blocks[0]!;
  assert.deepEqual((list.props as { items: string[] }).items.slice(0, 2), ["Giriş cümlesi burada.", "Birinci madde burada."]);
  assert.equal((explodeLineParagraphs([node("paragraph", { html: "Bir<br />iki" })])).exploded, 0);
});

import { normalizeBlockSpacing } from "../src/cardify";

test("zemini olmayan bloktaki dikey dolgu kalkar, bantta 28 px ile sınırlanır; yan dolgu ve ikinci çalıştırma değişmez", () => {
  const blocks = [
    node("section", {}, { style: { paddingTop: "50px", paddingBottom: "50px", paddingLeft: "20px", mobile: { paddingTop: "30px" } } }),
    node("section", {}, { style: { paddingTop: "60px", backgroundColor: "#1a202c", marginBottom: "40px" } }),
  ];
  const first = normalizeBlockSpacing(blocks);
  const [plain, band] = first.blocks as Array<{ style: Record<string, unknown> }>;
  assert.equal(plain!.style.paddingTop, undefined);
  assert.equal(plain!.style.paddingLeft, "20px");
  assert.equal((plain!.style.mobile as Record<string, unknown>).paddingTop, undefined);
  assert.equal(band!.style.paddingTop, "28px");
  assert.equal(band!.style.marginBottom, undefined);
  assert.equal(normalizeBlockSpacing(first.blocks).changed, 0);
});

import { revertNarrowExploded } from "../src/cardify";

test("dar sütundaki bölünmüş liste paragrafa döner; geniş sütundakine dokunulmaz", () => {
  const list = (id: string) => node("list_element", { listType: "cards", items: ["a.", "b.", "c."] }, { id } as never);
  const tree = [node("columns", {}, { children: [node("column", { widthPct: 33 }, { children: [list("p1_x0")] }), node("column", { widthPct: 67 }, { children: [list("p2_x0")] })] })];
  const out = revertNarrowExploded(tree);
  assert.equal(out.reverted, 1);
  const cols = out.blocks[0]!.children!;
  assert.equal(cols[0]!.children![0]!.type, "paragraph");
  assert.equal(cols[1]!.children![0]!.type, "list_element");
});
