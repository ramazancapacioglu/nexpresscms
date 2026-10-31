"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { validatePassword } from "@nexpress/core";
import { hashPassword, verifyPassword } from "@nexpress/core/password";
import { getUserRepository } from "@nexpress/database";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { issueSession } from "@/lib/auth/issue";
import { getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { startMfaChallenge } from "@/lib/auth/mfa";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/auth/login-limiter";

export interface LoginState {
  error?: string;
}

/** Kullanıcı yoksa `.env` yönetici bilgileriyle ilk yöneticiyi oluşturur (yalnızca geliştirmede). */
async function ensureFirstAdmin(siteId: string, email: string, password: string): Promise<void> {
  const repo = getUserRepository(siteId);
  if ((await repo.count()) > 0) return;
  const seedEmail = process.env.ADMIN_DEFAULT_EMAIL?.trim().toLowerCase();
  const seedPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!seedEmail || !seedPassword || email !== seedEmail || password !== seedPassword) return;
  if (process.env.NODE_ENV === "production" && (seedPassword === "Admin123!" || validatePassword(seedPassword, { email: seedEmail }).length > 0)) return;
  await repo.create({ email, name: "Yönetici", passwordHash: await hashPassword(password), role: "admin" });
}

function safeNext(raw: string): string {
  return raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin";
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/admin"));
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limitKey = `${siteId}:${ip}:${email}`;

  if (!email || !password) return { error: "E-posta ve parola gerekli." };
  if (isLoginBlocked(limitKey)) {
    await recordAudit(null, "auth.login_blocked", { siteId, detail: `${email} — çok fazla deneme` });
    return { error: "Çok fazla deneme. Biraz sonra tekrar deneyin." };
  }

  await ensureFirstAdmin(siteId, email, password);
  const repo = getUserRepository(siteId);
  const user = await repo.findByEmail(email);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  // Devre dışı hesap, doğru parolayla bile aynı genel hatayı alır (hesap varlığı sızmaz)
  if (!user || !ok || user.status !== "active") {
    recordLoginFailure(limitKey);
    await recordAudit(null, "auth.login_failed", { siteId, detail: email });
    return { error: "E-posta veya parola hatalı." };
  }

  // İkinci adım açıksa oturum burada AÇILMAZ: parola doğru olsa da kod doğrulanana kadar giriş yoktur
  if (user.totpEnabledAt) {
    await startMfaChallenge(siteId, user);
    redirect(`/login/verify?next=${encodeURIComponent(next)}`);
  }
  clearLoginFailures(limitKey);
  await repo.touchLogin(user.id);
  await issueSession(user);
  await recordAudit({ id: user.id, email: user.email }, "auth.login", { siteId });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) await recordAudit({ id: session.sub, email: session.email }, "auth.logout");
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
