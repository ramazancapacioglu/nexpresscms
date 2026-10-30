"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PASSWORD_PROBLEM_MESSAGES, validatePassword } from "@nexpress/core";
import { hashPassword } from "@nexpress/core/password";
import { getUserRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { resolveAccountToken } from "@/lib/account-mail";
import { issueSession } from "@/lib/auth/issue";
import { takeResetSlot } from "@/lib/auth/reset-limiter";

export interface ResetState {
  error?: string;
}

const INVALID = "Bağlantı geçersiz, süresi dolmuş veya daha önce kullanılmış. Yeni bir bağlantı isteyin.";

export async function resetPasswordAction(_prev: ResetState, form: FormData): Promise<ResetState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const h = await headers();
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!takeResetSlot(`r:${siteId}:${ip}`)) return { error: "Çok fazla deneme. Bir süre sonra tekrar deneyin." };

  const found = await resolveAccountToken(siteId, token);
  if (!found) return { error: INVALID };
  if (password !== confirm) return { error: "Parolalar eşleşmiyor." };
  const problems = validatePassword(password, { email: found.user.email, name: found.user.name });
  if (problems.length > 0) return { error: PASSWORD_PROBLEM_MESSAGES[problems[0]!] };

  const repo = getUserRepository(siteId);
  await repo.setPassword(found.user.id, await hashPassword(password)); // parola zamanı değişir: bağlantı bayatlar, eski oturumlar kapanır
  const fresh = await repo.findById(found.user.id);
  await recordAudit({ id: found.user.id, email: found.user.email }, found.purpose === "invite" ? "user.invite_accepted" : "auth.password_reset_done", { siteId });
  if (fresh) {
    await repo.touchLogin(fresh.id);
    await issueSession(fresh);
  }
  redirect("/admin");
}
