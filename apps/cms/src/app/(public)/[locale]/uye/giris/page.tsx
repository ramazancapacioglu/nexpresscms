import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { safeMemberNext } from "@nexpress/core";
import { createTranslator } from "@nexpress/i18n";
import { getThemeManifest } from "@nexpress/themes";
import { MemberButton, MemberCard, MemberNotice, memberFieldClass } from "@/components/public/member-ui";
import { siteLocaleBase } from "@/lib/locale-url";
import { getMembership, getVisitorMember } from "@/lib/members";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTranslator(locale)("member.loginTitle"), robots: { index: false, follow: false } };
}

const ERRORS = { closed: "member.closedBody", email: "member.invalidEmail", consent: "member.needConsent", rate: "member.rateLimited", mail: "member.mailUnavailable" } as const;

/** Üye girişi / kayıt: e-posta → tek kullanımlık bağlantı. Düz HTML formu (JS yok); hesap varlığı sızmaz. */
export default async function MemberLoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ sent?: string; e?: string; next?: string; deleted?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = createTranslator(locale);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, membership, member, lb] = await Promise.all([getPublicSite(siteId), getMembership(siteId), getVisitorMember(), siteLocaleBase(siteId, locale)]);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const next = safeMemberNext(sp.next, "/");
  const errorKey = sp.e && sp.e in ERRORS ? ERRORS[sp.e as keyof typeof ERRORS] : null;

  if (member) {
    return (
      <MemberCard title={t("member.accountTitle")} tokens={tokens}>
        <p className="text-sm text-nx-soft">{t("member.signedInAs", { email: member.email })}</p>
        <a href={`${lb}/uye`} className="text-sm font-semibold underline">{t("member.accountTitle")}</a>
      </MemberCard>
    );
  }
  if (membership.mode === "closed") {
    return (
      <MemberCard title={t("member.closedTitle")} tokens={tokens}>
        <p className="text-sm text-nx-soft">{t("member.closedBody")}</p>
      </MemberCard>
    );
  }
  if (sp.sent === "1") {
    return (
      <MemberCard title={t("member.sentTitle")} tokens={tokens}>
        <MemberNotice kind="ok">{t("member.sentBody")}</MemberNotice>
      </MemberCard>
    );
  }
  const open = membership.mode === "open";
  return (
    <MemberCard title={t("member.loginTitle")} tokens={tokens}>
      <p className="text-sm leading-relaxed text-nx-soft">{open ? t("member.loginIntro") : t("member.inviteNote")}</p>
      {errorKey ? <MemberNotice kind="error">{t(errorKey)}</MemberNotice> : null}
      <form action="/api/members/request-link" method="post" className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <label htmlFor="nx-member-email" className="block text-xs font-semibold text-nx-fg">{t("member.emailLabel")}</label>
          <input id="nx-member-email" name="email" type="email" required autoComplete="email" maxLength={254} className={memberFieldClass} />
        </div>
        {open ? (
          <>
            <div className="space-y-1.5">
              <label htmlFor="nx-member-name" className="block text-xs font-semibold text-nx-fg">{t("member.nameLabel")}</label>
              <input id="nx-member-name" name="name" type="text" autoComplete="name" maxLength={80} className={memberFieldClass} />
            </div>
            <label className="flex items-start gap-2 text-xs text-nx-soft">
              <input type="checkbox" name="consent" value="1" required className="mt-0.5" />
              <span>
                {t("member.consent")}{" "}
                {membership.privacyUrl ? <a href={membership.privacyUrl} className="underline" rel="noopener">{t("member.privacyLink")}</a> : null}
              </span>
            </label>
            <p className="text-xs text-nx-soft">{t("member.signupHint")}</p>
          </>
        ) : null}
        <MemberButton tokens={tokens}>{t("member.send")}</MemberButton>
      </form>
    </MemberCard>
  );
}
