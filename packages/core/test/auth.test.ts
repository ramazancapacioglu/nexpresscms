import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, safeEqual, verifyPassword } from "../src/password";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "../src/secret-box";
import { signSessionToken, verifySessionToken, type SessionPayload } from "../src/session-token";

const secret = "test-secret-with-enough-length-0123456789";
const payload = (exp: number): SessionPayload => ({ sub: "u1", siteId: "default", role: "admin", sv: 0, exp });

test("oturum belirteci imza ve süre doğrular", async () => {
  const now = 1_000_000;
  const token = await signSessionToken(payload(now + 60), secret);
  assert.deepEqual(await verifySessionToken(token, secret, now), payload(now + 60));
  assert.equal(await verifySessionToken(token, secret, now + 61), null, "süresi dolmuş");
  assert.equal(await verifySessionToken(token, "baska-secret", now), null, "yanlış anahtar");
});

test("oturum belirteci kurcalanınca reddedilir", async () => {
  const now = 1_000_000;
  const token = await signSessionToken(payload(now + 60), secret);
  const [body, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ ...payload(now + 60), role: "editor", sub: "u2" })).toString("base64url");
  assert.equal(await verifySessionToken(`${forged}.${sig}`, secret, now), null);
  assert.equal(await verifySessionToken(`${body}.`, secret, now), null);
  assert.equal(await verifySessionToken(undefined, secret, now), null);
  assert.equal(await verifySessionToken("çöp", secret, now), null);
});

test("oturum sürümü olmayan (eski) belirteç reddedilir", async () => {
  const now = 1_000_000;
  const legacy = await signSessionToken({ sub: "u1", siteId: "default", role: "admin", exp: now + 60 } as never, secret);
  assert.equal(await verifySessionToken(legacy, secret, now), null);
});

test("parola özeti doğrulanır, yanlış parola reddedilir", async () => {
  const stored = await hashPassword("Gizli-Parola-1");
  assert.match(stored, /^scrypt\$/);
  assert.equal(await verifyPassword("Gizli-Parola-1", stored), true);
  assert.equal(await verifyPassword("gizli-parola-1", stored), false);
  assert.equal(await verifyPassword("x", "bozuk"), false);
  assert.notEqual(stored, await hashPassword("Gizli-Parola-1"), "tuz her seferinde farklı");
});

test("safeEqual uzunluk farkında false döner", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

test("sır kutusu şifreler ve çözer; düz metni olduğu gibi bırakır", () => {
  const boxed = encryptSecret("api-secret");
  assert.equal(isEncryptedSecret(boxed), true);
  assert.notEqual(boxed, "api-secret");
  assert.equal(decryptSecret(boxed), "api-secret");
  assert.equal(decryptSecret("eski-düz-değer"), "eski-düz-değer");
  assert.equal(encryptSecret(boxed), boxed, "çift şifrelenmez");
  assert.throws(() => decryptSecret(boxed.slice(0, -4) + "AAAA"));
});

test("oturum belirteci: dört rol kabul edilir, bilinmeyen rol reddedilir", async () => {
  const now = 1_000_000;
  for (const role of ["admin", "editor", "author", "contributor"] as const) {
    const token = await signSessionToken({ ...payload(now + 60), role }, secret);
    assert.equal((await verifySessionToken(token, secret, now))?.role, role, role);
  }
  const bad = await signSessionToken({ ...payload(now + 60), role: "root" as never }, secret);
  assert.equal(await verifySessionToken(bad, secret, now), null);
});
