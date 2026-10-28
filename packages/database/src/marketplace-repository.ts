import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { MarketplaceEnvironment } from "@nexpress/marketplace";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { decryptRecord, encryptRecord } from "@nexpress/core/secret-box";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

export interface MarketplaceChannelDto {
  id: string;
  siteId: string;
  driverId: string;
  label: string;
  enabled: boolean;
  environment: MarketplaceEnvironment;
  credentials: Record<string, string>;
  connectionStatus: string;
  lastCheckedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceJobDto {
  id: string;
  channelId: string;
  kind: string;
  status: string;
  message: string;
  createdAt: Date;
}

export interface MarketplaceInboundOrderDto {
  id: string;
  channelId: string;
  externalId: string;
  status: string;
  buyerName: string;
  currency: string;
  totalCents: number;
  createdAt: Date;
}

function mapChannel(row: {
  id: string;
  siteId: string;
  driverId: string;
  label: string;
  enabled: boolean;
  environment: string;
  credentials: Record<string, string> | null;
  connectionStatus: string;
  lastCheckedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MarketplaceChannelDto {
  return {
    id: row.id,
    siteId: row.siteId,
    driverId: row.driverId,
    label: row.label,
    enabled: row.enabled,
    environment: row.environment === "production" ? "production" : "sandbox",
    credentials: decryptRecord(row.credentials ?? {}),
    connectionStatus: row.connectionStatus,
    lastCheckedAt: row.lastCheckedAt,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class MarketplaceRepository {
  public readonly siteId: string;
  public readonly dialect: DbDialect;

  constructor(siteId?: string, dialect?: DbDialect) {
    const ctx = getCmsContext();
    this.siteId = siteId ?? ctx.siteId ?? "default";
    this.dialect = dialect ?? getDbDialect();
  }

  /** Motor başına tablo/istemci adaptörü (bkz. dialect.ts). */
  private get backend() {
    return backendFor(this.dialect);
  }

  public async listChannels(): Promise<MarketplaceChannelDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.marketplaceChannels)
      .where(eq(t.marketplaceChannels.siteId, this.siteId))
      .orderBy(desc(t.marketplaceChannels.updatedAt));
    return rows.map(mapChannel);
  }

  public async getChannel(id: string): Promise<MarketplaceChannelDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.marketplaceChannels)
      .where(and(eq(t.marketplaceChannels.siteId, this.siteId), eq(t.marketplaceChannels.id, id)))
      .limit(1);
    return rows[0] ? mapChannel(rows[0]) : null;
  }

  public async saveChannel(input: {
    id?: string;
    driverId: string;
    label: string;
    enabled: boolean;
    environment: MarketplaceEnvironment;
    credentials: Record<string, string>;
  }): Promise<MarketplaceChannelDto> {
    const now = new Date();
    const existing = input.id ? await this.getChannel(input.id) : null;
    const id = existing?.id ?? input.id ?? randomUUID();
    const credentials = mergeSecrets(existing?.credentials ?? {}, input.credentials);
    const record = {
      id,
      siteId: this.siteId,
      driverId: input.driverId,
      label: input.label.trim() || input.driverId,
      enabled: input.enabled,
      environment: input.environment,
      credentials: encryptRecord(credentials),
      connectionStatus: existing?.connectionStatus ?? "unknown",
      lastCheckedAt: existing?.lastCheckedAt ?? null,
      lastError: existing?.lastError ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const { db, t } = this.backend;
    // Atomik, kiracıya kapalı upsert; bağlantı durumu alanları güncellemede korunur.
    await db
      .insert(t.marketplaceChannels)
      .values(record)
      .onConflictDoUpdate({
        target: t.marketplaceChannels.id,
        set: {
          label: record.label,
          enabled: record.enabled,
          environment: record.environment,
          credentials: record.credentials,
          updatedAt: now,
        },
        setWhere: eq(t.marketplaceChannels.siteId, this.siteId),
      });
    const saved = await this.getChannel(id);
    if (!saved) throw new Error("Kanal kaydedilemedi.");
    return saved;
  }

  public async markConnection(id: string, status: "ok" | "error", message: string): Promise<void> {
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.marketplaceChannels)
      .set({
        connectionStatus: status,
        lastCheckedAt: now,
        lastError: status === "ok" ? null : message,
        updatedAt: now,
      })
      .where(and(eq(t.marketplaceChannels.siteId, this.siteId), eq(t.marketplaceChannels.id, id)));
  }

  public async deleteChannel(id: string): Promise<void> {
    const { db, t } = this.backend;
    await db
      .delete(t.marketplaceChannels)
      .where(and(eq(t.marketplaceChannels.siteId, this.siteId), eq(t.marketplaceChannels.id, id)));
  }

  public async addJob(channelId: string, kind: string, status: string, message: string): Promise<void> {
    const record = {
      id: randomUUID(),
      siteId: this.siteId,
      channelId,
      kind,
      status,
      message: message.slice(0, 500),
      createdAt: new Date(),
    };
    const { db, t } = this.backend;
    await db.insert(t.marketplaceJobs).values(record);
  }

  public async listJobs(channelId: string, limit = 12): Promise<MarketplaceJobDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.marketplaceJobs)
      .where(and(eq(t.marketplaceJobs.siteId, this.siteId), eq(t.marketplaceJobs.channelId, channelId)))
      .orderBy(desc(t.marketplaceJobs.createdAt))
      .limit(limit);
    return rows.map((row) => ({
      id: row.id,
      channelId: row.channelId,
      kind: row.kind,
      status: row.status,
      message: row.message,
      createdAt: row.createdAt,
    }));
  }

  public async upsertInboundOrder(input: {
    channelId: string;
    externalId: string;
    status: string;
    buyerName: string;
    currency: string;
    totalCents: number;
    payload: Record<string, unknown>;
    orderedAt: Date | null;
  }): Promise<void> {
    if (!input.externalId) return;
    const now = new Date();
    const { db, t } = this.backend;
    const existing = await db
      .select()
      .from(t.marketplaceOrders)
      .where(
        and(
          eq(t.marketplaceOrders.siteId, this.siteId),
          eq(t.marketplaceOrders.channelId, input.channelId),
          eq(t.marketplaceOrders.externalId, input.externalId)
        )
      )
      .limit(1);
    if (existing[0]) {
      await db
        .update(t.marketplaceOrders)
        .set({
          status: input.status,
          buyerName: input.buyerName,
          total: input.totalCents,
          payload: input.payload,
        })
        .where(eq(t.marketplaceOrders.id, existing[0].id));
      return;
    }
    await db.insert(t.marketplaceOrders).values({
      id: randomUUID(),
      siteId: this.siteId,
      channelId: input.channelId,
      externalId: input.externalId,
      status: input.status,
      buyerName: input.buyerName,
      currency: input.currency,
      total: input.totalCents,
      payload: input.payload,
      orderedAt: input.orderedAt,
      createdAt: now,
    });
  }

  public async listInboundOrders(channelId: string, limit = 30): Promise<MarketplaceInboundOrderDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.marketplaceOrders)
      .where(
        and(eq(t.marketplaceOrders.siteId, this.siteId), eq(t.marketplaceOrders.channelId, channelId))
      )
      .orderBy(desc(t.marketplaceOrders.createdAt))
      .limit(limit);
    return rows.map(mapOrder);
  }
}

function mapOrder(row: {
  id: string;
  channelId: string;
  externalId: string;
  status: string;
  buyerName: string;
  currency: string;
  total: number;
  createdAt: Date;
}): MarketplaceInboundOrderDto {
  return {
    id: row.id,
    channelId: row.channelId,
    externalId: row.externalId,
    status: row.status,
    buyerName: row.buyerName,
    currency: row.currency,
    totalCents: row.total,
    createdAt: row.createdAt,
  };
}

function mergeSecrets(previous: Record<string, string>, next: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = { ...previous };
  for (const [key, value] of Object.entries(next)) {
    if (value.trim() === "" && previous[key]) continue;
    merged[key] = value.trim();
  }
  return merged;
}

export function getMarketplaceRepository(siteIdOverride?: string): MarketplaceRepository {
  return new MarketplaceRepository(siteIdOverride);
}
