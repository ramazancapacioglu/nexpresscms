"use server";

import { requireAdmin } from "@/lib/auth/session";
import { reconstructRichSiteDataset } from "@/lib/wp-bridge/reconstruct";
import { redrawFlatPages } from "@/lib/wp-bridge/redraw";
import { repairImportedAssets } from "@/lib/wp-bridge/repair";
import { issueBridgeCode } from "@/lib/wp-bridge/store";

/** Panele bir kez gösterilen eşleştirme kodu. WordPress eklentisine yapıştırılır. */
export async function issueBridgeCodeAction(): Promise<{ ok: true; code: string; expiresAt: string } | { ok: false; error: string }> {
  const admin = await requireAdmin("wp-bridge.code");
  const issued = await issueBridgeCode(admin.siteId);
  return { ok: true, ...issued };
}

/** Zengin blok derleyicisiyle tüm sayfa, yazı, kategori, görsel ve menüleri yeniden derler. */
export async function reconstructBridgeDatasetAction(): Promise<
  | { ok: true; pagesUpdated: number; postsUpdated: number; categoriesUpdated: number; imagesCopied: number }
  | { ok: false; error: string }
> {
  const admin = await requireAdmin("wp-bridge.reconstruct");
  const result = await reconstructRichSiteDataset(admin.siteId);
  if (!result.ok) {
    return { ok: false, error: "Kaynak veri kümesi bulunamadı." };
  }
  return {
    ok: true,
    pagesUpdated: result.pagesUpdated,
    postsUpdated: result.postsUpdated,
    categoriesUpdated: result.categoriesUpdated,
    imagesCopied: result.imagesCopied,
  };
}

/** Göreli görselleri indirir, yapışık başlıkları ayırır, yapısız sayfaları AI ile yerleştirir. */
export async function repairBridgeAction(): Promise<
  | { ok: true; pages: number; split: number; downloaded: number; failed: number; drawn: number; note: string }
  | { ok: false; error: string }
> {
  const admin = await requireAdmin("wp-bridge.repair");
  const reconstructed = await reconstructRichSiteDataset(admin.siteId);
  const repair = await repairImportedAssets(admin.siteId);
  if (!repair.origin && !reconstructed.ok) return { ok: false, error: "Kaynak site adresi yok. Önce eşleştirin." };
  const draw = await redrawFlatPages(admin.siteId, 4);
  return {
    ok: true,
    pages: repair.pages + reconstructed.pagesUpdated,
    split: repair.split,
    downloaded: repair.downloaded + reconstructed.imagesCopied,
    failed: repair.failed,
    drawn: draw.drawn,
    note: reconstructed.ok
      ? `${reconstructed.pagesUpdated} sayfa ve ${reconstructed.postsUpdated} yazı zengin blok ağacıyla yeniden derlendi.${draw.note ? ` ${draw.note}` : ""}`
      : draw.note,
  };
}
