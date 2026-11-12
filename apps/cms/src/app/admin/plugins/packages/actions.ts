"use server";

import { randomBytes } from "node:crypto";
import { MAX_CONTENT_TYPES, droppedArchives, resolveSiteSettings, sanitizeContentTypes } from "@nexpress/core";
import { decryptSecret, encryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";
import { processDueWebhookDeliveries } from "@/lib/plugin-webhooks";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Veri eklentisini etkinleştirir. Açık onay şarttır (`consent`): yönetici paketin izin özetini görmüş olmalıdır.
 * Özel türler siteye eklenir (var olan, eklentiye ait olmayan tür kimliğiyle çakışma reddedilir); başlangıç sayfaları
 * yalnızca istenirse ve **taslak** olarak eklenir (aynı adresli içerik ezilmez); webhook sırrı ilk etkinleştirmede üretilir.
 */
export async function enableDataPluginAction(input: { pluginId: string; consent: boolean; addPages: boolean }): Promise<Result<{ pagesAdded: number; pagesSkipped: number }>> {
  const admin = await requireAdmin("plugins.enableData");
  if (input.consent !== true) return { ok: false, error: "Etkinleştirmek için izinleri onaylayın." };
  const repo = getScopedRepository(admin.siteId);
  const plugin = await repo.getDataPlugin(input.pluginId);
  if (!plugin) return { ok: false, error: "Eklenti bulunamadı." };
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";

  if (plugin.contentTypes.length > 0) {
    const current = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
    const conflict = plugin.contentTypes.find((t) => current.some((c) => c.id === t.id && c.plugin !== plugin.pluginId));
    if (conflict) return { ok: false, error: `“${conflict.id}” türü zaten var (başka bir kaynaktan). Önce o türü kaldırın ya da paketin tür kimliğini değiştirin.` };
    const requested = [...current.filter((c) => c.plugin !== plugin.pluginId), ...plugin.contentTypes];
    if (requested.length > MAX_CONTENT_TYPES) return { ok: false, error: `En çok ${MAX_CONTENT_TYPES} içerik türü olabilir; bu paket sınırı aşıyor.` };
    const merged = sanitizeContentTypes(requested);
    if (merged.length !== requested.length || droppedArchives(requested, merged).length > 0) return { ok: false, error: "Paketin türlerinden biri mevcut türlerle çakışıyor (kimlik ya da arşiv adresi)." };
    await repo.saveSiteSettings({ general: { contentTypes: merged } });
  }

  let pagesAdded = 0;
  let pagesSkipped = 0;
  if (input.addPages) {
    for (const p of plugin.pages as Array<{ slug: string; title: string; tldr?: string; type?: "page" | "post"; blocks: never[] }>) {
      if (await repo.getContentBySlug(p.slug, locale)) {
        pagesSkipped++;
        continue;
      }
      await repo.saveContent({
        actor: { id: admin.sub, email: admin.email },
        type: p.type ?? "page",
        status: "draft",
        schemaType: p.type === "post" ? "BlogPosting" : "WebPage",
        importanceScore: 5,
        locale,
        slug: p.slug,
        title: p.title,
        tldr: p.tldr,
        blocks: p.blocks,
      });
      pagesAdded++;
    }
  }

  const secret = plugin.webhooks.length > 0 ? plugin.webhookSecret || encryptSecret(randomBytes(32).toString("base64url")) : plugin.webhookSecret;
  await repo.setDataPluginEnabled(plugin.pluginId, true, secret);
  await recordAudit({ id: admin.sub, email: admin.email }, "plugins.enableData", { detail: `${plugin.pluginId}@${plugin.manifest.version}; tür:${plugin.contentTypes.length} sayfa:+${pagesAdded}/${pagesSkipped} atlandı webhook:${plugin.webhooks.length}` });
  await invalidateSite(admin.siteId);
  await revalidatePath("/admin/plugins/packages");
  await revalidatePath("/admin/content-types");
  await revalidatePath("/sitemap.xml");
  return { ok: true, pagesAdded, pagesSkipped };
}

/** Devre dışı bırakır: eklentinin türleri siteden kaldırılır (türde içerik varsa reddedilir; içerik sahipsiz kalmaz). */
export async function disableDataPluginAction(input: { pluginId: string }): Promise<Result> {
  const admin = await requireAdmin("plugins.disableData");
  const repo = getScopedRepository(admin.siteId);
  const plugin = await repo.getDataPlugin(input.pluginId);
  if (!plugin) return { ok: false, error: "Eklenti bulunamadı." };
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const current = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
  const owned = current.filter((c) => c.plugin === plugin.pluginId);
  for (const t of owned) {
    const used = await repo.listContents({ locale, type: t.id });
    if (used.length > 0) return { ok: false, error: `“${t.labelPlural}” türünde ${used.length} içerik var; önce içerikleri silin.` };
  }
  if (owned.length > 0) await repo.saveSiteSettings({ general: { contentTypes: current.filter((c) => c.plugin !== plugin.pluginId) } });
  await repo.setDataPluginEnabled(plugin.pluginId, false);
  await recordAudit({ id: admin.sub, email: admin.email }, "plugins.disableData", { detail: plugin.pluginId });
  await invalidateSite(admin.siteId);
  await revalidatePath("/admin/plugins/packages");
  await revalidatePath("/admin/content-types");
  await revalidatePath("/sitemap.xml");
  return { ok: true };
}

export async function deleteDataPluginAction(input: { pluginId: string }): Promise<Result> {
  const admin = await requireAdmin("plugins.deleteData");
  const res = await getScopedRepository(admin.siteId).deleteDataPlugin(input.pluginId);
  if (res.ok) {
    await recordAudit({ id: admin.sub, email: admin.email }, "plugins.deleteData", { detail: input.pluginId });
    await revalidatePath("/admin/plugins/packages");
  }
  return res;
}

/** Webhook sırrını yöneticiye gösterir (alıcı imza doğrulaması için). Her gösterim denetim günlüğüne yazılır. */
export async function revealWebhookSecretAction(input: { pluginId: string }): Promise<Result<{ secret: string }>> {
  const admin = await requireAdmin("plugins.revealWebhookSecret");
  const plugin = await getScopedRepository(admin.siteId).getDataPlugin(input.pluginId);
  if (!plugin?.webhookSecret) return { ok: false, error: "Bu eklentinin webhook sırrı yok (etkinleştirince üretilir)." };
  try {
    await recordAudit({ id: admin.sub, email: admin.email }, "plugins.revealWebhookSecret", { detail: plugin.pluginId });
    return { ok: true, secret: decryptSecret(plugin.webhookSecret) };
  } catch {
    return { ok: false, error: "Sır çözülemedi (SECRETS_KEY değişmiş olabilir)." };
  }
}

/** Vazgeçilmiş (başarısız) teslimatı yeniden kuyruğa alır ve hemen dener. */
export async function retryDeliveryAction(input: { deliveryId: string }): Promise<Result> {
  const admin = await requireAdmin("plugins.retryDelivery");
  const ok = await getScopedRepository(admin.siteId).requeueDelivery(input.deliveryId);
  if (!ok) return { ok: false, error: "Teslimat bulunamadı ya da başarısız durumda değil." };
  await processDueWebhookDeliveries(admin.siteId);
  await revalidatePath("/admin/plugins/packages");
  return { ok: true };
}
