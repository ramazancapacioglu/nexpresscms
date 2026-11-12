import "server-only";
import sharp from "sharp";
import { parseMediaRef, resolveSiteSettings } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";
import { getOriginal } from "@/lib/media/storage";

/** Yayımlanan simge boyutları: favicon, Apple ana ekranı ve manifest. */
export const SITE_ICON_SIZES = [32, 180, 192, 512] as const;
export type SiteIconSize = (typeof SITE_ICON_SIZES)[number];

/** Ayarlı site simgesi varsa kareye sığdırılmış PNG; yoksa `null`. Yalnızca yerel medya kabul edilir (dış adres çekilmez). */
export async function renderSiteIcon(siteId: string, size: SiteIconSize): Promise<Buffer | null> {
  const site = await getPublicSite(siteId);
  const ref = parseMediaRef(resolveSiteSettings(site?.settings).seo.siteIcon);
  if (!ref) return null;
  const original = await getOriginal(siteId, ref.id);
  if (!original) return null;
  return sharp(original).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer();
}

export const iconHeaders = { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400" };
