import React from "react";
import { getScopedRepository } from "@nexpress/database";
import { resolvePublishing } from "@nexpress/core";
import { findStale, STALE_AFTER_DAYS } from "./freshness";

/** Panel kartı: 6+ aydır güncellenmeyen yayındaki içerikler. */
export async function FreshnessCard({ siteId }: { siteId: string }) {
  const contents = await getScopedRepository(siteId).listContents({ locale: "tr", status: "published" });
  const visible = contents.filter((c) => resolvePublishing(c.schemaAttributes).visibility === "public");
  const stale = findStale(
    visible.map((c) => ({ id: c.contentId, title: c.title, slug: c.slug, type: c.type, updatedAt: new Date(c.updatedAt) })),
    new Date()
  );
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C]">
      <div className="flex items-center justify-between border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-4 py-2.5">
        <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">İçerik tazeliği</span>
        <span className="text-[11px] text-[#8C9099]">
          {stale.length === 0 ? "Güncel" : `${stale.length} içerik ${STALE_AFTER_DAYS}+ gündür güncellenmedi`}
        </span>
      </div>
      {stale.length === 0 ? (
        <p className="px-4 py-3 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">Yayındaki tüm içerikler son {STALE_AFTER_DAYS} gün içinde güncellenmiş.</p>
      ) : (
        <ul className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
          {stale.slice(0, 6).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <a href={`/admin/contents?id=${encodeURIComponent(s.id)}`} className="truncate font-medium text-[#14151A] dark:text-[#F3F4F6] hover:underline">
                {s.title}
              </a>
              <span className="shrink-0 font-mono text-[11px] text-amber-700 dark:text-amber-300">{s.ageDays} gün</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
