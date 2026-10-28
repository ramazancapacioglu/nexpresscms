import type { DbDialect } from "@nexpress/core";
import { eq, type AnyColumn } from "drizzle-orm";
import { getPgClient, getSqliteClient } from "./client";
import * as pgSchema from "./schema/pg";
import * as sqliteSchema from "./schema/sqlite";

/**
 * İki motor için ortak sorgu yüzeyi. Drizzle'ın SQLite ve PostgreSQL oluşturucuları aynı
 * zincir API'sine sahiptir ve iki şema `test/schema-parity.test.ts` ile sütun/indeks düzeyinde
 * birebir doğrulanır; bu yüzden basit CRUD için tabloyu ve istemciyi tek bir tipe daraltırız
 * (motor başına ayrı kod yazmak yerine bir adaptör). Her iki motorda da testlerle doğrulanır.
 * Yalnızca gerçekten farklı işler (ham SQL, vektör araması, `returning` farkı) ayrıca dallanır.
 */
export type CommonDb = ReturnType<typeof getSqliteClient>["db"];

type SqliteExports = typeof sqliteSchema;
type StripPrefix<K extends string> = K extends `sqlite${infer R}` ? Uncapitalize<R> : never;
/** `sqliteContentTranslations` -> `contentTranslations` */
export type Tables = { [K in keyof SqliteExports as K extends `sqlite${string}` ? StripPrefix<K & string> : never]: SqliteExports[K] };

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function collectTables(mod: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mod)) {
    if (key.startsWith(prefix) && typeof value === "object" && value !== null) out[lowerFirst(key.slice(prefix.length))] = value;
  }
  return out;
}

const sqliteTables = collectTables(sqliteSchema as Record<string, unknown>, "sqlite") as unknown as Tables;
const pgTables = collectTables(pgSchema as Record<string, unknown>, "pg") as unknown as Tables;

export function backendFor(dialect: DbDialect) {
  if (dialect === "sqlite") {
    return { db: getSqliteClient().db, t: sqliteTables, users: sqliteTables.users, audit: sqliteTables.auditLog };
  }
  return {
    db: getPgClient().db as unknown as CommonDb,
    t: pgTables,
    users: pgTables.users,
    audit: pgTables.auditLog,
  };
}

/**
 * Kiracıya kapalı, atomik upsert. Kimlik başka bir kiracıya aitse satır GÜNCELLENMEZ
 * (`setWhere`) ve `siteId` hiçbir zaman değiştirilemez; çağıran, kaydı `siteId` kapsamlı
 * okuyarak sonucu doğrular. Güncellemede `id`, `siteId` ve `createdAt` korunur.
 */
export async function upsertScoped(
  db: CommonDb,
  table: { id: AnyColumn; siteId: AnyColumn },
  siteId: string,
  record: Record<string, unknown>,
  update?: Record<string, unknown>
): Promise<void> {
  const { id: _id, siteId: _siteId, createdAt: _createdAt, ...rest } = record;
  await db
    .insert(table as never)
    .values(record as never)
    .onConflictDoUpdate({ target: table.id as never, set: (update ?? rest) as never, setWhere: eq(table.siteId, siteId) });
}
