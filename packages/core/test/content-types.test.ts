import assert from "node:assert/strict";
import test from "node:test";
import { displayFields, droppedArchives, findTypeByArchiveSlug, isValidTypeId, readFieldValues, resolveSiteSettings, sanitizeContentTypes, sanitizeFieldValues, writeFieldValues } from "../src/index";

const defs = sanitizeContentTypes([
  {
    id: "referans",
    label: "Referans",
    labelPlural: "Referanslar",
    schemaType: "Organization",
    fields: [
      { key: "musteri", label: "Müşteri", kind: "text", required: true },
      { key: "sektor", label: "Sektör", kind: "select", options: ["Perakende", "Sağlık"] },
      { key: "yil", label: "Yıl", kind: "number" },
      { key: "tarih", label: "Proje tarihi", kind: "date" },
      { key: "site", label: "Web sitesi", kind: "url" },
      { key: "mail", label: "E-posta", kind: "email", show: false },
      { key: "aktif", label: "Devam ediyor", kind: "boolean" },
      { key: "logo", label: "Logo", kind: "image" },
    ],
  },
]);
const type = defs[0]!;

test("tür tanımı temizlenir: geçersiz kimlik, yerleşik ad, tekrar ve bozuk alan atılır", () => {
  assert.equal(isValidTypeId("referans"), true);
  assert.equal(isValidTypeId("page"), false);
  assert.equal(isValidTypeId("Referans"), false);
  assert.equal(isValidTypeId("1a"), false);
  const out = sanitizeContentTypes([
    { id: "page", label: "Sayfa" },
    { id: "etkinlik", label: "Etkinlik", fields: [{ key: "Bad Key", label: "x", kind: "text" }, { key: "ok", label: "Tamam", kind: "text" }, { key: "ok", label: "Çift", kind: "text" }, { key: "liste", label: "Liste", kind: "select", options: [] }, { key: "x", label: "X", kind: "bilinmeyen" }] },
    { id: "etkinlik", label: "Yinelenen" },
    "bozuk",
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0]!.fields.map((f) => f.key), ["ok"]);
  assert.equal(out[0]!.labelPlural, "Etkinlik");
  assert.equal(out[0]!.schemaType, "WebPage");
  assert.deepEqual(sanitizeContentTypes(null), []);
});

test("değer doğrulama: tür dönüşümü, zorunlu alan, liste, bağlantı ve görsel güvenliği", () => {
  const ok = sanitizeFieldValues(type, { musteri: "  Acme  Ltd ", sektor: "Sağlık", yil: "2024", tarih: "2025-03-09", site: "https://acme.test/x", mail: "a@acme.test", aktif: "on", logo: "/media/med_abcdef123456?w=10&h=10", bilinmeyen: "x" });
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.values, { musteri: "Acme Ltd", sektor: "Sağlık", yil: 2024, tarih: "2025-03-09", site: "https://acme.test/x", mail: "a@acme.test", aktif: true, logo: "/media/med_abcdef123456?w=10&h=10" });
  const bad = sanitizeFieldValues(type, { sektor: "Yok", yil: "abc", tarih: "9 Mart", site: "javascript:alert(1)", mail: "x", logo: "http://x.test/a.png" });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["logo", "mail", "musteri", "sektor", "site", "tarih", "yil"]);
  assert.deepEqual(bad.values, {}, "geçersiz değer yazılmaz");
});

test("okuma/yazma ve ziyaretçi gösterimi: gizli ve boş alanlar çıkar, biçimler uygulanır", () => {
  const attrs = writeFieldValues({ canvas: true }, { musteri: "Acme", yil: 1500, tarih: "2025-03-09", aktif: false, mail: "a@acme.test", site: "/hakkimizda" });
  assert.equal((attrs._fields as Record<string, unknown>).musteri, "Acme");
  assert.deepEqual(readFieldValues(type, attrs).yil, 1500);
  const shown = displayFields(type, attrs, "tr");
  assert.deepEqual(shown.map((f) => f.key), ["musteri", "yil", "tarih", "site", "aktif"], "mail gizli");
  assert.equal(shown.find((f) => f.key === "aktif")!.text, "Hayır");
  assert.match(shown.find((f) => f.key === "tarih")!.text, /2025/);
  assert.equal(shown.find((f) => f.key === "site")!.href, "/hakkimizda");
  assert.equal("_fields" in writeFieldValues(attrs, {}), false);
  assert.deepEqual(readFieldValues(undefined, attrs), {});
});

test("ayar çözümünde türler korunur; yoksa boş", () => {
  assert.equal(resolveSiteSettings({ general: { contentTypes: defs } }).general.contentTypes?.length, 1);
  assert.deepEqual(resolveSiteSettings({}).general.contentTypes, []);
});

test("arşiv: eski kayıtta kapalı; adres çoğul addan türer; sistem rotası ve çift adres reddedilir", () => {
  assert.equal(defs[0]!.archive, undefined, "arşiv alanı olmayan tür kapalı kalır");
  const types = sanitizeContentTypes([
    { id: "etkinlik", label: "Etkinlik", labelPlural: "Etkinlikler Takvimi", archive: true, fields: [] },
    { id: "ekip", label: "Ekip", labelPlural: "Ekibimiz", archive: true, archiveSlug: "  Ekip Üyeleri ", archiveIntro: "  Bizi tanıyın  ", fields: [] },
    { id: "magaza_x", label: "Mağaza", labelPlural: "Mağaza", archive: true, fields: [] },
    { id: "kopya", label: "Kopya", labelPlural: "Ekibimiz", archive: true, archiveSlug: "ekip-uyeleri", fields: [] },
    { id: "kapali", label: "Kapalı", labelPlural: "Kapalılar", fields: [] },
  ]);
  const by = (id: string) => types.find((t) => t.id === id)!;
  assert.equal(by("etkinlik").archiveSlug, "etkinlikler-takvimi");
  assert.equal(by("ekip").archiveSlug, "ekip-uyeleri");
  assert.equal(by("ekip").archiveIntro, "Bizi tanıyın");
  assert.equal(by("magaza_x").archive, undefined, "sistem rotası (magaza) arşiv olamaz");
  assert.equal(by("kopya").archiveSlug, "ekibimiz", "açık adres doluysa çoğul addan türeyene düşer");
  assert.equal(by("kapali").archive, undefined);
  assert.equal(findTypeByArchiveSlug(types, "ekip-uyeleri")?.id, "ekip");
  assert.equal(findTypeByArchiveSlug(types, "kapalilar"), undefined);
  assert.deepEqual(droppedArchives([{ id: "magaza_x", label: "Mağaza", archive: true }, { id: "ekip", archive: true }], types), ["Mağaza"]);
});
