import assert from "node:assert/strict";
import test from "node:test";
import { buildCruxRequest, classifyCruxError, formatCruxValue, maskSecret, parseCruxResponse, rateMetric, sanitizeCruxOrigin } from "../src/index";

const hist = (a: number, b: number, c: number) => [{ start: 0, end: 1, density: a }, { start: 1, end: 2, density: b }, { start: 2, density: c }];
const response = (over: Record<string, unknown> = {}) => ({
  record: {
    key: { origin: "https://x.test" },
    metrics: {
      largest_contentful_paint: { histogram: hist(0.82, 0.11, 0.07), percentiles: { p75: 2171 } },
      interaction_to_next_paint: { histogram: hist(0.9, 0.06, 0.04), percentiles: { p75: 140 } },
      cumulative_layout_shift: { histogram: hist(0.95, 0.03, 0.02), percentiles: { p75: "0.05" } },
      first_contentful_paint: { histogram: hist(0.7, 0.2, 0.1), percentiles: { p75: 1700 } },
      ...over,
    },
    collectionPeriod: { firstDate: { year: 2026, month: 10, day: 14 }, lastDate: { year: 2026, month: 11, day: 10 } },
  },
});
const meta = { origin: "https://x.test", formFactor: "ALL" as const, now: new Date("2026-11-12T10:00:00Z") };

test("eşikler: iyi / geliştirilmeli / kötü (sınır değerler iyiye dahil)", () => {
  assert.equal(rateMetric("lcp", 2500), "good");
  assert.equal(rateMetric("lcp", 2501), "needs-improvement");
  assert.equal(rateMetric("lcp", 4001), "poor");
  assert.equal(rateMetric("cls", 0.1), "good");
  assert.equal(rateMetric("cls", 0.26), "poor");
  assert.equal(rateMetric("inp", 200), "good");
  assert.equal(rateMetric("ttfb", 1800), "needs-improvement");
});

test("yanıt çözümü: p75 (CLS metin gelir), yüzdeler, dönem, Core Web Vitals geçti", () => {
  const s = parseCruxResponse(response(), meta)!;
  assert.equal(s.metrics.length, 4, "TTFB yanıtta yok: atlanır");
  const cls = s.metrics.find((m) => m.key === "cls")!;
  assert.deepEqual([cls.p75, cls.rating, cls.good], [0.05, "good", 95]);
  assert.equal(s.metrics.find((m) => m.key === "lcp")?.needsImprovement, 11);
  assert.deepEqual(s.period, { first: "2026-10-14", last: "2026-11-10" });
  assert.equal(s.cwvPass, true);
  assert.equal(s.fetchedAt, "2026-11-12T10:00:00.000Z");
});

test("Core Web Vitals: biri kötüyse kaldı; biri eksikse belirsiz (null)", () => {
  assert.equal(parseCruxResponse(response({ largest_contentful_paint: { histogram: hist(0.4, 0.3, 0.3), percentiles: { p75: 4500 } } }), meta)!.cwvPass, false);
  assert.equal(parseCruxResponse(response({ interaction_to_next_paint: undefined }), meta)!.cwvPass, null);
});

test("bozuk/eksik yanıt: kırılmaz, null döner; bozuk metrik atlanır", () => {
  assert.equal(parseCruxResponse(null, meta), null);
  assert.equal(parseCruxResponse({}, meta), null);
  assert.equal(parseCruxResponse({ record: { metrics: {} } }, meta), null);
  const partial = parseCruxResponse(response({ cumulative_layout_shift: { histogram: [], percentiles: { p75: "x" } } }), meta)!;
  assert.equal(partial.metrics.some((m) => m.key === "cls"), false);
  assert.equal(parseCruxResponse({ record: { metrics: { largest_contentful_paint: { histogram: hist(1, 0, 0), percentiles: { p75: 1200 } } } } }, meta)!.period, null);
});

test("kaynak adres: yalnızca https kökü (yol ve sorgu atılır); yerel http geliştirme için", () => {
  assert.equal(sanitizeCruxOrigin("https://ileriseo.com/yol?x=1#h"), "https://ileriseo.com");
  assert.equal(sanitizeCruxOrigin("http://localhost:3000/x"), "http://localhost:3000");
  for (const bad of ["http://ileriseo.com", "javascript:alert(1)", "ftp://x.test", "", "yok", null, 5]) assert.equal(sanitizeCruxOrigin(bad), null, String(bad));
});

test("istek gövdesi: ALL'da formFactor yok", () => {
  assert.equal("formFactor" in buildCruxRequest("https://x.test", "ALL"), false);
  assert.equal(buildCruxRequest("https://x.test", "PHONE").formFactor, "PHONE");
  assert.equal((buildCruxRequest("https://x.test", "ALL").metrics as string[]).includes("interaction_to_next_paint"), true);
});

test("hata sınıflandırma: anahtar/gövde metni sızmaz", () => {
  assert.equal(classifyCruxError(404).kind, "no_data");
  assert.equal(classifyCruxError(403).kind, "bad_key");
  assert.equal(classifyCruxError(429).kind, "quota");
  assert.equal(classifyCruxError(500).kind, "error");
  assert.equal(/key|AIza/i.test(classifyCruxError(400).message.replace("API anahtarı", "")), false);
});

test("gösterim: anahtar maskesi ve değer biçimi", () => {
  assert.equal(maskSecret("AIzaSyD-1234567890abcdWxYz"), "AIza…WxYz");
  assert.equal(maskSecret("kısa"), "••••");
  assert.equal(formatCruxValue("lcp", 2171), "2,2 sn");
  assert.equal(formatCruxValue("inp", 140), "140 ms");
  assert.equal(formatCruxValue("cls", 0.05), "0,05");
});
