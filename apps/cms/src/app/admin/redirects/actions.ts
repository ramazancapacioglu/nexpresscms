"use server";

import { getRedirectRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";

export type RedirectActionResult = { ok: true } | { ok: false; error: string };

async function commit() {
  await invalidateSite();
  await revalidatePath("/admin/redirects");
}

export async function saveRedirectAction(input: { fromPath: string; toPath: string; code: number; note?: string }): Promise<RedirectActionResult> {
  const me = await requireAdmin("redirects.save");
  const res = await getRedirectRepository(me.siteId).save(input);
  if (!res.ok) return res;
  await recordAudit({ id: me.sub, email: me.email }, "redirects.save", { detail: `${input.fromPath} → ${input.toPath} (${input.code})`.slice(0, 200) });
  await commit();
  return { ok: true };
}

export async function toggleRedirectAction(input: { id: string; enabled: boolean }): Promise<RedirectActionResult> {
  const me = await requireAdmin("redirects.toggle");
  const ok = await getRedirectRepository(me.siteId).setEnabled(input.id, input.enabled);
  await commit();
  return ok ? { ok: true } : { ok: false, error: "Kural bulunamadı." };
}

export async function deleteRedirectAction(input: { id: string }): Promise<RedirectActionResult> {
  const me = await requireAdmin("redirects.delete");
  const ok = await getRedirectRepository(me.siteId).remove(input.id);
  if (ok) await recordAudit({ id: me.sub, email: me.email }, "redirects.delete", { target: input.id });
  await commit();
  return ok ? { ok: true } : { ok: false, error: "Kural silinemedi." };
}

/** 404 satırını listeden gizler (ör. bot gürültüsü, favicon). */
export async function ignoreNotFoundAction(input: { path: string }): Promise<RedirectActionResult> {
  const me = await requireAdmin("redirects.ignore404");
  await getRedirectRepository(me.siteId).ignoreNotFound(input.path);
  await revalidatePath("/admin/redirects");
  return { ok: true };
}

export async function clearNotFoundAction(): Promise<RedirectActionResult> {
  const me = await requireAdmin("redirects.clear404");
  await getRedirectRepository(me.siteId).clearNotFound();
  await recordAudit({ id: me.sub, email: me.email }, "redirects.clear404");
  await revalidatePath("/admin/redirects");
  return { ok: true };
}
