import React from "react";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { discountLabel } from "./campaign-showcase";
import { ResponsiveImage } from "./responsive-image";

/**
 * "İletişim formu + ilgili kampanya" modeli (`contact_campaign`):
 * `software_product_card` ile aynı tasarım dilinde koyu vitrin kampanya sütunu + ferah teklif/iletişim formu.
 * Eşleşen kampanya yoksa form şık üst bantla tek başına ortalanır.
 */
export function ContactCampaignView({
  props,
  item,
  tokens,
  form,
  preview = false,
}: {
  props?: Record<string, unknown>;
  item?: DynamicItem | null;
  tokens: DesignTokens;
  /** Hazır çizilmiş form (`form_block`); yoksa (silinmiş form) model hiçbir şey çizmez. */
  form: React.ReactNode;
  preview?: boolean;
}) {
  const p = props ?? {};
  const heading = typeof p.heading === "string" ? p.heading.trim() : "";
  const note = typeof p.note === "string" ? p.note.trim() : "";
  if (!form) {
    return preview ? (
      <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-xs text-slate-600">
        İletişim formu + kampanya modeli: bir form seçin.
      </div>
    ) : null;
  }

  const formPanel = (
    <div className="flex h-full flex-col justify-center space-y-4 bg-nx-card p-6 sm:p-8 [&_form]:border-0 [&_form]:bg-transparent [&_form]:p-0">
      <div className="space-y-1.5">
        <span
          style={{ color: tokens.colors.primary }}
          className="inline-block text-[11px] font-bold uppercase tracking-wider"
        >
          Hızlı Teklif &amp; Danışmanlık
        </span>
        {heading ? (
          <h3
            style={{ fontFamily: tokens.typography.headingFont }}
            className="text-xl sm:text-2xl font-bold tracking-tight text-nx-fg"
          >
            {heading}
          </h3>
        ) : null}
        {note ? <p className="text-xs sm:text-sm leading-relaxed text-nx-soft">{note}</p> : null}
      </div>
      {form}
    </div>
  );

  if (!item) {
    return (
      <section
        aria-label={heading || "İletişim"}
        style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
        className="mx-auto w-full max-w-3xl overflow-hidden border bg-nx-card shadow-sm"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-slate-950 via-blue-700 to-emerald-500" />
        {formPanel}
      </section>
    );
  }

  return (
    <section
      aria-label={heading || "İletişim ve kampanya"}
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="overflow-hidden border bg-nx-card shadow-sm"
    >
      <div className="grid items-stretch lg:grid-cols-12">
        {/* Sol: Koyu Vitrin Kampanya Kartı (`software_product_card` diliyle uyumlu) */}
        <article className="group flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white lg:col-span-5">
          <div className="space-y-4 p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-emerald-300">
                {item.daysRemaining != null ? `Son ${item.daysRemaining} Gün` : "Aktif Fırsat"}
              </span>
              {item.discount ? (
                <span
                  style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
                  className="rounded-full px-2.5 py-0.5 font-bold"
                >
                  {discountLabel(item.discount)}
                </span>
              ) : null}
              {item.badge ? (
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-slate-200">
                  {item.badge}
                </span>
              ) : null}
            </div>

            <h3
              style={{ fontFamily: tokens.typography.headingFont }}
              className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-white"
            >
              <a href={item.url} className="hover:underline">
                {item.title}
              </a>
            </h3>

            {item.image ? (
              <a
                href={item.url}
                tabIndex={-1}
                aria-hidden="true"
                className="block overflow-hidden rounded-xl border border-white/15 bg-white/5 p-2"
              >
                <ResponsiveImage
                  src={item.image}
                  alt={item.imageAlt || item.title}
                  className="h-48 sm:h-56 w-full rounded-lg object-contain transition duration-300 group-hover:scale-[1.02]"
                />
              </a>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-6 py-4">
            <span className="text-xs text-slate-300">
              {item.daysRemaining != null
                ? `Kampanya bitimine ${item.daysRemaining} gün kaldı`
                : "Yetkili İzmir Ana Bayi güvencesiyle"}
            </span>
            <a
              href={item.url}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-xs transition hover:opacity-95"
            >
              Detayları Gör →
            </a>
          </div>
        </article>

        {/* Sağ: Teklif / İletişim Formu */}
        <div className="border-t border-nx-line lg:col-span-7 lg:border-l lg:border-t-0">
          {formPanel}
        </div>
      </div>
    </section>
  );
}
