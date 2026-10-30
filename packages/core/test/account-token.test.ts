import test from "node:test";
import assert from "node:assert/strict";
import { createAccountToken, isTokenCurrent, verifyAccountToken } from "../src/account-token";

const S = "gizli-anahtar-0123456789-0123456789";
const NOW = Date.UTC(2026, 9, 30);
const user = { id: "11111111-2222-3333-4444-555555555555", passwordChangedAt: new Date(NOW - 86_400_000) };

test("belirteç: geçerli, süre dolan, başka site/anahtar, kurcalanmış ve biçim dışı", () => {
  const t = createAccountToken(S, "default", "reset", user, NOW);
  assert.deepEqual(verifyAccountToken(S, "default", t, NOW + 30 * 60_000), { purpose: "reset", userId: user.id, pwdMs: user.passwordChangedAt.getTime() });
  assert.equal(verifyAccountToken(S, "default", t, NOW + 61 * 60_000), null, "sıfırlama 1 saat");
  assert.equal(verifyAccountToken(S, "baska", t, NOW), null, "başka kiracı");
  assert.equal(verifyAccountToken("baska-anahtar", "default", t, NOW), null);
  const [p, id, pwd, exp, mac] = t.split(".");
  assert.equal(verifyAccountToken(S, "default", [p, "99999999-aaaa", pwd, exp, mac].join("."), NOW), null, "başka kullanıcı");
  assert.equal(verifyAccountToken(S, "default", [p, id, pwd, Number(exp) + 86400, mac].join("."), NOW), null, "süre uzatma");
  assert.equal(verifyAccountToken(S, "default", ["invite", id, pwd, exp, mac].join("."), NOW), null, "amaç değiştirilemez");
  for (const bad of ["", "a.b.c", `${t}.x`, "reset.x.1.2.3", "admin.${id}.1.2.3"]) assert.equal(verifyAccountToken(S, "default", bad, NOW), null, bad);
});

test("davet 7 gün, sıfırlama 1 saat; 7 günden uzun omur uydurulamaz", () => {
  const inv = createAccountToken(S, "default", "invite", user, NOW);
  assert.ok(verifyAccountToken(S, "default", inv, NOW + 6 * 86_400_000));
  assert.equal(verifyAccountToken(S, "default", inv, NOW + 8 * 86_400_000), null);
});

test("tek kullanım: parola değişince (zaman damgası) aynı belirteç bayatlar; parolası hiç olmayan hesap da desteklenir", () => {
  const t = createAccountToken(S, "default", "reset", user, NOW);
  const parsed = verifyAccountToken(S, "default", t, NOW)!;
  assert.equal(isTokenCurrent(parsed, user), true);
  assert.equal(isTokenCurrent(parsed, { passwordChangedAt: new Date(NOW) }), false, "parola değişti");
  const none = createAccountToken(S, "default", "invite", { id: user.id, passwordChangedAt: null }, NOW);
  assert.equal(isTokenCurrent(verifyAccountToken(S, "default", none, NOW)!, { passwordChangedAt: null }), true);
  assert.throws(() => createAccountToken(S, "default", "reset", { id: "../x", passwordChangedAt: null }, NOW));
});
