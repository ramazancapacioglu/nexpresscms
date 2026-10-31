import "server-only";
import { cookies } from "next/headers";
import { createAccountToken, isTokenCurrent, verifyAccountToken } from "@nexpress/core/account-token";
import { decryptSecret } from "@nexpress/core/secret-box";
import { consumeRecoveryCode, verifyTotp } from "@nexpress/core/totp";
import { getUserRepository, type UserDto } from "@nexpress/database";
import { getAuthSecret } from "./config";

export const MFA_COOKIE = "nx_mfa";
const MFA_TTL_SECONDS = 5 * 60;

/** Parola doğrulandı, ikinci adım bekleniyor: 5 dakikalık, yalnızca bu çereze bağlı geçici belirteç. */
export async function startMfaChallenge(siteId: string, user: Pick<UserDto, "id" | "passwordChangedAt">): Promise<void> {
  const jar = await cookies();
  jar.set(MFA_COOKIE, createAccountToken(getAuthSecret(), siteId, "mfa", user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/login",
    maxAge: MFA_TTL_SECONDS,
  });
}

export async function clearMfaChallenge(): Promise<void> {
  (await cookies()).delete({ name: MFA_COOKIE, path: "/login" });
}

/** Çerezdeki belirteçten bekleyen kullanıcıyı çözer; süresi dolmuş, bayat veya devre dışıysa null. */
export async function pendingMfaUser(siteId: string): Promise<UserDto | null> {
  const token = (await cookies()).get(MFA_COOKIE)?.value;
  if (!token) return null;
  const parsed = verifyAccountToken(getAuthSecret(), siteId, token);
  if (!parsed || parsed.purpose !== "mfa") return null;
  const user = await getUserRepository(siteId).findById(parsed.userId);
  if (!user || user.status !== "active" || !user.totpEnabledAt || !isTokenCurrent(parsed, user)) return null;
  return user;
}

/** 6 haneli TOTP veya kurtarma kodu. Başarıda kullanılan adım/kod atomik tüketilir. `kind` denetim kaydı içindir. */
export async function checkSecondFactor(siteId: string, user: UserDto, input: string): Promise<"totp" | "recovery" | null> {
  const repo = getUserRepository(siteId);
  if (user.totpSecret) {
    let secret = "";
    try {
      secret = decryptSecret(user.totpSecret);
    } catch {
      return null; // anahtar değişmiş: yönetici başka bir yönetici tarafından kapatmalı
    }
    const step = verifyTotp(secret, input, Date.now(), user.totpLastStep);
    if (step !== null && (await repo.advanceTotpStep(user.id, step))) return "totp";
  }
  if (user.recoveryCodes) {
    let hashes: string[] = [];
    try {
      hashes = JSON.parse(user.recoveryCodes) as string[];
    } catch {
      return null;
    }
    const left = consumeRecoveryCode(hashes, input);
    if (left && (await repo.replaceRecoveryCodes(user.id, user.recoveryCodes, left))) return "recovery";
  }
  return null;
}
