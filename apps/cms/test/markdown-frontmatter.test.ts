import test from "node:test";
import assert from "node:assert/strict";
import { buildMarkdownFrontmatter, markdownCanonicalLink, markdownCanonicalUrl } from "../src/lib/markdown-frontmatter";

const base = { title: 'Wolvox "ERP"', slug: "wolvox-erp", locale: "tr", region: "TR", type: "page", schemaType: "SoftwareApplication", url: "https://ornek.test/wolvox-erp" };

test("ön bilgi içerideki puanları ve kiracı kimliğini sızdırmaz", () => {
  const fm = buildMarkdownFrontmatter({ ...base, publishedAt: new Date("2025-01-02T03:04:05Z"), updatedAt: "2026-02-03T00:00:00Z" });
  assert.doesNotMatch(fm, /seo_score|importance_score|site_id/);
  assert.match(fm, /^---\n/);
  assert.match(fm, /\n---$/);
  assert.match(fm, /url: "https:\/\/ornek\.test\/wolvox-erp"/);
  assert.match(fm, /published: "2025-01-02T03:04:05\.000Z"/);
  assert.match(fm, /updated: "2026-02-03T00:00:00\.000Z"/);
});

test("başlıktaki tırnak ve ters eğik çizgi YAML'ı bozmaz", () => {
  const fm = buildMarkdownFrontmatter({ ...base, title: 'A "B" \\ C' });
  assert.match(fm, /title: "A \\"B\\" \\\\ C"/);
});

test("tarih yoksa ya da geçersizse satır yazılmaz; bölgesiz dil yalnız dil olur", () => {
  const fm = buildMarkdownFrontmatter({ ...base, region: "", updatedAt: "bozuk", publishedAt: null });
  assert.doesNotMatch(fm, /published:|updated:/);
  assert.match(fm, /locale: "tr"/);
});

test("kampanya gibi ek satırlar kapanış çitinden önce gelir", () => {
  const fm = buildMarkdownFrontmatter({ ...base, extraLines: ['campaign_status: "active"'] });
  assert.ok(fm.indexOf("campaign_status") < fm.lastIndexOf("---"));
});

test("kanonik adres: tek dilde önek yok, ana sayfa köke gider", () => {
  assert.equal(markdownCanonicalUrl("https://ornek.test/", "", ["wolvox-erp"]), "https://ornek.test/wolvox-erp");
  assert.equal(markdownCanonicalUrl("https://ornek.test", "", []), "https://ornek.test/");
  assert.equal(markdownCanonicalUrl("https://ornek.test", "/en", []), "https://ornek.test/en");
  assert.equal(markdownCanonicalUrl("https://ornek.test", "/en", ["kampanya", "x"]), "https://ornek.test/en/kampanya/x");
});

test("kanonik Link başlığı RFC 8288 biçimindedir", () => {
  assert.equal(markdownCanonicalLink("https://ornek.test/a"), '<https://ornek.test/a>; rel="canonical"');
});
