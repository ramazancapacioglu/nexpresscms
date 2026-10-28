import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate as migrateSqlite } from "drizzle-orm/libsql/migrator";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { existsSync } from "node:fs";
import path from "node:path";
import { getDbDialect, getPgClient, getSqliteClient } from "../client";
import { pushSchema } from "./push";

/**
 * Veritabanı göç çalıştırıcısı (`pnpm db:migrate`). Her iki motor için aynı mantık:
 *  - boş veritabanı  -> göçler baştan uygulanır (`fresh`)
 *  - eski (push.ts) veritabanı, göç günlüğü yok -> önce eski betik ile güncel taban şemaya getirilir
 *    (idempotent), sonra 0000 "uygulandı" işaretlenir (`baselined`); ardından bekleyen göçler çalışır
 *  - göç günlüğü var -> yalnızca bekleyen göçler uygulanır (`upgraded` / `current`)
 * `push.ts` bundan sonra DEĞİŞTİRİLMEZ: şema değişiklikleri `pnpm db:generate` ile göç dosyası olur.
 */
export type MigrateMode = "fresh" | "baselined" | "upgraded" | "current";
export interface MigrateResult {
  mode: MigrateMode;
  pending: number;
}

/** `NEXPRESS_MIGRATIONS_DIR` yalnızca testler içindir (üretilmiş göç klasörünü geçersiz kılar). */
const folderFor = (dialect: "sqlite" | "postgresql") => {
  if (process.env.NEXPRESS_MIGRATIONS_DIR) return process.env.NEXPRESS_MIGRATIONS_DIR;
  const sub = dialect === "sqlite" ? "sqlite" : "pg";
  // Derlenmiş (Next) pakette `import.meta.dirname` derleme çıktısını gösterir: çalışma dizininden de aranır.
  const candidates = [
    path.resolve(import.meta.dirname ?? ".", "../../migrations", sub),
    path.resolve(process.cwd(), "../../packages/database/migrations", sub),
    path.resolve(process.cwd(), "packages/database/migrations", sub),
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0]!;
};

async function sqliteState() {
  const { client } = getSqliteClient();
  const has = async (name: string) => (await client.execute({ sql: "select 1 from sqlite_master where type='table' and name = ?", args: [name] })).rows.length > 0;
  const journal = await has("__drizzle_migrations");
  const lastApplied = journal
    ? Number((await client.execute("select created_at from __drizzle_migrations order by created_at desc limit 1")).rows[0]?.created_at ?? 0)
    : 0;
  return { legacy: await has("sites"), journalRows: journal && lastApplied > 0, lastApplied };
}

async function pgState() {
  const { sql } = getPgClient();
  const legacy = (await sql`select to_regclass('public.sites') as t`)[0]!.t !== null;
  const hasJournal = (await sql`select to_regclass('drizzle.__drizzle_migrations') as t`)[0]!.t !== null;
  const lastApplied = hasJournal ? Number((await sql`select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`)[0]?.created_at ?? 0) : 0;
  return { legacy, journalRows: hasJournal && lastApplied > 0, lastApplied };
}

async function markBaselineSqlite(hash: string, millis: number) {
  const { client } = getSqliteClient();
  await client.execute("CREATE TABLE IF NOT EXISTS \"__drizzle_migrations\" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)");
  await client.execute({ sql: 'INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)', args: [hash, millis] });
}

async function markBaselinePg(hash: string, millis: number) {
  const { sql } = getPgClient();
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`;
  await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${millis})`;
}

/** Yönetim paneli için salt-okunur göç durumu: uygulanan/toplam/bekleyen. */
export async function migrationStatus(): Promise<{ dialect: "sqlite" | "postgresql"; total: number; pending: number; legacy: boolean }> {
  const dialect = getDbDialect();
  const files = readMigrationFiles({ migrationsFolder: folderFor(dialect) });
  const state = dialect === "sqlite" ? await sqliteState() : await pgState();
  const pending = state.journalRows ? files.filter((f) => f.folderMillis > state.lastApplied).length : files.length;
  return { dialect, total: files.length, pending, legacy: state.legacy && !state.journalRows };
}

export async function migrateDatabase(): Promise<MigrateResult> {
  const dialect = getDbDialect();
  const folder = folderFor(dialect);
  const files = readMigrationFiles({ migrationsFolder: folder });
  const state = dialect === "sqlite" ? await sqliteState() : await pgState();
  let mode: MigrateMode;

  if (state.journalRows) {
    const pending = files.filter((f) => f.folderMillis > state.lastApplied).length;
    mode = pending > 0 ? "upgraded" : "current";
  } else if (state.legacy) {
    console.log("[NexPress DB] Eski (push.ts) veritabanı bulundu: taban şemaya getirilip 0000 işaretleniyor…");
    await pushSchema();
    const baseline = files[0]!;
    if (dialect === "sqlite") await markBaselineSqlite(baseline.hash, baseline.folderMillis);
    else await markBaselinePg(baseline.hash, baseline.folderMillis);
    mode = "baselined";
  } else {
    mode = "fresh";
  }

  if (dialect === "sqlite") {
    await migrateSqlite(getSqliteClient().db, { migrationsFolder: folder });
  } else {
    const { sql, db } = getPgClient();
    await sql`select pg_advisory_lock(727272)`; // eşzamanlı iki çalıştırıcı aynı göçü iki kez uygulamasın
    try {
      await migratePg(db, { migrationsFolder: folder });
    } finally {
      await sql`select pg_advisory_unlock(727272)`;
    }
  }

  const after = dialect === "sqlite" ? await sqliteState() : await pgState();
  const pendingAfter = files.filter((f) => f.folderMillis > after.lastApplied).length;
  console.log(`[NexPress DB] Göç tamam (${dialect}, mod: ${mode}, bekleyen: ${pendingAfter}).`);
  return { mode, pending: pendingAfter };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("[NexPress DB] Göç başarısız:", error);
      process.exit(1);
    });
}
