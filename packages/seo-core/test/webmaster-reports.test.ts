import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateBingRows,
  dayList,
  fetchBingReport,
  fetchGa4Report,
  fetchGscReport,
  fetchYandexReport,
  googleAccessToken,
  googleError,
  inspectUrl,
  parseBingDate,
  reportRange,
  WebmasterApiError,
} from "../src/webmaster-reports";

const NOW = new Date("2026-11-20T10:00:00Z");
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const fake = (handler: (url: string, init?: RequestInit) => Response): typeof fetch => (async (url: string | URL | Request, init?: RequestInit) => handler(String(url), init)) as typeof fetch;

test("rapor aralığı: veri gecikmesi kadar geriden biter, önceki dönem hemen öncesidir; günler eksiksiz", () => {
  const r = reportRange(7, 2, NOW);
  assert.deepEqual([r.start, r.end, r.prevStart, r.prevEnd], ["2026-11-12", "2026-11-18", "2026-11-05", "2026-11-11"]);
  assert.equal(dayList(r.start, r.end).length, 7);
});

test("Search Console özeti: tıklama/gösterim toplamı, ağırlıklı konum, boş günler sıfır, önceki dönemle karşılaştırma", async () => {
  const calls: Array<{ url: string; body: any }> = [];
  const fetchImpl = fake((url, init) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    return json({ rows: [
      { keys: ["2026-11-18"], clicks: 10, impressions: 100, ctr: 0.1, position: 4 },
      { keys: ["2026-11-17"], clicks: 5, impressions: 300, ctr: 0.0166, position: 8 },
      { keys: ["2026-11-10"], clicks: 4, impressions: 50, ctr: 0.08, position: 6 },
    ] });
  });
  const report = await fetchGscReport({ fetchImpl, accessToken: "t", siteUrl: "sc-domain:ornek.test", section: "overview", days: 7, now: NOW });
  assert.match(calls[0]!.url, /sites\/sc-domain%3Aornek\.test\/searchAnalytics\/query$/);
  assert.deepEqual(calls[0]!.body.dimensions, ["date"]);
  const k = Object.fromEntries(report.kpis.map((x) => [x.key, x]));
  assert.equal(k.clicks!.value, 15);
  assert.equal(k.clicks!.previous, 4);
  assert.equal(k.impressions!.value, 400);
  assert.equal(k.ctr!.value, 3.75);
  assert.equal(k.position!.value, 7, "(4*100 + 8*300)/400");
  assert.equal(report.timeline!.dates.length, 7);
  assert.equal(report.timeline!.series[0]!.values.reduce((a, b) => a + b, 0), 15);
  assert.equal(report.timeline!.series[0]!.values[0], 0);
});

test("Search Console tabloları: cihaz adı çevrilir, TO yüzdeye çevrilir; site haritası durumu", async () => {
  const devices = await fetchGscReport({ fetchImpl: fake(() => json({ rows: [{ keys: ["MOBILE"], clicks: 3, impressions: 60, ctr: 0.05, position: 3.26 }] })), accessToken: "t", siteUrl: "https://x.test/", section: "devices", days: 28, now: NOW });
  assert.deepEqual(devices.tables[0]!.rows[0], { label: "Mobil", clicks: 3, impressions: 60, ctr: 5, position: 3.3 });
  const maps = await fetchGscReport({ fetchImpl: fake(() => json({ sitemap: [{ path: "https://x.test/sitemap.xml", isSitemapsIndex: true, errors: "0", warnings: "2", lastDownloaded: "2026-11-19T10:00:00Z", contents: [{ type: "web", submitted: "145", indexed: "0" }] }] })), accessToken: "t", siteUrl: "https://x.test/", section: "sitemaps", days: 28, now: NOW });
  assert.equal(maps.tables[0]!.rows[0]!.submitted, 145);
  assert.equal(maps.tables[0]!.rows[0]!.status, "Tamam");
  assert.equal(maps.kpis.find((x) => x.key === "warnings")!.value, 2);
});

test("hata açıklama: yenileme jetonu, devre dışı API, yetki, mülk bulunamadı, kota", () => {
  assert.equal(googleError(400, '{"error":"invalid_grant"}', "token").kind, "auth");
  assert.match(googleError(400, '{"error":"invalid_grant"}', "token").hint ?? "", /yeniden bağlayın/);
  assert.equal(googleError(401, '{"error":"invalid_client"}', "token").kind, "auth");
  const disabled = googleError(403, JSON.stringify({ error: { code: 403, message: "Google Analytics Data API has not been used in project 1 before or it is disabled.", status: "PERMISSION_DENIED", details: [{ reason: "SERVICE_DISABLED" }] } }), "ga4");
  assert.equal(disabled.kind, "api_disabled");
  assert.match(disabled.message, /Analytics Data API/);
  assert.equal(googleError(403, JSON.stringify({ error: { message: "User does not have sufficient permission for site" } }), "gsc").kind, "permission");
  assert.equal(googleError(404, "{}", "ga4").kind, "not_found");
  assert.equal(googleError(429, "{}", "gsc").kind, "quota");
});

test("erişim jetonu: eksik bilgi bağlı değil sayılır; Google yanıtı hataya çevrilir", async () => {
  await assert.rejects(googleAccessToken({ clientId: "a", clientSecret: "b", refreshToken: "" }), (e: unknown) => e instanceof WebmasterApiError && e.kind === "not_connected" && /bağlanmadı/.test(e.message));
  await assert.rejects(googleAccessToken({ clientId: "a", clientSecret: "b", refreshToken: "r" }, fake(() => json({ error: "invalid_grant" }, 400))), (e: unknown) => e instanceof WebmasterApiError && e.kind === "auth");
  assert.equal(await googleAccessToken({ clientId: "a", clientSecret: "b", refreshToken: "r" }, fake(() => json({ access_token: "tok" }))), "tok");
});

test("GA4 özeti: günlük seri, ağırlıklı etkileşim oranı, önceki dönem; AI kaynakları ayıklanır", async () => {
  let n = 0;
  const overview = await fetchGa4Report({
    fetchImpl: fake(() => {
      n += 1;
      return n === 1
        ? json({ rows: [
            { dimensionValues: [{ value: "20261118" }], metricValues: [{ value: "100" }, { value: "80" }, { value: "50" }, { value: "300" }, { value: "0.5" }, { value: "60" }] },
            { dimensionValues: [{ value: "20261119" }], metricValues: [{ value: "300" }, { value: "200" }, { value: "100" }, { value: "700" }, { value: "0.7" }, { value: "100" }] },
          ] })
        : json({ rows: [{ metricValues: [{ value: "250" }, { value: "180" }, { value: "90" }, { value: "600" }, { value: "0.6" }, { value: "70" }] }] });
    }),
    accessToken: "t", propertyId: "properties/123", section: "overview", days: 7, now: NOW,
  });
  const k = Object.fromEntries(overview.kpis.map((x) => [x.key, x]));
  assert.equal(k.sessions!.value, 400);
  assert.equal(k.sessions!.previous, 250);
  assert.equal(k.engagement!.value, 65, "(100*0.5+300*0.7)/400 = 0.65");
  assert.equal(k.duration!.value, 90, "(100*60+300*100)/400");
  assert.equal(overview.timeline!.series[0]!.values.at(-3), 100);
  assert.equal(overview.timeline!.series[0]!.values.at(-2), 300);

  const ai = await fetchGa4Report({
    fetchImpl: fake(() => json({ rows: [
      { dimensionValues: [{ value: "chatgpt.com" }], metricValues: [{ value: "40" }, { value: "30" }, { value: "0.5" }] },
      { dimensionValues: [{ value: "perplexity.ai" }], metricValues: [{ value: "10" }, { value: "9" }, { value: "0.8" }] },
      { dimensionValues: [{ value: "google" }], metricValues: [{ value: "900" }, { value: "700" }, { value: "0.6" }] },
      { dimensionValues: [{ value: "openai.com" }], metricValues: [{ value: "5" }, { value: "5" }, { value: "1" }] },
    ] })),
    accessToken: "t", propertyId: "1", section: "ai", days: 28, now: NOW,
  });
  assert.equal(ai.kpis[0]!.value, 55);
  assert.deepEqual(ai.tables[0]!.rows.map((r) => r.d0), ["ChatGPT", "Perplexity"]);
  assert.equal(ai.tables[0]!.rows[0]!.m0, 45, "chatgpt.com + openai.com tek etikette birleşir");
});

test("Bing: tarih ayrıştırma, haftalık satırların aralıkta toplanması, ağırlıklı konum, özet serisi", async () => {
  assert.equal(parseBingDate("/Date(1752969600000)/"), "2025-07-20");
  assert.equal(parseBingDate(null), "");
  const d = (iso: string) => `/Date(${Date.parse(`${iso}T00:00:00Z`)})/`;
  const rows = [
    { Query: "wolvox", Clicks: 4, Impressions: 100, AvgImpressionPosition: 2, Date: d("2026-11-15") },
    { Query: "wolvox", Clicks: 6, Impressions: 300, AvgImpressionPosition: 4, Date: d("2026-11-16") },
    { Query: "wolvox", Clicks: 99, Impressions: 999, AvgImpressionPosition: 1, Date: d("2026-01-01") },
    { Query: "yok", Clicks: 0, Impressions: 10, AvgImpressionPosition: -1, Date: d("2026-11-16") },
  ];
  const agg = aggregateBingRows(rows, "2026-11-01", "2026-11-20");
  assert.deepEqual(agg[0], { key: "wolvox", clicks: 10, impressions: 400, ctr: 2.5, position: 3.5 });
  assert.equal(agg[1]!.position, 0);

  const overview = await fetchBingReport({
    fetchImpl: fake((url) => (url.includes("GetRankAndTrafficStats") ? json({ d: [{ Clicks: 7, Impressions: 70, Date: d("2026-11-19") }, { Clicks: 2, Impressions: 20, Date: d("2026-11-08") }] }) : json({ d: rows }))),
    apiKey: "k", siteUrl: "https://x.test", section: "overview", days: 7, now: NOW,
  });
  assert.equal(overview.kpis.find((x) => x.key === "clicks")!.value, 7);
  assert.equal(overview.kpis.find((x) => x.key === "clicks")!.previous, 2);
  assert.equal(overview.timeline!.series[1]!.values.at(-2), 70);

  await assert.rejects(fetchBingReport({ fetchImpl: fake(() => json({ Message: "InvalidApiKey" }, 400)), apiKey: "k", siteUrl: "https://x.test", section: "queries", days: 7, now: NOW }), (e: unknown) => e instanceof WebmasterApiError && e.kind === "auth");
});

test("Yandex Metrika: özet toplamları ve zaman serisi; geçersiz jeton açıklanır; sayfa yolu çıkarılır", async () => {
  const overview = await fetchYandexReport({
    fetchImpl: fake((url) => (url.includes("/bytime") ? json({ data: [{ metrics: [[1, 2, 3, 4, 5, 6, 7], [1, 1, 1, 1, 1, 1, 1], [2, 2, 2, 2, 2, 2, 2]] }] }) : json({ totals: [28, 20, 56, 41.234, 95.4], data: [] }))),
    token: "t", counterId: "1", section: "overview", days: 7, now: NOW,
  });
  assert.equal(overview.kpis[0]!.value, 28);
  assert.equal(overview.kpis[3]!.value, 41.2);
  assert.deepEqual(overview.timeline!.series[0]!.values, [1, 2, 3, 4, 5, 6, 7]);
  await assert.rejects(fetchYandexReport({ fetchImpl: fake(() => json({ errors: [{ error_type: "invalid_token", message: "Invalid oauth_token" }], code: 403 }, 403)), token: "t", counterId: "1", section: "sources", days: 7, now: NOW }), (e: unknown) => e instanceof WebmasterApiError && e.kind === "auth" && /metrika:read/.test(e.hint ?? ""));
  const pages = await fetchYandexReport({ fetchImpl: fake(() => json({ data: [{ dimensions: [{ name: "https://x.test/wolvox-erp" }], metrics: [10, 8, 25.56] }] })), token: "t", counterId: "1", section: "pages", days: 7, now: NOW });
  assert.deepEqual(pages.tables[0]!.rows[0], { label: "/wolvox-erp", visits: 10, users: 8, bounce: 25.6 });
});

test("URL denetimi: dizin kararı ve ayrıntılar Türkçeye çevrilir", async () => {
  const r = await inspectUrl({ fetchImpl: fake(() => json({ inspectionResult: { inspectionResultLink: "https://search.google.com/x", indexStatusResult: { verdict: "PASS", coverageState: "Submitted and indexed", lastCrawlTime: "2026-11-19T08:30:11Z", googleCanonical: "https://x.test/a", crawledAs: "MOBILE" }, mobileUsabilityResult: { verdict: "PASS" } } })), accessToken: "t", siteUrl: "sc-domain:x.test", url: "https://x.test/a" });
  assert.equal(r.verdict, "Geçti");
  assert.equal(r.lastCrawl, "2026-11-19 08:30");
  assert.equal(r.mobile, "Geçti");
  assert.equal(r.richResults, "—");
});
