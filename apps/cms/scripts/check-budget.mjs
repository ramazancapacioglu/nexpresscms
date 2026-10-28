// `next build` sonrası çalışır: ziyaretçi rotalarının istemci JS bütçesini denetler.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { evaluate, measure } from "./budget-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const next = path.join(root, process.env.NEXT_DIST_DIR || ".next");
const budget = JSON.parse(fs.readFileSync(path.join(root, "perf-budget.json"), "utf8"));
const manifestPath = path.join(next, "app-build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Önce `next build` çalıştırın (.next/app-build-manifest.json yok).");
  process.exit(2);
}
const pages = JSON.parse(fs.readFileSync(manifestPath, "utf8")).pages;

const routes = measure(pages, (file) => {
  const buf = fs.readFileSync(path.join(next, file));
  return { gzip: zlib.gzipSync(buf).length, text: file.endsWith(".js") ? buf.toString("utf8") : null };
});

console.log("Ziyaretçi rotaları — gzip istemci JS (düzenler + sayfa)\n");
for (const r of routes) console.log(`${r.jsKb.toFixed(1).padStart(7)} kB  (rota/düzen kodu ${r.ownKb.toFixed(2)} kB)  ${r.route}`);
console.log(`\nBütçe: toplam ≤ ${budget.publicFirstLoadGzipKb} kB, rota/düzen kodu ≤ ${budget.publicOwnGzipKb} kB, yasak kütüphane yok.`);

const failures = evaluate(routes, budget);
if (failures.length > 0) {
  console.error("\nBÜTÇE AŞILDI:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Bütçe içinde.");
