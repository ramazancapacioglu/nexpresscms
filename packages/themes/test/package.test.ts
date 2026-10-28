import test from "node:test";
import assert from "node:assert/strict";
import { strToU8, unzipSync, zipSync } from "fflate";
import { buildThemePackage, parseThemePackage, sanitizeThemeCss, scopeSelector, splitSelectors, badEntryName, type BuildInput } from "../src/package";

const colors = { primary: "#2563eb", primaryForeground: "#ffffff", secondary: "#0f172a", secondaryForeground: "#f8fafc", accent: "#4f46e5", accentForeground: "#ffffff", background: "#ffffff", foreground: "#09090b", muted: "#f1f5f9", mutedForeground: "#64748b", border: "#e2e8f0" };
const base = (): BuildInput => ({
  theme: { id: "demo-tema", name: "Demo", version: "1.0.0", author: "T", tagline: "", description: "d", recommendedProfile: "corporate", features: [] },
  tokens: { colors: { ...colors }, typography: { headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif", monoFont: "monospace", baseSizePx: 16, scaleRatio: 1.25 }, geometry: { borderRadius: "8px", containerMaxWidth: "1200px", sectionSpacingY: "4rem", cardShadow: "sm" } },
  css: ".nx-hero { color: red; }\n:root { --x: 1; }",
  pages: [{ slug: "merhaba", title: "Merhaba", type: "page", blocks: [{ id: "b1", type: "paragraph", props: { text: "x" } }] }],
});
const zip = (files: Record<string, string | Uint8Array>) => zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, typeof v === "string" ? strToU8(v) : v])));
const errs = (r: ReturnType<typeof parseThemePackage>) => (r.ok ? [] : r.errors);

test("gidiş-dönüş: yazılan paket aynen okunur; CSS kapsamlanır; özet kararlı", () => {
  const bytes = buildThemePackage(base());
  const r = parseThemePackage(bytes);
  assert.ok(r.ok, JSON.stringify(errs(r)));
  if (!r.ok) return;
  assert.equal(r.value.theme.id, "demo-tema");
  assert.equal(r.value.pages[0]!.slug, "merhaba");
  assert.match(r.value.rawCss, /^\.nx-hero \{ color: red; \}/, "özgün CSS dışa aktarma için saklanır");
  assert.match(r.value.css, /\[data-nx-skin="demo-tema"\] \.nx-hero/);
  assert.match(r.value.css, /\[data-nx-skin="demo-tema"\] \{?\s*--x|\[data-nx-skin="demo-tema"\]\s*\{/);
  assert.equal(r.value.checksum, (parseThemePackage(buildThemePackage(base())) as { value: { checksum: string } }).value.checksum);
});

test("zorunlu dosyalar ve şema hataları satır satır raporlanır", () => {
  assert.match(errs(parseThemePackage(zip({ "theme.json": "{}" }))).join("|"), /tokens\.json eksik/);
  const bad = base();
  bad.tokens.colors.primary = "kırmızı";
  bad.theme.id = "../x";
  const r = parseThemePackage(buildThemePackage(bad));
  assert.ok(!r.ok);
  const e = errs(r).join("|");
  assert.match(e, /theme\.json › id/);
  assert.match(e, /tokens\.json › colors\.primary/);
  assert.match(errs(parseThemePackage(strToU8("zip değil"))).join(), /zip/);
});

test("zip güvenliği: yol gezinmesi, izinsiz uzantı, zip bombası, tek klasör sarmalayıcı", () => {
  const good = buildThemePackage(base());
  assert.ok(parseThemePackage(good).ok);
  assert.match(errs(parseThemePackage(zip({ "../evil.json": "{}", "theme.json": "{}" }))).join(), /yol gezinmesi/);
  assert.match(errs(parseThemePackage(zip({ "C:/x.json": "{}" }))).join(), /geçersiz yol/);
  assert.match(errs(parseThemePackage(zip({ "theme.json": "{}", "run.js": "alert(1)" }))).join(), /verilmeyen dosya türü/);
  const bomb = zip({ "theme.json": "{}", "pages/a.css": new Uint8Array(31 * 1024 * 1024) });
  assert.ok(bomb.length < 200_000, "bomba küçük görünür");
  assert.match(errs(parseThemePackage(bomb)).join(), /zip bombası/);
  // sarmalayıcı klasör (klasörü zipleyen kullanıcılar)
  const inner = buildThemePackage(base());
  const files = unzipSync(inner);
  const wrapped = zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [`demo-tema/${k}`, v])));
  assert.ok(parseThemePackage(wrapped).ok, "tek üst klasör atılır");
});

test("CSS: yasak kurallar ve değerler reddedilir, kapsam dışına taşamaz", () => {
  const bad = (css: string) => sanitizeThemeCss(css, "t");
  assert.ok(!bad('@import url("https://x.test/a.css");').ok);
  assert.ok(!bad(".a { width: expression(alert(1)); }").ok);
  assert.ok(!bad(".a { background: url(https://x.test/a.png); }").ok);
  assert.ok(!bad(".a { background: url(javascript:alert(1)); }").ok);
  assert.ok(!bad("@font-face { font-family: X; src: url(data:font/woff2;base64,AAAA); }").ok);
  assert.ok(bad(".a { background: url(data:image/png;base64,iVBORw0KGgo=); }").ok);
  assert.ok(bad("@media (min-width: 600px) { .a { color: red } } @keyframes k { from { opacity: 0 } to { opacity: 1 } }").ok);
  const big = sanitizeThemeCss("a{}".repeat(100_000), "t");
  assert.ok(!big.ok && /KB/.test(big.errors[0]!));
});

test("seçici kapsamlama: virgül, :root/body, parantez içi virgül", () => {
  assert.deepEqual(splitSelectors("a, b:is(c, d), [x='1,2']"), ["a", "b:is(c, d)", "[x='1,2']"]);
  assert.equal(scopeSelector(":root", '[s]'), "[s]");
  assert.equal(scopeSelector("body.dark h1", "[s]"), "[s].dark h1");
  assert.equal(scopeSelector(".a .b", "[s]"), "[s] .a .b");
  assert.match(sanitizeThemeCss("h1, .a:is(.b, .c) { color: red }", "t").css, /\[data-nx-skin="t"\] h1, \[data-nx-skin="t"\] \.a:is\(\.b, \.c\)/);
  assert.equal(badEntryName("chrome/header.json"), null);
});
