import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWithDates, stringifyWithDates } from "../src/json-dates";

test("tarihler gidiş-dönüşte Date kalır, iç içe ve dizi içinde de", () => {
  const input = {
    id: "a",
    createdAt: new Date("2026-10-28T10:00:00.000Z"),
    nested: { list: [{ updatedAt: new Date(0) }], none: null, text: "2026-10-28" },
  };
  const out = parseWithDates<typeof input>(stringifyWithDates(input));
  assert.ok(out.createdAt instanceof Date);
  assert.equal(out.createdAt.toISOString(), "2026-10-28T10:00:00.000Z");
  assert.ok(out.nested.list[0]!.updatedAt instanceof Date);
  assert.equal(out.nested.none, null);
  assert.equal(out.nested.text, "2026-10-28", "düz dize tarihe çevrilmez");
});

test("null ve undefined alanlar korunur", () => {
  assert.deepEqual(parseWithDates(stringifyWithDates({ a: null })), { a: null });
  assert.equal(parseWithDates(stringifyWithDates(null)), null);
});
