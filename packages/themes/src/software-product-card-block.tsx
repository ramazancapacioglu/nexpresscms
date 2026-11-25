import React from "react";
import type { DesignTokens } from "@nexpress/core";

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
  listPrice?: number;
  campaignPrice?: number;
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
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];
const fmtTry = (n: number): string => `${Math.round(n).toLocaleString("tr-TR")} TL`;

/**
 * 0-KB RSC Yazılım / Ürün Bilgi, Fiyat Listesi & Otomatik Şema Kartı.
 * Özellikler, Modüller, Paketler, Fiyat Listesi, Sistem Gereksinimleri ve Uyumlu Entegrasyonlar
 * saf CSS radio-input sekmeleriyle (0 KB istemci JS, tam SSR HTML DOM) sunulur.
 */
export function SoftwareProductCardBlock({ id = "spc", tokens, props: p }: SoftwareProductCardProps) {
  const safeId = `nxspc_${id.replace(/[^a-zA-Z0-9_]/g, "")}`;
  const name = str(p.name) || "Yazılım Ürünü";
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
  const priceNum = num(p.price);
  const listPriceNum = num(p.listPrice);
  const campaignBadge = str(p.campaignBadge);
  const currency = str(p.currency) || "TRY";
  const vatNote = str(p.vatNote) || "+ KDV";
  const priceLabel = str(p.priceLabel);
  const priceFootNote = str(p.priceFootNote);
  const demoUrl = str(p.demoUrl);
  const demoLabel = str(p.demoLabel) || "Ücretsiz Demo İste";
  const downloadUrl = str(p.downloadUrl);
  const downloadLabel = str(p.downloadLabel) || "Kurulum Dosyasını İndir";
  const downloadSize = str(p.downloadSize);
  const brochureUrl = str(p.brochureUrl);
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
          listPrice: num(r.listPrice) || undefined,
          campaignPrice: num(r.campaignPrice) || undefined,
          note: str(r.note) || undefined,
        }))
        .filter((r) => r.name)
    : [];

  const curSym = currency === "TRY" ? "TL" : currency;
  const hasVisiblePrice = (pricingMode === "fixed" || pricingMode === "starting") && priceNum > 0;
  const formattedPrice = hasVisiblePrice
    ? `${priceNum.toLocaleString("tr-TR")} ${curSym}`
    : priceLabel || "Modüler Lisans · İşletmeye Özel Teklif";

  const quickSpecs = [
    version ? { k: "Güncel Sürüm", v: version } : null,
    operatingSystem ? { k: "Platform", v: operatingSystem } : null,
    database ? { k: "Veritabanı", v: database } : null,
    deployment ? { k: "Kurulum Modeli", v: deployment } : null,
    licenseModel ? { k: "Lisanslama", v: licenseModel } : null,
    supportSla ? { k: "Destek & Kurulum", v: supportSla } : null,
  ].filter((x): x is { k: string; v: string } => Boolean(x));

  // Build available tabs dynamically so empty tabs never show
  const tabs: Array<{ key: string; label: string; count?: number }> = [];
  if (priceList.length > 0) tabs.push({ key: "pricing", label: "Fiyat Listesi", count: priceList.length });
  if (packages.length > 0) tabs.push({ key: "packages", label: "Paketler", count: packages.length });
  if (highlights.length > 0) tabs.push({ key: "features", label: "Özellikler" });
  if (modules.length > 0) tabs.push({ key: "modules", label: "Modüller", count: modules.length });
  if (requirements.length > 0) tabs.push({ key: "requirements", label: "Sistem Gereksinimleri" });
  if (integrations.length > 0) tabs.push({ key: "integrations", label: "Uyumlu Entegrasyonlar", count: integrations.length });

  const tabCss = tabs
    .map(
      (t, i) =>
        `#${safeId}_t${i}:checked ~ .nxspc-bar label[for="${safeId}_t${i}"]{background:${tokens.colors.primary};color:${tokens.colors.primaryForeground};border-color:${tokens.colors.primary};}` +
        `#${safeId}_t${i}:checked ~ .nxspc-panels [data-panel="${t.key}"]{display:block;}`
    )
    .join("");

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
              {sku ? <span className="font-mono text-slate-400">Kod: {sku}</span> : null}
            </div>

            <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {name}
            </h2>
            {tagline ? <p className="text-sm font-medium text-sky-300">{tagline}</p> : null}
            {shortDescription ? <p className="text-sm leading-relaxed text-slate-300 max-w-3xl">{shortDescription}</p> : null}

            {(vendor || seller) ? (
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs text-slate-300">
                {vendor ? <span><strong className="text-white">Yazılım Üreticisi:</strong> {vendor}</span> : null}
                {seller ? <span><strong className="text-white">Yetkili Satış &amp; Destek:</strong> {seller}</span> : null}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4 rounded-xl border border-white/15 bg-white/5 p-5 space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>{pricingMode === "starting" ? "Başlangıç Kampanya Fiyatı" : "Lisans & Fiyatlandırma"}</span>
                {listPriceNum > 0 && hasVisiblePrice && listPriceNum > priceNum ? (
                  <span className="line-through text-slate-400 font-normal normal-case">{fmtTry(listPriceNum)}</span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-extrabold tracking-tight text-emerald-400">{formattedPrice}</span>
                {hasVisiblePrice && vatNote ? <span className="text-xs font-medium text-slate-300">{vatNote}</span> : null}
              </div>
              {priceLabel && hasVisiblePrice ? <div className="text-[11px] text-slate-300">{priceLabel}</div> : null}
              {releaseDate ? <div className="text-[11px] text-slate-400">Güncel Sürüm: {version || releaseDate}</div> : null}
            </div>

            <div className="flex flex-col gap-2">
              {demoUrl ? (
                <a
                  href={demoUrl}
                  style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground, borderRadius: tokens.geometry.borderRadius }}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold shadow-xs hover:opacity-95"
                >
                  {demoLabel} →
                </a>
              ) : null}
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  style={{ borderRadius: tokens.geometry.borderRadius }}
                  className="inline-flex w-full items-center justify-center gap-2 border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/15"
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
                  className="text-center text-xs font-medium text-sky-300 hover:underline pt-0.5"
                >
                  Resmî Fiyat Hesaplayıcı (Abaküs) ↗
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

      {/* 0-KB CSS Sekmeli İçerik Alanı */}
      {tabs.length > 0 ? (
        <div className="p-5 sm:p-7">
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: `#${safeId} .nxspc-radio{position:absolute;opacity:0;pointer-events:none;}#${safeId} .nxspc-panels>[data-panel]{display:none;}${tabCss}` }} />

          {tabs.map((t, i) => (
            <input
              key={t.key}
              type="radio"
              name={`${safeId}_tabs`}
              id={`${safeId}_t${i}`}
              defaultChecked={i === 0}
              className="nxspc-radio"
            />
          ))}

          {/* Sekme Başlık Çubuğu */}
          <div
            role="tablist"
            aria-label={`${name} detay sekmeleri`}
            className="nxspc-bar flex flex-wrap gap-2 border-b border-nx-line pb-4 mb-6"
          >
            {tabs.map((t, i) => (
              <label
                key={t.key}
                htmlFor={`${safeId}_t${i}`}
                style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                className="cursor-pointer select-none inline-flex items-center gap-1.5 border bg-nx-subtle/60 px-3.5 py-2 text-xs font-semibold text-nx-fg transition hover:bg-nx-subtle"
              >
                <span>{t.label}</span>
                {typeof t.count === "number" ? (
                  <span className="rounded-full bg-black/10 px-1.5 py-px text-[10px] font-bold">{t.count}</span>
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
                    2026 Güncel Liste ve Kampanya Fiyatları
                  </h3>
                  <span className="text-xs text-nx-muted">Tüm fiyatlar TL cinsindendir · KDV hariçtir</span>
                </div>
                <div style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }} className="overflow-x-auto border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-nx-subtle/80 text-[11px] uppercase tracking-wider text-nx-muted border-b border-nx-line">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Paket / Modül</th>
                        <th className="px-3 py-3 font-semibold hidden sm:table-cell">Kategori</th>
                        <th className="px-3 py-3 font-semibold text-right">Liste Fiyatı</th>
                        <th className="px-4 py-3 font-semibold text-right">Kampanya Fiyatı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nx-line">
                      {priceList.map((row, idx) => {
                        const lp = row.listPrice ?? 0;
                        const cp = row.campaignPrice ?? 0;
                        const pct = lp > 0 && cp > 0 && cp < lp ? Math.round(((lp - cp) / lp) * 100) : 0;
                        return (
                          <tr key={idx} className={idx % 2 === 1 ? "bg-nx-subtle/30" : "bg-nx-card"}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-nx-fg">{row.name}</div>
                              {row.note ? <div className="text-[11px] text-nx-muted mt-0.5">{row.note}</div> : null}
                            </td>
                            <td className="px-3 py-3 text-xs text-nx-muted hidden sm:table-cell">
                              {row.group || (row.code ? `Kod: ${row.code}` : "Modül")}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-xs text-nx-muted">
                              {lp > 0 ? <span className={cp > 0 && cp < lp ? "line-through" : ""}>{fmtTry(lp)}</span> : "Dahil"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {cp > 0 ? (
                                <div className="inline-flex items-center gap-2 justify-end">
                                  {pct > 0 ? (
                                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                      %{pct}
                                    </span>
                                  ) : null}
                                  <span className="font-mono font-bold text-nx-fg">{fmtTry(cp)}</span>
                                </div>
                              ) : (
                                <span className="inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  Ücretsiz / Dahil
                                </span>
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
                  Hazır Paket ve Lisans Seçenekleri
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
                          {pk.ctaLabel || "Teklif İste"}
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
                  Öne Çıkan Özellikler
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
                  Dahil &amp; Genişletilebilir Modüller
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
                  Sistem Gereksinimleri
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
                  Uyumlu Entegrasyonlar
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

          {lastVerified ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-nx-line pt-4 text-[11px] text-nx-muted">
              <span>Fiyat ve teknik özellikler son kontrol: <strong>{lastVerified}</strong></span>
              {seller ? <span>{seller}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
