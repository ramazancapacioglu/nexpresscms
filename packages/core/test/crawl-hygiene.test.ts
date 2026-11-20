import assert from "node:assert/strict";
import test from "node:test";
import { groupNotFoundPaths, hasGoneParam, hasUnknownQueryParams, matchesGoneRule, sanitizeCrawlHygiene } from "../src/crawl-hygiene";

test("tarama temizliği: kurallar temizlenir, geçersiz/tehlikeli satırlar ve kök kuralı atılır", () => {
  const c = sanitizeCrawlHygiene({ goneRules: " /ajax/* \n/pc/index.php,/ajax/*,/,/*,https://x.test/a,/ünlü,/a b", goneParams: "?j, utm_x=1, <bad>, j", noindexUnknownParams: false });
  assert.deepEqual(c.goneRules, ["/ajax/*", "/pc/index.php"]);
  assert.deepEqual(c.goneParams, ["j", "utm_x"]);
  assert.equal(c.noindexUnknownParams, false);
  assert.deepEqual(sanitizeCrawlHygiene(undefined), { goneRules: [], goneParams: [], noindexUnknownParams: true });
  assert.equal(sanitizeCrawlHygiene({ goneRules: Array.from({ length: 300 }, (_, i) => `/k${i}/*`) }).goneRules.length, 100);
});

test("tarama temizliği: yol eşleşmesi (önek, tam yol, dil öneki, sorgu dizesi, büyük/küçük harf)", () => {
  const rules = ["/ajax/*", "/pc/index.php", "/products/detail/*"];
  assert.ok(matchesGoneRule("/ajax/productstorestocklist", rules));
  assert.ok(matchesGoneRule("/ajax", rules));
  assert.ok(matchesGoneRule("/ajax/productdeliverycalendar/?sku=1", rules));
  assert.ok(matchesGoneRule("/PC/index.php", rules));
  assert.ok(matchesGoneRule("/tr/products/detail/9235769553", rules));
  assert.equal(matchesGoneRule("/ajaxx/foo", rules), false, "önek sınırı: /ajax/* yalnızca /ajax ve altı");
  assert.equal(matchesGoneRule("/pc/index.php.bak", rules), false);
  assert.equal(matchesGoneRule("/e-fatura", rules), false);
  assert.equal(matchesGoneRule("/ajax/x", []), false);
});

test("tarama temizliği: spam parametresi ve bilinmeyen parametre ayrımı (izleme ve sayfalama bilinen sayılır)", () => {
  assert.ok(hasGoneParam(new URLSearchParams("j=d8a2l5"), ["j"]));
  assert.equal(hasGoneParam(new URLSearchParams("sayfa=2"), ["j"]), false);
  assert.equal(hasUnknownQueryParams(new URLSearchParams("utm_source=x&gclid=1&sayfa=2&ysclid=3&qab_page=2")), false);
  assert.equal(hasUnknownQueryParams(new URLSearchParams("j=abc")), true);
  assert.equal(hasUnknownQueryParams(new URLSearchParams("")), false);
});

test("404 günlüğü gruplanır: iki ve daha derin yollar ilk parçaya göre, kök yol aynen; en çok isteneni örnek verir", () => {
  const g = groupNotFoundPaths([
    { path: "/ajax/productstorestocklist", hits: 100 },
    { path: "/ajax/productdeliverycalendar/?sku=1", hits: 60 },
    { path: "/kaden/mtalk", hits: 30 },
    { path: "/wp-login.php", hits: 5 },
    { path: "/wp-login.php/", hits: 2 },
  ]);
  assert.deepEqual(g.map((x) => [x.pattern, x.hits, x.paths]), [["/ajax/*", 160, 2], ["/kaden/*", 30, 1], ["/wp-login.php", 7, 2]]);
  assert.equal(g[0]!.sample, "/ajax/productstorestocklist");
});
