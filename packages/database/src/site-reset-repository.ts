import type { DbDialect } from "@nexpress/core";
import { and, eq } from "drizzle-orm";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";
import { getScopedRepository } from "./repository";

export type ContentWipe = "pages" | "media" | "everything";

export interface ContentWipeResult {
  contents: number;
  mediaIds: string[];
}

export interface DesignWipeResult {
  templates: number;
  designs: number;
  themes: number;
  /** Etkin tema yüklenen bir paketti; çağıran resmi temaya döndürmeli. */
  activeUploaded: boolean;
}

/** Sayfa, medya ve tasarım sıfırlama. Kullanıcı, ayar, sipariş ve resmi tema kodu silinmez. */
export class SiteResetRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect,
  ) {}

  private get backend() {
    return backendFor(this.dialect);
  }

  private async contentIds(filter: { only?: string; except?: string }): Promise<string[]> {
    const { db, t } = this.backend;
    const rows = await db.select({ id: t.contents.id, type: t.contents.type }).from(t.contents).where(eq(t.contents.siteId, this.siteId));
    return rows
      .filter((row) => (filter.only ? row.type === filter.only : true) && (filter.except ? row.type !== filter.except : true))
      .map((row) => row.id);
  }

  private async dropContents(ids: string[]): Promise<number> {
    const repo = getScopedRepository(this.siteId);
    let removed = 0;
    for (let i = 0; i < ids.length; i += 40) {
      removed += await repo.deleteContents(ids.slice(i, i + 40));
    }
    return removed;
  }

  /** Medya kayıtlarını ve klasörlerini siler. Diskteki dosyayı çağıran kaldırır. */
  public async wipeMedia(): Promise<string[]> {
    const { db, t } = this.backend;
    const rows = await db.select({ id: t.mediaAssets.id }).from(t.mediaAssets).where(eq(t.mediaAssets.siteId, this.siteId));
    if (rows.length === 0) return [];
    await db.delete(t.mediaAssets).where(eq(t.mediaAssets.siteId, this.siteId));
    await db.delete(t.mediaFolders).where(eq(t.mediaFolders.siteId, this.siteId));
    return rows.map((row) => row.id);
  }

  /** Sayfalar, medya veya şablon hariç tüm içerik. Tasarım kütüphanesi bu kapıda yok. */
  public async wipeContent(kind: ContentWipe): Promise<ContentWipeResult> {
    let contents = 0;
    let mediaIds: string[] = [];
    if (kind === "pages" || kind === "everything") {
      contents = await this.dropContents(await this.contentIds(kind === "pages" ? { only: "page" } : { except: "template" }));
    }
    if (kind === "media" || kind === "everything") mediaIds = await this.wipeMedia();
    return { contents, mediaIds };
  }

  /** Şablon içerikleri, tasarım kütüphanesi ve yüklenen temalar. Sayfa ve medya durur. */
  public async wipeDesign(): Promise<DesignWipeResult> {
    const { db, t } = this.backend;
    const templates = await this.dropContents(await this.contentIds({ only: "template" }));
    await db.update(t.taxonomies).set({ templateId: null }).where(eq(t.taxonomies.siteId, this.siteId));
    const designs = await db.select({ id: t.designLibrary.id }).from(t.designLibrary).where(eq(t.designLibrary.siteId, this.siteId));
    if (designs.length > 0) await db.delete(t.designLibrary).where(eq(t.designLibrary.siteId, this.siteId));
    const site = await getScopedRepository(this.siteId).getSite();
    const uploaded = await db
      .select({ themeId: t.installedThemes.themeId })
      .from(t.installedThemes)
      .where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.source, "uploaded")));
    const activeUploaded = uploaded.some((row) => row.themeId === site?.activeThemeId);
    if (!activeUploaded && uploaded.length > 0) {
      await db.delete(t.installedThemes).where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.source, "uploaded")));
    }
    return { templates, designs: designs.length, themes: activeUploaded ? 0 : uploaded.length, activeUploaded };
  }

  /** Etkin tema resmi pakete alındıktan sonra yüklenen tema satırlarını siler. */
  public async deleteUploadedThemes(): Promise<number> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ themeId: t.installedThemes.themeId })
      .from(t.installedThemes)
      .where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.source, "uploaded")));
    if (rows.length === 0) return 0;
    await db.delete(t.installedThemes).where(and(eq(t.installedThemes.siteId, this.siteId), eq(t.installedThemes.source, "uploaded")));
    return rows.length;
  }
}

export function getSiteResetRepository(siteId: string, dialect?: DbDialect): SiteResetRepository {
  return new SiteResetRepository(siteId, dialect ?? getDbDialect());
}
