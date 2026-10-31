import test from "node:test";
import assert from "node:assert/strict";
import { base32Decode, base32Encode, consumeRecoveryCode, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUri, totpCode, verifyTotp } from "../src/totp";

// RFC 6238 ek B: SHA-1, gizli "12345678901234567890", 8 hane -> son 6 hane
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));
const at = (sec: number) => Math.floor(sec / 30);

test("RFC 6238 SHA-1 test vektörleri (6 haneli kesit)", () => {
  assert.equal(totpCode(RFC_SECRET, at(59)), "287082");
  assert.equal(totpCode(RFC_SECRET, at(1111111109)), "081804");
  assert.equal(totpCode(RFC_SECRET, at(1234567890)), "005924");
  assert.equal(totpCode(RFC_SECRET, at(2000000000)), "279037");
});

test("base32 gidiş-dönüş ve geçersiz karakter", () => {
  const raw = Buffer.from([1, 2, 3, 250, 251, 252, 0, 9]);
  assert.deepEqual(base32Decode(base32Encode(raw)), raw);
  assert.equal(generateTotpSecret().length, 32);
  assert.throws(() => base32Decode("ab!c"));
});

test("doğrulama: ±1 adım penceresi, biçim, yeniden kullanım", () => {
  const now = 1234567890 * 1000;
  const step = at(1234567890);
  assert.equal(verifyTotp(RFC_SECRET, "005924", now), step);
  assert.equal(verifyTotp(RFC_SECRET, "005 924", now), step, "boşluk toleransı");
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), now), step - 1, "önceki adım");
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), now), step + 1, "sonraki adım");
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 2), now), null, "pencere dışı");
  assert.equal(verifyTotp(RFC_SECRET, "00592", now), null);
  assert.equal(verifyTotp(RFC_SECRET, "abcdef", now), null);
  assert.equal(verifyTotp(RFC_SECRET, "005924", now, step), null, "aynı adım ikinci kez kullanılamaz");
  assert.equal(verifyTotp(RFC_SECRET, "005924", now, step - 1), step);
});

test("otpauth adresi", () => {
  const u = otpauthUri("ABC234", "a@b.co", "Site Adı");
  assert.ok(u.startsWith("otpauth://totp/Site%20Ad%C4%B1:a%40b.co?secret=ABC234&issuer=Site%20Ad%C4%B1"));
});

test("kurtarma kodları: biçim, tek kullanım, normalleştirme", () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  for (const c of codes) assert.match(c, /^[a-z2-9]{5}-[a-z2-9]{5}$/);
  const hashes = codes.map(hashRecoveryCode);
  const left = consumeRecoveryCode(hashes, codes[3]!.toUpperCase().replace("-", " "));
  assert.equal(left?.length, 9);
  assert.ok(!left!.includes(hashes[3]!));
  assert.equal(consumeRecoveryCode(left!, codes[3]!), null, "kullanılmış kod");
  assert.equal(consumeRecoveryCode(hashes, "yanlis-kodxx"), null);
});
