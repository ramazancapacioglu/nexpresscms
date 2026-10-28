import "server-only";
import { MEDIA_WIDTHS, type MediaFormat } from "@nexpress/core";
import { renderVariant } from "./process";
import { getOriginal, getVariant, putVariant } from "./storage";

/** İlk ziyaretçiyi bekletmemek için yüklemede üretilen genişlikler (ekranların çoğunu kapsar). */
const PREWARM_WIDTHS = [640, 1280];

/**
 * Yüklemeden sonra (yanıttan sonra) sık kullanılan türevleri sırayla üretir.
 * Sıralı çalışır: AVIF kodlaması CPU'yu yorar, eşzamanlı yük bindirmez.
 */
export async function prewarmVariants(siteId: string, id: string, originalWidth: number, hasAlpha: boolean): Promise<void> {
  const original = await getOriginal(siteId, id);
  if (!original) return;
  const widths = PREWARM_WIDTHS.filter((w) => (MEDIA_WIDTHS as readonly number[]).includes(w) && w <= originalWidth);
  const formats: MediaFormat[] = ["avif", "webp", hasAlpha ? "png" : "jpg"];
  for (const width of widths.length > 0 ? widths : [MEDIA_WIDTHS[0]]) {
    for (const format of formats) {
      const file = `${width}.${format}`;
      if (await getVariant(siteId, id, file)) continue;
      await putVariant(siteId, id, file, await renderVariant(original, width, format));
    }
  }
}
