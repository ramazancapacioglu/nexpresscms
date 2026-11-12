/**
 * Yayında CDN/ters vekil önbelleğini temizleme (saf mantık). Önbellek `s-maxage` ile kendiliğinden tazelenir
 * (`html-cache.ts`); bu modül içerik değişince etkilenen adresleri hesaplar ve sağlayıcı isteğini kurar.
 * Ağ çağrısı `apps/cms/src/lib/cdn-purge.ts`'tedir. Yapılandırma yalnızca sunucu ortamındandır (panelden sır alınmaz).
 */

export const CDN_PURGE_PROVIDERS = ["cloudflare", "webhook"] as const;
export type CdnPurgeProvider = (typeof CDN_PURGE_PROVIDERS)[number];

/** Cloudflare tek istekte en çok 30 adres temizler. */
export const CDN_PURGE_BATCH = 30;

export type CdnPurgeConfig =
  | { provider: "cloudflare"; zoneId: string; apiToken: string }
  | { provider: "webhook"; url: string; secret: string };

/** Ortam değişkenlerinden yapılandırma; eksik ya da geçersizse `null` (temizleme kapalı). */
export function resolveCdnPurgeConfig(env: Record<string, string | undefined>): CdnPurgeConfig | null {
  const provider = CDN_PURGE_PROVIDERS.find((p) => p === (env.CDN_PURGE_PROVIDER ?? "").trim().toLowerCase());
  if (provider === "cloudflare") {
    const zoneId = (env.CLOUDFLARE_ZONE_ID ?? "").trim();
    const apiToken = (env.CLOUDFLARE_API_TOKEN ?? "").trim();
    return /^[a-f0-9]{32}$/i.test(zoneId) && apiToken.length >= 20 ? { provider, zoneId, apiToken } : null;
  }
  if (provider === "webhook") {
    const url = (env.CDN_PURGE_WEBHOOK_URL ?? "").trim();
    const secret = (env.CDN_PURGE_WEBHOOK_SECRET ?? "").trim();
    try {
      const u = new URL(url);
      return u.protocol === "https:" && !u.username && !u.password && secret.length >= 16 ? { provider, url: u.toString(), secret } : null;
    } catch {
      return null;
    }
  }
  return null;
}

export interface PurgeTargetInput {
  /** `NEXT_PUBLIC_APP_URL` (kök adres, sonda eğik çizgi olmadan olur). */
  appUrl: string;
  /** Dil tabanı (`""` ya da `/en`). */
  lb: string;
  /** İçeriğin dil tabanından sonraki yolu (`/hakkimizda`, `/referanslar/acme`). */
  contentPath: string;
  /** Türün arşiv yolu (`/referanslar`); yoksa verilmez. */
  archivePath?: string;
  /** Yazıysa besleme adresi de temizlenir. */
  isPost?: boolean;
  /** Ana sayfa içeriği ise yalnızca kök temizlenir. */
  isHome?: boolean;
}

/**
 * Bir içerik değişince eskimiş olabilecek adresler: kendisi, ana sayfa (listeler), tür arşivi, site haritası,
 * `llms.txt` ve (yazıysa) beslemeler. Yinelenenler atılır; mutlak adres üretilir.
 */
export function cdnPurgeTargets(input: PurgeTargetInput): string[] {
  const base = input.appUrl.replace(/\/$/, "");
  const lb = input.lb.replace(/\/$/, "");
  const paths = [
    input.isHome ? `${lb}/` : `${lb}${input.contentPath}`,
    `${lb}/`,
    ...(input.archivePath ? [`${lb}${input.archivePath}`] : []),
    "/sitemap.xml",
    `${lb}/llms.txt`,
    ...(input.isPost ? ["/feed.xml", "/atom.xml"] : []),
  ];
  return [...new Set(paths.map((p) => `${base}${p === "" ? "/" : p}`))];
}

export const chunkUrls = (urls: readonly string[], size = CDN_PURGE_BATCH): string[][] => {
  const out: string[][] = [];
  for (let i = 0; i < urls.length; i += size) out.push(urls.slice(i, i + size));
  return out;
};

/** Cloudflare `purge_cache` isteği. */
export const cloudflarePurgeRequest = (cfg: Extract<CdnPurgeConfig, { provider: "cloudflare" }>, urls: readonly string[]) => ({
  url: `https://api.cloudflare.com/client/v4/zones/${cfg.zoneId}/purge_cache`,
  headers: { Authorization: `Bearer ${cfg.apiToken}` },
  body: JSON.stringify({ files: urls }),
});
