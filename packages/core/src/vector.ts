/**
 * Vektör yardımcıları ve yerel (anahtarsız) gömme: öznitelik karma + TF ağırlığı.
 * Anlamsal değil sözcüksel yakınlık ölçer; bir gömme servisi yapılandırılana dek çalışan
 * temel hattır ve vektörler sağlayıcı kimliğiyle etiketlenir (modeller karıştırılmaz).
 */
export const EMBEDDING_DIMENSIONS = 1536;
export const LOCAL_EMBEDDING_MODEL = `local:hash-v1:${EMBEDDING_DIMENSIONS}`;

export function normalizeVector(v: Float32Array): Float32Array {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i]! / norm;
  return out;
}

/** Birim vektörler için kosinüs = iç çarpım; uzunluklar farklıysa 0. */
export function dot(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

/** Float32 vektörü `f32:<base64>` olarak kodlar (JSON dizisine göre ~2,5 kat küçük). */
export function encodeVector(v: Float32Array): string {
  const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `f32:${btoa(bin)}`;
}

export function decodeVector(text: string): Float32Array {
  if (!text.startsWith("f32:")) throw new Error("Bilinmeyen vektör biçimi.");
  const bin = atob(text.slice(4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Küçük harfe indirger, Türkçe aksanları açar, harf/rakam dizilerine böler. */
export function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Sabit 32-bit karma (FNV-1a), deterministik ve ortamdan bağımsız. */
function hash32(s: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Öznitelikler: tekil sözcük, ilk 5 harf "kök" (Türkçe ekler için kaba çözüm) ve ardışık ikili.
 * İşaretli karma (+/-) çakışma yanlılığını azaltır; logaritmik TF ağırlığı uygulanır.
 */
export function hashEmbed(text: string, dims = EMBEDDING_DIMENSIONS): Float32Array {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  const add = (feature: string, weight: number) => counts.set(feature, (counts.get(feature) ?? 0) + weight);
  tokens.forEach((t, i) => {
    add(`w:${t}`, 1);
    if (t.length > 5) add(`s:${t.slice(0, 5)}`, 0.6);
    if (i + 1 < tokens.length) add(`b:${t}_${tokens[i + 1]}`, 0.7);
  });
  const v = new Float32Array(dims);
  for (const [feature, count] of counts) {
    const weight = 1 + Math.log(count);
    const slot = hash32(feature, 0) % dims;
    const sign = hash32(feature, 1) & 1 ? 1 : -1;
    v[slot] = v[slot]! + sign * weight;
  }
  return normalizeVector(v);
}
