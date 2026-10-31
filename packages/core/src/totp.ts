import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * İki adımlı doğrulama (RFC 6238 TOTP, SHA-1, 6 hane, 30 sn) ve kurtarma kodları (yalnızca Node).
 * Gizli anahtar çağıran tarafından `secret-box` ile şifrelenip saklanır; kurtarma kodları yalnızca özetle saklanır.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("Geçersiz base32 karakteri.");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160 bit rastgele anahtar, base32. */
export const generateTotpSecret = (): string => base32Encode(randomBytes(20));

export function totpCode(secretBase32: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", base32Decode(secretBase32)).update(counter).digest();
  const o = h[h.length - 1]! & 15;
  const bin = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(bin % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export const currentStep = (now: number = Date.now()): number => Math.floor(now / 1000 / TOTP_STEP_SECONDS);

/**
 * Kodu ±1 adım (saat sapması) penceresinde doğrular; eşleşen adımı döner, yoksa null.
 * `lastUsedStep` verilirse o adım ve öncesi reddedilir (aynı kodun tekrar kullanımı).
 */
export function verifyTotp(secretBase32: string, input: string, now: number = Date.now(), lastUsedStep: number | null = null): number | null {
  const code = input.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const base = currentStep(now);
  let hit: number | null = null;
  for (const step of [base - 1, base, base + 1]) {
    const expected = Buffer.from(totpCode(secretBase32, step));
    // eşleşmede erken çıkma yok: süre kodun hangi adımda tuttuğunu sızdırmasın
    if (timingSafeEqual(expected, Buffer.from(code)) && (lastUsedStep === null || step > lastUsedStep)) hit = step;
  }
  return hit;
}

export function otpauthUri(secretBase32: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // okunmayan karakterler (i,l,o,0,1) yok
export const RECOVERY_CODE_COUNT = 10;

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const part = () => Array.from({ length: 5 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
  return Array.from({ length: count }, () => `${part()}-${part()}`);
}

const normalizeCode = (c: string) => c.toLowerCase().replace(/[^a-z0-9]/g, "");
export const hashRecoveryCode = (code: string): string => createHash("sha256").update(`nxrc|${normalizeCode(code)}`).digest("hex");

/** Kod listede varsa özeti çıkarılmış yeni liste döner (kod tek kullanımlıktır); yoksa null. */
export function consumeRecoveryCode(hashes: string[], input: string): string[] | null {
  const want = Buffer.from(hashRecoveryCode(input));
  let index = -1;
  hashes.forEach((h, i) => {
    const got = Buffer.from(h);
    if (got.length === want.length && timingSafeEqual(got, want)) index = i;
  });
  return index < 0 ? null : hashes.filter((_, i) => i !== index);
}
