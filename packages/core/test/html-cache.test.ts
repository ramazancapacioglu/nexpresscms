import assert from "node:assert/strict";
import test from "node:test";
import { htmlCacheControl, normalizeCacheTtl } from "../src/index";

const base = { method: "GET", path: "/tr/hakkimizda", searchParams: new URLSearchParams(), cookieNames: [] as string[], ttlSeconds: 60 };
const q = (s: string) => new URLSearchParams(s);

test("kapalı (0) ya da geçersiz TTL: önbellek yok", () => {
  assert.equal(htmlCacheControl({ ...base, ttlSeconds: 0 }), null);
  assert.equal(htmlCacheControl({ ...base, ttlSeconds: Number.NaN }), null);
  assert.equal(htmlCacheControl({ ...base, ttlSeconds: -5 }), null);
  assert.equal(normalizeCacheTtl("abc"), 0);
  assert.equal(normalizeCacheTtl("90"), 90);
  assert.equal(normalizeCacheTtl(10_000_000), 86_400, "üst sınır 1 gün");
});

test("anonim GET/HEAD sayfa: herkese açık, s-maxage ve 5 kat stale-while-revalidate", () => {
  assert.equal(htmlCacheControl(base), "public, s-maxage=60, stale-while-revalidate=300");
  assert.equal(htmlCacheControl({ ...base, method: "HEAD", path: "/tr" }), "public, s-maxage=60, stale-while-revalidate=300");
  assert.equal(htmlCacheControl({ ...base, ttlSeconds: 40_000 }), "public, s-maxage=40000, stale-while-revalidate=86400");
});

test("yalnızca GET/HEAD", () => {
  for (const method of ["POST", "PUT", "DELETE"]) assert.equal(htmlCacheControl({ ...base, method }), null, method);
});

test("oturum, onay, parola, önizleme çerezi: asla paylaşımlı önbellek", () => {
  for (const c of ["nx_session", "nx_consent", "nx_pwd_abc", "nx_preview", "nx_helpful_votes"]) assert.equal(htmlCacheControl({ ...base, cookieNames: [c] }), null, c);
  assert.notEqual(htmlCacheControl({ ...base, cookieNames: ["_ga", "_fbp"] }), null, "üçüncü taraf çerezler HTML'i değiştirmez");
});

test("sorgu: yalnızca izleme/sayfalama tarafsızdır; çıktıyı değiştirenler ve utm_source hariç", () => {
  assert.notEqual(htmlCacheControl({ ...base, searchParams: q("sayfa=2") }), null);
  assert.notEqual(htmlCacheControl({ ...base, searchParams: q("utm_medium=x&gclid=1&fbclid=2") }), null);
  for (const s of ["nx_draft=abc", "pwd=1", "form=ok", "yorum=1", "q=ara", "c_sort=new", "x=1", "utm_source=chatgpt.com"]) assert.equal(htmlCacheControl({ ...base, searchParams: q(s) }), null, s);
});

test("yol: dil önekli sayfalar; mağaza, arama, kampanya ve dosya uç noktaları dışarıda", () => {
  assert.notEqual(htmlCacheControl({ ...base, path: "/tr" }), null);
  assert.notEqual(htmlCacheControl({ ...base, path: "/en-gb/about" }), null);
  for (const p of ["/tr/magaza", "/tr/magaza/sepet", "/tr/ara", "/tr/kampanya/x", "/tr/llms.txt", "/tr/ai-sitemap.json", "/admin", "/api/x", "/api", "/og", "/sitemap.xml"]) assert.equal(htmlCacheControl({ ...base, path: p }), null, p);
  assert.notEqual(htmlCacheControl({ ...base, path: "/tr/kategori/rehber" }), null);
});

test("zaten özel (önizleme/taslak): atlanır", () => {
  assert.equal(htmlCacheControl({ ...base, alreadyPrivate: true }), null);
});
