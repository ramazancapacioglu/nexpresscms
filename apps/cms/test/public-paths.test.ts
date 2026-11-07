import assert from "node:assert/strict";
import { test } from "node:test";
import { isReservedPath } from "../src/lib/public-paths";

test("panel, API, medya, oturum ve kök dosyalar ön ek kuralının dışındadır", () => {
  for (const p of ["/admin", "/admin/themes", "/api/forms/submit", "/_next/static/a.js", "/media/med_1/640.webp", "/login", "/forgot-password", "/reset-password", "/og", "/sitemaps/page-1.xml", "/.well-known/mcp.json", "/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt", "/feed.xml", "/atom.xml", "/ai-sitemap.json", "/favicon.ico", "/demo/yazilim-firmasi/erp.svg"]) assert.equal(isReservedPath(p), true, p);
});

test("herkese açık sayfa yolları ön eksiz moda girer (arama ve mağaza dahil)", () => {
  for (const p of ["/", "/hakkimizda", "/ara", "/magaza/sepet", "/kategori/yazilim", "/kampanya/bahar", "/yazi-adi-ile-uzun-bir-adres"]) assert.equal(isReservedPath(p), false, p);
});
