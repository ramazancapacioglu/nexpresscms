import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Veritabanında duran üçüncü taraf sırları için AES-256-GCM (yalnızca Node).
 * Anahtar `SECRETS_KEY`, yoksa `AUTH_SECRET` değerinden türetilir.
 * Biçim: `enc:v1:<iv>:<tag>:<veri>` (base64).
 */
const PREFIX = "enc:v1:";

function key(): Buffer {
  const material = process.env.SECRETS_KEY ?? process.env.AUTH_SECRET ?? "nexpress-dev-only-secret";
  return createHash("sha256").update(material).digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  if (!plain || isEncryptedSecret(plain)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

/** Şifreli değilse (eski kayıt) olduğu gibi döner. */
export function decryptSecret(value: string): string {
  if (!isEncryptedSecret(value)) return value;
  const [iv, tag, data] = value.slice(PREFIX.length).split(":");
  if (!iv || !tag || !data) throw new Error("Şifreli sır biçimi geçersiz.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export function encryptRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, encryptSecret(v)]));
}

export function decryptRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, decryptSecret(v)]));
}
