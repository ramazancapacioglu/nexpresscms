import React from "react";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { discountLabel } from "./campaign-showcase";
import { ResponsiveImage } from "./responsive-image";

/**
 * "İletişim formu + ilgili kampanya" modeli (`contact_campaign`):
 * Site genişliğiyle hizalı, kompakt ve yüksek kontrastlı 2 sütunlu tasarım:
 * sol sütunda görsel üzeri rozetli kampanya kartı, sağ sütunda okunaklı beyaz zeminli teklif/iletişim formu.
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
    <div className="flex h-full flex-col justify-center space-y-3 bg-white p-5 text-slate-900 sm:p-6 [&_form]:border-0 [&_form]:bg-transparent [&_form]:p-0 [&_label]:text-slate-800 [&_input]:border-slate-300 [&_input]:bg-white [&_input]:text-slate-900 [&_input::placeholder]:text-slate-400 [&_select]:border-slate-300 [&_select]:bg-white [&_select]:text-slate-900 [&_textarea]:border-slate-300 [&_textarea]:bg-white [&_textarea]:text-slate-900 [&_textarea::placeholder]:text-slate-400">
      <div className="space-y-1">
        <span
          style={{ color: tokens.colors.primary }}
          className="inline-block text-[11px] font-bold uppercase tracking-wider"
        >
          Hızlı Teklif &amp; Danışmanlık
        </span>
        {heading ? (
          <h3
            style={{ fontFamily: tokens.typography.headingFont }}
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-950"
          >
            {heading}
          </h3>
        ) : null}
        {note ? <p className="text-xs leading-relaxed text-slate-600">{note}</p> : null}
      </div>
      {form}
    </div>
  );

  if (!item) {
    return (
      <section
        aria-label={heading || "İletişim"}
        style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
        className="w-full overflow-hidden border bg-white text-slate-900 shadow-sm"
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
      className="w-full overflow-hidden border bg-white text-slate-900 shadow-sm"
    >
      <div className="grid items-stretch md:grid-cols-12">
        {/* Sol: Kompakt Kampanya Görseli (etiketler görsel üzerinde) + koyu alt şerit */}
        <article className="group flex flex-col justify-between bg-slate-950 text-white md:col-span-5">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900 min-h-[220px]">
            {item.image ? (
              <a href={item.url} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
                <ResponsiveImage
                  src={item.image}
                  alt={item.imageAlt || item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </a>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/15">
                KAMPANYA
              </div>
            )}

            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
              {item.discount ? (
                <span
                  style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-sm"
                >
                  {discountLabel(item.discount)}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-950/85 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shadow-sm backdrop-blur-xs">
                {item.daysRemaining != null ? `Son ${item.daysRemaining} Gün` : "Aktif Fırsat"}
              </span>
              {item.badge ? (
                <span className="rounded-full bg-slate-950/80 border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950 px-4 py-3.5">
            <h3
              style={{ fontFamily: tokens.typography.headingFont }}
              className="line-clamp-2 text-sm sm:text-base font-bold leading-snug text-white"
            >
              <a href={item.url} className="hover:underline">
                {item.title}
              </a>
            </h3>
            <a
              href={item.url}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.primaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1 px-3.5 py-2 text-xs font-semibold shadow-xs transition hover:opacity-95 whitespace-nowrap"
            >
              Detay →
            </a>
          </div>
        </article>

        {/* Sağ: Yüksek Kontrastlı Teklif / İletişim Formu */}
        <div className="border-t border-slate-200 md:col-span-7 md:border-l md:border-t-0">
          {formPanel}
        </div>
      </div>
    </section>
  );
}
