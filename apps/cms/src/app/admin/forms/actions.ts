"use server";

import { getFormSubmissionRepository, type FormStatus } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";

const STATUSES: FormStatus[] = ["new", "read", "spam", "archived"];

/** Gelen kutusu durumunu değiştirir (editörler de okuyup işaretleyebilir). */
export async function setSubmissionStatusAction(input: { ids: string[]; status: FormStatus }): Promise<{ ok: boolean; affected: number }> {
  const me = await requireUser({ audit: "forms.status" });
  if (!STATUSES.includes(input.status)) return { ok: false, affected: 0 };
  const n = await getFormSubmissionRepository(me.siteId).setStatus(input.ids.slice(0, 200), input.status);
  await revalidatePath("/admin/forms");
  return { ok: true, affected: n };
}

/** Kalıcı silme: kişisel veri içerdiği için yalnızca yönetici. */
export async function deleteSubmissionsAction(input: { ids: string[] }): Promise<{ ok: boolean; affected: number }> {
  const me = await requireAdmin("forms.delete");
  const n = await getFormSubmissionRepository(me.siteId).remove(input.ids.slice(0, 200));
  await recordAudit({ id: me.sub, email: me.email }, "forms.delete", { detail: `${n} gönderim silindi` });
  await revalidatePath("/admin/forms");
  return { ok: true, affected: n };
}
