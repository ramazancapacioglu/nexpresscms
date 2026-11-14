import "server-only";
import { pickFrontSlug, resolveSiteSettings } from "@nexpress/core";
import { CR_HOME_SLUG, CR_THEME_ID, INK_GRID_HOME_SLUG, INK_GRID_ID, KA_HOME_SLUG, KA_THEME_ID, SA_HOME_SLUG, SA_THEME_ID, YF_DEMO_HOME_SLUG, YF_THEME_ID } from "@nexpress/themes";
import { getPublicContentBySlug } from "@/lib/public-data";

/** Seçilmiş öne çıkan sayfa durur. Yoksa tema demosu, o da yoksa `ana-sayfa`. */
export async function resolveHomeSlug(siteId: string, themeId: string, locale: string, settings: unknown) {
  let fallback = "ana-sayfa";
  if (themeId === INK_GRID_ID) fallback = INK_GRID_HOME_SLUG;
  else if (themeId === YF_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, YF_DEMO_HOME_SLUG, locale);
    if (demo) fallback = YF_DEMO_HOME_SLUG;
  } else if (themeId === KA_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, KA_HOME_SLUG, locale);
    if (demo) fallback = KA_HOME_SLUG;
  } else if (themeId === SA_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, SA_HOME_SLUG, locale);
    if (demo) fallback = SA_HOME_SLUG;
  } else if (themeId === CR_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, CR_HOME_SLUG, locale);
    if (demo) fallback = CR_HOME_SLUG;
  }
  const chosen = pickFrontSlug(resolveSiteSettings(settings).general.frontPageSlug, "");
  if (!chosen) return fallback;
  const page = await getPublicContentBySlug(siteId, chosen, locale);
  return page ? chosen : fallback;
}
