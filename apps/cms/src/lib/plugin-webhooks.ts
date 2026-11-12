import "server-only";
import { randomUUID } from "node:crypto";
import { signWebhook, type WebhookEvent } from "@nexpress/core";
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

/**
 * Etkin veri eklentilerinin ilgili webhook'larına bildirim gönderir. Hata içerik kaydını asla etkilemez; sonuç eklentinin
 * "son gönderim" alanına yazılır. Gövdeye yalnızca başlık, adres ve durum girer (içerik metni ve kişisel veri gitmez).
 */
export async function dispatchPluginWebhooks(siteId: string, event: WebhookEvent, data: ContentWebhookData): Promise<void> {
  try {
    const repo = getScopedRepository(siteId);
    const plugins = (await repo.listDataPlugins()).filter((p) => p.enabled && p.webhooks.some((w) => w.event === event));
    await Promise.all(
      plugins.map(async (plugin) => {
        let secret = "";
        try {
          secret = plugin.webhookSecret ? decryptSecret(plugin.webhookSecret) : "";
        } catch {
          secret = "";
        }
        if (!secret) return;
        let last: NonNullable<typeof plugin.lastDelivery> | null = null;
        for (const hook of plugin.webhooks.filter((w) => w.event === event)) {
          const timestamp = String(Math.floor(Date.now() / 1000));
          const delivery = randomUUID();
          const body = JSON.stringify({ event, plugin: plugin.pluginId, webhook: hook.id, deliveredAt: new Date().toISOString(), data });
          const res = await deliver(hook.url, {
            "X-NexPress-Event": event,
            "X-NexPress-Delivery": delivery,
            "X-NexPress-Timestamp": timestamp,
            "X-NexPress-Signature": `sha256=${await signWebhook(secret, timestamp, body)}`,
          }, body);
          last = { at: new Date().toISOString(), event, ok: res.ok, status: res.status, ...(res.error ? { error: res.error } : {}) };
        }
        if (last) await repo.recordDataPluginDelivery(plugin.pluginId, last);
      })
    );
  } catch {
    /* bildirim hatası yayını bozmaz */
  }
}
