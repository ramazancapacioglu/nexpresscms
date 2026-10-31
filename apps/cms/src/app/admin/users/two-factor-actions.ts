"use server";

import { revalidatePath } from "next/cache";
import { getUserRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

/** Telefonunu kaybeden kullanıcı için yönetici 2FA'yı kapatır (oturumlar kapanır; kişi yeniden kurabilir). */
export async function adminDisableTwoFactorAction(input: { id: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("user.2fa_reset");
  if (input.id === admin.sub) return { ok: false, error: "Kendi doğrulamanızı profilinizden kapatın." };
  const repo = getUserRepository(admin.siteId);
  const user = await repo.findById(input.id);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (!user.totpEnabledAt) return { ok: false, error: "Bu kullanıcıda iki adımlı doğrulama açık değil." };
  await repo.disableTotp(user.id);
  await recordAudit({ id: admin.sub, email: admin.email }, "user.2fa_reset", { target: user.email });
  revalidatePath("/admin/users");
  return { ok: true };
}
