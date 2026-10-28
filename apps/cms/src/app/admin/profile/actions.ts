"use server";

import { redirect } from "next/navigation";
import { PASSWORD_PROBLEM_MESSAGES, validatePassword } from "@nexpress/core";
import { hashPassword, verifyPassword } from "@nexpress/core/password";
import { getUserRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { issueSession } from "@/lib/auth/issue";
import { requireUser } from "@/lib/auth/session";

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(input: { name: string }): Promise<ProfileResult> {
  const me = await requireUser({ audit: "profile.update" });
  const name = input.name.trim();
  if (name.length > 80) return { ok: false, error: "Ad en çok 80 karakter olabilir." };
  await getUserRepository(me.siteId).setName(me.sub, name);
  return { ok: true };
}

/**
 * Parola değişimi: mevcut parola doğrulanır, diğer tüm oturumlar kapanır, bu oturum yeni sürümle sürer.
 * Mevcut parola yanlışsa denetim günlüğüne `auth.passwordChangeFailed` yazılır.
 */
export async function changePasswordAction(input: { current: string; next: string }): Promise<ProfileResult> {
  const me = await requireUser();
  const repo = getUserRepository(me.siteId);
  const user = await repo.findById(me.sub);
  if (!user || !(await verifyPassword(input.current, user.passwordHash))) {
    await recordAudit({ id: me.sub, email: me.email }, "auth.passwordChangeFailed");
    return { ok: false, error: "Mevcut parola hatalı." };
  }
  const problems = validatePassword(input.next, { email: user.email, name: user.name });
  if (problems.length > 0) return { ok: false, error: PASSWORD_PROBLEM_MESSAGES[problems[0]!] };
  if (input.next === input.current) return { ok: false, error: "Yeni parola mevcut parolayla aynı olamaz." };

  const sessionVersion = await repo.setPassword(user.id, await hashPassword(input.next));
  await issueSession({ id: user.id, siteId: user.siteId, role: user.role, sessionVersion });
  await recordAudit({ id: me.sub, email: me.email }, "auth.passwordChanged");
  return { ok: true };
}

/** Bu cihaz dahil tüm oturumları kapatır. */
export async function signOutEverywhereAction(): Promise<void> {
  const me = await requireUser({ audit: "auth.signOutEverywhere" });
  await getUserRepository(me.siteId).revokeSessions(me.sub);
  redirect("/login");
}
