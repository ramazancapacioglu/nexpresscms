import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import { isPublicIp } from "@nexpress/wp-importer";

export class FetchBlocked extends Error {}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

/** Bağlantı anında çözülen adresi doğrular (DNS yeniden bağlama saldırısına karşı doğrulanan adres kullanılır). */
function guardedLookup(hostname: string, options: dns.LookupOptions, cb: LookupCb) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err, "", 4);
    const list = (addrs as dns.LookupAddress[]).filter((a) => isPublicIp(a.address));
    if (list.length === 0) return cb(new FetchBlocked("Adres genel internete ait değil."), "", 4);
    if (options.all) return cb(null, list);
    cb(null, list[0]!.address, list[0]!.family);
  });
}

/**
 * Dış adresten (içe aktarma görselleri) güvenli indirme: yalnızca http/https ve varsayılan portlar, yalnızca genel IP'ler,
 * en çok 3 yönlendirme (her adım yeniden doğrulanır), zaman aşımı ve akış sırasında boyut sınırı.
 */
export async function fetchPublicFile(url: string, opts: { maxBytes: number; timeoutMs?: number; maxRedirects?: number }): Promise<{ data: Buffer; contentType: string }> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  let current = url;
  for (let hop = 0; hop <= (opts.maxRedirects ?? 3); hop++) {
    const u = new URL(current);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new FetchBlocked("Yalnızca http/https.");
    if (u.username || u.password) throw new FetchBlocked("Kimlik bilgili adresler desteklenmez.");
    if (u.port && u.port !== (u.protocol === "https:" ? "443" : "80")) throw new FetchBlocked("Yalnızca varsayılan bağlantı noktaları.");
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && !isPublicIp(host)) throw new FetchBlocked("Adres genel internete ait değil.");
    const res = await new Promise<{ status: number; location: string; type: string; data: Buffer }>((resolve, reject) => {
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.request(u, { method: "GET", lookup: guardedLookup as never, timeout: timeoutMs, headers: { "user-agent": "NexPress-Importer/1.0", accept: "image/*" } }, (r) => {
        const status = r.statusCode ?? 0;
        if (status >= 300 && status < 400) { r.resume(); return resolve({ status, location: String(r.headers.location ?? ""), type: "", data: Buffer.alloc(0) }); }
        if (status !== 200) { r.resume(); return reject(new Error(`HTTP ${status}`)); }
        const chunks: Buffer[] = [];
        let size = 0;
        r.on("data", (c: Buffer) => {
          size += c.length;
          if (size > opts.maxBytes) { req.destroy(new Error("Dosya boyut sınırını aşıyor.")); return; }
          chunks.push(c);
        });
        r.on("end", () => resolve({ status, location: "", type: String(r.headers["content-type"] ?? ""), data: Buffer.concat(chunks) }));
        r.on("error", reject);
      });
      req.on("timeout", () => req.destroy(new Error("Zaman aşımı.")));
      req.on("error", reject);
      req.end();
    });
    if (res.status >= 300) {
      if (!res.location) throw new Error("Geçersiz yönlendirme.");
      current = new URL(res.location, u).toString();
      continue;
    }
    return { data: res.data, contentType: res.type };
  }
  throw new Error("Çok fazla yönlendirme.");
}

function decodeBody(data: Buffer, encoding: string): Buffer {
  const enc = encoding.toLowerCase();
  if (enc.includes("gzip")) return zlib.gunzipSync(data);
  if (enc.includes("br")) return zlib.brotliDecompressSync(data);
  if (enc.includes("deflate")) return zlib.inflateSync(data);
  return data;
}

/** Yayımlanmış sayfa HTML'i. Görsel indirmeden ayrıdır: metin kabul edilir, sıkıştırma açılır, CSS/JS istenmez. */
export async function fetchPublicHtml(url: string, opts?: { maxBytes?: number; timeoutMs?: number }): Promise<string> {
  const maxBytes = opts?.maxBytes ?? 1_500_000;
  const timeoutMs = opts?.timeoutMs ?? 25_000;
  let current = url;
  for (let hop = 0; hop <= 3; hop++) {
    const u = new URL(current);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new FetchBlocked("Yalnızca http/https.");
    if (u.username || u.password) throw new FetchBlocked("Kimlik bilgili adresler desteklenmez.");
    if (u.port && u.port !== (u.protocol === "https:" ? "443" : "80")) throw new FetchBlocked("Yalnızca varsayılan bağlantı noktaları.");
    const host = u.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) && !isPublicIp(host)) throw new FetchBlocked("Adres genel internete ait değil.");
    const res = await new Promise<{ status: number; location: string; type: string; encoding: string; data: Buffer }>((resolve, reject) => {
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.request(u, { method: "GET", lookup: guardedLookup as never, timeout: timeoutMs, headers: { "user-agent": "NexPress-Importer/1.0", accept: "text/html,application/xhtml+xml", "accept-encoding": "gzip, deflate, br" } }, (r) => {
        const status = r.statusCode ?? 0;
        if (status >= 300 && status < 400) { r.resume(); return resolve({ status, location: String(r.headers.location ?? ""), type: "", encoding: "", data: Buffer.alloc(0) }); }
        if (status !== 200) { r.resume(); return reject(new Error(`HTTP ${status}`)); }
        const chunks: Buffer[] = [];
        let size = 0;
        r.on("data", (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) { req.destroy(new Error("Sayfa boyut sınırını aşıyor.")); return; }
          chunks.push(c);
        });
        r.on("end", () => resolve({ status, location: "", type: String(r.headers["content-type"] ?? ""), encoding: String(r.headers["content-encoding"] ?? ""), data: Buffer.concat(chunks) }));
        r.on("error", reject);
      });
      req.on("timeout", () => req.destroy(new Error("Zaman aşımı.")));
      req.on("error", reject);
      req.end();
    });
    if (res.status >= 300) {
      if (!res.location) throw new Error("Geçersiz yönlendirme.");
      current = new URL(res.location, u).toString();
      continue;
    }
    if (!res.type.toLowerCase().includes("text/html") && !res.type.toLowerCase().includes("application/xhtml")) throw new FetchBlocked("Yanıt HTML değil.");
    const text = decodeBody(res.data, res.encoding).toString("utf8");
    if (text.length > maxBytes * 4) throw new Error("Sayfa boyut sınırını aşıyor.");
    return text;
  }
  throw new Error("Çok fazla yönlendirme.");
}

/** Form webhook'u: https JSON POST. Yönlendirme izlenmez; gövde en çok 64 KB okunup atılır. */
export async function postPublicJson(url: string, body: string, opts?: { timeoutMs?: number; headers?: Record<string, string>; userAgent?: string }): Promise<void> {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new FetchBlocked("Yalnızca https.");
  if (u.username || u.password) throw new FetchBlocked("Kimlik bilgili adresler desteklenmez.");
  if (u.port && u.port !== "443") throw new FetchBlocked("Yalnızca varsayılan bağlantı noktaları.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && !isPublicIp(host)) throw new FetchBlocked("Adres genel internete ait değil.");
  const timeoutMs = opts?.timeoutMs ?? 8_000;
  const payload = Buffer.from(body);
  if (payload.length > 100_000) throw new Error("Gövde çok büyük.");
  await new Promise<void>((resolve, reject) => {
    const req = https.request(u, { method: "POST", lookup: guardedLookup as never, timeout: timeoutMs, headers: { "user-agent": opts?.userAgent ?? "NexPress-Forms/1.0", ...(opts?.headers ?? {}), "content-type": "application/json", "content-length": String(payload.length) } }, (r) => {
      const status = r.statusCode ?? 0;
      r.resume();
      r.on("error", reject);
      r.on("end", () => (status >= 200 && status < 300 ? resolve() : reject(new Error(`HTTP ${status}`))));
    });
    req.on("timeout", () => req.destroy(new Error("Zaman aşımı.")));
    req.on("error", reject);
    req.end(payload);
  });
}
