"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isUserRole,
  PASSWORD_PROBLEM_MESSAGES,
  validatePassword,
  wouldRemoveLastAdmin,
  type UserRole,
} from "@nexpress/core";
import { hashPassword } from "@nexpress/core/password";
import { getUserRepository, toSummary, type UserStatus, type UserSummaryDto } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";

export type UserActionResult = { ok: true; user?: UserSummaryDto } | { ok: false; error: string };

const fail = (error: string): UserActionResult => ({ ok: false, error });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const passwordError = (password: string, email: string, name?: string) => {
  const problems = validatePassword(password, { email, name });
  return problems.length > 0 ? PASSWORD_PROBLEM_MESSAGES[problems[0]!] : null;
};

/** Yönetici yeni hesap açar. İlk parolayı belirler; kullanıcı profilinden değiştirebilir. */
export async function createUserAction(input: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}): Promise<UserActionResult> {
  const admin = await requireAdmin();
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("Geçerli bir e-posta girin.");
  if (!isUserRole(input.role)) return fail("Geçersiz rol.");
  const pw = passwordError(input.password, email, input.name);
  if (pw) return fail(pw);

  const repo = getUserRepository(admin.siteId);
  if (await repo.findByEmail(email)) return fail("Bu e-posta ile zaten bir hesap var.");
  const user = await repo.create({ email, name: input.name, role: input.role, passwordHash: await hashPassword(input.password) });
  await recordAudit({ id: admin.sub, email: admin.email }, "user.created", { target: email, detail: `rol: ${input.role}` });
  revalidatePath("/admin/users");
  return { ok: true, user: toSummary(user) };
}

async function load(adminSiteId: string, id: string) {
  const repo = getUserRepository(adminSiteId);
  const all = await repo.list();
  return { repo, all, target: all.find((u) => u.id === id) ?? null };
}

export async function setUserRoleAction(input: { id: string; role: UserRole }): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (!isUserRole(input.role)) return fail("Geçersiz rol.");
  if (input.id === admin.sub) return fail("Kendi rolünüzü değiştiremezsiniz.");
  const { repo, all, target } = await load(admin.siteId, input.id);
  if (!target) return fail("Kullanıcı bulunamadı.");
  if (wouldRemoveLastAdmin(all, target.id, { role: input.role })) return fail("Son etkin yönetici düşürülemez.");
  await repo.setRole(target.id, input.role);
  // Oturum belirtecindeki rol eskir: açık oturumlar kapanır, kişi yeni yetkiyle girer
  await repo.revokeSessions(target.id);
  await recordAudit({ id: admin.sub, email: admin.email }, "user.roleChanged", { target: target.email, detail: `${target.role} → ${input.role}` });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserStatusAction(input: { id: string; status: UserStatus }): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (input.status !== "active" && input.status !== "disabled") return fail("Geçersiz durum.");
  if (input.id === admin.sub) return fail("Kendi hesabınızı devre dışı bırakamazsınız.");
  const { repo, all, target } = await load(admin.siteId, input.id);
  if (!target) return fail("Kullanıcı bulunamadı.");
  if (wouldRemoveLastAdmin(all, target.id, { status: input.status })) return fail("Son etkin yönetici devre dışı bırakılamaz.");
  await repo.setStatus(target.id, input.status);
  await recordAudit({ id: admin.sub, email: admin.email }, input.status === "disabled" ? "user.disabled" : "user.enabled", { target: target.email });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Yönetici başka bir kullanıcının parolasını sıfırlar; o kullanıcının tüm oturumları kapanır. */
export async function resetUserPasswordAction(input: { id: string; password: string }): Promise<UserActionResult> {
  const admin = await requireAdmin();
  const { repo, target } = await load(admin.siteId, input.id);
  if (!target) return fail("Kullanıcı bulunamadı.");
  if (target.id === admin.sub) return fail("Kendi parolanızı Profil sayfasından değiştirin.");
  const pw = passwordError(input.password, target.email, target.name);
  if (pw) return fail(pw);
  await repo.setPassword(target.id, await hashPassword(input.password));
  await recordAudit({ id: admin.sub, email: admin.email }, "user.passwordReset", { target: target.email });
  return { ok: true };
}

export async function revokeUserSessionsAction(input: { id: string }): Promise<UserActionResult> {
  const admin = await requireAdmin();
  const { repo, target } = await load(admin.siteId, input.id);
  if (!target) return fail("Kullanıcı bulunamadı.");
  await repo.revokeSessions(target.id);
  await recordAudit({ id: admin.sub, email: admin.email }, "user.sessionsRevoked", { target: target.email });
  if (target.id === admin.sub) redirect("/login");
  return { ok: true };
}
