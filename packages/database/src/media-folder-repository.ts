import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { checkFolderPlacement, folderSubtreeIds, normalizeFolderName, getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export interface MediaFolderDto {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export type FolderResult = { ok: true; folder: MediaFolderDto } | { ok: false; error: string };

/** Medya klasörleri: her sorgu `siteId` kapsamlı; yerleştirme kuralları `core/media-folders` içindedir. */
export class MediaFolderRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  public async list(): Promise<MediaFolderDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.mediaFolders).where(eq(t.mediaFolders.siteId, this.siteId));
    return rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parentId, createdAt: new Date(r.createdAt) }));
  }

  /** Klasör başına dosya sayısı (anahtar `""` = klasörsüz). */
  public async counts(): Promise<Record<string, number>> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ folderId: t.mediaAssets.folderId, n: sql<number>`count(*)` })
      .from(t.mediaAssets)
      .where(eq(t.mediaAssets.siteId, this.siteId))
      .groupBy(t.mediaAssets.folderId);
    const out: Record<string, number> = {};
    for (const r of rows) out[r.folderId ?? ""] = (out[r.folderId ?? ""] ?? 0) + Number(r.n);
    return out;
  }

  public async create(name: string, parentId: string | null): Promise<FolderResult> {
    const all = await this.list();
    const check = checkFolderPlacement(all, { id: null, parentId, name });
    if (!check.ok) return check;
    const { db, t } = this.backend;
    const id = `fld_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    await db.insert(t.mediaFolders).values({ id, siteId: this.siteId, name: normalizeFolderName(name), parentId, sortOrder: 0, createdAt: now });
    return { ok: true, folder: { id, name: normalizeFolderName(name), parentId, createdAt: now } };
  }

  /** Yeniden adlandırır ve/veya taşır (`parentId` verilmezse yer değişmez). */
  public async update(id: string, patch: { name?: string; parentId?: string | null }): Promise<FolderResult> {
    const all = await this.list();
    const cur = all.find((f) => f.id === id);
    if (!cur) return { ok: false, error: "Klasör bulunamadı." };
    const name = patch.name ?? cur.name;
    const parentId = patch.parentId === undefined ? cur.parentId : patch.parentId;
    const check = checkFolderPlacement(all, { id, parentId, name });
    if (!check.ok) return check;
    const { db, t } = this.backend;
    await db.update(t.mediaFolders).set({ name: normalizeFolderName(name), parentId }).where(and(eq(t.mediaFolders.siteId, this.siteId), eq(t.mediaFolders.id, id)));
    return { ok: true, folder: { ...cur, name: normalizeFolderName(name), parentId } };
  }

  /**
   * Siler: içindeki dosyalar ve alt klasörler üst klasöre (yoksa köke) taşınır; hiçbir dosya silinmez.
   * Üst klasörde aynı adlı kardeş varsa alt klasör adı değişmeden taşınır (ad çakışması yalnızca uyarıdır).
   */
  public async remove(id: string): Promise<boolean> {
    const all = await this.list();
    const cur = all.find((f) => f.id === id);
    if (!cur) return false;
    const { db, t } = this.backend;
    await db.update(t.mediaAssets).set({ folderId: cur.parentId }).where(and(eq(t.mediaAssets.siteId, this.siteId), eq(t.mediaAssets.folderId, id)));
    await db.update(t.mediaFolders).set({ parentId: cur.parentId }).where(and(eq(t.mediaFolders.siteId, this.siteId), eq(t.mediaFolders.parentId, id)));
    await db.delete(t.mediaFolders).where(and(eq(t.mediaFolders.siteId, this.siteId), eq(t.mediaFolders.id, id)));
    return true;
  }

  /** Dosyaları klasöre taşır (`null` = köke). Hedef klasör bu kiracıya ait olmalı. Taşınan sayıyı döner. */
  public async moveAssets(ids: string[], folderId: string | null): Promise<number> {
    if (ids.length === 0) return 0;
    if (folderId && !(await this.list()).some((f) => f.id === folderId)) return 0;
    const { db, t } = this.backend;
    await db.update(t.mediaAssets).set({ folderId }).where(and(eq(t.mediaAssets.siteId, this.siteId), inArray(t.mediaAssets.id, ids)));
    const rows = await db
      .select({ id: t.mediaAssets.id })
      .from(t.mediaAssets)
      .where(and(eq(t.mediaAssets.siteId, this.siteId), inArray(t.mediaAssets.id, ids), folderId ? eq(t.mediaAssets.folderId, folderId) : isNull(t.mediaAssets.folderId)));
    return rows.length;
  }

  /** Klasör ve alt klasörlerindeki dosya kimlikleri (klasör süzgeci için). */
  public subtreeIds(all: MediaFolderDto[], id: string): string[] {
    return folderSubtreeIds(all, id);
  }
}

export function getMediaFolderRepository(siteIdOverride?: string): MediaFolderRepository {
  return new MediaFolderRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}
