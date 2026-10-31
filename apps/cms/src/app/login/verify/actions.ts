"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { issueSession } from "@/lib/auth/issue";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/auth/login-limiter";
import { checkSecondFactor, clearMfaChallenge, pendingMfaUser } from "@/lib/auth/mfa";

export interface VerifyState {
  error?: string;
}

const safeNext = (raw: string) => (raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin");

export async function verifySecondFactorAction(_prev: VerifyState, form: FormData): Promise<VerifyState> {
  const input = String(form.get("code") ?? "").trim();
  const next = safeNext(String(form.get("next") ?? "/admin"));
  const h = await headers();
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const user = await pendingMfaUser(siteId);
  if (!user) redirect("/login");
  const limitKey = `mfa:${siteId}:${ip}:${user.id}`;
  if (isLoginBlocked(limitKey)) {
    await recordAudit({ id: user.id, email: user.email }, "auth.mfa_blocked", { siteId });
    return { error: "Çok fazla deneme. Biraz sonra tekrar deneyin." };
  }
  if (!input) return { error: "Kodu girin." };

  const kind = await checkSecondFactor(siteId, user, input);
  if (!kind) {
    recordLoginFailure(limitKey);
    await recordAudit({ id: user.id, email: user.email }, "auth.mfa_failed", { siteId });
    return { error: "Kod hatalı veya süresi dolmuş." };
  }
  clearLoginFailures(limitKey);
  await clearMfaChallenge();
  const repo = getUserRepository(siteId);
  await repo.touchLogin(user.id);
  await issueSession(user);
  await recordAudit({ id: user.id, email: user.email }, "auth.login", { siteId, detail: kind === "recovery" ? "2FA: kurtarma kodu" : "2FA" });
  redirect(next);
}

export async function cancelSecondFactorAction(): Promise<void> {
  await clearMfaChallenge();
  redirect("/login");
}
