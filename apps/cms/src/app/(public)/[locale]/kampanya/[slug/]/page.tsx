import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Link } from "@/components/public/link";
import { getPublicSite, resolvePublicContent } from "@/lib/public-data";
import { getScopedRepository } from "@nexpress/database";
import {
  resolveCampaignData,
  buildCampaignOfferJsonLd,
  type ResolvedCampaign,
} from "@nexpress/core";
import { jsonLdString } from "@nexpress/seo-core";
import { getThemeManifest, RscBlockRenderer } from "@nexpress/themes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    resolvePublicContent(siteId, slug, locale),
  ]);

  if (!resolved || !resolved.content) {
    return { title: "Kampanya Bulunamadı | NexPress CMS" };
  }

  const camp = resolveCampaignData(resolved.content);
  const siteName = site?.name ?? "NexPress CMS";
  const title = `${camp.title} | ${siteName}`;
  const description = camp.tldr || `${camp.title} fırsat detayları, indirim oranları ve başvuru şartları.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: camp.featuredImageUrl ? [camp.featuredImageUrl] : undefined,
    },
  };
}

export default async function PublicCampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    resolvePublicContent(siteId, slug, locale),
  ]);

  if (!resolved || !resolved.content) {
    notFound();
  }

  const content = resolved.content;
  const camp = resolveCampaignData(content);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}/${locale}/kampanya/${camp.slug}`;
  const siteName = site?.name ?? "NexPress CMS";
  const activeTheme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
  const themeTokens = site?.designTokens ?? activeTheme.tokens;

  // Google Schema.org Offer JSON-LD
  const offerJsonLd = buildCampaignOfferJsonLd(camp, {
    siteUrl: baseUrl,
    pageUrl,
    siteName,
  });

  // Diğer Aktif Kampanyalar
  const allContents = await repo.listContents({ locale });
  const otherCampaigns = allContents
    .filter(
      (c) =>
        c.contentId !== content.contentId &&
        c.status === "published" &&
        (c.type === "campaign" ||
          Boolean(
            c.schemaAttributes?.camp_discount ||
            c.schemaAttributes?.camp_name ||
            (c.schemaAttributes?.campaign as Record<string, unknown> | undefined)?.discount
          ))
    )
    .slice(0, 3)
    .map((c) => resolveCampaignData(c));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Schema.org Offer JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(offerJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">Ana Sayfa</Link>
        <span>/</span>
        <Link href={`/${locale}/kampanyalar`} className="hover:text-foreground">Kampanyalar</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{camp.title}</span>
      </nav>

      {/* 2 Kolonlu Yerleşim */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sol 2 Kolon: Ana Kampanya İçeriği */}
        <div className="lg:col-span-2 space-y-8">
          {/* Afiş Görseli */}
          {camp.featuredImageUrl && (
            <div className="rounded-2xl overflow-hidden border border-border shadow-xs bg-muted">
              <img
                src={camp.featuredImageUrl}
                alt={camp.featuredImageAlt || camp.title}
                className="w-full h-auto max-h-[460px] object-cover"
              />
            </div>
          )}

          {/* Başlık & Rozetler */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {camp.badge && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs px-3 py-1">
                  ✨ {camp.badge}
                </span>
              )}
              {camp.discount && (
                <span className="rounded-md bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1">
                  {camp.discount}
                </span>
              )}
              {camp.isExpired && (
                <span className="rounded-md bg-rose-600 text-white font-bold text-xs px-2.5 py-1">
                  Kampanya Sona Erdi
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {camp.title}
            </h1>

            {camp.tldr && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {camp.tldr}
              </p>
            )}
          </div>

          {/* Hediye Avantaj Kutusu (Varsa) */}
          {camp.gift && (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30 p-5 flex items-start gap-3.5">
              <div className="text-2xl">🎁</div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Kampanya Kapsamındaki Özel Hediye
                </h2>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  {camp.gift}
                </p>
              </div>
            </div>
          )}

          {/* Kampanya Bilgi & Detay Tablosu (ACO / WordPress Uyumlu Tablo) */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-muted/60 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-sm text-foreground">
                Kampanya Bilgileri & Avantaj Özeti
              </h2>
              {camp.isExpired ? (
                <span className="rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-0.5 text-xs font-bold">
                  Süre Aşımı
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                  Güncel & Aktif
                </span>
              )}
            </div>

            <table className="w-full text-left text-xs sm:text-sm">
              <tbody className="divide-y divide-border">
                {camp.discount && (
                  <tr>
                    <td className="px-5 py-3 w-1/3 bg-muted/20 font-semibold text-muted-foreground">
                      İndirim Avantajı
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {camp.discount}
                    </td>
                  </tr>
                )}
                {camp.gift && (
                  <tr>
                    <td className="px-5 py-3 bg-muted/20 font-semibold text-muted-foreground">
                      Hediye / Bonus
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      {camp.gift}
                    </td>
                  </tr>
                )}
                {camp.productName && (
                  <tr>
                    <td className="px-5 py-3 bg-muted/20 font-semibold text-muted-foreground">
                      Hedef Ürün / Yazılım
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {camp.productUrl ? (
                        <Link href={camp.productUrl} className="text-blue-600 hover:underline">
                          {camp.productName} →
                        </Link>
                      ) : (
                        camp.productName
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="px-5 py-3 bg-muted/20 font-semibold text-muted-foreground">
                    Geçerlilik Tarihleri
                  </td>
                  <td className="px-5 py-3 text-foreground">
                    {camp.formattedValidity}
                    {camp.daysRemaining !== null && !camp.isExpired && (
                      <span className="ml-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                        (Kalan: {camp.daysRemaining} gün)
                      </span>
                    )}
                  </td>
                </tr>
                {camp.targetAudience && (
                  <tr>
                    <td className="px-5 py-3 bg-muted/20 font-semibold text-muted-foreground">
                      Hedef Kitle
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {camp.targetAudience}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Katılım Şartları */}
          {camp.termsList && camp.termsList.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-base text-foreground">
                Kampanya Katılım Koşulları & Şartları
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
                {camp.termsList.map((term, i) => (
                  <li key={i} className="leading-relaxed">
                    {term}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Zengin Bloklar (Varsa) */}
          {content.blocks && content.blocks.length > 0 && (
            <div className="pt-4 space-y-6">
              <RscBlockRenderer
                blocks={content.blocks}
                themeId={site?.activeThemeId ?? "corporate-aurora"}
                tokens={themeTokens}
              />
            </div>
          )}
        </div>

        {/* Sağ Sütun: Hızlı Başvuru Kartı (Sticky) */}
        <aside className="space-y-6 lg:sticky lg:top-14">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
            <div className="text-center pb-4 border-b border-border space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                Özel Fırsat
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {camp.discount || "Özel İndirim"}
              </div>
              <p className="text-xs text-muted-foreground">
                {camp.isExpired ? (
                  <span className="text-rose-600 font-semibold">Kampanya süresi sona ermiştir.</span>
                ) : camp.daysRemaining !== null ? (
                  <span>⏳ Kampanyanın bitmesine <strong>{camp.daysRemaining} gün</strong> kaldı.</span>
                ) : (
                  <span>Süresiz geçerli fırsat.</span>
                )}
              </p>
            </div>

            {/* CTA Butonları */}
            <div className="space-y-2.5">
              {!camp.isExpired ? (
                <Link
                  href={camp.ctaUrl || "/iletisim"}
                  className="w-full flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  {camp.ctaText || "Hemen Teklif Al & Başvur"}
                </Link>
              ) : (
                <Link
                  href="/iletisim"
                  className="w-full flex items-center justify-center rounded-xl bg-muted px-4 py-3 text-sm font-bold text-foreground hover:bg-muted/80 transition"
                >
                  Benzer Fırsatlar İçin Bize Ulaşın
                </Link>
              )}

              {camp.contactWhatsapp && (
                <a
                  href={`https://wa.me/${camp.contactWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Merhaba, ${camp.title} hakkında bilgi ve teklif almak istiyorum.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <span>💬 WhatsApp'tan Hızlı Bilgi Al</span>
                </a>
              )}

              {camp.contactPhone && (
                <a
                  href={`tel:${camp.contactPhone.replace(/[^0-9]/g, "")}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <span>📞 {camp.contactPhone}</span>
                </a>
              )}
            </div>

            <p className="text-[11px] text-center text-muted-foreground leading-normal">
              Kampanya şartları ve kontenjan durumları hakkında doğrudan müşteri temsilcimizle görüşebilirsiniz.
            </p>
          </div>

          {/* Diğer Kampanyalar */}
          {otherCampaigns.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Diğer Aktif Fırsatlar
              </h2>
              <div className="space-y-3 divide-y divide-border">
                {otherCampaigns.map((oc) => (
                  <div key={oc.contentId} className="pt-3 first:pt-0 space-y-1">
                    {oc.discount && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {oc.discount}
                      </span>
                    )}
                    <h3 className="text-xs font-semibold text-foreground line-clamp-1">
                      <Link href={`/${locale}/kampanya/${oc.slug}`} className="hover:text-blue-600 transition">
                        {oc.title}
                      </Link>
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

