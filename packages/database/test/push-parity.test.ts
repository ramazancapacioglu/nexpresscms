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

const tsx = path.resolve(import.meta.dirname, "../node_modules/.bin/tsx");
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
  const expected = all.filter((t) => baselineTables.has(t.name));
  assert.ok(expected.length >= 31, `taban tablo sayısı: ${expected.length}`);
  const problems = compareWithSchema(actual, expected);
  assert.deepEqual(problems, []);
});
