import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import postgres from "postgres";
import { createClient, type Client as LibsqlClient } from "@libsql/client";
import type { DbDialect } from "@nexpress/core";
import * as pgSchema from "./schema/pg";
import * as sqliteSchema from "./schema/sqlite";
import fs from "node:fs";
import path from "node:path";

export function getDbDialect(): DbDialect {
  const raw = process.env.DB_DIALECT?.trim().toLowerCase();
  return raw === "sqlite" ? "sqlite" : "postgresql";
}

const globalForDb = globalThis as unknown as {
  __nexpressPgSql?: postgres.Sql;
  __nexpressPgDb?: PostgresJsDatabase<typeof pgSchema>;
  __nexpressLibsqlClient?: LibsqlClient;
  __nexpressSqliteDb?: LibSQLDatabase<typeof sqliteSchema>;
};

export function getPgClient(): {
  sql: postgres.Sql;
  db: PostgresJsDatabase<typeof pgSchema>;
} {
  if (!globalForDb.__nexpressPgSql || !globalForDb.__nexpressPgDb) {
    const connectionString =
      process.env.DATABASE_URL ??
      "postgresql://nexpress:nexpress_secret_password@localhost:5434/nexpress_cms";
    const sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
    });
    const db = drizzlePg(sql, { schema: pgSchema });
    globalForDb.__nexpressPgSql = sql;
    globalForDb.__nexpressPgDb = db;
  }
  return {
    sql: globalForDb.__nexpressPgSql,
    db: globalForDb.__nexpressPgDb,
  };
}

export function getSqliteClient(): {
  client: LibsqlClient;
  db: LibSQLDatabase<typeof sqliteSchema>;
} {
  if (!globalForDb.__nexpressLibsqlClient || !globalForDb.__nexpressSqliteDb) {
    const rawUrl = process.env.SQLITE_URL ?? "file:./data/nexpress.db";
    if (rawUrl.startsWith("file:")) {
      const filePath = rawUrl.replace(/^file:/, "");
      const dir = path.dirname(path.resolve(process.cwd(), filePath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    const client = createClient({ url: rawUrl });
    const db = drizzleLibsql(client, { schema: sqliteSchema });
    globalForDb.__nexpressLibsqlClient = client;
    globalForDb.__nexpressSqliteDb = db;
  }
  return {
    client: globalForDb.__nexpressLibsqlClient,
    db: globalForDb.__nexpressSqliteDb,
  };
}
