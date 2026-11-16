#!/usr/bin/env node
/**
 * Dağıtımdan sonra çalıştırılır: sayfaları gezip içlerindeki görsel türevlerini (`/media/<id>/<genişlik>.<biçim>`) önceden üretir.
 * AVIF/WebP türevi ilk istekte üretilir (birkaç yüz ms – saniye); ilk ziyaretçi bunu LCP'de öder. Bu betik o bedeli önceden öder.
 *
 *   node scripts/warm-cache.mjs [--base http://127.0.0.1:3001] [--host akinsoftizmir.com.tr] [--max 400]
 *
 * Yalnızca GET yapar; veri yazmaz. Aynı siteyi gezer, dış adrese gitmez.
 */
import http from "node:http";
import https from "node:https";

const arg = (name, fallback) => {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
};
const base = new URL(arg("--base", "http://127.0.0.1:3001"));
const host = arg("--host", base.host);
const max = Number(arg("--max", "400"));
const lib = base.protocol === "https:" ? https : http;

function get(path) {
  return new Promise((resolve) => {
    const req = lib.request(
      { hostname: base.hostname, port: base.port, path, method: "GET", headers: { host, "accept-encoding": "identity", "user-agent": "nexpress-warm/1.0", "x-forwarded-proto": "https" }, rejectUnauthorized: false, timeout: 60000 },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const next = res.headers.location.replace(/^https?:\/\/[^/]+/, "");
          return resolve(next.startsWith("/") ? get(next) : { status: res.statusCode, body: "" });
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("latin1"), type: res.headers["content-type"] ?? "" }));
      },
    );
    req.on("error", () => resolve({ status: 0, body: "" }));
    req.on("timeout", () => req.destroy());
    req.end();
  });
}

const seen = new Set(["/"]);
const queue = ["/"];
const media = new Set();
while (queue.length > 0 && seen.size <= max) {
  const path = queue.shift();
  const { status, body, type } = await get(path);
  if (status !== 200 || !String(type).includes("html")) continue;
  for (const m of body.matchAll(/\/media\/med_[A-Za-z0-9_-]+\/\d+\.(?:avif|webp|jpg|png)/g)) media.add(m[0]);
  for (const m of body.matchAll(/<a [^>]*href="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (/^\/(admin|api|media|_next|wp-content|login)\b/.test(href) || /\.[a-z0-9]{2,5}$/i.test(href) || seen.has(href)) continue;
    seen.add(href);
    queue.push(href);
  }
}

let done = 0;
let failed = 0;
const urls = [...media];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (urls.length > 0) {
      const url = urls.pop();
      const res = await get(url);
      if (res.status === 200) done += 1;
      else failed += 1;
    }
  }),
);
console.log(JSON.stringify({ pages: seen.size, mediaVariants: done + failed, warmed: done, failed }));
