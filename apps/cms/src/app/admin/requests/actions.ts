"use server";

import { getAgentRequestRepository, type AgentRequestStatus } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";

/** Talebi "işlendi" / "yeni" olarak işaretler. Kişisel veri içerdiği için yalnızca yönetici. */
export async function setRequestStatusAction(input: { id: string; status: AgentRequestStatus }): Promise<{ ok: boolean }> {
  const admin = await requireAdmin("requests.status");
  if (input.status !== "new" && input.status !== "handled") return { ok: false };
  const ok = await getAgentRequestRepository(admin.siteId).setStatus(input.id, input.status);
  if (ok) await recordAudit({ id: admin.sub, email: admin.email }, "requests.status", { target: input.id, detail: input.status });
  await revalidatePath("/admin/requests");
  return { ok };
}
