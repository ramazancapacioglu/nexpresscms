"use server";

import { createDraftPreviewToken } from "@nexpress/core/draft-preview";
import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { getAuthSecret } from "@/lib/auth/config";
import { requireUser } from "@/lib/auth/session";

/** Kaydedilmiş içeriğin taslağını oturumsuz görüntüleyen süreli bağlantı üretir (1–30 gün). */
export async function createDraftPreviewLinkAction(input: { contentId: string; locale: string; days: number }): Promise<{ ok: true; url: string; expiresAt: string } | { ok: false; error: string }> {
  const me = await requireUser({ audit: "content.preview-link" });
  const content = await getScopedRepository(me.siteId).getContentById(input.contentId, input.locale);
  if (!content || !content.slug) return { ok: false, error: "İçerik bulunamadı; önce kaydedin." };
  const days = [1, 7, 30].includes(input.days) ? input.days : 7;
  const token = createDraftPreviewToken(getAuthSecret(), me.siteId, content.id, days);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  await recordAudit({ id: me.sub, email: me.email }, "content.preview-link", { detail: `${content.slug} (${days} gün)` });
  return { ok: true, url: `${base}/${input.locale}/${content.slug}?nx_draft=${encodeURIComponent(token)}`, expiresAt: new Date(Date.now() + days * 86_400_000).toISOString() };
}
