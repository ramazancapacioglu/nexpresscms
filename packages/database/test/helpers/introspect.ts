import { createClient } from "@libsql/client";

export type Actual = Map<string, { columns: Map<string, boolean>; indexes: Set<string> }>; // sütun -> notNull

/** Gerçek veritabanını okur: tablo -> sütunlar (NOT NULL) ve indeks adları. Göç/günlük tabloları hariç. */
export async function introspect(target: { pgUrl?: string; sqliteUrl?: string }): Promise<Actual> {
  const out: Actual = new Map();
  if (target.pgUrl) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(target.pgUrl, { max: 1 });
    for (const r of await sql`select table_name, column_name, is_nullable from information_schema.columns where table_schema = 'public'`) {
      const t = out.get(r.table_name) ?? { columns: new Map(), indexes: new Set() };
      t.columns.set(r.column_name, r.is_nullable === "NO");
      out.set(r.table_name, t);
    }
    for (const r of await sql`select tablename, indexname from pg_indexes where schemaname = 'public'`) out.get(r.tablename)?.indexes.add(r.indexname);
    await sql.end();
    return out;
  }
  const c = createClient({ url: target.sqliteUrl! });
  const tables = (await c.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '__drizzle%'")).rows;
  for (const { name } of tables) {
    const t = { columns: new Map<string, boolean>(), indexes: new Set<string>() };
    for (const col of (await c.execute(`pragma table_info('${name}')`)).rows) t.columns.set(String(col.name), Number(col.notnull) === 1 || Number(col.pk) > 0);
    for (const ix of (await c.execute(`pragma index_list('${name}')`)).rows) if (!String(ix.name).startsWith("sqlite_autoindex")) t.indexes.add(String(ix.name));
    out.set(String(name), t);
  }
  c.close();
  return out;
}

/** Beklenen (Drizzle şemasından) ile gerçek veritabanını karşılaştırır; sorun listesi döner. */
export function compareWithSchema(actual: Actual, expected: Array<{ name: string; columns: Map<string, { notNull: boolean; primary: boolean }>; indexes: Set<string> }>): string[] {
  const problems: string[] = [];
  for (const t of expected) {
    const a = actual.get(t.name);
    if (!a) {
      problems.push(`tablo yok: ${t.name}`);
      continue;
    }
    for (const [col, def] of t.columns) {
      if (!a.columns.has(col)) problems.push(`${t.name}.${col}: veritabanında yok`);
      else if (a.columns.get(col) !== def.notNull && !def.primary) problems.push(`${t.name}.${col}: NOT NULL şema=${def.notNull} veritabanı=${a.columns.get(col)}`);
    }
    for (const col of a.columns.keys()) if (!t.columns.has(col)) problems.push(`${t.name}.${col}: şemada yok (fazladan sütun)`);
    for (const ix of t.indexes) if (!a.indexes.has(ix)) problems.push(`${t.name}: indeks yok: ${ix}`);
    for (const ix of a.indexes) if (!t.indexes.has(ix) && !ix.endsWith("_pkey")) problems.push(`${t.name}: indeks şemada tanımlı değil: ${ix}`);
  }
  for (const name of actual.keys()) if (!expected.some((t) => t.name === name)) problems.push(`şemada olmayan tablo: ${name}`);
  return problems;
}
