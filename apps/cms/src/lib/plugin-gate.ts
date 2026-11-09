import "server-only";
import { headers } from "next/headers";
import { isPluginModuleEnabled, pluginRegistry } from "@nexpress/core";
import { getCommerceRepository } from "@nexpress/database";
import type { CommerceProductDto } from "@nexpress/commerce";
import { COMMERCE_PLUGIN_ID } from "@/plugins/commerce";
import { MARKETPLACE_PLUGIN_ID } from "@/plugins/marketplaces";
import { getPluginState } from "./plugin-state";

export { COMMERCE_PLUGIN_ID, MARKETPLACE_PLUGIN_ID };

/** Eklentinin ana anahtarı. Kayıt yoksa manifest varsayılanı geçerlidir. */
export async function pluginEnabled(siteId: string, pluginId: string): Promise<boolean> {
  const manifest = pluginRegistry.get(pluginId);
  if (!manifest) return true;
  try {
    return (await getPluginState(siteId, manifest)).enabled;
  } catch {
    return true;
  }
}

/** Kapalı eklentinin server action'ı yazmasın. */
export async function assertPlugin(pluginId: string): Promise<void> {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (!(await pluginEnabled(siteId, pluginId))) throw new Error("Eklenti kapalı.");
}

/** Vitrin kapalıysa ürün listesi boş döner; menü ve dinamik blok mağazayı çağırmaz. */
export async function listStorefrontProducts(siteId: string, status?: CommerceProductDto["status"]): Promise<CommerceProductDto[]> {
  if (!(await isPluginModuleEnabled(siteId, COMMERCE_PLUGIN_ID, "storefront"))) return [];
  return getCommerceRepository(siteId).listProducts(status ? { status } : {}).catch(() => []);
}
