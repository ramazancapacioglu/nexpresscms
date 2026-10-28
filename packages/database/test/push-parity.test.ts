import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import * as pg from "../src/schema/pg";
import * as sqlite from "../src/schema/sqlite";
import { collect, describePg, describeSqlite } from "./helpers/describe-schema";
import { compareWithSchema, introspect, type Actual } from "./helpers/introspect";

/**
 * `push.ts` ile kurulan GERÇEK veritabanı, Drizzle şemasıyla aynı mı?
 * (tablo, sütun, NOT NULL, indeks adları). Elle yazılan SQL ile şema sapınca bu test kırılır.
 * DB_TEST_PG_URL verilirse PostgreSQL'e karşı çalışır.
 */
const tempPg = await createTempPgDatabase();
const pgUrl = tempPg?.url;
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-parity-"));
const env = pgUrl
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: pgUrl }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };

const tsx = path.resolve(import.meta.dirname, "../../../node_modules/.bin/tsx");
let actual: Actual;
before(async () => {
  execFileSync(tsx, ["src/scripts/push.ts"], { cwd: path.resolve(import.meta.dirname, ".."), env, stdio: "pipe" });
  actual = await introspect({ pgUrl, sqliteUrl: env.SQLITE_URL });
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

test(`push.ts veritabanı (${pgUrl ? "PostgreSQL" : "SQLite"}) Drizzle şemasıyla birebir uyuşur`, () => {
  // push.ts DONDURULMUŞ tabandır: yalnızca 0000_baseline göçündeki tabloları üretir.
  // Sonradan eklenen tablolar `migrate.test.ts` (boş veritabanı -> şemayla aynı) ile doğrulanır.
  const baselineSql = fs.readFileSync(path.resolve(import.meta.dirname, "..", "migrations", pgUrl ? "pg" : "sqlite", "0000_baseline.sql"), "utf8");
  const baselineTables = new Set([...baselineSql.matchAll(/CREATE TABLE [`"](\w+)[`"]/g)].map((m) => m[1]!));
  const all = pgUrl
    ? [...collect(pg as Record<string, unknown>, "pg")].map(([, t]) => describePg(t as PgTable))
    : [...collect(sqlite as Record<string, unknown>, "sqlite")].map(([, t]) => describeSqlite(t as SQLiteTable));
  // Sonraki göçlerin eklediği sütunlar da tabana ait değildir (ALTER TABLE ... ADD)
  const dir = path.resolve(import.meta.dirname, "..", "migrations", pgUrl ? "pg" : "sqlite");
  const later = new Set<string>();
  const laterIndexes = new Set<string>();
  for (const f of fs.readdirSync(dir).filter((n) => /^\d{4}_.*\.sql$/.test(n) && !n.startsWith("0000_"))) {
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/ALTER TABLE [`"](\w+)[`"] ADD (?:COLUMN )?[`"](\w+)[`"]/g)) later.add(`${m[1]}.${m[2]}`);
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?[`"](\w+)[`"] ON [`"](\w+)[`"]/g)) laterIndexes.add(`${m[2]}.${m[1]}`);
  }
  const expected = all
    .filter((t) => baselineTables.has(t.name))
    .map((t) => ({ ...t, columns: new Map([...t.columns].filter(([col]) => !later.has(`${t.name}.${col}`))), indexes: new Set([...t.indexes].filter((i) => !laterIndexes.has(`${t.name}.${i}`))) }));
  assert.ok(expected.length >= 31, `taban tablo sayısı: ${expected.length}`);
  const problems = compareWithSchema(actual, expected);
  assert.deepEqual(problems, []);
});
