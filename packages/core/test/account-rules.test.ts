import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePassword, wouldRemoveLastAdmin, type AccountLite } from "../src/account-rules";

test("iyi parola kabul edilir (uzunluk esas, karakter türü zorunluluğu yok)", () => {
  assert.deepEqual(validatePassword("mavi kelebek sabah yürüyüşü", { email: "ayse@x.com" }), []);
  assert.deepEqual(validatePassword("abcdefghijklmn!X", { email: "z@x.com" }).includes("sequential"), true, "uzun ardışık dizi reddedilir");
});

test("kısa, yaygın, tekrarlı, ardışık ve hesapla ilgili parolalar reddedilir", () => {
  assert.ok(validatePassword("kisa1").includes("short"));
  assert.ok(validatePassword("password1234").includes("common"));
  assert.ok(validatePassword("aaaaaaaaaaaaaa").includes("repetitive"));
  assert.ok(validatePassword("abababababab").includes("repetitive"));
  assert.ok(validatePassword("1234567890123456").includes("sequential"));
  assert.ok(validatePassword("ayse-yilmaz-2026!", { email: "ayse.yilmaz@x.com", name: "Ayşe Yılmaz" }).length === 0, "e-posta yerel kısmı farklı yazım");
  assert.ok(validatePassword("benim-ayse.yilmaz-sifrem", { email: "ayse.yilmaz@x.com" }).includes("contains_identity"));
  assert.ok(validatePassword("x".repeat(129)).includes("long"));
});

const u = (id: string, role: AccountLite["role"], status: AccountLite["status"] = "active"): AccountLite => ({ id, role, status });

test("son etkin yönetici korunur", () => {
  const solo = [u("a", "admin"), u("e", "editor")];
  assert.equal(wouldRemoveLastAdmin(solo, "a", { role: "editor" }), true);
  assert.equal(wouldRemoveLastAdmin(solo, "a", { status: "disabled" }), true);
  assert.equal(wouldRemoveLastAdmin(solo, "e", { status: "disabled" }), false);
  const two = [u("a", "admin"), u("b", "admin")];
  assert.equal(wouldRemoveLastAdmin(two, "a", { role: "editor" }), false);
  const withDisabled = [u("a", "admin"), u("b", "admin", "disabled")];
  assert.equal(wouldRemoveLastAdmin(withDisabled, "a", { role: "editor" }), true, "devre dışı yönetici sayılmaz");
  assert.equal(wouldRemoveLastAdmin([u("e", "editor")], "e", { status: "disabled" }), false, "zaten yönetici yoksa tetiklenmez");
});
