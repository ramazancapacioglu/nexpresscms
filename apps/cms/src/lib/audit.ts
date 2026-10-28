import "server-only";
import { headers } from "next/headers";
import { getAuditRepository } from "@nexpress/database";

export interface AuditActor {
  id: string | null;
  email: string;
}

/**
 * Denetim kaydı yazar; kayıt hatası asıl işlemi asla bozmaz. Parola, belirteç ve sır YAZILMAZ;
 * `detail` yalnızca kısa, insan okunur bağlam içindir (en çok 500 karakter).
 */
export async function recordAudit(
  actor: AuditActor | null,
  action: string,
  options: { target?: string; detail?: string; siteId?: string } = {}
): Promise<void> {
  try {
    const h = await headers();
    const siteId = options.siteId ?? h.get("x-nexpress-site-id") ?? "default";
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
    await getAuditRepository(siteId).record({
      actorId: actor?.id ?? null,
      actorEmail: actor?.email.toLowerCase() ?? "",
      action,
      target: options.target ?? null,
      detail: options.detail,
      ip,
    });
  } catch (error) {
    console.warn("[audit] kaydedilemedi:", error instanceof Error ? error.message : error);
  }
}
