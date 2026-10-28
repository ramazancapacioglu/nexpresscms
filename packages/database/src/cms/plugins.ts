import { and, eq } from "drizzle-orm";
import type { PluginRow } from "@nexpress/core";
import { upsertScoped } from "../dialect";
import { CmsThemeRepository } from "./themes";

export interface SitePluginRecord extends PluginRow {
  pluginId: string;
  settings: Record<string, unknown>;
  licenseKey: string | null;
  updatedAt: Date;
}

export interface SitePluginPatch {
  enabled?: boolean;
  /** Verilen modül anahtarları mevcutla birleştirilir */
  modules?: Record<string, boolean>;
  /** Verilen ayarlar mevcutla birleştirilir */
  settings?: Record<string, unknown>;
}

/** Kiracı başına eklenti durumu. Satır yoksa çağıran manifest varsayılanını kullanır. */
export class CmsPluginRepository extends CmsThemeRepository {
  public async listSitePlugins(): Promise<SitePluginRecord[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.sitePlugins).where(eq(t.sitePlugins.siteId, this.siteId));
    return rows.map((r) => ({
      pluginId: r.pluginId,
      enabled: Boolean(r.enabled),
      modules: r.modules ?? {},
      settings: r.settings ?? {},
      licenseKey: r.licenseKey,
      updatedAt: new Date(r.updatedAt),
    }));
  }

  public async getSitePlugin(pluginId: string): Promise<SitePluginRecord | null> {
    return (await this.listSitePlugins()).find((p) => p.pluginId === pluginId) ?? null;
  }

  public async saveSitePlugin(pluginId: string, patch: SitePluginPatch): Promise<SitePluginRecord> {
    const { db, t } = this.backend;
    const current = await this.getSitePlugin(pluginId);
    const now = new Date();
    const record = {
      id: `${this.siteId}:${pluginId}`,
      siteId: this.siteId,
      pluginId,
      enabled: patch.enabled ?? current?.enabled ?? true,
      modules: { ...(current?.modules ?? {}), ...(patch.modules ?? {}) },
      settings: { ...(current?.settings ?? {}), ...(patch.settings ?? {}) },
      licenseKey: current?.licenseKey ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await upsertScoped(db, t.sitePlugins, this.siteId, record);
    const saved = await this.getSitePlugin(pluginId);
    if (!saved) throw new Error("Eklenti durumu kaydedilemedi.");
    return saved;
  }
}
