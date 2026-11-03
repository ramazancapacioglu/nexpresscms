import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeSearchPerformance,
  parseSearchConsoleCsv,
  parseSearchConsoleJson,
} from "../src/search-console";

test("parseSearchConsoleCsv: GSC CSV çıktısını doğru ayrıştırır", () => {
  const gscCsv = `Top queries,Clicks,Impressions,CTR,Position
ön muhasebe programı,140,2500,5.6%,2.4
erp yazılımı,85,1800,4.72%,4.1
e fatura entegrasyonu,30,950,3.15%,7.8
stok takip programı,12,620,1.93%,3.2`;

  const parsed = parseSearchConsoleCsv(gscCsv);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0]?.query, "ön muhasebe programı");
  assert.equal(parsed[0]?.clicks, 140);
  assert.equal(parsed[0]?.impressions, 2500);
  assert.equal(parsed[0]?.ctr, 5.6);
  assert.equal(parsed[0]?.position, 2.4);

  const report = analyzeSearchPerformance(parsed);
  assert.equal(report.totalClicks, 267);
  assert.equal(report.totalImpressions, 5870);
  assert.ok(report.avgCtr > 4);
  assert.ok(report.strikingDistance.some((q) => q.query === "erp yazılımı"));
  assert.ok(report.lowCtrOpportunities.some((q) => q.query === "stok takip programı"));
});

test("parseSearchConsoleJson: JSON verilerini ayrıştırır", () => {
  const data = [
    { query: "akınsoft izmir", clicks: 210, impressions: 3200, ctr: 0.0656, position: 1.2 },
    { query: "wolvox erp fiyat", clicks: 45, impressions: 800, ctr: 0.056, position: 5.5 },
  ];

  const parsed = parseSearchConsoleJson(JSON.stringify(data));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.clicks, 210);
  assert.equal(parsed[0]?.ctr, 6.56);
});

