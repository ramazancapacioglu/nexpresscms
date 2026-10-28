import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { createTempPgDatabase } from "./helpers/pg-temp";
import { createClient } from "@libsql/client";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import * as pg from "../src/schema/pg";
import * as sqlite from "../src/schema/sqlite";
import { collect, describePg, describeSqlite } from "./helpers/describe-schema";
import { compareWithSchema, introspect } from "./helpers/introspect";

/**
 * Göç sistemi: boş veritabanı, eski (push.ts) veritabanı ve tekrar çalıştırma.
 * DB_TEST_PG_URL (sunucu adresi) verilirse PostgreSQL'e karşı, test dosyasına özel geçici veritabanında çalışır.
 */
const tempPg = await createTempPgDatabase();
const pgUrl = tempPg?.url;
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-mig-"));
const pkg = path.resolve(import.meta.dirname, "..");
const tsx = path.resolve(pkg, "node_modules/.bin/tsx");
const kit = path.resolve(pkg, "node_modules/.bin/drizzle-kit");
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const dbEnv = (name: string) =>
  pgUrl
    ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: pgUrl }
    : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, `${name}.db`)}` };

const migrationCount = (dir: string) => fs.readdirSync(path.join(pkg, "migrations", dir)).filter((f) => f.endsWith(".sql")).length;

const run = (script: string, env: NodeJS.ProcessEnv) =>
  execFileSync(tsx, [`src/scripts/${script}`], { cwd: pkg, env, encoding: "utf8", stdio: "pipe" });
const modeOf = (out: string) => /mod: (\w+), bekleyen: (\d+)/.exec(out)!.slice(1, 3);

async function resetPg() {
  const postgres = (await import("postgres")).default;
  const sql = postgres(pgUrl!, { max: 1 });
  await sql`drop schema public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;
  await sql.end();
}

const expected = () =>
  pgUrl
    ? [...collect(pg as Record<string, unknown>, "pg")].map(([, t]) => describePg(t as PgTable))
    : [...collect(sqlite as Record<string, unknown>, "sqlite")].map(([, t]) => describeSqlite(t as SQLiteTable));

test("boş veritabanı: göçler tabanı kurar ve sonuç Drizzle şemasıyla birebir aynıdır", async () => {
  if (pgUrl) await resetPg();
  const env = dbEnv("fresh");
  assert.deepEqual(modeOf(run("migrate.ts", env)), ["fresh", "0"]);
  const actual = await introspect({ pgUrl, sqliteUrl: env.SQLITE_URL });
  assert.deepEqual(compareWithSchema(actual, expected()), []);
  assert.deepEqual(modeOf(run("migrate.ts", env)), ["current", "0"], "tekrar çalıştırma hiçbir şey yapmaz");
});

test("eski (push.ts) veritabanı: veri korunur, taban işaretlenir, ikinci çalıştırma güncel", async () => {
  if (pgUrl) await resetPg();
  const env = dbEnv("legacy");
  run("push.ts", env);
  // Eski veritabanında gerçek veri olsun
  if (pgUrl) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(pgUrl, { max: 1 });
    await sql`insert into users (id, site_id, email, name, password_hash, role) values ('u1','default','eski@example.com','Eski','h','admin')`;
    await sql.end();
  } else {
    const c = createClient({ url: env.SQLITE_URL! });
    await c.execute("insert into users (id, site_id, email, name, password_hash, role, created_at) values ('u1','default','eski@example.com','Eski','h','admin', 1)");
    c.close();
  }
  assert.deepEqual(modeOf(run("migrate.ts", env)), ["baselined", "0"]);
  assert.deepEqual(modeOf(run("migrate.ts", env)), ["current", "0"]);
  const actual = await introspect({ pgUrl, sqliteUrl: env.SQLITE_URL });
  assert.deepEqual(compareWithSchema(actual, expected()), []);
  if (!pgUrl) {
    const c = createClient({ url: env.SQLITE_URL! });
    assert.equal((await c.execute("select email from users")).rows[0]!.email, "eski@example.com", "veri korunur");
    assert.equal((await c.execute("select count(*) n from __drizzle_migrations")).rows[0]!.n, migrationCount("sqlite"), "günlükte taban + sonraki tüm göçler");
    c.close();
  }
});

test("şema değişikliği göç dosyası olmadan bırakılmamıştır (drizzle-kit generate 'değişiklik yok' der)", () => {
  const dialects = [
    { dialect: "sqlite", schema: "./src/schema/sqlite.ts", dir: "sqlite" },
    { dialect: "postgresql", schema: "./src/schema/pg.ts", dir: "pg" },
  ];
  for (const d of dialects) {
    // drizzle-kit `--out` için GÖRELİ yol ister; üretim dosyalarına dokunmamak için kopyada çalışılır
    const rel = `.tmp-gen-${d.dir}-${process.pid}`;
    const tmp = path.join(pkg, rel);
    fs.cpSync(path.join(pkg, "migrations", d.dir), tmp, { recursive: true });
    try {
      const out = execFileSync(kit, ["generate", "--dialect", d.dialect, "--schema", d.schema, "--out", `./${rel}`], { cwd: pkg, encoding: "utf8", stdio: "pipe" });
      assert.match(out, /No schema changes, nothing to migrate/, `${d.dir}: şema değişmiş ama göç üretilmemiş; 'pnpm db:generate' çalıştırın.\n${out.slice(-300)}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
});

test("yeni göç (en son göçün ardından) mevcut veritabanına uygulanır: günlük korunur, veri korunur, ikinci çalıştırma güncel", async () => {
  if (pgUrl) await resetPg();
  const dialect = pgUrl ? "postgresql" : "sqlite";
  const dir = pgUrl ? "pg" : "sqlite";
  const schemaFile = pgUrl ? "src/schema/pg.ts" : "src/schema/sqlite.ts";
  const env = dbEnv("upgrade");

  // 1) Gerçek taban göçleriyle veritabanı kur ve veri ekle
  assert.deepEqual(modeOf(run("migrate.ts", env)), ["fresh", "0"]);
  if (pgUrl) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(pgUrl, { max: 1 });
    await sql`insert into users (id, site_id, email, name, password_hash, role) values ('u1','default','a@example.com','A','h','admin')`;
    await sql.end();
  } else {
    const c = createClient({ url: env.SQLITE_URL! });
    await c.execute("insert into users (id, site_id, email, name, password_hash, role, created_at) values ('u1','default','a@example.com','A','h','admin', 1)");
    c.close();
  }

  // 2) Şemanın değiştirilmiş KOPYASINDAN gerçek bir 0001 göçü üret (üretim şemasına dokunmadan)
  const rel = `.tmp-gen-up-${dir}-${process.pid}`;
  const tmp = path.join(pkg, rel);
  const tmpSchema = path.join(pkg, `src/schema/_tmp_up_${dir}_${process.pid}.ts`);
  try {
    fs.cpSync(path.join(pkg, "migrations", dir), tmp, { recursive: true });
    const marker = 'passwordChangedAt: ' + (pgUrl ? 'timestamp("password_changed_at"),' : 'integer("password_changed_at", { mode: "timestamp" }),');
    const original = fs.readFileSync(path.join(pkg, schemaFile), "utf8");
    assert.ok(original.includes(marker), "şema işaretçisi bulunamadı");
    fs.writeFileSync(tmpSchema, original.replace(marker, marker + '\n    twoFactorSecret: text("two_factor_secret"),'));
    execFileSync(kit, ["generate", "--dialect", dialect, "--schema", `./${path.relative(pkg, tmpSchema)}`, "--out", `./${rel}`, "--name", "two_factor"], { cwd: pkg, stdio: "pipe" });
    const sqlFiles = fs.readdirSync(tmp).filter((f) => f.endsWith(".sql")).sort();
    assert.equal(sqlFiles.length, migrationCount(dir) + 1, sqlFiles.join());
    assert.match(fs.readFileSync(path.join(tmp, sqlFiles.at(-1)!), "utf8"), /two_factor_secret/);

    // 3) Çalıştırıcı yalnızca bekleyen 0001'i uygular
    const upgraded = { ...env, NEXPRESS_MIGRATIONS_DIR: tmp };
    assert.deepEqual(modeOf(run("migrate.ts", upgraded)), ["upgraded", "0"]);
    assert.deepEqual(modeOf(run("migrate.ts", upgraded)), ["current", "0"]);
    if (pgUrl) {
      const postgres = (await import("postgres")).default;
      const sql = postgres(pgUrl, { max: 1 });
      assert.equal((await sql`select email, two_factor_secret from users`)[0]!.email, "a@example.com");
      assert.equal((await sql`select count(*)::int n from drizzle.__drizzle_migrations`)[0]!.n, migrationCount("pg") + 1);
      await sql.end();
    } else {
      const c = createClient({ url: env.SQLITE_URL! });
      const row = (await c.execute("select email, two_factor_secret from users")).rows[0]!;
      assert.equal(row.email, "a@example.com", "veri korunur");
      assert.equal(row.two_factor_secret, null, "yeni sütun boş gelir");
      assert.equal((await c.execute("select count(*) n from __drizzle_migrations")).rows[0]!.n, migrationCount("sqlite") + 1, "günlükte mevcut göçler + yeni");
      c.close();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(tmpSchema, { force: true });
  }
});
