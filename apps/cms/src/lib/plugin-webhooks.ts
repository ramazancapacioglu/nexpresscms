import "server-only";
import { randomUUID } from "node:crypto";
import { nextWebhookAttempt, signWebhook, type DataPluginWebhook, type WebhookEvent } from "@nexpress/core";
import { decryptSecret } from "@nexpress/core/secret-box";
import { getScopedRepository } from "@nexpress/database";
import { postPublicJson } from "@/lib/safe-fetch";

/** Giden istek `postPublicJson` ile yapılır (https, genel IP doğrulaması bağlantı anında, yönlendirme yok, kısa zaman aşımı). */
async function deliver(url: string, headers: Record<string, string>, body: string): Promise<{ ok: boolean; status: number | null; error?: string }> {
  try {
    await postPublicJson(url, body, { timeoutMs: 5_000, headers, userAgent: "NexPress-Webhook/1" });
    return { ok: true, status: 200 };
  } catch (e) {
    const message = e instanceof Error ? e.message : "hata";
    const status = /^HTTP (\d{3})$/.exec(message)?.[1];
    return { ok: false, status: status ? Number(status) : null, error: status ? `HTTP ${status}` : message.slice(0, 120) };
  }
}

export interface ContentWebhookData {
  contentId: string;
  type: string;
  slug: string;
  title: string;
  url: string;
  status: string;
  locale: string;
}

export interface ContentWebhookData {
  contentId: string;
  type: string;
  slug: string;
  title: string;
  url: string;
  status: string;
  locale: string;
}

/** Tek deneme: imzayı her denemede yeni zaman damgasıyla atar; gövde ve `X-NexPress-Delivery` (kayıt kimliği) sabittir. */
async function attemptDelivery(secret: string, hook: DataPluginWebhook, delivery: { id: string; event: string; body: string }): Promise<{ ok: boolean; status: number | null; error?: string }> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return deliver(hook.url, {
    "X-NexPress-Event": delivery.event,
    "X-NexPress-Delivery": delivery.id,
    "X-NexPress-Timestamp": timestamp,
    "X-NexPress-Signature": `sha256=${await signWebhook(secret, timestamp, delivery.body)}`,
  }, delivery.body);
}

const decrypt = (value: string): string => {
  try {
    return value ? decryptSecret(value) : "";
  } catch {
    return "";
  }
};

/** Bir kuyruk kaydını dener ve sonucu (başarı / yeniden deneme zamanı / vazgeçme) kaydeder; eklentinin "son bildirim"ini günceller. */
async function runDelivery(siteId: string, delivery: { id: string; pluginId: string; webhookId: string; event: string; body: string; attempts: number }): Promise<void> {
  const repo = getScopedRepository(siteId);
  const plugin = await repo.getDataPlugin(delivery.pluginId);
  const hook = plugin?.webhooks.find((w) => w.id === delivery.webhookId);
  const secret = plugin?.enabled ? decrypt(plugin.webhookSecret) : "";
  const now = new Date();
  if (!plugin || !hook || !secret) {
    // Eklenti kapatıldı/silindi ya da webhook kaldırıldı: bekleyen teslimat artık gönderilmez
    await repo.recordAttempt(delivery.id, delivery.attempts, { ok: false, status: null, error: "eklenti devre dışı ya da webhook kaldırıldı", giveUp: true });
    return;
  }
  const res = await attemptDelivery(secret, hook, delivery);
  const next = res.ok ? null : nextWebhookAttempt(delivery.attempts + 1, res.status, now);
  const wrote = await repo.recordAttempt(delivery.id, delivery.attempts, { ok: res.ok, status: res.status, error: res.error, ...(next && !next.giveUp ? { nextAttemptAt: next.at } : {}), giveUp: next?.giveUp === true });
  if (wrote) await repo.recordDataPluginDelivery(plugin.pluginId, { at: now.toISOString(), event: delivery.event, ok: res.ok, status: res.status, ...(res.error ? { error: res.error } : {}) });
}

/**
 * Etkin veri eklentilerinin ilgili webhook'larına bildirim gönderir. Her bildirim önce kalıcı kuyruğa yazılır ve hemen
 * denenir; geçici hatada zamanlayıcı üstel beklemeyle yeniden dener (`processDueWebhookDeliveries`). Hata içerik kaydını
 * asla etkilemez. Gövdeye yalnızca başlık, adres ve durum girer (içerik metni ve kişisel veri gitmez).
 */
export async function dispatchPluginWebhooks(siteId: string, event: WebhookEvent, data: ContentWebhookData): Promise<void> {
  try {
    const repo = getScopedRepository(siteId);
    const plugins = (await repo.listDataPlugins()).filter((p) => p.enabled && p.webhooks.some((w) => w.event === event));
    for (const plugin of plugins) {
      for (const hook of plugin.webhooks.filter((w) => w.event === event)) {
        const id = randomUUID();
        const body = JSON.stringify({ event, plugin: plugin.pluginId, webhook: hook.id, deliveryId: id, deliveredAt: new Date().toISOString(), data });
        await repo.enqueueDelivery({ id, pluginId: plugin.pluginId, webhookId: hook.id, event, body });
        await runDelivery(siteId, { id, pluginId: plugin.pluginId, webhookId: hook.id, event, body, attempts: 0 });
      }
    }
  } catch (error) {
    console.warn("[plugin-webhooks]", error instanceof Error ? error.message : error);
  }
}

/** Zamanlayıcı: zamanı gelen bekleyen teslimatları yeniden dener ve eski tamamlanmış kayıtları (14 gün) siler. */
export async function processDueWebhookDeliveries(siteId: string): Promise<number> {
  try {
    const repo = getScopedRepository(siteId);
    const due = await repo.dueDeliveries(new Date(), 20);
    for (const d of due) await runDelivery(siteId, d);
    if (due.length > 0) await repo.purgeOldDeliveries(14);
    return due.length;
  } catch (error) {
    console.warn("[plugin-webhooks]", error instanceof Error ? error.message : error);
    return 0;
  }
}
