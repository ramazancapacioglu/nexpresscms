import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate, layoutKeysFor, measure } from "../scripts/budget-lib.mjs";

const pages = {
  "/layout": ["static/chunks/a.js", "static/chunks/app/layout-1.js"],
  "/(public)/[locale]/layout": ["static/chunks/a.js", "static/chunks/app/(public)/[locale]/layout-1.js"],
  "/(public)/[locale]/page": ["static/chunks/a.js", "static/chunks/app/(public)/[locale]/page-1.js"],
  "/(public)/[locale]/[slug]/page": ["static/chunks/a.js", "static/chunks/b.js"],
  "/admin/page": ["static/chunks/app/admin/page-1.js", "static/chunks/huge.js"],
};
const KB = 1024;
const sizes = { "static/chunks/a.js": 50 * KB, "static/chunks/b.js": 10 * KB, "static/chunks/app/layout-1.js": 2 * KB, "static/chunks/app/(public)/[locale]/layout-1.js": 0.2 * KB, "static/chunks/app/(public)/[locale]/page-1.js": 0.2 * KB };
const sizeOf = (f) => ({ gzip: sizes[f] ?? 0, text: null });
const budget = { publicFirstLoadGzipKb: 70, publicOwnGzipKb: 3 };

test("düzen anahtarları atadan çocuğa sıralanır", () => {
  assert.deepEqual(layoutKeysFor("/(public)/[locale]/[slug]/page"), ["/layout", "/(public)/layout", "/(public)/[locale]/layout", "/(public)/[locale]/[slug]/layout"]);
});

test("yalnızca ziyaretçi sayfaları ölçülür; düzen dosyaları bir kez sayılır", () => {
  const routes = measure(pages, sizeOf);
  assert.deepEqual(routes.map((r) => r.route).sort(), ["/(public)/[locale]/[slug]/page", "/(public)/[locale]/page"]);
  const home = routes.find((r) => r.route === "/(public)/[locale]/page");
  assert.ok(Math.abs(home.jsKb - (50 + 2 + 0.2 + 0.2)) < 1e-9, String(home.jsKb));
  assert.ok(Math.abs(home.ownKb - 2.4) < 1e-9);
});

test("bütçe içindeyken hata yok; toplam ve rota kodu aşılınca ayrı ayrı bildirilir", () => {
  assert.deepEqual(evaluate(measure(pages, sizeOf), budget), []);
  const tight = evaluate(measure(pages, sizeOf), { publicFirstLoadGzipKb: 50, publicOwnGzipKb: 1 });
  assert.ok(tight.some((m) => /toplam gzip JS/.test(m)));
  assert.ok(tight.some((m) => /rota\/düzen kodu/.test(m)));
});

test("ziyaretçi paketine sızan yönetim parçası ve editör kütüphanesi yakalanır", () => {
  const leaky = { ...pages, "/(public)/[locale]/page": [...pages["/(public)/[locale]/page"], "static/chunks/app/admin/leak-1.js", "static/chunks/editor.js"] };
  const routes = measure(leaky, (f) => ({ gzip: 1, text: f.includes("editor") ? "var x='ProseMirror'" : "" }));
  const failures = evaluate(routes, { publicFirstLoadGzipKb: 999, publicOwnGzipKb: 999 });
  assert.ok(failures.some((m) => /yönetim parçası/.test(m)));
  assert.ok(failures.some((m) => /ProseMirror/.test(m)));
});

test("rota bulunamazsa sessiz geçmez", () => {
  assert.ok(evaluate([], budget).length > 0);
});
