import { getCmsContext } from "@nexpress/core";
import { CmsPluginRepository } from "./cms/plugins";

export * from "./cms/types";
export { invalidateSiteCache } from "./cms/site";

/**
 * Kural 2 & Kural 3: her sorgu `siteId` kapsamlıdır; tek arayüz iki motorda çalışır.
 * Gerçek kod alan bazlı dosyalardadır (`src/cms/*`); sınıf, sırayla genişleyen bir zincirdir:
 * base -> site -> navigation -> media -> comments -> taxonomy -> content-read -> revisions -> content-write -> translations -> themes -> lifecycle -> plugins.
 */
export class ScopedCmsRepository extends CmsPluginRepository {}

/**
 * Kural 2: Her zaman aktif `getCmsContext()` kapsamındaki repository'yi döndürür.
 */
export function getScopedRepository(siteIdOverride?: string): ScopedCmsRepository {
  return new ScopedCmsRepository(siteIdOverride);
}
