import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createTranslator } from "@nexpress/i18n";
import { getThemeManifest } from "@nexpress/themes";
import { MemberButton, MemberCard, MemberNotice, memberFieldClass } from "@/components/public/member-ui";
import { siteLocaleBase } from "@/lib/locale-url";
import { getMembership, getVisitorMember } from "@/lib/members";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTranslator(locale)("member.accountTitle"), robots: { index: false, follow: false } };
}

/** Üye hesabı: çıkış, veri indirme ve kalıcı silme (KVKK). JS'siz formlar. */
export default async function MemberAccountPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { locale } = await params;
  const saved = (await searchParams).saved === "1";
  const t = createTranslator(locale);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, member, lb, membership] = await Promise.all([getPublicSite(siteId), getVisitorMember(), siteLocaleBase(siteId, locale), getMembership(siteId)]);
  if (!member) redirect(`${lb}/uye/giris`);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const since = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(member.createdAt));
  return (
    <MemberCard title={t("member.accountTitle")} tokens={tokens}>
      <div className="space-y-1 text-sm text-nx-soft">
        <p>{t("member.signedInAs", { email: member.email })}</p>
        <p>{t("member.memberSince", { date: since })}</p>
        {member.tier && membership.tiers.some((x) => x.id === member.tier) ? <p>{t("member.tierLabel", { tier: membership.tiers.find((x) => x.id === member.tier)!.label })}</p> : null}
      </div>
      {saved ? <MemberNotice kind="ok">{t("member.nameSaved")}</MemberNotice> : null}
      <form action="/api/members/profile" method="post" className="space-y-2 border-t border-nx-line pt-5">
        <h2 className="text-sm font-bold text-nx-fg">{t("member.profileTitle")}</h2>
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="nx-member-profile-name" className="block text-xs font-semibold text-nx-fg">{t("member.nameLabel")}</label>
        <input id="nx-member-profile-name" name="name" type="text" defaultValue={member.name} maxLength={80} autoComplete="name" className={memberFieldClass} />
        <MemberButton tokens={tokens} variant="plain">{t("member.nameSave")}</MemberButton>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <form action="/api/members/logout" method="post">
          <input type="hidden" name="locale" value={locale} />
          <MemberButton tokens={tokens} variant="plain">{t("member.logout")}</MemberButton>
        </form>
        <form action="/api/members/logout-all" method="post">
          <input type="hidden" name="locale" value={locale} />
          <MemberButton tokens={tokens} variant="plain">{t("member.logoutAll")}</MemberButton>
        </form>
        <a href="/api/members/export" className="text-sm font-semibold underline">{t("member.exportData")}</a>
      </div>
      <form action="/api/members/delete" method="post" className="space-y-3 border-t border-nx-line pt-5">
        <h2 className="text-sm font-bold text-nx-fg">{t("member.deleteTitle")}</h2>
        <p className="text-xs text-nx-soft">{t("member.deleteBody")}</p>
        <input type="hidden" name="locale" value={locale} />
        <label className="flex items-start gap-2 text-xs text-nx-soft"><input type="checkbox" name="confirm" value="1" required className="mt-0.5" /> <span>{t("member.deleteConfirm")}</span></label>
        <MemberButton tokens={tokens} variant="danger">{t("member.deleteButton")}</MemberButton>
      </form>
    </MemberCard>
  );
}
