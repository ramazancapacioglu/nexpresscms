import React from "react";
import { getScopedRepository } from "@nexpress/database";
import { resolvePublishing } from "@nexpress/core";
import { analyzeContentGaps, GAP_LABEL, GAP_LIMITS, type GapKind } from "./gaps";

/** Panel kartı: yayındaki içeriklerin açıkları (TL;DR, bayatlık, öksüz, ince, kopya). Yalnızca gerçek içerik verisi. */
export async function GapCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const contents = await repo.listContents({ locale, status: "published" });
  const visible = contents.filter((c) => resolvePublishing(c.schemaAttributes).visibility === "public" && c.type !== "product");
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const report = analyzeContentGaps(
    visible.map((c) => ({ id: c.contentId, title: c.title, slug: c.slug, type: c.type, tldr: c.tldr, markdown: c.markdownCache ?? "", updatedAt: new Date(c.updatedAt), isHome: c.slug === "ana-sayfa" })),
    new Date(),
    base
  );
  const kinds = Object.keys(GAP_LABEL) as GapKind[];
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-4 py-2.5">
        <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">İçerik açığı analizi</span>
        <span className="text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">{visible.length} yayındaki içerik • {report.items.length} içerikte açık</span>
      </div>
      <ul className="flex flex-wrap gap-2 px-4 py-2.5 text-[11px]">
        {kinds.map((k) => (
          <li key={k} className={`rounded border px-2 py-0.5 ${report.counts[k] ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300" : "border-[#E6E7EA] dark:border-[#23262E] text-[#5C5F66] dark:text-[#9CA3AF]"}`}>{GAP_LABEL[k]}: {report.counts[k]}</li>
        ))}
      </ul>
      {report.items.length === 0 ? (
        <p className="px-4 pb-3 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">Ölçülen açık yok (TL;DR ≥ {GAP_LIMITS.tldrMin} karakter, {GAP_LIMITS.staleDays} günden yeni, iç bağlantı alıyor, ≥ {GAP_LIMITS.thinWords} sözcük, kopya değil).</p>
      ) : (
        <ul className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] border-t border-[#E6E7EA] dark:border-[#23262E] text-[12px]">
          {report.items.slice(0, 8).map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <a href={`/admin/contents?id=${encodeURIComponent(g.id)}`} className="truncate font-medium text-[#14151A] dark:text-[#F3F4F6] hover:underline">{g.title}</a>
              <span className="shrink-0 text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">{g.kinds.map((k) => GAP_LABEL[k]).join(" • ")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
