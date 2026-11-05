import React from "react";
import { getPluginSettings } from "@nexpress/core";
import type { GoogleReviewsSettings } from "./google-reviews";
import { ReviewsPullButton } from "./reviews-pull-button";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export async function GoogleReviewsCard({ siteId }: { siteId: string }) {
  const settings = ((await getPluginSettings(siteId, "@nexpress-pro/agentic-seo")) as GoogleReviewsSettings) ?? {};
  const rating = asNumber(settings.googleRating);
  const count = asNumber(settings.googleReviewCount);
  const reviews = Array.isArray(settings.reviews) ? settings.reviews : [];
  const ready = rating !== null || reviews.length > 0;

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Google yorumları</h4>
            <span className="rounded-full bg-nx-subtle px-2 py-0.5 text-[10px] font-semibold text-nx-soft">
              {ready ? "Ayarlardan" : "Kayıt yok"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Puan ve yorum ayara yazılır. Anahtar yoksa örnek isim eklenmez.
          </p>
        </div>
        {rating !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
            <span className="text-amber-500 font-bold text-sm">★ {rating}</span>
            <span className="text-xs text-nx-soft">({count ?? reviews.length} değerlendirme)</span>
          </div>
        )}
      </div>
      <ReviewsPullButton />
      {reviews.length === 0 ? (
        <p className="text-xs text-nx-soft">Kayıtlı yorum yok.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reviews.slice(0, 3).map((r, i) => (
            <div key={i} className="rounded-lg border border-nx-line bg-nx-subtle p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-nx-fg">{r.author}</span>
                <span className="text-amber-500 font-mono">{"★".repeat(Math.max(1, Math.min(5, r.rating)))}</span>
              </div>
              <p className="text-[11px] text-nx-soft line-clamp-2 italic">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
