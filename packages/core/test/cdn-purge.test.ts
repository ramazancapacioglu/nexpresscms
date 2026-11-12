import assert from "node:assert/strict";
import test from "node:test";
import { chunkUrls, cdnPurgeTargets, cloudflarePurgeRequest, resolveCdnPurgeConfig } from "../src/index";

const ZONE = "0123456789abcdef0123456789abcdef";

test("yapılandırma: eksik/geçersiz kapalı; geçerli cloudflare ve webhook kabul", () => {
  assert.equal(resolveCdnPurgeConfig({}), null);
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "cloudflare", CLOUDFLARE_ZONE_ID: "kısa", CLOUDFLARE_API_TOKEN: "x".repeat(40) }), null);
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "cloudflare", CLOUDFLARE_ZONE_ID: ZONE, CLOUDFLARE_API_TOKEN: "kısa" }), null);
  assert.deepEqual(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: " Cloudflare ", CLOUDFLARE_ZONE_ID: ZONE, CLOUDFLARE_API_TOKEN: "t".repeat(40) }), { provider: "cloudflare", zoneId: ZONE, apiToken: "t".repeat(40) });
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "webhook", CDN_PURGE_WEBHOOK_URL: "http://x.test/p", CDN_PURGE_WEBHOOK_SECRET: "s".repeat(20) }), null, "yalnızca https");
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "webhook", CDN_PURGE_WEBHOOK_URL: "https://x.test/p", CDN_PURGE_WEBHOOK_SECRET: "kısa" }), null, "sır kısa");
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "webhook", CDN_PURGE_WEBHOOK_URL: "https://u:p@x.test/p", CDN_PURGE_WEBHOOK_SECRET: "s".repeat(20) }), null, "kimlik bilgili adres");
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "webhook", CDN_PURGE_WEBHOOK_URL: "https://hooks.x.test/p", CDN_PURGE_WEBHOOK_SECRET: "s".repeat(20) })?.provider, "webhook");
  assert.equal(resolveCdnPurgeConfig({ CDN_PURGE_PROVIDER: "akamai" }), null);
});

test("hedefler: içerik, ana sayfa, arşiv, harita, llms; yazıda besleme; yinelenen yok", () => {
  const t = cdnPurgeTargets({ appUrl: "https://x.test/", lb: "", contentPath: "/hakkimizda" });
  assert.deepEqual(t, ["https://x.test/hakkimizda", "https://x.test/", "https://x.test/sitemap.xml", "https://x.test/llms.txt"]);
  const post = cdnPurgeTargets({ appUrl: "https://x.test", lb: "/en", contentPath: "/referanslar/acme", archivePath: "/referanslar", isPost: true });
  assert.ok(post.includes("https://x.test/en/referanslar/acme") && post.includes("https://x.test/en/referanslar") && post.includes("https://x.test/feed.xml") && post.includes("https://x.test/en/llms.txt"));
  const home = cdnPurgeTargets({ appUrl: "https://x.test", lb: "", contentPath: "/ana-sayfa", isHome: true });
  assert.equal(home.filter((u) => u === "https://x.test/").length, 1, "kök bir kez");
  assert.equal(new Set(post).size, post.length);
});

test("parçalama ve Cloudflare isteği", () => {
  const urls = Array.from({ length: 65 }, (_, i) => `https://x.test/${i}`);
  assert.deepEqual(chunkUrls(urls).map((c) => c.length), [30, 30, 5]);
  const r = cloudflarePurgeRequest({ provider: "cloudflare", zoneId: ZONE, apiToken: "tok" }, ["https://x.test/a"]);
  assert.equal(r.url, `https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`);
  assert.equal(r.headers.Authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(r.body), { files: ["https://x.test/a"] });
});
