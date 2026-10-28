"use server";

import { getScopedRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { invalidateSite, revalidatePath } from "@/lib/cache";

export type LifecycleResult = { ok: true; affected: number } | { ok: false; error: string };

async function commit() {
  await invalidateSite();
  await revalidatePath("/admin");
  await revalidatePath("/admin/pages");
  await revalidatePath("/admin/posts");
  await revalidatePath("/admin/contents");
  await revalidatePath("/admin/trash");
  await revalidatePath("/admin/schedule");
}

/** Çöpten taslak olarak geri yükler. */
export async function restoreContentsAction(input: { ids: string[] }): Promise<LifecycleResult> {
  const me = await requireUser({ audit: "cms.restoreContents" });
  const n = await getScopedRepository(me.siteId).restoreContents(input.ids.slice(0, 200));
  await commit();
  return { ok: true, affected: n };
}

/** Çöptekileri KALICI siler (yalnızca yönetici; yalnızca gerçekten çöpte olanlar). */
export async function purgeContentsAction(input: { ids: string[] }): Promise<LifecycleResult> {
  const me = await requireAdmin("cms.purgeContents");
  const repo = getScopedRepository(me.siteId);
  const inTrash = new Set((await repo.listTrashed()).map((i) => i.contentId));
  const ids = input.ids.filter((id) => inTrash.has(id)).slice(0, 200);
  const n = await repo.deleteContents(ids);
  await recordAudit({ id: me.sub, email: me.email }, "cms.purgeContents", { detail: `${n} içerik kalıcı silindi` });
  await commit();
  return { ok: true, affected: n };
}

export async function emptyTrashAction(): Promise<LifecycleResult> {
  const me = await requireAdmin("cms.emptyTrash");
  const n = await getScopedRepository(me.siteId).emptyTrash();
  await recordAudit({ id: me.sub, email: me.email }, "cms.emptyTrash", { detail: `${n} içerik kalıcı silindi` });
  await commit();
  return { ok: true, affected: n };
}

/** Zamanlanmış içeriği hemen yayınlar veya zamanlamayı kaldırıp taslağa alır. */
export async function resolveScheduledAction(input: { contentId: string; outcome: "draft" | "published" }): Promise<LifecycleResult> {
  const me = await requireUser({ audit: "cms.resolveScheduled" });
  const ok = await getScopedRepository(me.siteId).setScheduledOutcome(input.contentId, input.outcome === "published" ? "published" : "draft");
  if (!ok) return { ok: false, error: "İçerik zamanlanmış durumda değil." };
  await commit();
  return { ok: true, affected: 1 };
}
