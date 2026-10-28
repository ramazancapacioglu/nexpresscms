import assert from "node:assert/strict";
import { test } from "node:test";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import * as pg from "../src/schema/pg";
import * as sqlite from "../src/schema/sqlite";

import { KNOWN_COLUMN_RENAMES, PG_ONLY_INDEXES, collect, describePg, describeSqlite } from "./helpers/describe-schema";

/** SQLite sütun türü -> PostgreSQL karşılığı (JSON, boolean ve tarih motorlara göre depolanır). */
const COMPATIBLE: Record<string, string[]> = {
  SQLiteText: ["PgText"],
  SQLiteTextJson: ["PgJsonb"],
  SQLiteInteger: ["PgInteger"],
  SQLiteBoolean: ["PgBoolean"],
  SQLiteTimestamp: ["PgTimestamp"],
};

const sqliteTables = collect(sqlite as Record<string, unknown>, "sqlite");
const pgTables = collect(pg as Record<string, unknown>, "pg");

test("her SQLite tablosunun PostgreSQL eşi vardır ve tersi", () => {
  assert.deepEqual([...sqliteTables.keys()].sort(), [...pgTables.keys()].sort());
  assert.ok(sqliteTables.size >= 30, String(sqliteTables.size));
});

test("tablo adı, sütun adları, NOT NULL, birincil anahtar ve indeks adları iki motorda aynıdır", () => {
  const problems: string[] = [];
  for (const [key, st] of sqliteTables) {
    const s = describeSqlite(st as SQLiteTable);
    const p = describePg(pgTables.get(key) as PgTable);
    if (s.name !== p.name) problems.push(`${key}: tablo adı ${s.name} ≠ ${p.name}`);
    const rename = (name: string) => KNOWN_COLUMN_RENAMES.find((r) => r[0] === s.name && r[1] === name)?.[2] ?? name;
    const sNames = new Set([...s.columns.keys()].map(rename));
    for (const n of sNames) if (!p.columns.has(n)) problems.push(`${s.name}: sütun yalnızca SQLite'ta: ${n}`);
    for (const n of p.columns.keys()) if (!sNames.has(n)) problems.push(`${s.name}: sütun yalnızca PostgreSQL'de: ${n}`);
    for (const [name, sc] of s.columns) {
      const pc = p.columns.get(rename(name));
      if (!pc) continue;
      if (sc.notNull !== pc.notNull && name !== "embedding_json") problems.push(`${s.name}.${name}: NOT NULL ${sc.notNull} ≠ ${pc.notNull}`);
      if (sc.primary !== pc.primary) problems.push(`${s.name}.${name}: birincil anahtar ${sc.primary} ≠ ${pc.primary}`);
      const allowed = COMPATIBLE[sc.type];
      if (allowed && !allowed.includes(pc.type) && name !== "embedding_json") problems.push(`${s.name}.${name}: tür ${sc.type} ↔ ${pc.type}`);
    }
    for (const i of s.indexes) if (!p.indexes.has(i)) problems.push(`${s.name}: indeks yalnızca SQLite'ta: ${i}`);
    for (const i of p.indexes) if (!s.indexes.has(i) && !PG_ONLY_INDEXES.has(i)) problems.push(`${s.name}: indeks yalnızca PostgreSQL'de: ${i}`);
  }
  assert.deepEqual(problems, []);
});

test("AGENTS.md kural 2: her tabloda siteId sütunu ve indeksi vardır (sites hariç, kendisi kiracı)", () => {
  const missing: string[] = [];
  for (const [key, t] of sqliteTables) {
    const d = describeSqlite(t as SQLiteTable);
    if (!d.columns.has("site_id")) missing.push(`${d.name}: site_id yok`);
    else if (key !== "Sites" && ![...d.indexes].some((i) => i.includes("site"))) missing.push(`${d.name}: site indeksi yok`);
  }
  assert.deepEqual(missing, []);
});
