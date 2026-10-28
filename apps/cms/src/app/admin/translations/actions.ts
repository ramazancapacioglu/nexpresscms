"use server";

import { getScopedRepository, type TranslationOverviewRow } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";

export type TranslationActionResult = { ok: true } | { ok: false; error: string };

/** Dil şeridi verisi (okuma): içeriğin her etkin dildeki durumu. */
export async function translationOverviewAction(input: { contentId: string }): Promise<{ ok: true; rows: TranslationOverviewRow[] } | { ok: false; error: string }> {
  const session = await requireUser();
  if (!input.contentId) return { ok: false, error: "İçerik kimliği gerekli." };
  return { ok: true, rows: await getScopedRepository(session.siteId).translationOverview(input.contentId) };
}

/** Kaynak dildeki içeriği hedef dile taslak olarak kopyalar; çeviri sonra editörde düzenlenip yayınlanır. */
export async function createTranslationAction(input: { contentId: string; from: string; to: string }): Promise<TranslationActionResult> {
  const session = await requireUser({ audit: "cms.createTranslation" });
  const res = await getScopedRepository(session.siteId).createTranslation(input.contentId, input.from, input.to, { id: session.sub, email: session.email });
  if (res.ok) {
    await invalidateSite();
    await revalidatePath("/admin/contents");
  }
  return res;
}

export async function deleteTranslationAction(input: { contentId: string; locale: string }): Promise<TranslationActionResult> {
  const session = await requireUser({ audit: "cms.deleteTranslation" });
  const res = await getScopedRepository(session.siteId).deleteTranslation(input.contentId, input.locale);
  if (res.ok) {
    await invalidateSite();
    await revalidatePath("/admin/contents");
  }
  return res;
}

/** Sitenin etkin dil listesini yazar (yalnızca yönetici). Çeviriler silinmez; kapatılan dil ziyaretçiye 404 olur. */
export async function saveLocalesAction(input: { locales: string[] }): Promise<{ ok: true; locales: string[] } | { ok: false; error: string }> {
  const admin = await requireAdmin("settings.locales");
  const res = await getScopedRepository(admin.siteId).saveSupportedLocales(input.locales);
  if (res.ok) {
    await recordAudit({ id: admin.sub, email: admin.email }, "settings.locales", { detail: res.locales.join(", ") });
    await invalidateSite();
    await revalidatePath("/admin/settings");
  }
  return res;
}
