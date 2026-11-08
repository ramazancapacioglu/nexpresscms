"use server";

import { requireAdmin } from "@/lib/auth/session";
import { redrawFlatPages } from "@/lib/wp-bridge/redraw";
import { repairImportedAssets } from "@/lib/wp-bridge/repair";
import { issueBridgeCode } from "@/lib/wp-bridge/store";

/** Panele bir kez gösterilen eşleştirme kodu. WordPress eklentisine yapıştırılır. */
export async function issueBridgeCodeAction(): Promise<{ ok: true; code: string; expiresAt: string } | { ok: false; error: string }> {
  const admin = await requireAdmin("wp-bridge.code");
  const issued = await issueBridgeCode(admin.siteId);
  return { ok: true, ...issued };
}

/** Göreli görselleri indirir, yapışık başlıkları ayırır, yapısız sayfaları AI ile yerleştirir. */
export async function repairBridgeAction(): Promise<
  | { ok: true; pages: number; split: number; downloaded: number; failed: number; drawn: number; note: string }
  | { ok: false; error: string }
> {
  const admin = await requireAdmin("wp-bridge.repair");
  const repair = await repairImportedAssets(admin.siteId);
  if (!repair.origin) return { ok: false, error: "Kaynak site adresi yok. Önce eşleştirin." };
  const draw = await redrawFlatPages(admin.siteId, 4);
  return {
    ok: true,
    pages: repair.pages,
    split: repair.split,
    downloaded: repair.downloaded,
    failed: repair.failed,
    drawn: draw.drawn,
    note: draw.note,
  };
}
