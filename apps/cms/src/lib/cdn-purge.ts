import "server-only";
import { chunkUrls, cdnPurgeTargets, cloudflarePurgeRequest, contentPath, findContentType, localeBase, resolveCdnPurgeConfig, resolveSiteSettings, signWebhook } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { notify } from "@/lib/notify";
import { postPublicJson } from "@/lib/safe-fetch";

const DEBOUNCE_MS = 1500;
const pending = new Map<string, Set<string>>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Temizleme yapılandırılmış mı (`CDN_PURGE_PROVIDER` + sağlayıcı değişkenleri). */
export const cdnPurgeEnabled = (): boolean => resolveCdnPurgeConfig(process.env) !== null;

async function send(siteId: string, urls: string[]): Promise<void> {
  const cfg = resolveCdnPurgeConfig(process.env);
  if (!cfg) return;
  try {
    for (const batch of chunkUrls(urls)) {
      if (cfg.provider === "cloudflare") {
        const r = cloudflarePurgeRequest(cfg, batch);
        await postPublicJson(r.url, r.body, { timeoutMs: 8_000, headers: r.headers, userAgent: "NexPress-CDN/1" });
      } else {
        const body = JSON.stringify({ type: "purge", urls: batch, at: new Date().toISOString() });
        const timestamp = String(Math.floor(Date.now() / 1000));
        await postPublicJson(cfg.url, body, { timeoutMs: 8_000, userAgent: "NexPress-CDN/1", headers: { "X-NexPress-Timestamp": timestamp, "X-NexPress-Signature": `sha256=${await signWebhook(cfg.secret, timestamp, body)}` } });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 160) : "Ağ hatası";
    console.warn("[cdn-purge]", message);
    await notify(siteId, { kind: "cdn.purge_failed", severity: "warning", title: "CDN önbellek temizleme başarısız", body: `${message}. İçerik, önbellek süresi (PUBLIC_CACHE_SECONDS) dolana kadar eski görünebilir.`, href: "/admin/system", dedupeKey: "cdn-purge-failed", audience: "admin" }).catch(() => undefined);
  }
}

/** Adresleri kuyruğa alır; kısa sürede gelen çok sayıda değişiklik tek istekte birleşir. Hata içerik akışını bozmaz. */
export function queueCdnPurge(siteId: string, urls: string[]): void {
  if (!cdnPurgeEnabled() || urls.length === 0) return;
  const set = pending.get(siteId) ?? new Set<string>();
  for (const u of urls) set.add(u);
  pending.set(siteId, set);
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const batch = [...pending.entries()];
    pending.clear();
    for (const [id, set] of batch) void send(id, [...set]);
  }, DEBOUNCE_MS);
  timer.unref?.();
}

/**
 * İçeriğin her dilindeki adresini temizler. CDN kapalıysa hemen döner.
 * Çöpe taşımadan önce çağrılmalıdır: çöpteki satır ziyaretçi listesinde yoktur.
 */
export async function purgeContentLocales(siteId: string, contentId: string): Promise<void> {
  if (!cdnPurgeEnabled()) return;
  try {
    const translations = await getScopedRepository(siteId).getTranslationsForContent(contentId);
    const locales = [...new Set(translations.map((row) => row.locale))];
    for (const locale of locales.length > 0 ? locales : ["tr"]) await purgeContentCaches(siteId, { contentId, locale });
  } catch (error) {
    console.warn("[cdn-purge]", error instanceof Error ? error.message : error);
  }
}

/** Bir içeriğin etkilenen adreslerini hesaplayıp temizler (yayın, güncelleme, yayından kaldırma sonrası). */
export async function purgeContentCaches(siteId: string, ref: { contentId: string; locale: string }): Promise<void> {
  if (!cdnPurgeEnabled()) return;
  try {
    const repo = getScopedRepository(siteId);
    const [site, content] = await Promise.all([repo.getSite(), repo.getContentById(ref.contentId, ref.locale)]);
    if (!site || !content) return;
    const types = resolveSiteSettings(site.settings).general.contentTypes;
    const def = findContentType(types, content.type);
    const lb = localeBase(site, ref.locale);
    queueCdnPurge(siteId, cdnPurgeTargets({
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      lb,
      contentPath: contentPath(types, content),
      ...(def?.archive && def.archiveSlug ? { archivePath: `/${def.archiveSlug}` } : {}),
      isPost: content.type === "post",
      isHome: content.slug === "ana-sayfa",
    }));
  } catch (error) {
    console.warn("[cdn-purge]", error instanceof Error ? error.message : error);
  }
}
