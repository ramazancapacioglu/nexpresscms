import { randomBytes } from "node:crypto";

/**
 * PostgreSQL testleri için her çağrıya özel geçici veritabanı.
 * `DB_TEST_PG_URL` bir SUNUCU adresidir (veritabanı adı önemsizdir; yönetici bağlantısı için kullanılır).
 * Veritabanı yoksa (`DB_TEST_PG_URL` boş) `null` döner ve test SQLite'a düşer.
 */
export async function createTempPgDatabase(): Promise<{ url: string; drop: () => Promise<void> } | null> {
  const base = process.env.DB_TEST_PG_URL;
  if (!base) return null;
  const postgres = (await import("postgres")).default;
  const admin = new URL(base);
  admin.pathname = "/postgres";
  const name = `nx_t_${randomBytes(5).toString("hex")}`;
  const sql = postgres(admin.toString(), { max: 1 });
  await sql.unsafe(`CREATE DATABASE ${name}`);
  await sql.end();
  const url = new URL(base);
  url.pathname = `/${name}`;
  return {
    url: url.toString(),
    drop: async () => {
      const s = postgres(admin.toString(), { max: 1 });
      await s.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await s.end();
    },
  };
}
