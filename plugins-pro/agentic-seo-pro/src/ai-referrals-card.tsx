import React from "react";
import { AI_REFERRERS } from "@nexpress/core";
import { getAiReferralRepository } from "@nexpress/database";

const DAYS = 30;
const border = "border-[#E6E7EA] dark:border-[#23262E]";
const nameOf = (id: string) => AI_REFERRERS.find((s) => s.id === id)?.name ?? id;

/** Panel kartı: yapay zeka ürünlerinden gelen insan ziyaretleri (son 30 gün). */
export async function AiReferralsCard({ siteId }: { siteId: string }) {
  const s = await getAiReferralRepository(siteId).summary(DAYS);
  return (
    <div className={`mt-4 overflow-hidden rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
      <div className={`flex items-center justify-between border-b ${border} bg-[#FBFBFB] dark:bg-[#121317] px-4 py-2.5`}>
        <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">AI yönlendirme trafiği</span>
        <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Son {DAYS} gün · {s.total} ziyaret</span>
      </div>
      {s.total === 0 ? (
        <p className="px-4 py-3 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">
          Henüz yönlendirme yok. ChatGPT, Perplexity, Gemini, Copilot veya Claude üzerinden sitenize tıklayan ziyaretçiler burada görünür (Referer / utm_source ile; JS gerekmez).
        </p>
      ) : (
        <div className="grid gap-px bg-[#E6E7EA] dark:bg-[#23262E] md:grid-cols-2">
          <ul className="space-y-1.5 bg-white dark:bg-[#15171C] px-4 py-3 text-[12px]">
            {s.bySource.map((x) => (
              <li key={x.source} className="flex items-center justify-between">
                <span className="font-medium text-[#14151A] dark:text-[#F3F4F6]">{nameOf(x.source)}</span>
                <span className="font-mono tabular-nums text-[#5C5F66] dark:text-[#9CA3AF]">{x.hits}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5 bg-white dark:bg-[#15171C] px-4 py-3 text-[12px]">
            {s.topPaths.map((x) => (
              <li key={x.path} className="flex items-center justify-between gap-3">
                <code className="truncate text-[11px] text-[#266DF0]">{x.path}</code>
                <span className="font-mono tabular-nums text-[#5C5F66] dark:text-[#9CA3AF]">{x.hits}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className={`border-t ${border} px-4 py-2 text-[10px] text-[#5F6570] dark:text-[#8C9099]`}>Sayaçlar göstergedir: Referer başlığı tarayıcıdan gelir, bazı uygulamalar göndermez veya taklit edilebilir.</p>
    </div>
  );
}
