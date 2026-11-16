import React from "react";
import type { DesignTokens, DynamicItem } from "@nexpress/core";
import { CampaignCard } from "./campaign-showcase";

/**
 * "İletişim formu + ilgili kampanya" modeli (`contact_campaign`): sol sütunda sayfadaki çözüme bağlı yayındaki kampanya kartı,
 * sağda bağlı form. Sayfa yalnızca modeli ekler (`formId`, `productUrl`); kart ve form buradan gelir, tasarım tek yerdedir.
 * Eşleşen kampanya yoksa form tek başına ortalanır (WordPress'te sol sütun boş kalıyordu).
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
      className="space-y-3 border bg-nx-card p-5 shadow-sm sm:p-6"
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
    <section aria-label={heading || "İletişim ve kampanya"} className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
      <div className="space-y-2">
        <CampaignCard item={item} tokens={tokens} showDiscountBadge showCountdown showGift showCta showWhatsapp={false} showPhone={false} />
      </div>
      {panel}
    </section>
  );
}
