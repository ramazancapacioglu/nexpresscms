// Erişilebilirlik ve duyarlılık taraması (axe-core + playwright-core). Çalışan bir uygulamaya karşı koşar.
//   A11Y_BASE_URL (varsayılan http://localhost:3000)  A11Y_EMAIL / A11Y_PASSWORD (yönetici)  A11Y_CHROME (isteğe bağlı tarayıcı yolu)
//   A11Y_OUT (rapor JSON yolu, varsayılan a11y-report.json)
// Çıkış kodu 1: kritik/ciddi ihlal veya mobilde yatay taşma. Orta/az ihlaller yalnızca raporlanır.
// Bilinçli istisna: öğeye `data-axe-skip="gerekçe"` konur (ör. kullanıcı renkleriyle çizilen tema önizlemesi).
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = (process.env.A11Y_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.A11Y_EMAIL;
const PASSWORD = process.env.A11Y_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("A11Y_EMAIL ve A11Y_PASSWORD gerekli.");
  process.exit(2);
}

const ADMIN_PATHS = [
  "/admin", "/admin/pages", "/admin/posts", "/admin/forms", "/admin/forms/new", "/admin/forms/inbox", "/admin/forms/email",
  "/admin/media", "/admin/notifications", "/admin/settings", "/admin/system", "/admin/backup", "/admin/migration",
  "/admin/redirects", "/admin/taxonomies", "/admin/comments", "/admin/themes", "/admin/trash", "/admin/schedule",
  "/admin/translations", "/admin/users", "/admin/audit", "/admin/appearance/header", "/admin/plugins", "/admin/seo", "/admin/commerce",
];
const PUBLIC_PATHS = ["/tr", "/login"];
const BLOCKING = new Set(["critical", "serious"]);

const browser = await chromium.launch({ executablePath: process.env.A11Y_CHROME || undefined, args: ["--no-sandbox"] });
const report = { base: BASE, results: [] };
let failures = 0;

async function scan(page, label, path) {
  const res = await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => null);
  if (!res || res.status() >= 400) {
    report.results.push({ label, path, error: `HTTP ${res?.status() ?? "yok"}` });
    console.log(`✗ ${label} ${path}: sayfa açılamadı (${res?.status() ?? "yanıt yok"})`);
    failures++;
    return;
  }
  await page.waitForTimeout(400);
  await page.evaluate(axeSource);
  const out = await page.evaluate(async () => {
    const r = await axe.run({ exclude: [["[data-axe-skip]"]] }, { resultTypes: ["violations"] });
    return {
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0].html.replace(/\s+/g, " ").slice(0, 140), help: v.help })),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  const blocking = out.violations.filter((v) => BLOCKING.has(v.impact));
  const overflow = label.startsWith("mobil") && out.overflow > 1;
  report.results.push({ label, path, ...out, blocking: blocking.length, overflow });
  if (blocking.length || overflow) {
    failures++;
    console.log(`✗ ${label} ${path}`);
    for (const v of blocking) console.log(`    ${v.impact} ${v.id} (${v.nodes}): ${v.help}\n      ${v.sample}`);
    if (overflow) console.log(`    yatay taşma: ${out.overflow}px`);
  } else {
    const minor = out.violations.length ? ` (${out.violations.length} orta/az uyarı)` : "";
    console.log(`✓ ${label} ${path}${minor}`);
  }
}

for (const mode of ["mobil", "masaüstü"]) {
  const mobile = mode === "mobil";
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  // Giriş yapmadan: herkese açık sayfalar
  for (const p of PUBLIC_PATHS) await scan(page, `${mode}/genel`, p);
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await Promise.all([page.waitForURL(/\/admin/, { timeout: 30000 }), page.click("button[type=submit]")]);
  for (const p of ADMIN_PATHS) await scan(page, `${mode}/yönetim`, p);
  // Form kurucusu: boş form oluşturup kurucuyu tara
  await page.goto(`${BASE}/admin/forms/new`, { waitUntil: "networkidle" });
  await Promise.all([page.waitForURL(/\/admin\/forms\/frm_/, { timeout: 30000 }), page.getByRole("button", { name: /Boş form/ }).click()]);
  const builder = new URL(page.url()).pathname;
  await scan(page, `${mode}/yönetim`, builder);
  await scan(page, `${mode}/yönetim`, `${builder}/analytics`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(process.env.A11Y_OUT ?? "a11y-report.json", JSON.stringify(report, null, 2));
const total = report.results.length;
console.log(`\n${total} tarama, ${failures} başarısız.`);
process.exit(failures ? 1 : 0);
