import React from "react";
import type { DesignTokens } from "@nexpress/core";
import { createTranslator } from "@nexpress/i18n";

export interface SoftwareProductPackage {
  name: string;
  badge?: string;
  listPrice?: string;
  price?: string;
  period?: string;
  description?: string;
  highlights?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SoftwareProductPriceRow {
  name: string;
  code?: string;
  group?: string;
  /** `null` = fiyat girilmemiş (teklif); `0` = açıkça ücretsiz/dahil; `> 0` = tutar. */
  listPrice: number | null;
  campaignPrice: number | null;
  note?: string;
}

export interface SoftwareProductRequirement {
  label: string;
  value: string;
}

export interface SoftwareProductCardProps {
  id?: string;
  tokens: DesignTokens;
  props: Record<string, unknown>;
  locale?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

const parseOptionalPrice = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  const cleaned = String(v).trim().replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  // Hem `1.250,50` hem `1250.50` biçimlerini güvenli çöz
  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "")
      : cleaned.includes(",")
        ? cleaned.replace(",", ".")
        : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];

function currencyLabel(currency: string, locale: string): string {
  const code = currency.toUpperCase();
  if (code === "TRY" && locale.toLowerCase().startsWith("tr")) return "TL";
  return code;
}

export function formatProductMoney(amount: number, currency: string, locale = "tr"): string {
  const isWhole = Math.abs(amount - Math.round(amount)) < 1e-9;
  const numberLocale = locale.toLowerCase().startsWith("tr") ? "tr-TR" : locale;
  const formatted = amount.toLocaleString(numberLocale, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
  return `${formatted} ${currencyLabel(currency, locale)}`;
}

/**
 * 0-KB RSC Yazılım / Ürün Bilgi, Fiyat Listesi & Otomatik Şema Kartı.
 * Özellikler, Modüller, Paketler, Fiyat Listesi, Sistem Gereksinimleri ve Uyumlu Entegrasyonlar
 * saf CSS native radio grubuyla (0 KB istemci JS, tam SSR HTML DOM, klavye odak halkası ve ekran okuyucu uyumlu) sunulur.
 */
export function SoftwareProductCardBlock({ id = "spc", tokens, props: p, locale = "tr" }: SoftwareProductCardProps) {
  const t = createTranslator(locale);
  const safeId = `nxspc_${id.replace(/[^a-zA-Z0-9_]/g, "")}`;
  const name = str(p.name) || t("productCard.defaultName");
  const tagline = str(p.tagline);
  const shortDescription = str(p.shortDescription);
  const version = str(p.version);
  const releaseDate = str(p.releaseDate);
  const category = str(p.categoryLabel) || str(p.category);
  const operatingSystem = str(p.operatingSystem);
  const database = str(p.database);
  const deployment = str(p.deployment);
  const vendor = str(p.vendor);
  const seller = str(p.seller);
  const licenseModel = str(p.licenseModel);
  const supportSla = str(p.supportSla);
  const sku = str(p.sku);
  const pricingMode = str(p.pricingMode) || "quote";
  const priceNum = parseOptionalPrice(p.price) ?? 0;
  const listPriceNum = parseOptionalPrice(p.listPrice) ?? 0;
  const campaignBadge = str(p.campaignBadge);
  const currency = (str(p.currency) || "TRY").toUpperCase();
  const hasExplicitVat = typeof p.vatNote === "string" && p.vatNote.trim().length > 0;
  const vatNote = hasExplicitVat ? str(p.vatNote) : "";
  const priceLabel = str(p.priceLabel);
  const priceValidUntil = str(p.priceValidUntil);
  const priceFootNote = str(p.priceFootNote);
  const demoUrl = str(p.demoUrl);
  const demoLabel = str(p.demoLabel) || t("productCard.demoLabel");
  const downloadUrl = str(p.downloadUrl);
  const downloadLabel = str(p.downloadLabel) || t("productCard.downloadLabel");
  const downloadSize = str(p.downloadSize);
  const brochureUrl = str(p.brochureUrl);
  const brochureLabel = str(p.brochureLabel) || t("productCard.brochureLabel");
  const lastVerified = str(p.lastVerified);

  const highlights = strArr(p.highlights);
  const modules = strArr(p.modules);
  const integrations = strArr(p.integrations);
  const requirements: SoftwareProductRequirement[] = Array.isArray(p.requirements)
    ? p.requirements
        .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
        .map((r) => ({ label: str(r.label), value: str(r.value) }))
        .filter((r) => r.label && r.value)
    : [];
  const packages: SoftwareProductPackage[] = Array.isArray(p.packages)
    ? p.packages
        .filter((pk): pk is Record<string, unknown> => Boolean(pk && typeof pk === "object"))
        .map((pk) => ({
          name: str(pk.name),
          badge: str(pk.badge) || undefined,
          listPrice: str(pk.listPrice) || undefined,
          price: str(pk.price) || undefined,
          period: str(pk.period) || undefined,
          description: str(pk.description) || undefined,
          highlights: strArr(pk.highlights),
          ctaLabel: str(pk.ctaLabel) || undefined,
          ctaHref: str(pk.ctaHref) || undefined,
        }))
        .filter((pk) => pk.name)
    : [];
  const priceList: SoftwareProductPriceRow[] = Array.isArray(p.priceList)
    ? p.priceList
        .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
        .map((r) => ({
          name: str(r.name),
          code: str(r.code) || undefined,
          group: str(r.group) || undefined,
          listPrice: parseOptionalPrice(r.listPrice),
          campaignPrice: parseOptionalPrice(r.campaignPrice),
          note: str(r.note) || undefined,
        }))
        .filter((r) => r.name)
    : [];

  const curSym = currencyLabel(currency, locale);
  const fmtMoney = (n: number) => formatProductMoney(n, currency, locale);
  const hasVisiblePrice = (pricingMode === "fixed" || pricingMode === "starting") && priceNum > 0;
  const formattedPrice = hasVisiblePrice
    ? fmtMoney(priceNum)
    : priceLabel || t("productCard.defaultQuote");

  const quickSpecs = [
    version ? { k: t("productCard.currentVersion"), v: version } : null,
    operatingSystem ? { k: t("productCard.platform"), v: operatingSystem } : null,
    database ? { k: t("productCard.database"), v: database } : null,
    deployment ? { k: t("productCard.deployment"), v: deployment } : null,
    licenseModel ? { k: t("productCard.licenseModel"), v: licenseModel } : null,
    supportSla ? { k: t("productCard.supportSla"), v: supportSla } : null,
  ].filter((x): x is { k: string; v: string } => Boolean(x));

  // Boş sekmeler hiç gösterilmez (Özellikler varsayılan ilk sekme)
  const tabs: Array<{ key: string; label: string; count?: number }> = [];
  if (highlights.length > 0) tabs.push({ key: "features", label: t("productCard.tabFeatures") });
  if (priceList.length > 0) tabs.push({ key: "pricing", label: t("productCard.tabPricing"), count: priceList.length });
  if (packages.length > 0) tabs.push({ key: "packages", label: t("productCard.tabPackages"), count: packages.length });
  if (modules.length > 0) tabs.push({ key: "modules", label: t("productCard.tabModules"), count: modules.length });
  if (requirements.length > 0) tabs.push({ key: "requirements", label: t("productCard.tabRequirements") });
  if (integrations.length > 0) tabs.push({ key: "integrations", label: t("productCard.tabIntegrations"), count: integrations.length });

  const tabCss = tabs
    .map(
      (tab, i) =>
        `#${safeId}_t${i}:checked ~ .nxspc-bar label[for="${safeId}_t${i}"]{background:${tokens.colors.primary};color:${tokens.colors.primaryForeground};border-color:${tokens.colors.primary};}` +
        `#${safeId}_t${i}:focus-visible ~ .nxspc-bar label[for="${safeId}_t${i}"]{outline:2px solid ${tokens.colors.primary};outline-offset:2px;}` +
        `#${safeId}_t${i}:checked ~ .nxspc-panels [data-panel="${tab.key}"]{display:block;}`
    )
    .join("");

  const priceMetaParts = [
    t("productCard.currencyNote", { currency: curSym }),
    vatNote || null,
    priceValidUntil ? t("productCard.validUntil", { date: priceValidUntil }) : null,
  ].filter(Boolean);

  return (
    <section
      id={safeId}
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="border bg-nx-card shadow-sm overflow-hidden"
    >
      {/* Üst Vitrin & Fiyat / Aksiyon Şeridi */}
      <div className="border-b border-nx-line bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              {version ? (
                <span style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="rounded-full px-2.5 py-0.5">
                  {version}
                </span>
              ) : null}
              {category ? (
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-slate-200">
                  {category}
                </span>
              ) : null}
              {campaignBadge ? (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-emerald-300">
                  {campaignBadge}
                </span>
              ) : null}
              {sku ? <span className="font-mono text-slate-400">{t("productCard.code")}: {sku}</span> : null}
            </div>

            <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {name}
            </h2>
            {tagline ? <p className="text-sm font-medium text-sky-300">{tagline}</p> : null}
            {shortDescription ? <p className="text-sm leading-relaxed text-slate-300 max-w-3xl">{shortDescription}</p> : null}

            {(vendor || seller) ? (
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-slate-300">
                {vendor ? <span><strong className="text-white">{t("productCard.vendor")}:</strong> {vendor}</span> : null}
                {seller ? <span><strong className="text-white">{t("productCard.seller")}:</strong> {seller}</span> : null}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4 rounded-xl border border-white/15 bg-white/5 p-5 space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>{pricingMode === "starting" ? t("productCard.startingPrice") : t("productCard.licensePricing")}</span>
                {listPriceNum > 0 && hasVisiblePrice && listPriceNum > priceNum ? (
                  <span className="line-through text-slate-400 font-normal normal-case">{fmtMoney(listPriceNum)}</span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-extrabold tracking-tight text-emerald-400">{formattedPrice}</span>
                {hasVisiblePrice && vatNote ? <span className="text-xs font-medium text-slate-300">{vatNote}</span> : null}
              </div>
              {priceLabel && hasVisiblePrice ? <div className="text-[11px] text-slate-300">{priceLabel}</div> : null}
              {releaseDate ? <div className="text-[11px] text-slate-400">{t("productCard.currentVersion")}: {version || releaseDate}</div> : null}
            </div>

            <div className="flex flex-col gap-2">
              {demoUrl ? (
                <a
                  href={demoUrl}
                  style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius }}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-xs hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {demoLabel} →
                </a>
              ) : null}
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  style={{ borderRadius: tokens.geometry.borderRadius }}
                  className="inline-flex w-full items-center justify-center gap-2 border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>{downloadLabel}</span>
                  {downloadSize ? <span className="text-[11px] text-slate-300">({downloadSize})</span> : null}
                </a>
              ) : null}
              {brochureUrl ? (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-xs font-medium text-sky-300 hover:underline pt-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                >
                  {brochureLabel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı Teknik Özet Şeridi */}
      {quickSpecs.length > 0 ? (
        <div className="grid grid-cols-2 gap-px bg-nx-line sm:grid-cols-3 lg:grid-cols-6 border-b border-nx-line">
          {quickSpecs.map((sp) => (
            <div key={sp.k} className="bg-nx-card p-3.5 space-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-nx-muted">{sp.k}</div>
              <div className="text-xs font-semibold text-nx-fg leading-snug">{sp.v}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* 0-KB CSS Erişilebilir Native Radio Sekme Alanı */}
      {tabs.length > 0 ? (
        <div className="p-5 sm:p-7">
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: `#${safeId} .nxspc-radio{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}#${safeId} .nxspc-panels>[data-panel]{display:none;}${tabCss}` }} />

          <fieldset className="relative border-0 p-0 m-0 min-w-0">
            <legend className="sr-only">{t("productCard.tabsLabel", { name })}</legend>

            {tabs.map((tab, i) => (
              <input
                key={tab.key}
                type="radio"
                name={`${safeId}_tabs`}
                id={`${safeId}_t${i}`}
                defaultChecked={i === 0}
                className="nxspc-radio"
              />
            ))}

            {/* Sekme Seçenek Çubuğu */}
            <div className="nxspc-bar flex flex-wrap gap-2 border-b border-nx-line pb-4 mb-6">
              {tabs.map((tab, i) => (
                <label
                  key={tab.key}
                  htmlFor={`${safeId}_t${i}`}
                  style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                  className="cursor-pointer select-none inline-flex items-center gap-1.5 border bg-nx-subtle/60 px-3.5 py-2 text-xs font-semibold text-nx-fg transition hover:bg-nx-subtle"
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" ? (
                    <span className="rounded-full bg-black/10 px-1.5 py-px text-[10px] font-bold">{tab.count}</span>
                  ) : null}
                </label>
              ))}
            </div>

            {/* Sekme Panelleri */}
            <div className="nxspc-panels">
              {/* 1. Fiyat Listesi */}
              {priceList.length > 0 ? (
                <div data-panel="pricing" className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                      {t("productCard.priceListHeading")}
                    </h3>
                    <span className="text-xs text-nx-muted">{priceMetaParts.join(" · ")}</span>
                  </div>
                  <div style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }} className="overflow-x-auto border">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-nx-subtle/80 text-[11px] uppercase tracking-wider text-nx-muted border-b border-nx-line">
                        <tr>
                          <th className="px-4 py-3 font-semibold">{t("productCard.colPackage")}</th>
                          <th className="px-3 py-3 font-semibold hidden sm:table-cell">{t("productCard.colCategory")}</th>
                          <th className="px-3 py-3 font-semibold text-right">{t("productCard.colListPrice")}</th>
                          <th className="px-4 py-3 font-semibold text-right">{t("productCard.colCampaignPrice")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nx-line">
                        {priceList.map((row, idx) => {
                          const lp = row.listPrice;
                          const cp = row.campaignPrice;
                          const pct = lp !== null && cp !== null && lp > 0 && cp > 0 && cp < lp ? Math.round(((lp - cp) / lp) * 100) : 0;
                          return (
                            <tr key={idx} className={idx % 2 === 1 ? "bg-nx-subtle/30" : "bg-nx-card"}>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-nx-fg">{row.name}</div>
                                {row.note ? <div className="text-[11px] text-nx-muted mt-0.5">{row.note}</div> : null}
                              </td>
                              <td className="px-3 py-3 text-xs text-nx-muted hidden sm:table-cell">
                                {row.group || (row.code ? `${t("productCard.code")}: ${row.code}` : t("productCard.moduleDefault"))}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-xs text-nx-muted">
                                {lp !== null && lp > 0 ? (
                                  <span className={cp !== null && cp > 0 && cp < lp ? "line-through" : ""}>{fmtMoney(lp)}</span>
                                ) : lp === 0 ? (
                                  t("productCard.included")
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {cp !== null && cp > 0 ? (
                                  <div className="inline-flex items-center gap-2 justify-end">
                                    {pct > 0 ? (
                                      <>
                                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                          %{pct}
                                        </span>{" "}
                                      </>
                                    ) : null}
                                    <span className="font-mono font-bold text-nx-fg">{fmtMoney(cp)}</span>
                                  </div>
                                ) : cp === 0 ? (
                                  <span className="inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    {t("productCard.freeIncluded")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-nx-muted">{t("productCard.quoteOnRequest")}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {priceFootNote ? <p className="text-xs text-nx-muted leading-relaxed">{priceFootNote}</p> : null}
                </div>
              ) : null}

              {/* 2. Paketler */}
              {packages.length > 0 ? (
                <div data-panel="packages" className="space-y-4">
                  <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                    {t("productCard.packagesHeading")}
                  </h3>
                  <div className={`grid grid-cols-1 gap-4 ${packages.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                    {packages.map((pk, idx) => (
                      <div
                        key={idx}
                        style={{ borderRadius: tokens.geometry.borderRadius, borderColor: pk.badge ? tokens.colors.primary : tokens.colors.border }}
                        className="flex flex-col justify-between gap-4 border bg-nx-subtle/40 p-5"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-nx-fg">{pk.name}</span>
                            {pk.badge ? (
                              <span style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                {pk.badge}
                              </span>
                            ) : null}
                          </div>
                          {pk.price ? (
                            <div className="space-y-0.5">
                              {pk.listPrice ? <div className="text-xs text-nx-muted line-through">{pk.listPrice}</div> : null}
                              <div className="text-lg font-extrabold text-nx-fg">
                                {pk.price}
                                {pk.period ? <span className="text-xs font-normal text-nx-muted"> {pk.period}</span> : null}
                              </div>
                            </div>
                          ) : null}
                          {pk.description ? <p className="text-xs text-nx-soft">{pk.description}</p> : null}
                          {pk.highlights && pk.highlights.length > 0 ? (
                            <ul className="space-y-1 text-xs text-nx-soft pt-1">
                              {pk.highlights.map((h, hi) => (
                                <li key={hi} className="flex items-start gap-1.5">
                                  <span style={{ color: tokens.colors.primary }} className="font-bold">•</span>
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        {pk.ctaHref ? (
                          <a
                            href={pk.ctaHref}
                            style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                            className="inline-flex w-full items-center justify-center border bg-nx-card px-3 py-2 text-xs font-semibold text-nx-fg hover:bg-nx-subtle"
                          >
                            {pk.ctaLabel || t("productCard.requestQuote")}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 3. Özellikler */}
              {highlights.length > 0 ? (
                <div data-panel="features" className="space-y-3">
                  <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                    {t("productCard.featuresHeading")}
                  </h3>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-sm text-nx-soft">
                    {highlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-nx-line/70 bg-nx-subtle/30 p-3">
                        <span style={{ color: tokens.colors.primary }} className="mt-0.5 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* 4. Modüller */}
              {modules.length > 0 ? (
                <div data-panel="modules" className="space-y-3">
                  <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                    {t("productCard.modulesHeading")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((mod, i) => (
                      <span
                        key={i}
                        style={{ borderColor: tokens.colors.border }}
                        className="rounded-lg border bg-nx-subtle px-3 py-1.5 text-xs font-medium text-nx-fg"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 5. Sistem Gereksinimleri */}
              {requirements.length > 0 ? (
                <div data-panel="requirements" className="space-y-3">
                  <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                    {t("productCard.requirementsHeading")}
                  </h3>
                  <div style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }} className="overflow-hidden border">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <tbody className="divide-y divide-nx-line">
                        {requirements.map((req, i) => (
                          <tr key={i} className={i % 2 === 1 ? "bg-nx-subtle/40" : "bg-nx-card"}>
                            <th className="w-44 px-4 py-3 font-semibold text-nx-fg">{req.label}</th>
                            <td className="px-4 py-3 text-nx-soft">{req.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* 6. Uyumlu Entegrasyonlar */}
              {integrations.length > 0 ? (
                <div data-panel="integrations" className="space-y-3">
                  <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                    {t("productCard.integrationsHeading")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {integrations.map((intg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800"
                      >
                        <span>✓</span>
                        <span>{intg}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </fieldset>

          {lastVerified ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-nx-line pt-4 text-[11px] text-nx-muted">
              <span>{t("productCard.lastVerified")}: <strong>{lastVerified}</strong></span>
              {seller ? <span>{seller}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
