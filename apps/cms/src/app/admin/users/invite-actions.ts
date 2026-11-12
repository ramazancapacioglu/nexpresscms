"use server";

import { revalidatePath } from "next/cache";
import { isUserRole, type UserRole } from "@nexpress/core";
import { hashPassword } from "@nexpress/core/password";
import { getUserRepository, toSummary, type UserSummaryDto } from "@nexpress/database";
import { randomBytes } from "node:crypto";
import { buildAccountLink, sendAccountMail } from "@/lib/account-mail";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

export type InviteResult =
  | { ok: true; user?: UserSummaryDto; mailed: boolean; link?: string; note?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** E-postayla davet: rastgele (kullanılamaz) parolayla hesap açılır; kişi bağlantıdan kendi parolasını belirler. */
export async function inviteUserAction(input: { email: string; name: string; role: UserRole }): Promise<InviteResult> {
  const admin = await requireAdmin("user.invite");
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Geçerli bir e-posta girin." };
  if (!isUserRole(input.role)) return { ok: false, error: "Geçersiz rol." };
  const repo = getUserRepository(admin.siteId);
  if (await repo.findByEmail(email)) return { ok: false, error: "Bu e-posta ile zaten bir hesap var." };
  const user = await repo.create({ email, name: input.name, role: input.role, passwordHash: await hashPassword(randomBytes(32).toString("base64url")) });
  await recordAudit({ id: admin.sub, email: admin.email }, "user.invited", { target: email, detail: `rol: ${input.role}` });
  revalidatePath("/admin/users");
  return { ok: true, user: toSummary(user), ...(await deliver(admin.siteId, user.id, "invite")) };
}

/** Mevcut kullanıcıya parola sıfırlama bağlantısı gönderir (yönetici adına). */
export async function sendResetLinkAction(input: { id: string }): Promise<InviteResult> {
  const admin = await requireAdmin("user.reset_link");
  const user = await getUserRepository(admin.siteId).findById(input.id);
  if (!user) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (user.status !== "active") return { ok: false, error: "Devre dışı hesaba bağlantı gönderilemez." };
  await recordAudit({ id: admin.sub, email: admin.email }, "user.reset_link", { target: user.email });
  return { ok: true, ...(await deliver(admin.siteId, user.id, "reset")) };
}

async function deliver(siteId: string, userId: string, purpose: "invite" | "reset"): Promise<{ mailed: boolean; link?: string; note?: string }> {
  const res = await sendAccountMail(siteId, userId, purpose);
  if (res.ok) return { mailed: true };
  // SMTP kapalı/başarısız: yönetici bağlantıyı kendisi iletir (yalnızca yöneticinin ekranında görünür)
  const link = res.link ?? (await buildAccountLink(siteId, userId, purpose)) ?? undefined;
  return { mailed: false, link, note: `E-posta gönderilemedi (${res.error}). Bağlantıyı kullanıcıya güvenli bir kanaldan iletin.` };
}
