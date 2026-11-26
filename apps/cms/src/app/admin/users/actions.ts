"use server";

import { revalidatePath } from "@/lib/cache";
import { redirect } from "next/navigation";
import {
  authorProfileToRow,
  isUserRole,
  PASSWORD_PROBLEM_MESSAGES,
  sanitizeAuthorProfile,
  validatePassword,
  wouldRemoveLastAdmin,
  type AuthorProfile,
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

/** Yönetici herhangi bir kullanıcının yazar profilini (E-E-A-T / Person-Organization şeması, sosyal medya, biyografi, belgeler) günceller. */
export async function updateUserAuthorProfileAction(input: {
  id: string;
  name?: string;
  authorType?: "Person" | "Organization";
  jobTitle: string;
  bio: string;
  expertise: string;
  credentials?: string;
  sameAs: string;
  avatarUrl: string;
}): Promise<UserActionResult & { profile?: AuthorProfile }> {
  const admin = await requireAdmin("user.authorProfileUpdated");
  const { repo, target } = await load(admin.siteId, input.id);
  if (!target) return fail("Kullanıcı bulunamadı.");

  const nextName = typeof input.name === "string" ? input.name.trim() : "";
  if (nextName.length > 80) return fail("Ad en çok 80 karakter olabilir.");

  const dropped = String(input.sameAs ?? "").split(/\n/).map((line) => line.trim()).filter(Boolean);
  const profile = sanitizeAuthorProfile(input);
  if (dropped.length > profile.sameAs.length) {
    return fail("Sosyal medya ve profil bağlantıları https:// ile başlamalı ve geçerli bir adres olmalıdır (en çok 8).");
  }
  if (input.avatarUrl.trim() && !profile.avatarUrl) {
    return fail("Avatar, medya kitaplığından bir görsel (/media/…) ya da https adresi olmalıdır.");
  }

  if (nextName && nextName !== target.name) {
    await repo.setName(target.id, nextName);
  }
  const row = authorProfileToRow(profile);
  await repo.setAuthorProfile(target.id, row);
  await recordAudit({ id: admin.sub, email: admin.email }, "user.authorProfileUpdated", {
    target: target.email,
    detail: `tür: ${profile.authorType}, sameAs: ${profile.sameAs.length}`,
  });
  await revalidatePath("/");
  await revalidatePath("/admin/users");
  const updated = await repo.findById(target.id);
  return { ok: true, user: updated ? toSummary(updated) : undefined, profile };
}
