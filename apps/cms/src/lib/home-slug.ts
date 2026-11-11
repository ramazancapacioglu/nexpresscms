import "server-only";
import { pickFrontSlug, resolveSiteSettings } from "@nexpress/core";
import { INK_GRID_HOME_SLUG, INK_GRID_ID, YF_DEMO_HOME_SLUG, YF_THEME_ID } from "@nexpress/themes";
import { getPublicContentBySlug } from "@/lib/public-data";

/** Seçilmiş öne çıkan sayfa durur. Yoksa tema demosu, o da yoksa `ana-sayfa`. */
export async function resolveHomeSlug(siteId: string, themeId: string, locale: string, settings: unknown) {
  let fallback = "ana-sayfa";
  if (themeId === INK_GRID_ID) fallback = INK_GRID_HOME_SLUG;
  else if (themeId === YF_THEME_ID) {
    const demo = await getPublicContentBySlug(siteId, YF_DEMO_HOME_SLUG, locale);
    if (demo) fallback = YF_DEMO_HOME_SLUG;
  }
  const chosen = pickFrontSlug(resolveSiteSettings(settings).general.frontPageSlug, "");
  if (!chosen) return fallback;
  const page = await getPublicContentBySlug(siteId, chosen, locale);
  return page ? chosen : fallback;
}
