import React from "react";
import type { DesignTokens } from "@nexpress/core";

export interface SoftwareProductPackage {
  name: string;
  badge?: string;
  price?: string;
  period?: string;
  description?: string;
  highlights?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SoftwareProductRequirement {
  label: string;
  value: string;
}

export interface SoftwareProductCardProps {
  tokens: DesignTokens;
  props: Record<string, unknown>;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];

/**
 * 0-KB RSC Yazılım / Ürün Bilgi & Şema Kartı.
 * `emitSchema !== false` iken `deriveAutoSchemaNodes` bu bloktaki görünür verilerden
 * doğrudan `SoftwareApplication` veya `Product` JSON-LD üretir (HTML ↔ Şema tek kaynak).
 */
export function SoftwareProductCardBlock({ tokens, props: p }: SoftwareProductCardProps) {
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
  const priceNum = typeof p.price === "number" ? p.price : Number(str(p.price).replace(/[^\d.]/g, ""));
  const currency = str(p.currency) || "TRY";
  const vatNote = str(p.vatNote);
  const priceLabel = str(p.priceLabel);
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
          price: str(pk.price) || undefined,
          period: str(pk.period) || undefined,
          description: str(pk.description) || undefined,
          highlights: strArr(pk.highlights),
          ctaLabel: str(pk.ctaLabel) || undefined,
          ctaHref: str(pk.ctaHref) || undefined,
        }))
        .filter((pk) => pk.name)
    : [];

  const formattedPrice =
    (pricingMode === "fixed" || pricingMode === "starting") && Number.isFinite(priceNum) && priceNum > 0
      ? `${pricingMode === "starting" ? "Başlangıç: " : ""}${priceNum.toLocaleString("tr-TR")} ${currency === "TRY" ? "TL" : currency}${vatNote ? ` ${vatNote}` : ""}`
      : priceLabel || "Modüler Lisans · İşletmeye Özel Teklif";

  const quickSpecs = [
    version ? { k: "Güncel Sürüm", v: version } : null,
    operatingSystem ? { k: "Platform", v: operatingSystem } : null,
    database ? { k: "Veritabanı", v: database } : null,
    deployment ? { k: "Kurulum Modeli", v: deployment } : null,
    licenseModel ? { k: "Lisanslama", v: licenseModel } : null,
    supportSla ? { k: "Destek & Kurulum", v: supportSla } : null,
  ].filter((x): x is { k: string; v: string } => Boolean(x));

  return (
    <section
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="border bg-nx-card shadow-sm overflow-hidden"
    >
      {/* Üst Vitrin & Aksiyon Şeridi */}
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
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lisans &amp; Fiyatlandırma</div>
              <div className="text-lg font-extrabold text-white">{formattedPrice}</div>
              {releaseDate ? <div className="text-[11px] text-slate-400">Sürüm Tarihi: {releaseDate}</div> : null}
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
                  Ürün Broşürü &amp; Teknik Doküman ↗
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

      <div className="p-6 sm:p-8 space-y-8">
        {/* Öne Çıkan Özellikler + Modüller */}
        {(highlights.length > 0 || modules.length > 0) ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {highlights.length > 0 ? (
              <div className={modules.length > 0 ? "lg:col-span-7 space-y-3" : "lg:col-span-12 space-y-3"}>
                <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                  Öne Çıkan Özellikler
                </h3>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-nx-soft">
                  {highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: tokens.colors.primary }} className="mt-0.5 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {modules.length > 0 ? (
              <div className={highlights.length > 0 ? "lg:col-span-5 space-y-3" : "lg:col-span-12 space-y-3"}>
                <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                  Dahil &amp; Genişletilebilir Modüller
                </h3>
                <div className="flex flex-wrap gap-2">
                  {modules.map((mod, i) => (
                    <span
                      key={i}
                      style={{ borderColor: tokens.colors.border }}
                      className="rounded-lg border bg-nx-subtle px-2.5 py-1 text-xs font-medium text-nx-fg"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Paket / Lisans Seçenekleri */}
        {packages.length > 0 ? (
          <div className="space-y-3">
            <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
              Paket ve Lisans Seçenekleri
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
                      <div className="text-lg font-extrabold text-nx-fg">
                        {pk.price}
                        {pk.period ? <span className="text-xs font-normal text-nx-muted"> / {pk.period}</span> : null}
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

        {/* Sistem Gereksinimleri + Entegrasyonlar */}
        {(requirements.length > 0 || integrations.length > 0) ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {requirements.length > 0 ? (
              <div className={integrations.length > 0 ? "lg:col-span-7 space-y-3" : "lg:col-span-12 space-y-3"}>
                <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                  Sistem Gereksinimleri
                </h3>
                <div style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }} className="overflow-hidden border">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-nx-line">
                      {requirements.map((req, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-nx-subtle/40" : "bg-nx-card"}>
                          <th className="w-40 px-3.5 py-2.5 font-semibold text-nx-fg">{req.label}</th>
                          <td className="px-3.5 py-2.5 text-nx-soft">{req.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {integrations.length > 0 ? (
              <div className={requirements.length > 0 ? "lg:col-span-5 space-y-3" : "lg:col-span-12 space-y-3"}>
                <h3 style={{ fontFamily: tokens.typography.headingFont }} className="text-base font-bold text-nx-fg">
                  Uyumlu Entegrasyonlar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {integrations.map((intg, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800"
                    >
                      <span>✓</span>
                      <span>{intg}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {lastVerified ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nx-line pt-4 text-[11px] text-nx-muted">
            <span>Teknik özellikler ve sürüm bilgisi son kontrol: <strong>{lastVerified}</strong></span>
            {seller ? <span>{seller}</span> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
