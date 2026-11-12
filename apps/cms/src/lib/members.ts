import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { resolveSiteSettings, type MembershipSettings } from "@nexpress/core";
import { MEMBER_SESSION_COOKIE, MEMBER_SESSION_TTL_SECONDS, createMemberLinkToken, createMemberSessionToken, verifyMemberSessionToken } from "@nexpress/core/member-token";
import { getMemberRepository, getScopedRepository, type MemberDto } from "@nexpress/database";
import { createTranslator } from "@nexpress/i18n";
import { getAuthSecret } from "@/lib/auth/config";
import { siteLocaleBase } from "@/lib/locale-url";
import { resolveMailer, sendMail, type MailResult } from "@/lib/mailer";

export { MEMBER_SESSION_COOKIE };

export const memberCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MEMBER_SESSION_TTL_SECONDS,
});

export async function getMembership(siteId: string): Promise<MembershipSettings> {
  const site = await getScopedRepository(siteId).getSite();
  return resolveSiteSettings(site?.settings).general.membership ?? { mode: "closed", tiers: [], privacyUrl: "" };
}

/** Çerezdeki belirteci doğrular ve veritabanıyla eşler: üye etkin ve oturum sürümü aynı olmalı. */
export async function resolveMemberCookie(siteId: string, value: string | undefined): Promise<MemberDto | null> {
  if (!value) return null;
  const parsed = verifyMemberSessionToken(getAuthSecret(), siteId, value);
  if (!parsed) return null;
  const member = await getMemberRepository(siteId).findById(parsed.memberId);
  return member && member.status === "active" && member.sessionVersion === parsed.sessionVersion ? member : null;
}

/** Ziyaretçi sayfaları için: istek başına bir kez, çerezden geçerli üye (yoksa null). */
export const getVisitorMember = cache(async (): Promise<MemberDto | null> => {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  return resolveMemberCookie(siteId, (await cookies()).get(MEMBER_SESSION_COOKIE)?.value);
});

export const newSessionToken = (siteId: string, member: Pick<MemberDto, "id" | "sessionVersion">): string => createMemberSessionToken(getAuthSecret(), siteId, member);

/** Yeni bağlantı sırası açar (eski bağlantılar düşer) ve e-postayla gönderir. SMTP yoksa `{ ok:false }`. */
export async function sendMemberLink(input: { siteId: string; member: MemberDto; locale: string; next: string }): Promise<MailResult> {
  const { siteId, member, locale, next } = input;
  const seq = await getMemberRepository(siteId).beginLink(member.id);
  const token = createMemberLinkToken(getAuthSecret(), siteId, { id: member.id, linkSeq: seq });
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const lb = await siteLocaleBase(siteId, locale);
  const link = `${base}${lb}/uye/dogrula?t=${encodeURIComponent(token)}${next && next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`;
  const site = await getScopedRepository(siteId).getSite();
  const t = createTranslator(locale);
  const siteName = site?.name || "NexPress";
  return sendMail(siteId, {
    to: [member.email],
    subject: t("member.mailSubject", { site: siteName }),
    text: t("member.mailBody", { site: siteName, link }),
  });
}

export const mailerReady = async (siteId: string): Promise<boolean> => (await resolveMailer(siteId)) !== null;

/** Çapraz kaynak POST'larını reddeder (çerezli form gönderimi için CSRF savunması). */
export function sameOriginPost(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  // `Origin: null` (korumalı bağlam) ve bozuk değer reddedilir; patlamaz
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
