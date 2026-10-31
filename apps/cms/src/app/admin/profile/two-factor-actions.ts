"use server";

import { revalidatePath } from "next/cache";
import { verifyPassword } from "@nexpress/core/password";
import { decryptSecret, encryptSecret } from "@nexpress/core/secret-box";
import { generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUri, verifyTotp } from "@nexpress/core/totp";
import qrcode from "qrcode-generator";
import { getScopedRepository, getUserRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { issueSession } from "@/lib/auth/issue";
import { checkSecondFactor } from "@/lib/auth/mfa";
import { requireUser } from "@/lib/auth/session";

export type TwoFactorResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

const BAD_PASSWORD = "Mevcut parola hatalı.";

async function loadMe(audit: string) {
  const me = await requireUser({ audit, allowWithout2fa: true });
  const user = await getUserRepository(me.siteId).findById(me.sub);
  return { me, user };
}

/** Kurulumu başlatır (mevcut parola şart): yeni anahtar üretilir, kod doğrulanana kadar 2FA AÇILMAZ. */
export async function beginTwoFactorSetupAction(input: { password: string }): Promise<TwoFactorResult<{ secret: string; uri: string; qrSvg: string }>> {
  const { me, user } = await loadMe("profile.2fa-begin");
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return { ok: false, error: BAD_PASSWORD };
  if (user.totpEnabledAt) return { ok: false, error: "İki adımlı doğrulama zaten açık." };
  const secret = generateTotpSecret();
  await getUserRepository(me.siteId).setTotpPending(user.id, encryptSecret(secret));
  const site = await getScopedRepository(me.siteId).getSite();
  const uri = otpauthUri(secret, user.email, site?.name || "NexPress");
  const qr = qrcode(0, "M");
  qr.addData(uri);
  qr.make();
  return { ok: true, secret, uri, qrSvg: qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) };
}

/** Uygulamadaki ilk kodu doğrular, 2FA'yı açar ve kurtarma kodlarını BİR KEZ gösterilmek üzere döner. */
export async function confirmTwoFactorSetupAction(input: { code: string }): Promise<TwoFactorResult<{ recoveryCodes: string[] }>> {
  const { me, user } = await loadMe("profile.2fa-confirm");
  if (!user?.totpSecret || user.totpEnabledAt) return { ok: false, error: "Önce kurulumu başlatın." };
  let secret = "";
  try {
    secret = decryptSecret(user.totpSecret);
  } catch {
    return { ok: false, error: "Anahtar okunamadı; kurulumu yeniden başlatın." };
  }
  const step = verifyTotp(secret, input.code);
  if (step === null) return { ok: false, error: "Kod hatalı. Uygulamadaki güncel kodu girin." };
  const codes = generateRecoveryCodes();
  await getUserRepository(me.siteId).enableTotp(user.id, step, codes.map(hashRecoveryCode));
  await recordAudit({ id: me.sub, email: me.email }, "auth.2fa_enabled");
  revalidatePath("/admin/profile");
  return { ok: true, recoveryCodes: codes };
}

/** Kapatma: parola + güncel kod (veya kurtarma kodu). Oturumlar kapanır, bu oturum yeni sürümle sürer. */
export async function disableTwoFactorAction(input: { password: string; code: string }): Promise<TwoFactorResult> {
  const { me, user } = await loadMe("profile.2fa-disable");
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return { ok: false, error: BAD_PASSWORD };
  if (!user.totpEnabledAt) return { ok: false, error: "İki adımlı doğrulama açık değil." };
  if (!(await checkSecondFactor(me.siteId, user, input.code))) return { ok: false, error: "Kod hatalı veya süresi dolmuş." };
  const repo = getUserRepository(me.siteId);
  await repo.disableTotp(user.id);
  const fresh = await repo.findById(user.id);
  if (fresh) await issueSession(fresh);
  await recordAudit({ id: me.sub, email: me.email }, "auth.2fa_disabled");
  revalidatePath("/admin/profile");
  return { ok: true };
}

/** Kurtarma kodlarını yeniler (eskiler geçersiz): parola + güncel kod gerekir. */
export async function regenerateRecoveryCodesAction(input: { password: string; code: string }): Promise<TwoFactorResult<{ recoveryCodes: string[] }>> {
  const { me, user } = await loadMe("profile.2fa-codes");
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return { ok: false, error: BAD_PASSWORD };
  if (!user.totpEnabledAt) return { ok: false, error: "İki adımlı doğrulama açık değil." };
  if (!(await checkSecondFactor(me.siteId, user, input.code))) return { ok: false, error: "Kod hatalı veya süresi dolmuş." };
  const codes = generateRecoveryCodes();
  const fresh = (await getUserRepository(me.siteId).findById(user.id))!;
  if (!(await getUserRepository(me.siteId).replaceRecoveryCodes(user.id, fresh.recoveryCodes, codes.map(hashRecoveryCode)))) {
    return { ok: false, error: "Kodlar az önce değişti; yeniden deneyin." };
  }
  await recordAudit({ id: me.sub, email: me.email }, "auth.2fa_codes_regenerated");
  return { ok: true, recoveryCodes: codes };
}
