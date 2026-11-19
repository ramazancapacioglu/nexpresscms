import assert from "node:assert/strict";
import test from "node:test";
import { rankRelated, titleTerms } from "../src/related-content";

const hugin = { id: "a", title: "Akınsoft Hugin ÖKC Entegrasyonu", tags: ["okc"] };
const pool = [
  { id: "b", title: "Beko ÖKC Entegrasyon Çözümleri", tags: ["okc"] },
  { id: "c", title: "Ingenico ÖKC Entegrasyon Çözümleri", tags: [] as string[] },
  { id: "d", title: "Genel Muhasebe Programı", tags: ["muhasebe"] },
  { id: "e", title: "Restoran Yönetimi", categories: ["sektor"] },
];

test("ilgili içerik: ortak etiket ve başlık sözcüğü öne çıkar, ilgisiz içerik elenir", () => {
  const out = rankRelated(hugin, [hugin, ...pool], 3);
  assert.deepEqual(out.map((x) => x.id).sort(), ["b", "c"]);
  assert.equal(out[0]!.id, "b", "etiket + sözcük ortak olan önce");
});

test("ilgili içerik: ek almış sözcükler eşleşir; kısa/yaygın sözcükler sayılmaz", () => {
  assert.ok(titleTerms("Muhasebe programları nedir").has("muhas"));
  assert.equal(titleTerms("Ne için ile").size, 0);
});

test("ilgili içerik: eşit puanlarda sıra hedefe göre değişir (hep aynı yazılar çıkmaz) ve sınır uygulanır", () => {
  const same = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, title: `Yazı ${i}`, categories: ["genel"] }));
  const first = rankRelated({ id: "x1", title: "A", categories: ["genel"] }, same, 3);
  const second = rankRelated({ id: "x2", title: "A", categories: ["genel"] }, same, 3);
  assert.equal(first.length, 3);
  assert.notDeepEqual(first.map((x) => x.id), second.map((x) => x.id));
});
