import test from "node:test";
import assert from "node:assert/strict";
import { buildBotDailySeries, summarizeBotPageRows } from "../src/bot-stats-repository";

test("bot-stats: sayfa bazlı bot özetleme ve filtreleme", () => {
  const t1 = new Date("2026-11-24T10:00:00Z");
  const t2 = new Date("2026-11-25T12:00:00Z");
  const rows = [
    { day: "2026-11-24", botId: "gptbot", kind: "markdown", path: "/wolvox-erp", hits: 4, lastSeenAt: t1 },
    { day: "2026-11-25", botId: "claudebot", kind: "page", path: "/wolvox-erp", hits: 3, lastSeenAt: t2 },
    { day: "2026-11-25", botId: "gptbot", kind: "llms", path: "/llms.txt", hits: 2, lastSeenAt: t2 },
  ];

  const all = summarizeBotPageRows(rows);
  assert.equal(all.length, 2);
  assert.equal(all[0]!.path, "/wolvox-erp");
  assert.equal(all[0]!.total, 7);
  assert.deepEqual(all[0]!.byBot, { gptbot: 4, claudebot: 3 });
  assert.deepEqual(all[0]!.byKind, { markdown: 4, page: 3 });

  const onlyClaude = summarizeBotPageRows(rows, { botId: "claudebot" });
  assert.equal(onlyClaude.length, 1);
  assert.equal(onlyClaude[0]!.total, 3);

  const onlyMd = summarizeBotPageRows(rows, { kind: "markdown" });
  assert.equal(onlyMd.length, 1);
  assert.equal(onlyMd[0]!.path, "/wolvox-erp");
});

test("bot-stats: günlük seri eksik günleri sıfırla doldurur", () => {
  const series = buildBotDailySeries(
    [{ day: "2026-11-24", botId: "gptbot", kind: "page", trust: "verified", hits: 5, lastSeenAt: new Date("2026-11-24T10:00:00Z") }],
    "2026-11-23",
    "2026-11-25"
  );
  assert.equal(series.length, 3);
  assert.deepEqual(series.map((s) => [s.day, s.total]), [
    ["2026-11-23", 0],
    ["2026-11-24", 5],
    ["2026-11-25", 0],
  ]);
});
