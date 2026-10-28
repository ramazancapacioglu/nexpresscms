import "server-only";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
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
