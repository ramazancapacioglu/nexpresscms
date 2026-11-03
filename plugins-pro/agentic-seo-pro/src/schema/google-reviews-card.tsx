import React from "react";
import { getPluginSettings } from "@nexpress/core";
import { DEFAULT_GOOGLE_REVIEWS, type GoogleReviewsSettings } from "./google-reviews";

export async function GoogleReviewsCard({ siteId }: { siteId: string }) {
  const settings = ((await getPluginSettings(siteId, "@nexpress-pro/agentic-seo")) as GoogleReviewsSettings) ?? {};
  const rating = Number(settings.googleRating ?? 4.9);
  const count = Number(settings.googleReviewCount ?? 48);
  const reviews = settings.reviews && settings.reviews.length > 0 ? settings.reviews : DEFAULT_GOOGLE_REVIEWS;

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Google Haritalar & Yorum Entegrasyonu</h4>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Şemaya Bağlı
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            LocalBusiness şemasına bağlı doğrulanmış müşteri değerlendirmeleri ve Google Yıldız Rozeti.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
          <span className="text-amber-500 font-bold text-sm">★ {rating}</span>
          <span className="text-xs text-nx-soft">({count} değerlendirme)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {reviews.slice(0, 3).map((r, i) => (
          <div key={i} className="rounded-lg border border-nx-line bg-nx-subtle p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-nx-fg">{r.author}</span>
              <span className="text-amber-500 font-mono">{"★".repeat(r.rating)}</span>
            </div>
            <p className="text-[11px] text-nx-soft line-clamp-2 italic">"{r.text}"</p>
            <div className="text-[10px] text-nx-muted text-right">{r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

