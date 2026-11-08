"use server";

import { requireAdmin } from "@/lib/auth/session";
import { issueBridgeCode } from "@/lib/wp-bridge/store";

/** Panele bir kez gösterilen eşleştirme kodu. WordPress eklentisine yapıştırılır. */
export async function issueBridgeCodeAction(): Promise<{ ok: true; code: string; expiresAt: string } | { ok: false; error: string }> {
  const admin = await requireAdmin("wp-bridge.code");
  const issued = await issueBridgeCode(admin.siteId);
  return { ok: true, ...issued };
}
