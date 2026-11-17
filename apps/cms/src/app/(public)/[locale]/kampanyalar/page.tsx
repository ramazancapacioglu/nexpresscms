import React from "react";
import { siteLocaleBase } from "@/lib/locale-url";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Link } from "@/components/public/link";
import { getPublicSite } from "@/lib/public-data";
import { getScopedRepository } from "@nexpress/database";
import {
  resolveCampaignData,
  buildCampaignsItemListJsonLd,
  type ResolvedCampaign,
} from "@nexpress/core";
import { jsonLdString } from "@nexpress/seo-core";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getPublicSite(siteId);
  const siteName = site?.name ?? "NexPress CMS";

  const title = `Kampanyalar & Özel Fırsatlar | ${siteName}`;
  const description = `${siteName} güncel yazılım, e-ticaret ve lisans kampanyaları, indirimler ve hediye avantajları.`;

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lb = await siteLocaleBase(siteId, locale);
  const url = `${origin}${lb}/kampanyalar`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [`${origin}/og?title=${encodeURIComponent("Kampanyalar")}&site=${encodeURIComponent(siteName)}`],
    },
  };
}

export default async function PublicCampaignsArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const lb = await siteLocaleBase(siteId, locale);
  const site = await getPublicSite(siteId);
  const repo = getScopedRepository(siteId);

  const allContents = await repo.listContents({ locale });
  const campaignContents = allContents.filter(
    (c) =>
      c.status === "published" &&
      (c.type === "campaign" ||
        Boolean(
          c.schemaAttributes?.camp_discount ||
          c.schemaAttributes?.camp_name ||
          (c.schemaAttributes?.campaign as Record<string, unknown> | undefined)?.discount
        ))
  );

  const campaigns: ResolvedCampaign[] = campaignContents.map((c) =>
    resolveCampaignData(c)
  );

  const activeCampaigns = campaigns.filter((c) => !c.isExpired);
  const expiredCampaigns = campaigns.filter((c) => c.isExpired);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const archiveUrl = `${baseUrl}${lb}/kampanyalar`;

  const itemListJsonLd = buildCampaignsItemListJsonLd(activeCampaigns, {
    localeBase: lb,
    archiveUrl,
    siteUrl: baseUrl,
    name: `${site?.name ?? "NexPress"} Güncel Kampanyalar`,
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Schema.org ItemList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd) }}
      />

      {/* Hero Header */}
      <header className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-nx-subtle text-[var(--nx-primary,#0c644e)] dark:bg-nx-subtle border border-nx-line dark:border-nx-line">
          Özel Fırsatlar & İndirimler
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Güncel Kampanyalar
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          İşletmenizi büyütecek lisans avantajları, özel paket indirimleri ve hediye modül fırsatları.
        </p>
      </header>

      {/* Aktif Kampanyalar Grid */}
      {activeCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">Şu anda yayında olan bir kampanya bulunmuyor.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Yeni fırsatlardan haberdar olmak için bizi takip edin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCampaigns.map((camp) => (
            <article
              key={camp.contentId}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Afiş Görseli */}
              <Link
                href={`${lb}/kampanya/${camp.slug}`}
                className="relative block aspect-[16/9] w-full bg-nx-subtle overflow-hidden"
              >
                {camp.featuredImageUrl ? (
                  <img
                    src={camp.featuredImageUrl}
                    alt={camp.featuredImageAlt || camp.title}
                    className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full bg-nx-subtle flex items-center justify-center text-[var(--nx-primary,#0c644e)]">
                    <span className="text-3xl font-bold opacity-30">%</span>
                  </div>
                )}

                {/* Rozetler */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                  {camp.badge ? (
                    <span className="rounded-full bg-[var(--nx-primary,#0c644e)] backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 shadow-sm">
                      {camp.badge}
                    </span>
                  ) : (
                    <span />
                  )}

                  {camp.discount && (
                    <span className="rounded-md bg-[var(--nx-primary,#0c644e)] text-white text-xs font-extrabold px-2 py-1 shadow-sm">
                      {camp.discount}
                    </span>
                  )}
                </div>
              </Link>

              {/* İçerik */}
              <div className="flex flex-col flex-1 p-5 space-y-3">
                {camp.productName && (
                  <p className="text-xs font-semibold text-[var(--nx-primary,#0c644e)] uppercase tracking-wide">
                    {camp.productName}
                  </p>
                )}

                <h2 className="text-lg font-bold text-card-foreground group-hover:text-[var(--nx-primary,#0c644e)] transition-colors line-clamp-2">
                  <Link href={`${lb}/kampanya/${camp.slug}`}>
                    {camp.title}
                  </Link>
                </h2>

                {camp.tldr && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {camp.tldr}
                  </p>
                )}

                {camp.gift && (
                  <div className="rounded-lg bg-nx-subtle border border-nx-line p-2.5 text-xs text-nx-fg font-medium flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <span className="line-clamp-1">{camp.gift}</span>
                  </div>
                )}

                <div className="pt-3 mt-auto border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {camp.daysRemaining !== null ? (
                      <span className="text-nx-fg font-semibold">
                        ⏳ Son {camp.daysRemaining} gün
                      </span>
                    ) : (
                      <span>{camp.formattedValidity}</span>
                    )}
                  </span>

                  <Link
                    href={`${lb}/kampanya/${camp.slug}`}
                    className="font-bold text-[var(--nx-primary,#0c644e)] hover:underline flex items-center gap-1"
                  >
                    <span>İncele</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Süresi Dolan Kampanyalar Arşivi (Varsa) */}
      {expiredCampaigns.length > 0 && (
        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-6 text-muted-foreground">
            Sona Eren Kampanyalar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-75">
            {expiredCampaigns.map((camp) => (
              <div
                key={camp.contentId}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-nx-subtle text-nx-fg dark:bg-nx-subtle">
                    Süresi Doldu
                  </span>
                  {camp.discount && (
                    <span className="text-xs font-bold text-muted-foreground">{camp.discount}</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                  <Link href={`${lb}/kampanya/${camp.slug}`} className="hover:underline">
                    {camp.title}
                  </Link>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {camp.formattedValidity}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

