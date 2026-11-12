import { and, eq } from "drizzle-orm";
import type { CustomContentType, DataPluginManifest, DataPluginWebhook, SignatureStatus } from "@nexpress/core";
import { upsertScoped } from "../dialect";
import { CmsPluginRepository } from "./plugins";

export interface DataPluginInput {
  manifest: DataPluginManifest;
  contentTypes: CustomContentType[];
  pages: Array<Record<string, unknown>>;
  webhooks: DataPluginWebhook[];
  signature: SignatureStatus;
  checksum: string;
}

export interface DataPluginDto extends DataPluginInput {
  pluginId: string;
  enabled: boolean;
  /** Şifreli webhook sırrı (düz metin değil). */
  webhookSecret: string;
  lastDelivery: { at: string; event: string; ok: boolean; status: number | null; error?: string } | null;
  installedAt: Date;
  updatedAt: Date;
}

/** `.nxplugin` veri eklentileri (kod içermez). Kurulum etkinleştirme değildir; her işlem `siteId` kapsamlıdır. */
export class CmsDataPluginRepository extends CmsPluginRepository {
  private toPlugin(r: Record<string, unknown>): DataPluginDto {
    return {
      pluginId: r.pluginId as string,
      manifest: r.manifest as unknown as DataPluginManifest,
      contentTypes: (r.contentTypes as CustomContentType[]) ?? [],
      pages: (r.pages as Array<Record<string, unknown>>) ?? [],
      webhooks: (r.webhooks as DataPluginWebhook[]) ?? [],
      signature: r.signature as SignatureStatus,
      checksum: r.checksum as string,
      enabled: Boolean(r.enabled),
      webhookSecret: (r.webhookSecret as string) ?? "",
      lastDelivery: (r.lastDelivery as DataPluginDto["lastDelivery"]) ?? null,
      installedAt: new Date(r.installedAt as Date),
      updatedAt: new Date(r.updatedAt as Date),
    };
  }

  public async listDataPlugins(): Promise<DataPluginDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.dataPlugins).where(eq(t.dataPlugins.siteId, this.siteId));
    return rows.map((r) => this.toPlugin(r as Record<string, unknown>)).sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  }

  public async getDataPlugin(pluginId: string): Promise<DataPluginDto | null> {
    return (await this.listDataPlugins()).find((p) => p.pluginId === pluginId) ?? null;
  }

  /**
   * Kurar ya da sürüm olarak günceller. Etkin bir eklenti değiştirilemez (önce devre dışı bırakılır: izinler değişmiş
   * olabilir ve yeniden onay gerekir). Yeni kurulum her zaman devre dışıdır.
   */
  public async installDataPlugin(input: DataPluginInput): Promise<{ ok: true; replaced: boolean } | { ok: false; error: string }> {
    const { db, t } = this.backend;
    const existing = await this.getDataPlugin(input.manifest.id);
    if (existing?.enabled) return { ok: false, error: "Bu eklenti etkin. Güncellemek için önce devre dışı bırakın (izinler değişmiş olabilir, yeniden onay gerekir)." };
    const now = new Date();
    await upsertScoped(
      db,
      t.dataPlugins,
      this.siteId,
      {
        id: `${this.siteId}:${input.manifest.id}`,
        siteId: this.siteId,
        pluginId: input.manifest.id,
        name: input.manifest.name,
        version: input.manifest.version,
        vendor: input.manifest.vendor,
        description: input.manifest.description,
        enabled: false,
        manifest: input.manifest as unknown as Record<string, unknown>,
        contentTypes: input.contentTypes as unknown as Array<Record<string, unknown>>,
        pages: input.pages,
        webhooks: input.webhooks as unknown as Array<Record<string, unknown>>,
        signature: input.signature,
        publisherKey: input.manifest.publisherKey ?? "",
        checksum: input.checksum,
        webhookSecret: existing?.webhookSecret ?? "",
        lastDelivery: null,
        installedAt: existing?.installedAt ?? now,
        updatedAt: now,
      },
      undefined
    );
    return (await this.getDataPlugin(input.manifest.id)) ? { ok: true, replaced: Boolean(existing) } : { ok: false, error: "Eklenti kaydedilemedi." };
  }

  public async setDataPluginEnabled(pluginId: string, enabled: boolean, secret?: string): Promise<void> {
    const { db, t } = this.backend;
    await db
      .update(t.dataPlugins)
      .set({ enabled, updatedAt: new Date(), ...(secret !== undefined ? { webhookSecret: secret } : {}) })
      .where(and(eq(t.dataPlugins.siteId, this.siteId), eq(t.dataPlugins.pluginId, pluginId)));
  }

  public async recordDataPluginDelivery(pluginId: string, delivery: NonNullable<DataPluginDto["lastDelivery"]>): Promise<void> {
    const { db, t } = this.backend;
    await db.update(t.dataPlugins).set({ lastDelivery: delivery as unknown as Record<string, unknown> }).where(and(eq(t.dataPlugins.siteId, this.siteId), eq(t.dataPlugins.pluginId, pluginId)));
  }

  /** Yalnızca devre dışı eklenti silinir. */
  public async deleteDataPlugin(pluginId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const plugin = await this.getDataPlugin(pluginId);
    if (!plugin) return { ok: false, error: "Eklenti bulunamadı." };
    if (plugin.enabled) return { ok: false, error: "Etkin eklenti silinemez; önce devre dışı bırakın." };
    const { db, t } = this.backend;
    await db.delete(t.dataPlugins).where(and(eq(t.dataPlugins.siteId, this.siteId), eq(t.dataPlugins.pluginId, pluginId)));
    return { ok: true };
  }
}
