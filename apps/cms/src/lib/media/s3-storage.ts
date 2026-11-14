import "server-only";
import { resolveObjectStorageConfig, signObjectRequest, type ObjectStorageConfig } from "@nexpress/core/object-storage";

/** Fetch gövdesi `ArrayBuffer` ister; `Uint8Array` dilim paylaşımlı tampon olabiliyor. */
function asArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  return copy;
}

/** S3 ayarı yoksa çağıran yerel diske düşmez; yanlışlıkla iki depoya yazılmasın. */
function config(): ObjectStorageConfig {
  const resolved = resolveObjectStorageConfig(process.env);
  if (!resolved) throw new Error("MEDIA_DRIVER=s3 ama S3 ayarı eksik veya geçersiz.");
  return resolved;
}

async function send(method: "GET" | "PUT" | "DELETE", input: { key?: string; query?: Record<string, string>; body?: Uint8Array; extraHeaders?: Record<string, string> }): Promise<Response> {
  const signed = signObjectRequest(config(), { method, ...input });
  const body = input.body ? asArrayBuffer(input.body) : undefined;
  const res = await fetch(signed.url, {
    method,
    headers: signed.headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status >= 300 && res.status < 400) {
    await res.body?.cancel();
    throw new Error("Nesne deposu yönlendirmesi kabul edilmez.");
  }
  return res;
}

export async function putObject(key: string, data: Uint8Array, exclusive = false): Promise<void> {
  const res = await send("PUT", { key, body: data, ...(exclusive ? { extraHeaders: { "if-none-match": "*" } } : {}) });
  if (res.status === 412) {
    await res.body?.cancel();
    throw new Error("Özgün dosya zaten var.");
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`Nesne deposu yazamadı (HTTP ${res.status}).`);
  }
  await res.body?.cancel();
}

export async function getObject(key: string): Promise<Buffer | null> {
  const res = await send("GET", { key });
  if (res.status === 404) {
    await res.body?.cancel();
    return null;
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`Nesne deposu okunamadı (HTTP ${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function listedKeys(xml: string): { keys: string[]; token?: string; truncated: boolean } {
  const keys = [...xml.matchAll(/<Key>([^<]*)<\/Key>/g)].map((match) => match[1] ?? "").filter(Boolean);
  const token = xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1];
  return { keys, token, truncated: /<IsTruncated>true<\/IsTruncated>/.test(xml) };
}

/** Önek altındaki nesneleri siler. Başka kiracının önekine çıkılmaz (çağıran anahtarı kurar). */
export async function deletePrefix(prefix: string): Promise<void> {
  let token: string | undefined;
  for (let page = 0; page < 20; page++) {
    const query: Record<string, string> = { "list-type": "2", prefix, "max-keys": "1000" };
    if (token) query["continuation-token"] = token;
    const res = await send("GET", { query });
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`Nesne listesi alınamadı (HTTP ${res.status}).`);
    }
    const parsed = listedKeys(await res.text());
    for (const key of parsed.keys) {
      if (!key.startsWith(prefix)) continue;
      const gone = await send("DELETE", { key });
      await gone.body?.cancel();
      if (!gone.ok && gone.status !== 404) throw new Error(`Nesne silinemedi (HTTP ${gone.status}).`);
    }
    if (!parsed.truncated || !parsed.token) return;
    token = parsed.token;
  }
}
