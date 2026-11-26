import test from "node:test";
import assert from "node:assert/strict";
import { INDEXABLE_ROBOTS, metaDescription, robotsMeta, titleWithSite } from "../src/lib/robots-meta";

test("indekslenebilir sayfa içerik sayfalarıyla aynı robots yönergesini taşır", () => {
  assert.deepEqual(robotsMeta(true), INDEXABLE_ROBOTS);
  assert.deepEqual(robotsMeta(true), { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 });
  assert.deepEqual(robotsMeta(false), { index: false, follow: true });
});

test("kısa başlığa site adı eklenir, uzun ya da site adını taşıyan başlığa eklenmez", () => {
  assert.equal(titleWithSite("Makaleler", "Akınsoft İzmir Ana Bayi"), "Makaleler | Akınsoft İzmir Ana Bayi");
  assert.equal(titleWithSite("Sorular", "Akınsoft İzmir Ana Bayi"), "Sorular | Akınsoft İzmir Ana Bayi");
  assert.equal(titleWithSite("Makaleler — Akınsoft İzmir Ana Bayi", "Akınsoft İzmir Ana Bayi"), "Makaleler — Akınsoft İzmir Ana Bayi");
  assert.equal(titleWithSite("Wolvox ERP Nedir ve Kimler İçin Uygundur?", "Akınsoft"), "Wolvox ERP Nedir ve Kimler İçin Uygundur?");
  assert.equal(titleWithSite("Makaleler", ""), "Makaleler");
  assert.equal(titleWithSite("Makaleler", "Çok Uzun Bir Site Adı Burada Yazılı Olarak Durmaktadır Gerçekten"), "Makaleler", "65'i aşarsa eklenmez");
});

test("uzun açıklama kelime sınırında 160'a iner, kısa olan aynen kalır", () => {
  const long = "Akınsoft ".repeat(40);
  const out = metaDescription(long);
  assert.ok(out.length <= 160);
  assert.ok(out.endsWith("…"));
  assert.doesNotMatch(out, /Akıns…$/);
  assert.equal(metaDescription("Kısa açıklama."), "Kısa açıklama.");
});
