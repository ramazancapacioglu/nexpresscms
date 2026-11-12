import { and, asc, desc, eq, lt, lte, or } from "drizzle-orm";
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

export type DeliveryStatus = "pending" | "delivered" | "failed";

export interface DeliveryDto {
  id: string;
  pluginId: string;
  webhookId: string;
  event: string;
  body: string;
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastStatus: number | null;
  lastError: string;
  createdAt: Date;
  deliveredAt: Date | null;
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

  // ---- Webhook teslimat kuyruğu ----

  public async enqueueDelivery(input: { id: string; pluginId: string; webhookId: string; event: string; body: string }): Promise<void> {
    const { db, t } = this.backend;
    const now = new Date();
    await db.insert(t.pluginDeliveries).values({ id: input.id, siteId: this.siteId, pluginId: input.pluginId, webhookId: input.webhookId, event: input.event, body: input.body, status: "pending", attempts: 0, nextAttemptAt: now, lastStatus: null, lastError: "", createdAt: now, deliveredAt: null });
  }

  /** Zamanı gelmiş bekleyen teslimatlar (en eskiden başlayarak). */
  public async dueDeliveries(now: Date, limit = 20): Promise<DeliveryDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.pluginDeliveries).where(and(eq(t.pluginDeliveries.siteId, this.siteId), eq(t.pluginDeliveries.status, "pending"), lte(t.pluginDeliveries.nextAttemptAt, now))).orderBy(asc(t.pluginDeliveries.nextAttemptAt)).limit(limit);
    return rows as DeliveryDto[];
  }

  /**
   * Bir denemenin sonucunu yazar. Koşullu: yalnızca hâlâ `pending` ve beklenen deneme sayısındaki kayıt güncellenir
   * (iki süreç aynı teslimatı yarışta işlerse tek sonuç yazılır). Dönen `true` = bu çağrı yazdı.
   */
  public async recordAttempt(id: string, expectedAttempts: number, result: { ok: boolean; status: number | null; error?: string; nextAttemptAt?: Date; giveUp?: boolean }): Promise<boolean> {
    const { db, t } = this.backend;
    const rows = await db
      .update(t.pluginDeliveries)
      .set({
        attempts: expectedAttempts + 1,
        lastStatus: result.status,
        lastError: (result.error ?? "").slice(0, 200),
        status: result.ok ? "delivered" : result.giveUp ? "failed" : "pending",
        ...(result.ok ? { deliveredAt: new Date() } : {}),
        ...(result.nextAttemptAt ? { nextAttemptAt: result.nextAttemptAt } : {}),
      })
      .where(and(eq(t.pluginDeliveries.siteId, this.siteId), eq(t.pluginDeliveries.id, id), eq(t.pluginDeliveries.status, "pending"), eq(t.pluginDeliveries.attempts, expectedAttempts)))
      .returning({ id: t.pluginDeliveries.id });
    return rows.length > 0;
  }

  public async listDeliveries(pluginId: string, limit = 10): Promise<DeliveryDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.pluginDeliveries).where(and(eq(t.pluginDeliveries.siteId, this.siteId), eq(t.pluginDeliveries.pluginId, pluginId))).orderBy(desc(t.pluginDeliveries.createdAt)).limit(limit);
    return rows as DeliveryDto[];
  }

  /** Başarısız kaydı yeniden kuyruğa alır (yönetici elle). */
  public async requeueDelivery(id: string): Promise<boolean> {
    const { db, t } = this.backend;
    const rows = await db.update(t.pluginDeliveries).set({ status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: "" }).where(and(eq(t.pluginDeliveries.siteId, this.siteId), eq(t.pluginDeliveries.id, id), eq(t.pluginDeliveries.status, "failed"))).returning({ id: t.pluginDeliveries.id });
    return rows.length > 0;
  }

  /** Tamamlanmış (teslim edilmiş ya da vazgeçilmiş) kayıtlar `days` günden eskiyse silinir; bekleyenlere dokunulmaz. */
  public async purgeOldDeliveries(days = 14): Promise<void> {
    const { db, t } = this.backend;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    await db.delete(t.pluginDeliveries).where(and(eq(t.pluginDeliveries.siteId, this.siteId), or(eq(t.pluginDeliveries.status, "delivered"), eq(t.pluginDeliveries.status, "failed"))!, lt(t.pluginDeliveries.createdAt, cutoff)));
  }

  /** Yalnızca devre dışı eklenti silinir. */
  public async deleteDataPlugin(pluginId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const plugin = await this.getDataPlugin(pluginId);
    if (!plugin) return { ok: false, error: "Eklenti bulunamadı." };
    if (plugin.enabled) return { ok: false, error: "Etkin eklenti silinemez; önce devre dışı bırakın." };
    const { db, t } = this.backend;
    await db.delete(t.pluginDeliveries).where(and(eq(t.pluginDeliveries.siteId, this.siteId), eq(t.pluginDeliveries.pluginId, pluginId)));
    await db.delete(t.dataPlugins).where(and(eq(t.dataPlugins.siteId, this.siteId), eq(t.dataPlugins.pluginId, pluginId)));
    return { ok: true };
  }
}
