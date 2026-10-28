import "server-only";
import { isModuleActive, pluginRegistry, resolvePluginState, type PluginManifest, type PluginState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { cachedRead } from "./cache";

/** Kiracının eklenti satırları; yönetim eylemleri `invalidateSite` ile düşürür. */
const readSitePlugins = cachedRead("site-plugins", (siteId: string) => getScopedRepository(siteId).listSitePlugins());

export async function getPluginState(siteId: string, manifest: PluginManifest): Promise<PluginState> {
  const rows = await readSitePlugins(siteId);
  return resolvePluginState(manifest, rows.find((r) => r.pluginId === manifest.id));
}

/** Eklenti kodunun kapısı: bilinmeyen eklenti veya okuma hatası durumunda açık sayılır (kapı yüzünden özellik kaybolmasın). */
export async function isModuleEnabledForSite(siteId: string, pluginId: string, moduleId: string): Promise<boolean> {
  const manifest = pluginRegistry.get(pluginId);
  if (!manifest) return true;
  try {
    return isModuleActive(manifest, await getPluginState(siteId, manifest), moduleId);
  } catch {
    return true;
  }
}

async function settingsForSite(siteId: string, pluginId: string): Promise<Record<string, unknown>> {
  try {
    return (await readSitePlugins(siteId)).find((r) => r.pluginId === pluginId)?.settings ?? {};
  } catch {
    return {};
  }
}

/** Uygulama açılışında bir kez bağlanır. */
export function installPluginGate(): void {
  pluginRegistry.gate = isModuleEnabledForSite;
  pluginRegistry.settingsProvider = settingsForSite;
}
