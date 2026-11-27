import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAuthorProfile } from "@nexpress/core";
import { validateSchemaGraph } from "../src/schema-validate";
import { runDeepSiteAudit } from "../src/site-self-audit";
import { extractSeoQuickWins } from "../src/quick-wins";

test("validateSchemaGraph: çift FAQPage, düşük/yüksek fiyat çelişkisi ve TechArticle alanları yakalanır", () => {
  const issues = validateSchemaGraph([
    { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "S1", acceptedAnswer: { "@type": "Answer", text: "C1" } }] },
    { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "S2", acceptedAnswer: { "@type": "Answer", text: "C2" } }] },
    {
      "@type": "SoftwareApplication",
      name: "Wolvox ERP",
      offers: { "@type": "AggregateOffer", lowPrice: 50000, highPrice: 10000, priceCurrency: "TRY" },
    },
    { "@type": "TechArticle", headline: "Kurulum Rehberi" },
  ]);
  assert.ok(issues.some((i) => i.level === "error" && i.type === "FAQPage" && i.message.includes("2 adet")));
  assert.ok(issues.some((i) => i.level === "error" && i.type === "SoftwareApplication" && i.message.includes("lowPrice")));
  assert.ok(issues.some((i) => i.level === "warning" && i.type === "TechArticle" && i.message.includes("proficiencyLevel")));
});

test("runDeepSiteAudit: ham HTML sızıntısı, kırık iç bağlantı, Markdown tablo başlığı ve RAG model uyuşmazlığını yakalar", () => {
  const report = runDeepSiteAudit({
    contents: [
      {
        id: "c1",
        slug: "demo-talebi",
        type: "page",
        title: "Demo Talebi",
        schemaType: "WebPage",
        blocks: [
          { id: "b1", type: "paragraph", props: { text: 'İndirmek için <a href="/indir">tıklayın</a>' } },
          { id: "b2", type: "cta_banner", props: { title: "Başla", ctaHref: "/olmayan-sayfa" } },
          { id: "b3", type: "comparison_table", props: { headers: ["A", "B"], rows: [["1", "2"]] } },
        ],
        markdownCache: "| 1 | 2 |",
      },
      {
        id: "c2",
        slug: "kurulum",
        type: "post",
        title: "Kurulum",
        schemaType: "TechArticle",
        blocks: [],
        markdownCache: "# Kurulum",
        authorName: "Boş Yazar",
      },
    ],
    authors: [{ slug: "bos-yazar", name: "Boş Yazar", profile: sanitizeAuthorProfile({}) }],
    ragHealth: {
      activeModel: "local:hash:1536",
      activeSemantic: false,
      chunkModels: [{ model: "openai:text-embedding-3-small:1536", count: 987 }],
      indexedContents: 2,
      totalPublished: 2,
    },
  });

  assert.ok(report.findings.some((f) => f.category === "links_html" && f.severity === "error" && f.title.includes("Ham HTML")));
  assert.ok(report.findings.some((f) => f.category === "links_html" && f.severity === "warning" && f.detail.includes("/olmayan-sayfa")));
  assert.ok(report.findings.some((f) => f.category === "consistency" && f.title.includes("Markdown tablo")));
  assert.ok(report.findings.some((f) => f.category === "eeat_rag" && f.title.includes("Yazar profili eksik")));
  assert.ok(report.findings.some((f) => f.category === "eeat_rag" && f.severity === "error" && f.title.includes("RAG vektör modeli uyuşmazlığı")));
  assert.ok(report.summary.errors >= 2);
});

test("extractSeoQuickWins: 2. sayfa, düşük TO ve eksik konu fırsatlarını doğru sınıflandırır", () => {
  const wins = extractSeoQuickWins(
    [
      { keyword: "wolvox erp fiyat", source: "gsc", impressions: 120, clicks: 4, ctr: 0.033, position: 11.4 },
      { keyword: "e-fatura kurulum", source: "bing", impressions: 200, clicks: 2, ctr: 0.01, position: 3.2 },
      { keyword: "barkod terazi entegrasyonu", source: "gsc", impressions: 45, clicks: 1, ctr: 0.02, position: 25 },
    ],
    ["Akınsoft Wolvox ERP", "e-Fatura Kurulum Rehberi"]
  );
  assert.ok(wins.some((w) => w.kind === "page2" && w.keyword === "wolvox erp fiyat"));
  assert.ok(wins.some((w) => w.kind === "low_ctr" && w.keyword === "e-fatura kurulum"));
  assert.ok(wins.some((w) => w.kind === "missing_topic" && w.keyword === "barkod terazi entegrasyonu"));
});
