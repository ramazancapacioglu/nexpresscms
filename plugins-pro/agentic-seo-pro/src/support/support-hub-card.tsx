import React from "react";
import { getIntelRepository } from "@nexpress/database";

/** Cevapsız site aramaları. Yüzde ve örnek sorgu yok. */
export async function SupportHubCard({ siteId }: { siteId: string }) {
  const misses = (await getIntelRepository(siteId).listSignals())
    .filter((row) => row.source === "support")
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-3">
      <h4 className="text-sm font-semibold text-nx-fg">Destek araması</h4>
      <p className="text-xs text-nx-soft">
        Ziyaretçi aramasında sonuç çıkmayan sorgular. Oran uydurulmaz.
      </p>
      {misses.length === 0 ? (
        <p className="text-xs text-nx-soft">Cevapsız arama yok.</p>
      ) : (
        <ul className="space-y-1.5">
          {misses.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-nx-line bg-nx-subtle px-3 py-2 text-xs">
              <span className="truncate text-nx-fg">{row.keyword}</span>
              <span className="shrink-0 text-nx-soft">{row.impressions}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
