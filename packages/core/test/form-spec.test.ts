import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSubmissions, FORM_TEMPLATES, field, fieldSpan, normalizeAppearance, normalizeFormSpec, normalizeNotify, safeInternalPath, safeWebhookUrl, validateSubmission } from "../src";

test("zengin alan doğrulaması: seçenek, çoklu seçim, onay kutusu, puan, tarih, url, sayı sınırı", () => {
  const defs = normalizeFormSpec({
    fields: [
      { name: "s", label: "S", type: "select", required: true, options: ["A", "B"] },
      { name: "c", label: "C", type: "checkboxes", options: ["x", "y", "z"] },
      { name: "k", label: "K", type: "checkbox", required: true },
      { name: "p", label: "P", type: "rating", max: 5 },
      { name: "n", label: "N", type: "scale" },
      { name: "d", label: "D", type: "date" },
      { name: "u", label: "U", type: "url" },
      { name: "sayi", label: "Sayı", type: "number", min: 1, max: 10 },
      { name: "baslik", label: "Başlık", type: "heading" },
    ],
  }).fields;
  const ok = validateSubmission(defs, { s: "A", c: ["x", "z", "x"], k: "on", p: "4", n: "10", d: "2026-02-28", u: "https://a.co", sayi: "7", baslik: "yok sayılır" });
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.deepEqual(ok.values.find((v) => v.name === "c")?.values, ["x", "z"]);
    assert.equal(ok.values.find((v) => v.name === "k")?.value, "Evet");
    assert.ok(!ok.values.some((v) => v.name === "baslik"));
  }
  const bad = validateSubmission(defs, { s: "Z", c: ["q"], p: "6", n: "11", d: "2026-13-40", u: "javascript:alert(1)", sayi: "11" });
  assert.ok(!bad.ok);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["c", "d", "k", "n", "p", "s", "sayi", "u"]);
});

test("normalleştirme: içerik alanı zorunlu olmaz, seçeneksiz seçmeli düzelir, yinelenen veri alanı atılır, sınırlar", () => {
  const f = normalizeFormSpec({ fields: [{ name: "a", type: "heading", required: true }, { name: "b", type: "select" }, { name: "b", type: "text" }, { name: "t", type: "text", width: "half", options: ["x"] }] }).fields;
  assert.equal(f[0]!.required, false);
  assert.deepEqual(f[1]!.options, ["Seçenek 1", "Seçenek 2"]);
  assert.equal(f.length, 3);
  assert.deepEqual(f[2]!.options, []);
  assert.equal(f[2]!.width, "half");
  assert.equal(normalizeFormSpec({ fields: Array.from({ length: 200 }, (_, i) => ({ name: `a${i}` })) }).fields.length, 60);
  assert.equal(normalizeFormSpec({}).submitLabel, "Gönder");
});

test("yönlendirme yalnızca site içi yol; bildirim ayarı temizlenir", () => {
  assert.equal(safeInternalPath("/tesekkurler"), "/tesekkurler");
  for (const bad of ["//evil.com", "https://evil.com", "javascript:x", "/a b", ""]) assert.equal(safeInternalPath(bad), "");
  const fields = [field("1", "eposta", "E", "email"), field("2", "ad", "A", "text")];
  const n = normalizeNotify({ enabled: true, to: "a@x.co, bozuk, b@x.co\nA@x.co", autoReply: { enabled: true, emailField: "ad" } }, fields);
  assert.deepEqual(n.to, ["a@x.co", "b@x.co", "A@x.co"]);
  assert.equal(n.autoReply.emailField, "eposta"); // e-posta türü olmayan alan seçilemez
  assert.equal(normalizeNotify({ autoReply: { enabled: true } }, [field("2", "ad", "A", "text")]).autoReply.enabled, false);
});

test("saat, ayırıcı ve koşullu alan: gizli zorunlu alan hata vermez, yanlış bağ düşer", () => {
  const defs = normalizeFormSpec({
    fields: [
      { name: "once", type: "text", showWhen: { field: "kanal", equals: "E-posta" } },
      { name: "kanal", type: "radio", options: ["E-posta", "Telefon"], required: true },
      { name: "telefon", type: "tel", required: true, showWhen: { field: "kanal", equals: "Telefon" } },
      { name: "saat", type: "time", required: true },
      { name: "cizgi", type: "divider" },
      { name: "sonra", type: "text", showWhen: { field: "yok", equals: "A" } },
    ],
  }).fields;
  assert.equal(defs.find((f) => f.name === "sonra")?.showWhen, undefined);
  assert.ok(defs.find((f) => f.name === "telefon")?.showWhen);
  assert.equal(defs.find((f) => f.name === "once")?.showWhen, undefined);
  const mail = validateSubmission(defs, { kanal: "E-posta", saat: "09:30:00" });
  assert.ok(mail.ok);
  if (mail.ok) {
    assert.equal(mail.values.find((v) => v.name === "saat")?.value, "09:30");
    assert.ok(!mail.values.some((v) => v.name === "telefon" || v.name === "cizgi"));
  }
  const phone = validateSubmission(defs, { kanal: "Telefon", saat: "25:00" });
  assert.ok(!phone.ok);
  if (!phone.ok) assert.deepEqual(Object.keys(phone.errors).sort(), ["saat", "telefon"]);
});

test("görünüm: sütun, çeyrek genişlik ve adım sınırı", () => {
  assert.equal(fieldSpan("quarter", 4), 1);
  assert.equal(fieldSpan("half", 4), 2);
  assert.equal(fieldSpan("full", 2), 2);
  assert.equal(fieldSpan("quarter", 1), 1);
  const spec = normalizeFormSpec({
    appearance: { columns: 4, surface: "dialog", triggerLabel: "Hızlı iletişim", stepped: true, buttonAlign: "beside" },
    fields: [{ name: "a", type: "text", width: "quarter", step: 1 }, { name: "b", type: "text", step: 9 }, { name: "c", type: "text", width: "nope" }],
  });
  assert.equal(spec.appearance.columns, 4);
  assert.equal(spec.appearance.surface, "dialog");
  assert.equal(spec.appearance.triggerLabel, "Hızlı iletişim");
  assert.equal(spec.fields[0]!.width, "quarter");
  assert.equal(spec.fields[0]!.step, 1);
  assert.equal(spec.fields[1]!.step, undefined);
  assert.equal(spec.fields[2]!.width, "full");
  assert.equal(normalizeAppearance({ columns: 3 }).columns, 1);
  assert.equal(FORM_TEMPLATES.find((t) => t.id === "appointment")?.spec.appearance.stepped, true);
});

test("webhook yalnızca https ve kimliksiz adres tutar", () => {
  assert.equal(safeWebhookUrl("https://hooks.ornek.com/form"), "https://hooks.ornek.com/form");
  assert.equal(safeWebhookUrl("https://hooks.ornek.com:8443/form"), "");
  for (const bad of ["http://hooks.ornek.com/a", "https://user:pw@hooks.ornek.com/a", "https://127.0.0.1/a", "https://localhost/a", "javascript:alert(1)"]) {
    assert.equal(safeWebhookUrl(bad), "");
  }
  const n = normalizeNotify({ webhook: { enabled: true, url: "https://hooks.ornek.com/a" } });
  assert.equal(n.webhook.enabled, true);
  assert.equal(normalizeNotify({ webhook: { enabled: true, url: "http://hooks.ornek.com/a" } }).webhook.enabled, false);
});

test("şablonlar geçerli: ad benzersiz, doğrulamadan geçen örnek veri, otomatik yanıt alanı e-posta", () => {
  assert.ok(FORM_TEMPLATES.length >= 8);
  assert.equal(new Set(FORM_TEMPLATES.map((t) => t.id)).size, FORM_TEMPLATES.length);
  for (const t of FORM_TEMPLATES) {
    const names = t.spec.fields.map((x) => x.name);
    assert.equal(new Set(names).size, names.length, t.id);
    const r = validateSubmission(t.spec.fields, {});
    assert.ok(!r.ok === t.spec.fields.some((x) => x.required), t.id);
    if (t.notify.autoReply.enabled) assert.equal(t.spec.fields.find((x) => x.name === t.notify.autoReply.emailField)?.type, "email");
  }
});

test("analiz: durum, günlük seri, dağılım, NPS, puan ortalaması, e-posta alanı, anahtar kelime; spam dışlanır", () => {
  const defs = normalizeFormSpec({ fields: [
    { name: "nps", type: "scale", label: "NPS" }, { name: "puan", type: "rating", label: "Puan" },
    { name: "kaynak", type: "radio", label: "Kaynak", options: ["Google", "Tavsiye"] },
    { name: "e", type: "email", label: "E" }, { name: "m", type: "textarea", label: "M" },
  ] }).fields;
  const now = new Date("2026-03-10T12:00:00Z");
  const mk = (daysAgo: number, status: string, nps: string, puan: string, kaynak: string, e: string, m: string) => ({
    createdAt: new Date(now.getTime() - daysAgo * 86_400_000), status, pagePath: "/tr/iletisim",
    fields: [{ name: "nps", value: nps }, { name: "puan", value: puan }, { name: "kaynak", value: kaynak }, { name: "e", value: e }, { name: "m", value: m }],
  });
  const a = analyzeSubmissions(defs, [
    mk(0, "new", "10", "5", "Google", "a@gmail.com", "hızlı teslimat harika"),
    mk(1, "read", "9", "4", "Google", "b@gmail.com", "teslimat çok hızlı"),
    mk(2, "new", "3", "2", "Tavsiye", "c@firma.com", "geç geldi"),
    mk(2, "spam", "0", "1", "Google", "x@spam.com", "teslimat teslimat"),
  ], { now, days: 7 });
  assert.equal(a.total, 4);
  assert.equal(a.spamRate, 0.25);
  assert.equal(a.daily.length, 7);
  assert.equal(a.daily.at(-1)!.count, 1);
  assert.equal(a.daily.reduce((n, d) => n + d.count, 0), 3);
  const nps = a.fields.find((f) => f.name === "nps")!;
  assert.equal(nps.nps, 33); // 2 destekçi, 1 eleştirmen / 3
  assert.equal(a.fields.find((f) => f.name === "puan")!.average, 3.67);
  assert.deepEqual(a.fields.find((f) => f.name === "kaynak")!.distribution, [{ label: "Google", count: 2 }, { label: "Tavsiye", count: 1 }]);
  assert.deepEqual(a.fields.find((f) => f.name === "e")!.topDomains, [{ label: "gmail.com", count: 2 }, { label: "firma.com", count: 1 }]);
  assert.deepEqual(a.fields.find((f) => f.name === "m")!.topWords, [{ word: "hızlı", count: 2 }, { word: "teslimat", count: 2 }]);
  assert.equal(a.topPages[0]!.count, 3);
  assert.equal(analyzeSubmissions(defs, []).total, 0);
});
