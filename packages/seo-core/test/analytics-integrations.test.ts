import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregateBingQueryStats,
  type BingQueryRow,
} from "../src/analytics-integrations";

test("aggregateBingQueryStats: çoklu haftalık satırları birleştirir ve ortalama pozisyon hesaplar", () => {
  const rows: BingQueryRow[] = [
    { query: "wolvox erp", clicks: 10, impressions: 100, position: 2.0 },
    { query: "wolvox erp", clicks: 5, impressions: 50, position: 4.0 },
    { query: "muhasebe programı", clicks: 20, impressions: 400, position: 1.5 },
  ];

  const aggregated = aggregateBingQueryStats(rows);
  assert.equal(aggregated.length, 2);

  const wolvox = aggregated.find((r) => r.query === "wolvox erp");
  assert.ok(wolvox);
  assert.equal(wolvox.clicks, 15);
  assert.equal(wolvox.impressions, 150);
  assert.equal(wolvox.position, 3.0); // (2.0 + 4.0) / 2

  const muhasebe = aggregated.find((r) => r.query === "muhasebe programı");
  assert.ok(muhasebe);
  assert.equal(muhasebe.clicks, 20);
});

