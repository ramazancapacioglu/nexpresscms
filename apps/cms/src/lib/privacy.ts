import "server-only";
import { resolvePublicContent } from "@/lib/public-data";

/** Gizlilik politikası sayfasının slug'ı: formlardaki açık rıza bağlantısı bu sayfayı pencerede açar. */
const PRIVACY_SLUG = "gizlilik-politikasi";

/**
 * Pencerede (iframe, tembel yüklenir) gösterilecek gizlilik politikası adresi; sayfa yoksa boş döner ve form düz metin kalır.
 * `?embed=1` ziyaretçi kabuğunu (üst, alt, yüzen düğmeler) gizler.
 */
export async function privacyEmbedUrl(siteId: string, locale: string, lb: string): Promise<string> {
  const hit = await resolvePublicContent(siteId, PRIVACY_SLUG, locale, "");
  return hit && !hit.isRedirect ? `${lb}/${PRIVACY_SLUG}?embed=1` : "";
}
