import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, DEFAULT_FORM_FIELDS, resolveFormFields, spamReasons, toCsv, validateSubmission } from "../src";

test("alan tanımı: geçersiz ad/tür düzeltilir, yinelenen atılır, boşsa varsayılan", () => {
  assert.equal(resolveFormFields(undefined), DEFAULT_FORM_FIELDS);
  assert.equal(resolveFormFields([]), DEFAULT_FORM_FIELDS);
  const f = resolveFormFields([{ name: "ad", label: "Ad", type: "text", required: true }, { name: "ad", label: "Yinelenen" }, { name: "Bozuk Ad!", label: "", type: "zip" }, null]);
  assert.deepEqual(f.map((x) => [x.name, x.type, x.required]), [["ad", "text", true], ["alan_2", "text", false], ["alan_3", "text", false]]);
  assert.equal(resolveFormFields(Array.from({ length: 200 }, (_, i) => ({ name: `a${i}` }))).length, 60);
});

test("doğrulama: zorunlu, e-posta, telefon, sayı, uzunluk; fazlalık alan yok sayılır", () => {
  const defs = resolveFormFields([{ name: "ad", label: "Ad", required: true }, { name: "e", label: "E", type: "email", required: true }, { name: "t", label: "T", type: "tel" }, { name: "n", label: "N", type: "number" }]);
  assert.deepEqual(validateSubmission(defs, { ad: " Ayşe ", e: "a@x.test", gizli: "yok sayılır" }), { ok: true, values: [{ name: "ad", label: "Ad", type: "text", value: "Ayşe" }, { name: "e", label: "E", type: "email", value: "a@x.test" }] });
  const bad = validateSubmission(defs, { e: "bozuk", t: "abc", n: "x" });
  assert.ok(!bad.ok);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["ad", "e", "n", "t"]);
  assert.ok(!validateSubmission(defs, { ad: "x".repeat(501), e: "a@x.test" }).ok);
  assert.equal((validateSubmission(defs, { ad: "a\u0000b", e: "a@x.test" }) as { values: Array<{ value: string }> }).values[0]!.value, "ab");
});

test("spam sezgisi ve CSV güvenliği", () => {
  assert.deepEqual(spamReasons([{ value: "merhaba" }]), []);
  assert.match(spamReasons([{ value: "http://a.t https://b.t www.c.t" }]).join(), /3 bağlantı/);
  assert.match(spamReasons([{ value: "[url=http://x]y[/url]" }]).join(), /işaretleme/);
  assert.equal(csvCell("düz"), "düz");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.ok(toCsv([["a", "b"], ["1", "2"]]).startsWith("﻿a,b\r\n1,2"));
});
