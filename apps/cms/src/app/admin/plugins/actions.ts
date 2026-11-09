"use server";

import { normalizePluginSettings, pluginRegistry, verifyPluginLicenseKey, type PluginLicenseVerification } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import "@/plugins/register";

export type PluginActionResult = { ok: true } | { ok: false; error: string };

async function commit(path = "/admin/plugins") {
  await invalidateSite();
  await revalidatePath(path);
}

/** Eklentiyi tüm modülleriyle aç / kapat. Çekirdek (builtin) eklentiler kapatılamaz. */
export async function setPluginEnabledAction(input: { pluginId: string; enabled: boolean }): Promise<PluginActionResult> {
  const admin = await requireAdmin("plugins.toggle");
  const manifest = pluginRegistry.get(input.pluginId);
  if (!manifest) return { ok: false, error: "Eklenti bulunamadı." };
  if (manifest.builtin) return { ok: false, error: "Çekirdek eklenti kapatılamaz." };
  await getScopedRepository(admin.siteId).saveSitePlugin(manifest.id, { enabled: input.enabled });
  await recordAudit({ id: admin.sub, email: admin.email }, "plugins.toggle", { detail: `${manifest.name}: ${input.enabled ? "açıldı" : "kapatıldı"}` });
  await commit();
  return { ok: true };
}

/** Tek bir modülü aç / kapat. Henüz taşınmamış ("yakında") modüller değiştirilemez. */
export async function setPluginModuleAction(input: { pluginId: string; moduleId: string; enabled: boolean }): Promise<PluginActionResult> {
  const admin = await requireAdmin("plugins.module");
  const manifest = pluginRegistry.get(input.pluginId);
  const def = manifest?.modules.find((m) => m.id === input.moduleId);
  if (!manifest || !def) return { ok: false, error: "Modül bulunamadı." };
  if (def.status !== "ready") return { ok: false, error: "Bu modül henüz hazır değil." };
  await getScopedRepository(admin.siteId).saveSitePlugin(manifest.id, { modules: { [def.id]: input.enabled } });
  await recordAudit({ id: admin.sub, email: admin.email }, "plugins.module", { detail: `${manifest.name} › ${def.label}: ${input.enabled ? "açıldı" : "kapatıldı"}` });
  await commit();
  return { ok: true };
}

/** Eklenti ayarlarını manifestteki alanlara göre doğrulayıp kaydeder. */
export async function savePluginSettingsAction(input: {
  pluginId: string;
  values: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  const admin = await requireAdmin("plugins.settings");
  const manifest = pluginRegistry.get(input.pluginId);
  if (!manifest?.settings) return { ok: false, error: "Bu eklentinin ayarı yok." };
  const { values, errors } = normalizePluginSettings(manifest.settings, input.values);
  if (Object.keys(errors).length > 0) return { ok: false, error: "Bazı alanlar geçersiz.", fieldErrors: errors };
  await getScopedRepository(admin.siteId).saveSitePlugin(manifest.id, { settings: values });
  await recordAudit({ id: admin.sub, email: admin.email }, "plugins.settings", { detail: `${manifest.name}: ayarlar kaydedildi` });
  await commit();
  return { ok: true };
}

/** Pro eklenti çevrimdışı Ed25519 lisans anahtarını doğrular ve kaydeder (boşsa kaldırır). */
export async function savePluginLicenseAction(input: {
  pluginId: string;
  licenseKey: string;
}): Promise<{ ok: true; verification: PluginLicenseVerification } | { ok: false; error: string }> {
  const admin = await requireAdmin("plugins.license");
  const manifest = pluginRegistry.get(input.pluginId);
  if (!manifest) return { ok: false, error: "Eklenti bulunamadı." };
  const cleaned = input.licenseKey.trim();
  if (!cleaned) {
    await getScopedRepository(admin.siteId).saveSitePlugin(manifest.id, { licenseKey: null });
    await recordAudit({ id: admin.sub, email: admin.email }, "plugins.license", { detail: `${manifest.name}: lisans anahtarı kaldırıldı` });
    await commit();
    return { ok: true, verification: { status: "unlicensed", payload: null, daysRemaining: null } };
  }
  const site = await getScopedRepository(admin.siteId).getSite();
  const verification = await verifyPluginLicenseKey(cleaned, {
    pluginId: manifest.id,
    siteDomain: site?.domain ?? undefined,
  });
  if (verification.status === "invalid") {
    return { ok: false, error: verification.error ?? "Lisans anahtarı doğrulanamadı." };
  }
  await getScopedRepository(admin.siteId).saveSitePlugin(manifest.id, { licenseKey: cleaned });
  await recordAudit(
    { id: admin.sub, email: admin.email },
    "plugins.license",
    { detail: `${manifest.name}: lisans kaydedildi (${verification.status})` }
  );
  await commit();
  return { ok: true, verification };
}
