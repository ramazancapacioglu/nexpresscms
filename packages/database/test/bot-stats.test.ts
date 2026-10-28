import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeBotRows, utcDay, type BotStatRow } from "../src/bot-stats-repository";

const d = (s: string) => new Date(s);

test("utcDay UTC gün sınırını kullanır", () => {
  assert.equal(utcDay(d("2026-10-28T23:59:59.999Z")), "2026-10-28");
  assert.equal(utcDay(d("2026-10-29T00:00:00.000Z")), "2026-10-29");
});

test("özet: bota göre toplar, doğrulananı ve türleri ayırır, çoktan aza sıralar", () => {
  const rows: BotStatRow[] = [
    { botId: "gptbot", kind: "page", trust: "claimed", hits: 5, lastSeenAt: d("2026-10-28T10:00:00Z") },
    { botId: "gptbot", kind: "llms", trust: "claimed", hits: 2, lastSeenAt: d("2026-10-28T12:00:00Z") },
    { botId: "googlebot", kind: "page", trust: "verified", hits: 20, lastSeenAt: d("2026-10-27T09:00:00Z") },
    { botId: "googlebot", kind: "page", trust: "claimed", hits: 3, lastSeenAt: d("2026-10-27T08:00:00Z") },
  ];
  const [first, second] = summarizeBotRows(rows);
  assert.equal(first!.botId, "googlebot");
  assert.equal(first!.total, 23);
  assert.equal(first!.verified, 20, "sahte UA doğrulanmış sayılmaz");
  assert.equal(second!.total, 7);
  assert.deepEqual(second!.byKind, { page: 5, llms: 2 });
  assert.equal(second!.lastSeenAt.toISOString(), "2026-10-28T12:00:00.000Z");
});

test("boş girdi boş özet verir", () => {
  assert.deepEqual(summarizeBotRows([]), []);
});
