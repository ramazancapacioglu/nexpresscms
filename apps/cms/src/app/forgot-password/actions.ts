"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { sendAccountMail } from "@/lib/account-mail";
import { recordAudit } from "@/lib/audit";
import { takeResetSlot } from "@/lib/auth/reset-limiter";
import { getUserRepository } from "@nexpress/database";

export interface ForgotState {
  done?: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Hesap varlığı sızmasın diye yanıt her zaman aynıdır; e-posta yanıttan sonra gönderilir (zamanlama farkı yok). */
export async function requestResetAction(_prev: ForgotState, form: FormData): Promise<ForgotState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Geçerli bir e-posta girin." };
  const h = await headers();
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!takeResetSlot(`e:${siteId}:${email}`) || !takeResetSlot(`i:${siteId}:${ip}`)) {
    return { error: "Çok fazla istek. Bir süre sonra tekrar deneyin." };
  }
  after(async () => {
    try {
      const user = await getUserRepository(siteId).findByEmail(email);
      if (!user || user.status !== "active") return;
      const res = await sendAccountMail(siteId, user.id, "reset");
      await recordAudit(null, "auth.reset_requested", { siteId, target: email, detail: res.ok ? "e-posta gönderildi" : "e-posta gönderilemedi" });
    } catch (error) {
      console.warn("[reset] istek işlenemedi:", error instanceof Error ? error.message : error);
    }
  });
  return { done: true };
}
