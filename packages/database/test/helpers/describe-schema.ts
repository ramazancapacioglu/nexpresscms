import { getTableConfig as pgConfig, type PgTable } from "drizzle-orm/pg-core";
import { getTableConfig as sqliteConfig, type SQLiteTable } from "drizzle-orm/sqlite-core";

/** İki şemada bilerek farklı olan sütunlar: [tablo, sqlite sütunu, pg sütunu]. */
export const KNOWN_COLUMN_RENAMES: Array<[string, string, string]> = [["content_chunks", "embedding_json", "embedding"]];

/** Yalnızca PostgreSQL'de anlamlı indeksler (SQLite eşi yok). */
export const PG_ONLY_INDEXES = new Set(["content_chunks_embedding_hnsw"]);

export type Table = SQLiteTable | PgTable;
export const isTable = (v: unknown): v is Table => typeof v === "object" && v !== null && Symbol.for("drizzle:Name") in (v as object);

export function collect(mod: Record<string, unknown>, prefix: string) {
  const out = new Map<string, Table>();
  for (const [key, value] of Object.entries(mod)) if (key.startsWith(prefix) && isTable(value)) out.set(key.slice(prefix.length), value);
  return out;
}

export function describeSqlite(t: SQLiteTable) {
  const c = sqliteConfig(t);
  return {
    name: c.name,
    columns: new Map(c.columns.map((col) => [col.name, { notNull: col.notNull, primary: col.primary, type: col.columnType }])),
    indexes: new Set(c.indexes.map((i) => i.config.name)),
  };
}
export function describePg(t: PgTable) {
  const c = pgConfig(t);
  return {
    name: c.name,
    columns: new Map(c.columns.map((col) => [col.name, { notNull: col.notNull, primary: col.primary, type: col.columnType }])),
    indexes: new Set(c.indexes.map((i) => i.config.name).filter((n): n is string => Boolean(n))),
  };
}

