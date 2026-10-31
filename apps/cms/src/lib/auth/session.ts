import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, type SessionPayload, type UserRole } from "@nexpress/core/session";
import { getUserRepository } from "@nexpress/database";
import { isUiLocale } from "@nexpress/i18n";
import { recordAudit } from "@/lib/audit";
import { SESSION_COOKIE, getAuthSecret } from "./config";

export interface SessionUser extends SessionPayload {
  email: string;
  name: string;
  /** Panel arayüz dili (boşsa tr) */
  uiLocale: string;
  /** İki adımlı doğrulama açık mı */
  twoFactor: boolean;
}

/**
 * Oturum, imzadan sonra veritabanıyla da doğrulanır: kullanıcı etkin mi, oturum sürümü eşleşiyor mu.
 * Rol de veritabanından okunur; rol değişikliği veya "tüm oturumları kapat" anında etkili olur.
 * İstek başına bir kez çalışır.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token, getAuthSecret());
  if (!payload) return null;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (payload.siteId !== siteId) return null;
  const user = await getUserRepository(siteId).findById(payload.sub);
  if (!user || user.status !== "active" || user.sessionVersion !== payload.sv) return null;
  return { ...payload, role: user.role, email: user.email, name: user.name, uiLocale: isUiLocale(user.uiLocale) ? user.uiLocale : "tr", twoFactor: user.totpEnabledAt !== null };
});

export interface GuardOptions {
  roles?: UserRole[];
  /** Denetim günlüğüne yazılacak eylem adı (örn. `cms.saveContent`) */
  audit?: string;
  /** Yalnızca profil/2FA kurulum eylemleri: zorunlu 2FA'sı olup kurmamış yönetici bunlara erişebilir */
  allowWithout2fa?: boolean;
}

/** `REQUIRE_ADMIN_2FA=1` iken iki adımlı doğrulaması olmayan yönetici yalnızca profil sayfasına ve kurulum eylemlerine erişir. */
export const mustSetUpTwoFactor = (session: Pick<SessionUser, "role" | "twoFactor">): boolean =>
  ["1", "true"].includes((process.env.REQUIRE_ADMIN_2FA ?? "").toLowerCase()) && session.role === "admin" && !session.twoFactor;

/**
 * Server action ve sayfalarda oturum şartı; yoksa girişe yönlendirir. Rol yetmezse hata fırlatır.
 * `audit` verilirse yetkilendirilen çağrı günlüğe yazılır (sonuçtan bağımsız, çağrı kaydıdır).
 */
export async function requireUser(options: GuardOptions | UserRole[] = {}): Promise<SessionUser> {
  const { roles = ["admin", "editor"], audit, allowWithout2fa = false } = Array.isArray(options) ? { roles: options } : options;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role)) throw new Error("Bu işlem için yetkiniz yok.");
  if (!allowWithout2fa && mustSetUpTwoFactor(session)) redirect("/admin/profile?2fa=required");
  if (audit) await recordAudit({ id: session.sub, email: session.email }, audit);
  return session;
}

export const requireAdmin = (audit?: string) => requireUser({ roles: ["admin"], audit });

/** Sayfa düzeyi koruma: yönetici değilse hata sayfası yerine panele döner. */
export async function requireAdminPage(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/admin");
  if (mustSetUpTwoFactor(session)) redirect("/admin/profile?2fa=required");
  return session;
}
