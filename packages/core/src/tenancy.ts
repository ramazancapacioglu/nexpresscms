import type { CmsMode, SiteProfile } from "./types";

export interface CmsRequestContext {
  siteId: string;
  cmsMode: CmsMode;
  locale: string;
  region?: string;
  host?: string;
  siteProfile?: SiteProfile;
}

const globalForContext = globalThis as unknown as {
  __nexpressActiveContext?: CmsRequestContext;
};

/**
 * Ortam değişkeninden aktif çalışma modunu döndürür.
 * Varsayılan: 'single' (siteId = 'default')
 */
export function getCmsMode(): CmsMode {
  const raw =
    typeof process !== "undefined"
      ? process.env?.CMS_MODE?.trim().toLowerCase()
      : undefined;
  return raw === "multi_subdomain" ? "multi_subdomain" : "single";
}

/**
 * Gelen HTTP `Host` başlığından ve `CMS_MODE` ayarından `siteId` değerini çözer.
 * - `CMS_MODE="single"` ise her zaman `'default'` döner.
 * - `CMS_MODE="multi_subdomain"` ise `firma.demo.nexpress.com` -> `'firma'` döner.
 */
export function resolveSiteIdFromHost(hostHeader?: string | null): string {
  const mode = getCmsMode();
  if (mode === "single" || !hostHeader) {
    return "default";
  }

  const cleanHost = hostHeader.split(":")[0]?.toLowerCase().trim() ?? "";
  const rootDomain = (
    (typeof process !== "undefined"
      ? process.env?.NEXT_PUBLIC_ROOT_DOMAIN
      : undefined) ?? "localhost:3000"
  )
    .split(":")[0]
    ?.toLowerCase()
    .trim();

  if (
    !cleanHost ||
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === rootDomain ||
    cleanHost === `www.${rootDomain}`
  ) {
    return "default";
  }

  if (cleanHost.endsWith(".localhost")) {
    const sub = cleanHost.replace(/\.localhost$/, "");
    return sanitizeSiteId(sub);
  }

  if (rootDomain && cleanHost.endsWith(`.${rootDomain}`)) {
    const sub = cleanHost.slice(0, -(rootDomain.length + 1));
    return sanitizeSiteId(sub);
  }

  return "default";
}

function sanitizeSiteId(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
  if (!cleaned || cleaned === "www" || cleaned === "admin" || cleaned === "api") {
    return "default";
  }
  return cleaned;
}

/**
 * Bir işlem bloğunu belirli bir `CmsRequestContext` (`siteId`) altında çalıştırır.
 */
export function runWithCmsContext<T>(
  context: CmsRequestContext,
  fn: () => T
): T {
  const prev = globalForContext.__nexpressActiveContext;
  globalForContext.__nexpressActiveContext = context;
  try {
    return fn();
  } finally {
    globalForContext.__nexpressActiveContext = prev;
  }
}

/**
 * Aktif isteğin `siteId`, `cmsMode` ve `locale` bağlamını döndürür.
 */
export function getCmsContext(
  overrides?: Partial<CmsRequestContext>
): CmsRequestContext {
  const active = globalForContext.__nexpressActiveContext;
  const cmsMode = overrides?.cmsMode ?? active?.cmsMode ?? getCmsMode();
  const siteId =
    overrides?.siteId ??
    active?.siteId ??
    (cmsMode === "single" ? "default" : "default");

  return {
    siteId,
    cmsMode,
    locale: overrides?.locale ?? active?.locale ?? "tr",
    region: overrides?.region ?? active?.region ?? "TR",
    host: overrides?.host ?? active?.host,
    siteProfile: overrides?.siteProfile ?? active?.siteProfile,
  };
}
