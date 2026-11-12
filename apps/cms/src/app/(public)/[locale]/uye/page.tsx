import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createTranslator } from "@nexpress/i18n";
import { getThemeManifest } from "@nexpress/themes";
import { MemberButton, MemberCard } from "@/components/public/member-ui";
import { siteLocaleBase } from "@/lib/locale-url";
import { getVisitorMember } from "@/lib/members";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTranslator(locale)("member.accountTitle"), robots: { index: false, follow: false } };
}

/** Üye hesabı: çıkış, veri indirme ve kalıcı silme (KVKK). JS'siz formlar. */
export default async function MemberAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, member, lb] = await Promise.all([getPublicSite(siteId), getVisitorMember(), siteLocaleBase(siteId, locale)]);
  if (!member) redirect(`${lb}/uye/giris`);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  const since = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(member.createdAt));
  return (
    <MemberCard title={t("member.accountTitle")} tokens={tokens}>
      <div className="space-y-1 text-sm text-nx-soft">
        <p>{t("member.signedInAs", { email: member.email })}</p>
        <p>{t("member.memberSince", { date: since })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <form action="/api/members/logout" method="post">
          <input type="hidden" name="locale" value={locale} />
          <MemberButton tokens={tokens} variant="plain">{t("member.logout")}</MemberButton>
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
