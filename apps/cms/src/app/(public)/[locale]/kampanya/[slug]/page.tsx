import React from "react";
import { siteLocaleBase } from "@/lib/locale-url";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Link } from "@/components/public/link";
import { getPublicSite, resolvePublicContent } from "@/lib/public-data";
import { getScopedRepository, type ContentWithTranslationDto } from "@nexpress/database";
import { getSession } from "@/lib/auth/session";
import { resolveDraftPreview } from "@/lib/draft-preview";
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
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const sp = searchParams ? await searchParams : {};
  const draftToken = typeof sp.nx_draft === "string" ? sp.nx_draft : undefined;
  const draftContent = await resolveDraftPreview(siteId, locale, slug, draftToken);

  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    draftContent
      ? Promise.resolve({ content: draftContent, isRedirect: false })
      : resolvePublicContent(siteId, slug, locale),
  ]);

  let content: ContentWithTranslationDto | undefined = resolved?.content;
  if (!content) {
    const session = await getSession();
    if (session) {
      const repo = getScopedRepository(siteId);
      const all = await repo.listContents({ locale });
      content = all.find((c) => c.slug === slug || c.contentId === slug);
    }
  }

  if (!content) {
    return { title: "Kampanya Bulunamadı | NexPress CMS" };
  }

  const camp = resolveCampaignData(content);
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
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ nx_draft?: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const sp = searchParams ? await searchParams : {};
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const lb = await siteLocaleBase(siteId, locale);
  const repo = getScopedRepository(siteId);

  const draftContent = await resolveDraftPreview(siteId, locale, slug, sp?.nx_draft);
  const [site, resolved] = await Promise.all([
    getPublicSite(siteId),
    draftContent
      ? Promise.resolve({ content: draftContent, isRedirect: false })
      : resolvePublicContent(siteId, slug, locale),
  ]);

  if (resolved?.isRedirect && resolved.content) {
    permanentRedirect(`${lb}/kampanya/${resolved.content.slug}`);
  }

  let content: ContentWithTranslationDto | undefined = resolved?.content;
  let isDraftPreview = false;

  if (!content) {
    const session = await getSession();
    if (session) {
      const all = await repo.listContents({ locale });
      content = all.find((c) => c.slug === slug || c.contentId === slug);
      if (content) {
        isDraftPreview = content.status !== "published";
      }
    }
  }

  if (!content) {
    notFound();
  }

  const camp = resolveCampaignData(content);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${baseUrl}${lb}/kampanya/${camp.slug}`;
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
    <div className="w-full py-6 space-y-6">
      {/* Schema.org Offer JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(offerJsonLd) }}
      />

      {/* Taslak Önizleme Rozeti */}
      {isDraftPreview && (
        <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ Taslak Önizleme:</span>
            <span>Bu kampanya henüz yayında değil (taslak durumunda). Yalnızca giriş yapmış yöneticiler görebilir.</span>
          </div>
          <Link
            href="/admin/campaigns"
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shrink-0"
          >
            Panele Dön
          </Link>
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={(lb || "/")} className="hover:text-foreground">Ana Sayfa</Link>
        <span>/</span>
        <Link href={`${lb}/kampanyalar`} className="hover:text-foreground">Kampanyalar</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{camp.title}</span>
      </nav>

      {/* Ana Kampanya Detay İçeriği */}
      <article className="space-y-8">
        {/* Afiş Görseli */}
        {camp.featuredImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-border shadow-xs bg-muted">
            <img
              src={camp.featuredImageUrl}
              alt={camp.featuredImageAlt || camp.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Başlık, Rozetler & Kalan Süre Sayacı */}
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
            {/* Bitmesine Kalan Süre Sayacı Rozeti (Görsel altındaki etiketlerin yanında) */}
            {camp.isExpired ? (
              <span className="rounded-md bg-rose-600 text-white font-bold text-xs px-2.5 py-1">
                Kampanya Sona Erdi
              </span>
            ) : camp.daysRemaining !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 font-bold text-xs px-2.5 py-1">
                <span>⏳</span>
                <span>Kampanyanın bitmesine <strong>{camp.daysRemaining} gün</strong> kaldı</span>
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs px-2.5 py-1">
                Süresiz Geçerli Fırsat
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

        {/* Kampanya Bilgi & Detay Tablosu + Hemen Teklif Al / Bilgi İste / WhatsApp / Telefon Aksiyonları */}
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

          {/* Hemen Teklif Al & Bilgi İste / WhatsApp / Telefon Aksiyonları (Doğrudan Tablonun Altında) */}
          <div className="p-5 sm:p-6 bg-muted/30 border-t border-border space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!camp.isExpired ? (
                <Link
                  href={camp.ctaUrl || "/iletisim"}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  {camp.ctaText || "Hemen Teklif Al & Bilgi İste"}
                </Link>
              ) : (
                <Link
                  href="/iletisim"
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-muted px-5 py-3 text-sm font-bold text-foreground hover:bg-muted/80 transition"
                >
                  Benzer Fırsatlar İçin Bilgi İste
                </Link>
              )}

              {camp.contactWhatsapp && (
                <a
                  href={`https://wa.me/${camp.contactWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Merhaba, ${camp.title} hakkında bilgi ve teklif almak istiyorum.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition shrink-0"
                >
                  <span>💬 WhatsApp'tan Bilgi Al</span>
                </a>
              )}

              {camp.contactPhone && (
                <a
                  href={`tel:${camp.contactPhone.replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition shrink-0"
                >
                  <span>📞 {camp.contactPhone}</span>
                </a>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Kampanya şartları ve kontenjan durumları hakkında doğrudan müşteri temsilcimizle görüşebilirsiniz.
            </p>
          </div>
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

        {/* Diğer Aktif Fırsatlar (Altta Şık Grid) */}
        {otherCampaigns.length > 0 && (
          <section className="pt-8 border-t border-border space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Diğer Aktif Kampanyalar & Fırsatlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherCampaigns.map((oc) => (
                <Link
                  key={oc.contentId}
                  href={`${lb}/kampanya/${oc.slug}`}
                  className="group p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 hover:shadow-xs transition space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {oc.featuredImageUrl && (
                      <div className="rounded-lg overflow-hidden h-28 bg-muted">
                        <img
                          src={oc.featuredImageUrl}
                          alt={oc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {oc.discount && (
                        <span className="rounded bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5">
                          {oc.discount}
                        </span>
                      )}
                      {oc.daysRemaining !== null && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          ⏳ {oc.daysRemaining} gün kaldı
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-foreground group-hover:text-blue-600 transition line-clamp-2">
                      {oc.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    İncele & Başvur →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

