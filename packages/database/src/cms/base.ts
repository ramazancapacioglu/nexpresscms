import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "../client";
import { backendFor } from "../dialect";

/**
 * Kural 2 & Kural 3:
 * - Her sorgu `siteId` kapsamındadır (Implicit Tenancy).
 * - Hem `postgresql` (pgvector) hem `sqlite` (LibSQL) üzerinde tek arayüzle çalışır.
 */
export class CmsRepositoryBase {
  public readonly siteId: string;
  public readonly dialect: DbDialect;

  constructor(siteId?: string, dialect?: DbDialect) {
    const ctx = getCmsContext();
    this.siteId = siteId ?? ctx.siteId ?? "default";
    this.dialect = dialect ?? getDbDialect();
  }

  /** Motor başına tablo/istemci adaptörü: tek kod yolu iki motorda çalışır (bkz. dialect.ts). */
  protected get backend() {
    return backendFor(this.dialect);
  }
}
