import React from "react";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { discountLabel } from "./campaign-showcase";
import { ResponsiveImage } from "./responsive-image";

/**
 * "İletişim formu + ilgili kampanya" modeli (`contact_campaign`): sol sütunda sayfadaki çözüme bağlı yayındaki kampanya kartı,
 * sağda bağlı form. Sayfa yalnızca modeli ekler (`formId`, `productUrl`); kart ve form buradan gelir, tasarım tek yerdedir.
 * Eşleşen kampanya yoksa form tek başına ortalanır.
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
    return preview ? <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-xs text-slate-600">İletişim formu + kampanya modeli: bir form seçin.</div> : null;
  }
  const panel = (
    <div
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="flex h-full flex-col justify-center space-y-3 border bg-nx-card p-5 shadow-sm sm:p-6 [&_form]:border-0 [&_form]:bg-transparent [&_form]:p-0"
    >
      {heading ? (
        <h3 style={{ fontFamily: tokens.typography.headingFont, color: tokens.colors.secondary }} className="flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden="true" style={{ backgroundColor: tokens.colors.primary }} className="inline-block h-5 w-1.5 rounded-full" />
          {heading}
        </h3>
      ) : null}
      {note ? <p className="text-sm text-nx-soft">{note}</p> : null}
      {form}
    </div>
  );
  if (!item) return <section aria-label={heading || "İletişim"} className="mx-auto w-full max-w-3xl">{panel}</section>;
  return (
    <section aria-label={heading || "İletişim ve kampanya"} className="grid items-stretch gap-6 md:grid-cols-2 md:gap-8">
      <article
        style={{ borderColor: tokens.colors.border, borderRadius: tokens.geometry.borderRadius }}
        className="group flex h-full flex-col overflow-hidden border bg-nx-card shadow-sm transition hover:shadow-md"
      >
        <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden bg-nx-subtle">
          {item.image ? (
            <a href={item.url} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
              <ResponsiveImage
                src={item.image}
                alt={item.imageAlt || item.title}
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
              />
            </a>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-black text-muted-foreground/20">
              KAMPANYA
            </div>
          )}
          {(item.discount || item.badge) && (
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
              {item.discount && (
                <span style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }} className="rounded-full px-2.5 py-0.5 text-[11px] font-black shadow-sm">
                  {discountLabel(item.discount)}
                </span>
              )}
              {item.badge && (
                <span style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground }} className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          style={{ borderColor: tokens.colors.border }}
          className="flex shrink-0 items-center justify-between gap-3 border-t p-4 sm:px-5"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div style={{ color: tokens.colors.primary }} className="inline-flex items-center gap-1 text-[11px] font-bold">
              <span aria-hidden="true">⏳</span>
              <span>
                {item.daysRemaining != null
                  ? `Bitmesine ${item.daysRemaining} gün kaldı`
                  : "Süresiz Fırsat"}
              </span>
            </div>
            <h3 style={{ fontFamily: tokens.typography.headingFont }} className="line-clamp-2 text-base font-bold leading-snug">
              <a href={item.url} className="hover:underline">
                {item.title}
              </a>
            </h3>
          </div>

          <a
            href={item.url}
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.primaryForeground,
              borderRadius: tokens.geometry.borderRadius,
            }}
            className="inline-flex shrink-0 items-center justify-center px-4 py-2 text-xs font-bold shadow-xs transition hover:opacity-95"
          >
            Detay
          </a>
        </div>
      </article>
      {panel}
    </section>
  );
}
