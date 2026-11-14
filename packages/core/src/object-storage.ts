import { createHash, createHmac } from "node:crypto";

/**
 * S3 uyumlu nesne deposu için istek imzası (AWS SigV4, hizmet `s3`).
 * Ağ çağrısı uygulamadadır. `MEDIA_DRIVER` ve `BACKUP_COPY` boşsa bu modül devreye girmez.
 */

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export interface ObjectStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Özel uç (R2, MinIO) yol biçimini kullanır; AWS sanal barındırma kullanır. */
  forcePathStyle: boolean;
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/** Eksik, http (özel izin yok) veya geçersiz kovada `null`. Sır değerleri yalnızca dönen yapıda durur. */
export function resolveObjectStorageConfig(env: Record<string, string | undefined>): ObjectStorageConfig | null {
  const endpointRaw = (env.S3_ENDPOINT ?? "").trim().replace(/\/$/, "");
  const bucket = (env.S3_BUCKET ?? "").trim();
  const accessKeyId = (env.S3_ACCESS_KEY_ID ?? "").trim();
  const secretAccessKey = (env.S3_SECRET_ACCESS_KEY ?? "").trim();
  if (!endpointRaw || !bucket || !accessKeyId || !secretAccessKey) return null;
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(bucket) || bucket.includes("..")) return null;
  let url: URL;
  try {
    url = new URL(endpointRaw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const local = isLocalHost(host);
  if (local) {
    if (env.S3_ALLOW_PRIVATE !== "1") return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  } else if (url.protocol !== "https:") {
    return null;
  }
  const region = (env.S3_REGION ?? "auto").trim() || "auto";
  const amazon = /(^|\.)amazonaws\.com$/i.test(host);
  const forcePathStyle = env.S3_FORCE_PATH_STYLE === "1" || !amazon;
  return { endpoint: url.origin, region, bucket, accessKeyId, secretAccessKey, forcePathStyle };
}

export interface SignedObjectRequest {
  url: string;
  headers: Record<string, string>;
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function encodePath(path: string): string {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

/**
 * İmzalı S3 isteği. `key` boşsa kova kökü (liste). Gövde yoksa boş yük özeti imzalanır.
 */
export function signObjectRequest(
  cfg: ObjectStorageConfig,
  input: {
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    key?: string;
    query?: Record<string, string>;
    body?: Uint8Array;
    now?: Date;
    extraHeaders?: Record<string, string>;
  }
): SignedObjectRequest {
  const now = input.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = input.body ? sha256Hex(input.body) : EMPTY_SHA256;
  const endpoint = new URL(cfg.endpoint);
  const host = cfg.forcePathStyle ? endpoint.host : `${cfg.bucket}.${endpoint.host}`;
  const keyPath = input.key ? encodePath(input.key) : "";
  const canonicalUri = cfg.forcePathStyle ? `/${encodePath(cfg.bucket)}${keyPath ? `/${keyPath}` : ""}` : `/${keyPath}`;
  const query = input.query ?? {};
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${encodeURIComponent(name)}=${encodeURIComponent(query[name] ?? "")}`)
    .join("&");
  const lower: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  for (const [name, value] of Object.entries(input.extraHeaders ?? {})) {
    lower[name.toLowerCase()] = value.trim().replace(/\s+/g, " ");
  }
  const names = Object.keys(lower).sort();
  const canonicalHeaders = names.map((name) => `${name}:${lower[name]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonical = [input.method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonical)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), cfg.region), "s3"), "aws4_request");
  const signature = hmac(signingKey, stringToSign).toString("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const origin = cfg.forcePathStyle ? cfg.endpoint : `${endpoint.protocol}//${host}`;
  return {
    url: `${origin}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`,
    headers: { ...lower, Authorization: authorization },
  };
}
