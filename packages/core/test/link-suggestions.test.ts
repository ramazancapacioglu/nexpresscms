import assert from "node:assert/strict";
import test from "node:test";
import { applyLinkToBlocks, foldStable, linkedHrefsOf, phrasesFor, suggestLinksForText } from "../src/link-suggestions";
import type { BlockNode } from "../src/types";

const candidates = [
  { id: "a", title: "E-Fatura | Muhasebe Programı", href: "/e-fatura", importance: 8 },
  { id: "b", title: "Akınsoft Wolvox Restoran Yönetimi", href: "/restoran", importance: 6 },
  { id: "c", title: "Hakkımızda", href: "/hakkimizda" },
  { id: "d", title: "Genel Muhasebe Programı", href: "/genel-muhasebe" },
];

test("katlama: Türkçe harfler duyarsız, uzunluk korunur", () => {
  assert.equal(foldStable("İSTANBUL Işık ÇAĞRI"), "istanbul isik cagri");
  assert.equal(foldStable("e-Fatura").length, "e-Fatura".length);
});

test("ifade türetme: marka ve genel sözcükler atılmış kısa biçim üretilir; tek genel sözcük elenir", () => {
  const phrases = phrasesFor(candidates[1]!);
  assert.ok(phrases.includes("Akınsoft Wolvox Restoran Yönetimi"));
  assert.ok(phrases.includes("Wolvox Restoran"));
  assert.deepEqual(phrasesFor({ id: "x", title: "Akınsoft Programı", href: "/x" }), []);
});

test("öneri: çekim ekli eşleşme bulunur, bağlı sayfa ve bağlantı metni önerilmez, çakışma tekilleşir", () => {
  const text = "Müşterilerimiz e-Faturayı ve Wolvox Restoran çözümünü kullanır. Genel muhasebe programını inceleyin. [Hakkımızda](/hakkimizda) sayfasına bakın. Hakkımızda ayrıca.";
  const found = suggestLinksForText(text, candidates, { linkedHrefs: linkedHrefsOf(text) });
  const byId = Object.fromEntries(found.map((f) => [f.candidateId, f]));
  assert.equal(byId.a?.matchedText, "e-Faturayı");
  assert.equal(byId.b?.matchedText, "Wolvox Restoran");
  assert.equal(byId.d?.matchedText, "Genel muhasebe programını");
  assert.equal(byId.c, undefined, "zaten bağlı sayfa önerilmez");
  assert.ok(found[0]!.score >= found[found.length - 1]!.score);
  assert.equal(suggestLinksForText("Ortak bir metin yok.", candidates).length, 0);
});

test("uygulama: ilk uygun geçiş bağlanır, var olan bağlantı ve etiket içine girilmez, bulunamazsa değişmez", () => {
  const blocks = [
    { id: "s", type: "section", props: {}, children: [
      { id: "p1", type: "paragraph", props: { html: '<p><a href="/x">e-Fatura</a> ve <strong>e-Fatura</strong> kullanın</p>' } },
      { id: "p2", type: "paragraph", props: { html: "<p>Başka metin</p>" } },
    ] },
  ] as unknown as BlockNode[];
  const r = applyLinkToBlocks(blocks, "e-Fatura", "/e-fatura");
  assert.equal(r.changed, true);
  const html = (r.blocks[0]!.children![0]!.props as { html: string }).html;
  assert.equal(html, '<p><a href="/x">e-Fatura</a> ve <strong><a href="/e-fatura">e-Fatura</a></strong> kullanın</p>');
  assert.equal((blocks[0]!.children![0]!.props as { html: string }).html.includes('href="/e-fatura"'), false, "girdi değişmez");
  assert.equal(applyLinkToBlocks(blocks, "olmayan ifade", "/y").changed, false);
});
