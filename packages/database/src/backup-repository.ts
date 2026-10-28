import { and, eq, inArray, type AnyColumn } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor, type CommonDb } from "./dialect";

/**
 * Kiracı yedeği (dışa/içe aktarma). Tablolar ve sıra: dış anahtar bağımlılığına göre (ebeveyn önce).
 * Kullanıcılar, parola özetleri, oturumlar, denetim günlüğü, bot/yönlendirme sayaçları, arama dizini parçaları
 * (içe aktarmadan sonra yeniden kurulur), revizyonlar ve ticaret verisi YEDEĞE GİRMEZ (bkz. docs/11 §Yedekleme).
 */
export const BACKUP_TABLES = [
  "contents",
  "contentTranslations",
  "contentEntityLinks",
  "commentsReviews",
  "taxonomies",
  "navigationLayouts",
  "mediaAssets",
  "redirects",
  "installedThemes",
  "sitePlugins",
  "forms",
  "formSubmissions",
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

/** Kişisel veri içerenler: yalnızca açıkça istenirse yedeğe girer. */
export const PERSONAL_TABLES: BackupTable[] = ["formSubmissions", "commentsReviews"];

/** Yedeğe girmeyen/maskelenen sütunlar (sırlar). */
const OMIT_COLUMNS: Partial<Record<BackupTable, string[]>> = { sitePlugins: ["licenseKey"] };

export const SITE_FIELDS = ["name", "tagline", "defaultLocale", "supportedLocales", "activeThemeId", "designTokens", "siteProfile", "siteDna", "settings"] as const;
export type SiteSnapshot = Partial<Record<(typeof SITE_FIELDS)[number], unknown>>;

export type BackupData = {
  site: SiteSnapshot | null;
  tables: Partial<Record<BackupTable, Array<Record<string, unknown>>>>;
};

export type ImportMode = "merge" | "replace";

export interface ImportReport {
  mode: ImportMode;
  tables: Partial<Record<BackupTable, { inserted: number; skipped: number; conflicts: number }>>;
  siteRestored: boolean;
  warnings: string[];
}

type AnyTable = Record<string, AnyColumn> & { id: AnyColumn; siteId: AnyColumn };

const CHUNK = 100;

/** Genel (çalışma zamanında seçilen) tablolarda projeksiyonlu seçim için gevşek tür. */
const loose = (db: unknown) => db as { select: (f: unknown) => { from: (t: unknown) => { where: (w: unknown) => Promise<unknown> } } };

export class BackupRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  private table(name: BackupTable): AnyTable {
    return (this.backend.t as unknown as Record<string, AnyTable>)[name]!;
  }

  /** Kiracının tablolarını okur (yüklenen temalar dışında resmi tema satırları atılır). */
  public async exportData(include: { personal: boolean }): Promise<BackupData> {
    const { db, t } = this.backend;
    const siteRows = await db.select().from(t.sites).where(eq(t.sites.siteId, this.siteId)).limit(1);
    const site = siteRows[0] as Record<string, unknown> | undefined;
    const tables: BackupData["tables"] = {};
    for (const name of BACKUP_TABLES) {
      if (PERSONAL_TABLES.includes(name) && !include.personal) continue;
      const tbl = this.table(name);
      let rows = (await db.select().from(tbl as never).where(eq(tbl.siteId, this.siteId))) as Array<Record<string, unknown>>;
      if (name === "installedThemes") rows = rows.filter((r) => r.source === "uploaded");
      const omit = OMIT_COLUMNS[name] ?? [];
      tables[name] = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !omit.includes(k))));
    }
    const snap = site ? (Object.fromEntries(SITE_FIELDS.map((k) => [k, site[k]])) as SiteSnapshot) : null;
    // SMTP parolası (şifreli de olsa) yedek dosyasına girmez
    if (snap?.settings && typeof snap.settings === "object") {
      const settings = snap.settings as Record<string, unknown>;
      if (settings.email && typeof settings.email === "object") snap.settings = { ...settings, email: { ...(settings.email as object), password: "" } };
    }
    return { site: snap, tables };
  }

  /**
   * İçe aktarır. `merge`: mevcut kimlikler atlanır, olmayanlar eklenir (başka kiracının kimliğiyle çakışma raporlanır).
   * `replace`: kiracının yedek tablolarındaki satırlar silinip yedekten yazılır ve site ayarları geri yüklenir.
   * Tek işlemde çalışır: hata olursa hiçbir şey değişmez. Bilinmeyen sütunlar atılır; `siteId` hedef kiracıya zorlanır.
   */
  public async importData(data: BackupData, mode: ImportMode): Promise<ImportReport> {
    const report: ImportReport = { mode, tables: {}, siteRestored: false, warnings: [] };
    const { db: rootDb, t } = this.backend;
    await (rootDb as unknown as { transaction: (fn: (tx: CommonDb) => Promise<void>) => Promise<void> }).transaction(async (tx) => {
      if (mode === "replace") {
        for (const name of [...BACKUP_TABLES].reverse()) {
          if (data.tables[name] === undefined) continue; // yedekte olmayan tablo (ör. kişisel veri) dokunulmaz
          const tbl = this.table(name);
          const where = name === "installedThemes" ? and(eq(tbl.siteId, this.siteId), eq(tbl.source as AnyColumn, "uploaded")) : eq(tbl.siteId, this.siteId);
          await tx.delete(tbl as never).where(where);
        }
      }
      for (const name of BACKUP_TABLES) {
        const rows = data.tables[name];
        if (!rows) continue;
        const tbl = this.table(name);
        const allowed = new Set(Object.keys(getTableColumns(tbl as never)));
        const rep = (report.tables[name] = { inserted: 0, skipped: 0, conflicts: 0 });
        const clean: Array<Record<string, unknown>> = rows.map((r) => ({ ...Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))), siteId: this.siteId }));
        const ids = clean.map((r) => r.id as string).filter((id) => typeof id === "string");
        // Mevcut kimlikler: aynı kiracıdaysa atla, başka kiracıdaysa çakışma
        const existing = new Map<string, string>();
        for (let i = 0; i < ids.length; i += 500) {
          const found = (await loose(tx).select({ id: tbl.id, siteId: tbl.siteId }).from(tbl).where(inArray(tbl.id, ids.slice(i, i + 500)))) as Array<{ id: string; siteId: string }>;
          for (const f of found) existing.set(f.id, f.siteId);
        }
        const fresh: Array<Record<string, unknown>> = [];
        for (const r of clean) {
          const owner = existing.get(r.id as string);
          if (owner === undefined) fresh.push(r);
          else if (owner === this.siteId) rep.skipped++;
          else rep.conflicts++;
        }
        for (let i = 0; i < fresh.length; i += CHUNK) {
          await tx.insert(tbl as never).values(fresh.slice(i, i + CHUNK) as never);
          rep.inserted += Math.min(CHUNK, fresh.length - i);
        }
        if (rep.conflicts > 0) report.warnings.push(`${name}: ${rep.conflicts} satır başka bir kiracının kimliğiyle çakıştığı için atlandı.`);
      }
      if (mode === "replace" && data.site) {
        const patch: Record<string, unknown> = {};
        for (const k of SITE_FIELDS) if (data.site[k] !== undefined && data.site[k] !== null) patch[k] = data.site[k];
        // Yedekte parola yok: mevcut SMTP parolası korunur
        const cur = (await tx.select({ settings: t.sites.settings }).from(t.sites).where(eq(t.sites.siteId, this.siteId)).limit(1))[0]?.settings as { email?: { password?: string } } | undefined;
        const incoming = patch.settings as { email?: Record<string, unknown> } | undefined;
        if (incoming?.email && cur?.email?.password) patch.settings = { ...incoming, email: { ...incoming.email, password: cur.email.password } };
        if (Object.keys(patch).length > 0) {
          await tx.update(t.sites).set({ ...patch, updatedAt: new Date() } as never).where(eq(t.sites.siteId, this.siteId));
          report.siteRestored = true;
        }
      }
    });
    return report;
  }
}

export function getBackupRepository(siteIdOverride?: string): BackupRepository {
  return new BackupRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
