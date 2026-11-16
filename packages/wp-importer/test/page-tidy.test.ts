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
