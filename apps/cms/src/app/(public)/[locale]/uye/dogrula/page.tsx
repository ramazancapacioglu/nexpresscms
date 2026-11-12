import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { safeMemberNext } from "@nexpress/core";
import { createTranslator } from "@nexpress/i18n";
import { getThemeManifest } from "@nexpress/themes";
import { MemberButton, MemberCard, MemberNotice } from "@/components/public/member-ui";
import { siteLocaleBase } from "@/lib/locale-url";
import { getPublicSite } from "@/lib/public-data";

export const dynamic = "force-dynamic";

// Bağlantı adresi bir belirteç taşır: Referer yalnızca kökeni içersin (yol/sorgu sızmaz). `no-referrer` KULLANILMAZ: tarayıcı
// formda `Origin: null` gönderir ve çapraz kaynak denetimi (`sameOriginPost`) meşru isteği de reddederdi.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTranslator(locale)("member.verifyTitle"), robots: { index: false, follow: false }, referrer: "origin" };
}

/**
 * Bağlantı onayı. GET hiçbir şeyi tüketmez (e-posta güvenlik tarayıcıları bağlantıyı önceden açabilir);
 * giriş yalnızca düğmeyle yapılan POST ile olur.
 */
export default async function MemberVerifyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string; next?: string; bad?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = createTranslator(locale);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, lb] = await Promise.all([getPublicSite(siteId), siteLocaleBase(siteId, locale)]);
  const tokens = site?.designTokens ?? getThemeManifest(site?.activeThemeId ?? "corporate-aurora").tokens;
  if (sp.bad === "1" || !sp.t) {
    return (
      <MemberCard title={t("member.verifyTitle")} tokens={tokens}>
        <MemberNotice kind="error">{t("member.verifyInvalid")}</MemberNotice>
        <a href={`${lb}/uye/giris`} className="text-sm font-semibold underline">{t("member.loginTitle")}</a>
      </MemberCard>
    );
  }
  return (
    <MemberCard title={t("member.verifyTitle")} tokens={tokens}>
      <p className="text-sm text-nx-soft">{t("member.verifyBody")}</p>
      <form action="/api/members/verify" method="post">
        <input type="hidden" name="t" value={sp.t.slice(0, 200)} />
        <input type="hidden" name="next" value={safeMemberNext(sp.next, `${lb}/uye`)} />
        <input type="hidden" name="locale" value={locale} />
        <MemberButton tokens={tokens}>{t("member.verifyButton")}</MemberButton>
      </form>
    </MemberCard>
  );
}
