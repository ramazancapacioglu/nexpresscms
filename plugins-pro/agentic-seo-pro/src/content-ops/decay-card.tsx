import React from "react";
import { getIntelRepository, getScopedRepository } from "@nexpress/database";
import { rankingDrops } from "./intel";

export interface DecayingContent {
  id: string;
  title: string;
  slug: string;
  daysSinceUpdate: number;
  decayLevel: "critical" | "warning" | "fresh";
  wordCount: number;
  hasTldr: boolean;
}

export async function DecayCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const contents = await repo.listContents({ locale: "tr" });
  const published = contents.filter((c) => c.status === "published");

  const now = Date.now();
  const decaying: DecayingContent[] = published
    .map((c) => {
      const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : now;
      const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
      const text = JSON.stringify(c.blocks || "");
      const wordCount = text.split(/\s+/).length;
      const hasTldr = Boolean(c.tldr && c.tldr.trim().length >= 20);

      let decayLevel: "critical" | "warning" | "fresh" = "fresh";
      if (days >= 180 || !hasTldr) decayLevel = "critical";
      else if (days >= 90 || wordCount < 150) decayLevel = "warning";

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        daysSinceUpdate: days,
        decayLevel,
        wordCount,
        hasTldr,
      };
    })
    .filter((c) => c.decayLevel !== "fresh")
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
    .slice(0, 6);

  const criticalCount = decaying.filter((d) => d.decayLevel === "critical").length;
  const drops = rankingDrops(await getIntelRepository(siteId).listSignals()).slice(0, 6);

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">İçerik Erimesi & Tazelik Risk Raporu</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              criticalCount > 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600"
            }`}>
              {criticalCount > 0 ? `${criticalCount} İçerik Risk Altında` : "Tüm İçerikler Güncel"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            90 günden uzun süredir güncellenmeyen veya TL;DR özeti eksik olan sayfaların arama sıralaması erime riski taşır.
          </p>
        </div>

        <div className="text-xs text-nx-soft">
          Toplam İncelenen: <strong className="text-nx-fg">{published.length}</strong> Sayfa
        </div>
      </div>

      {drops.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-nx-soft">Sırası düşen sorgular</p>
          {drops.map((row) => (
            <div key={row.keyword} className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle px-3 py-2 text-xs">
              <span className="truncate font-medium text-nx-fg">{row.keyword}</span>
              <span className="shrink-0 text-red-600 dark:text-red-400">{((row.prevPosition10 ?? 0) / 10).toFixed(1)} → {(row.position10 / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      {decaying.length === 0 ? (
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-4 text-center text-xs text-nx-soft">
          Tebrikler! Sitenizdeki tüm içerikler son 90 gün içinde güncellenmiş ve yeterli içerik derinliğine sahip.
        </div>
      ) : (
        <div className="space-y-2">
          {decaying.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle p-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                <div className="font-medium text-nx-fg truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-nx-soft">
                  <span>/{item.slug}</span>
                  <span>•</span>
                  <span>{item.wordCount} kelime</span>
                  {!item.hasTldr && <span className="text-amber-600 dark:text-amber-400 font-semibold">• TL;DR Eksik</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  item.decayLevel === "critical"
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}>
                  {item.daysSinceUpdate} gün önce güncellendi
                </span>

                <a
                  href={`/admin/contents?id=${item.id}`}
                  className="rounded border border-nx-line bg-nx-card px-2.5 py-1 text-xs font-semibold text-nx-fg hover:bg-nx-line transition"
                >
                  Yenile →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

