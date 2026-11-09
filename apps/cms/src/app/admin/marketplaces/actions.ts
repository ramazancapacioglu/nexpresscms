"use server";

import { requireAdmin } from "@/lib/auth/session";
import { assertPlugin, MARKETPLACE_PLUGIN_ID } from "@/lib/plugin-gate";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCommerceOpsRepository, getCommerceRepository, getMarketplaceRepository } from "@nexpress/database";
import {
  getMarketplaceDriver,
  registerBuiltinMarketplaceDrivers,
  type MarketplaceEnvironment,
} from "@nexpress/marketplace";

async function siteIdFromHeaders(): Promise<string> {
  const reqHeaders = await headers();
  return reqHeaders.get("x-nexpress-site-id") ?? "default";
}

function revalidateMarketplace(id?: string) {
  revalidatePath("/admin/marketplaces");
  if (id) revalidatePath(`/admin/marketplaces/${id}`);
}

export async function saveMarketplaceChannelAction(input: {
  id?: string;
  driverId: string;
  label: string;
  enabled: boolean;
  environment: MarketplaceEnvironment;
  credentials: Record<string, string>;
}) {
  await assertPlugin(MARKETPLACE_PLUGIN_ID);
  await requireAdmin("marketplace.saveMarketplaceChannel");
  registerBuiltinMarketplaceDrivers();
  if (!getMarketplaceDriver(input.driverId)) {
    throw new Error("Bilinmeyen pazar yeri sürücüsü.");
  }
  const repo = getMarketplaceRepository(await siteIdFromHeaders());
  const channel = await repo.saveChannel(input);
  revalidateMarketplace(channel.id);
  return channel.id;
}

export async function deleteMarketplaceChannelAction(id: string) {
  await assertPlugin(MARKETPLACE_PLUGIN_ID);
  await requireAdmin("marketplace.deleteMarketplaceChannel");
  const repo = getMarketplaceRepository(await siteIdFromHeaders());
  await repo.deleteChannel(id);
  revalidateMarketplace();
}

export async function testMarketplaceChannelAction(id: string) {
  await assertPlugin(MARKETPLACE_PLUGIN_ID);
  await requireAdmin("marketplace.testMarketplaceChannel");
  registerBuiltinMarketplaceDrivers();
  const repo = getMarketplaceRepository(await siteIdFromHeaders());
  const channel = await repo.getChannel(id);
  if (!channel) throw new Error("Kanal yok.");
  const driver = getMarketplaceDriver(channel.driverId);
  if (!driver) throw new Error("Sürücü kayıtlı değil.");
  const result = await driver.testConnection(channel.environment, channel.credentials);
  await repo.markConnection(id, result.ok ? "ok" : "error", result.message);
  await repo.addJob(id, "test_connection", result.ok ? "ok" : "error", result.message);
  revalidateMarketplace(id);
  return result.message;
}

export async function pushMarketplaceStockAction(id: string) {
  await assertPlugin(MARKETPLACE_PLUGIN_ID);
  await requireAdmin("marketplace.pushMarketplaceStock");
  registerBuiltinMarketplaceDrivers();
  const siteId = await siteIdFromHeaders();
  const repo = getMarketplaceRepository(siteId);
  const channel = await repo.getChannel(id);
  if (!channel) throw new Error("Kanal yok.");
  const driver = getMarketplaceDriver(channel.driverId);
  if (!driver) throw new Error("Sürücü kayıtlı değil.");
  const products = await getCommerceRepository(siteId).listProducts({ status: "published" });
  const items = products.map((product) => ({
    sku: product.sku,
    quantity: product.stockQuantity,
    salePrice: product.priceCents / 100,
    listPrice: product.compareAtCents ? product.compareAtCents / 100 : undefined,
    currency: product.currency,
  }));
  const result = await driver.pushPriceStock(channel.environment, channel.credentials, items);
  await repo.addJob(id, "push_price_stock", result.ok ? "ok" : "error", result.message);
  revalidateMarketplace(id);
  return result.message;
}

export async function pullMarketplaceOrdersAction(id: string) {
  await assertPlugin(MARKETPLACE_PLUGIN_ID);
  await requireAdmin("marketplace.pullMarketplaceOrders");
  registerBuiltinMarketplaceDrivers();
  const repo = getMarketplaceRepository(await siteIdFromHeaders());
  const channel = await repo.getChannel(id);
  if (!channel) throw new Error("Kanal yok.");
  const driver = getMarketplaceDriver(channel.driverId);
  if (!driver) throw new Error("Sürücü kayıtlı değil.");
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const result = await driver.pullOrders(channel.environment, channel.credentials, since);
  if (result.ok && result.data) {
    const ops = getCommerceOpsRepository(await siteIdFromHeaders());
    for (const order of result.data) {
      await repo.upsertInboundOrder({
        channelId: id,
        externalId: order.externalId,
        status: order.status,
        buyerName: order.buyerName,
        currency: order.currency,
        totalCents: Math.round(order.total * 100),
        payload: { lines: order.lines, orderedAt: order.orderedAt },
        orderedAt: parseMarketplaceDate(order.orderedAt),
      });
      await ops.upsertCustomer({
        source: "marketplace",
        channelId: id,
        externalKey: `${id}:${order.buyerName || order.externalId}`,
        name: order.buyerName || "Pazar alıcısı",
      });
    }
  }
  await repo.addJob(id, "pull_orders", result.ok ? "ok" : "error", result.message);
  revalidateMarketplace(id);
  return result.message;
}

function parseMarketplaceDate(value: string | null): Date | null {
  if (!value) return null;
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && numeric > 1_000_000_000_000 ? new Date(numeric) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
