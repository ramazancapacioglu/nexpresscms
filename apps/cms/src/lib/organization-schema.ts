import type { SeoEngineSettings } from "@nexpress/core";

/** `site-settings-defaults.ts` varsayılan kurum adı. */
const DEFAULT_ORGANIZATION_NAME = "NexPress CMS";

/**
 * Ayarlardaki kuruluş kimliğini şema grafiğine verir. Varsayılan kurum adı ("NexPress CMS") site adını ezmez;
 * boş alan hiçbir şey yazmaz.
 */
export function organizationFor(seo: SeoEngineSettings) {
  const name = seo.organizationName && seo.organizationName !== DEFAULT_ORGANIZATION_NAME ? seo.organizationName : undefined;
  return {
    ...(name ? { name } : {}),
    ...(seo.organizationLogo ? { logo: seo.organizationLogo } : {}),
    ...(seo.sameAs?.length ? { sameAs: seo.sameAs } : {}),
    ...(seo.organizationSchema ? { schema: seo.organizationSchema } : {}),
    ...(seo.imageRights !== false ? { imageRights: { ...(seo.imageLicenseUrl ? { licenseUrl: seo.imageLicenseUrl } : {}) } } : {}),
  };
}
