import fs from "node:fs";
import path from "node:path";
import { count, eq, type AnyColumn } from "drizzle-orm";
import { getDbDialect, getPgClient, getSqliteClient } from "./client";
import { backendFor, type CommonDb } from "./dialect";

export interface TableCount {
  label: string;
  rows: number;
}

const COUNTS: Array<{ key: string; label: string }> = [
  { key: "contents", label: "İçerik" },
  { key: "contentTranslations", label: "Çeviri" },
  { key: "mediaAssets", label: "Medya" },
  { key: "commentsReviews", label: "Yorum" },
  { key: "redirects", label: "Yönlendirme" },
  { key: "commerceProducts", label: "Ürün" },
  { key: "commerceOrders", label: "Sipariş" },
];

/** Kiracı satır sayıları ve motorun istatistik güncellemesi. Ham SQL yalnızca bu dosyada. */
export class PerformanceRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect = getDbDialect()
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  /** Bu kiracının satır sayıları. Bakım komutu ise veritabanının tamamına işler. */
  public async tableCounts(): Promise<TableCount[]> {
    const { db, t } = this.backend;
    const tables = t as unknown as Record<string, { siteId: AnyColumn }>;
    const out: TableCount[] = [];
    for (const item of COUNTS) {
      const table = tables[item.key];
      if (!table) continue;
      out.push({ label: item.label, rows: await countScoped(db, table, this.siteId) });
    }
    return out;
  }

  /** Veritabanı dosyasının veya PostgreSQL kümesinin bayt boyu. */
  public async databaseBytes(): Promise<number | null> {
    if (this.dialect === "sqlite") {
      const raw = process.env.SQLITE_URL ?? "file:./data/nexpress.db";
      if (!raw.startsWith("file:")) return null;
      try {
        return fs.statSync(path.resolve(raw.slice("file:".length))).size;
      } catch {
        return null;
      }
    }
    const rows = await getPgClient().sql<{ bytes: string }[]>`select pg_database_size(current_database())::text as bytes`;
    const bytes = Number(rows[0]?.bytes ?? "");
    return Number.isFinite(bytes) ? bytes : null;
  }

  /**
   * Planlayıcı istatistiğini günceller. Kilitli VACUUM FULL çalıştırılmaz.
   * PostgreSQL `ANALYZE`, SQLite `ANALYZE` ve `PRAGMA optimize`.
   */
  public async analyze(): Promise<{ dialect: string; statement: string }> {
    if (this.dialect === "sqlite") {
      const client = getSqliteClient().client;
      await client.execute("ANALYZE");
      await client.execute("PRAGMA optimize");
      return { dialect: "sqlite", statement: "ANALYZE; PRAGMA optimize" };
    }
    await getPgClient().sql.unsafe("ANALYZE");
    return { dialect: "postgresql", statement: "ANALYZE" };
  }
}

async function countScoped(db: CommonDb, table: { siteId: AnyColumn }, siteId: string): Promise<number> {
  const rows = await db.select({ n: count() }).from(table as never).where(eq(table.siteId, siteId));
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export function getPerformanceRepository(siteId: string): PerformanceRepository {
  return new PerformanceRepository(siteId);
}
