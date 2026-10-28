"use client";

import { KNOWN_BOTS, type BotCategory, type BotDecision } from "@nexpress/core";

const CATEGORY_LABEL: Record<BotCategory, string> = {
  "ai-training": "Yapay zeka eğitimi",
  "ai-search": "Yapay zeka arama ve yanıt",
  search: "Arama motoru",
};

/** robots.txt bot politikası: botu tek tek izinli / engelli yapar. Engel yalnızca robots.txt kuralıdır; uymayan botu durdurmaz. */
export function BotPolicyPanel({
  policy,
  onChange,
}: {
  policy: Record<string, BotDecision>;
  onChange: (next: Record<string, BotDecision>) => void;
}) {
  const set = (ids: string[], decision: BotDecision) => {
    const next = { ...policy };
    for (const id of ids) {
      if (decision === "allow") delete next[id];
      else next[id] = "block";
    }
    onChange(next);
  };
  const categories = Object.keys(CATEGORY_LABEL) as BotCategory[];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">Bot politikası (robots.txt)</div>
        <button
          type="button"
          onClick={() => set(KNOWN_BOTS.filter((b) => b.category === "ai-training").map((b) => b.id), "block")}
          className="rounded border border-[#E6E7EA] dark:border-[#23262E] px-2 py-0.5 text-[11px] hover:bg-muted"
        >
          Eğitim botlarını kapat
        </button>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="space-y-1">
          <div className="text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">{CATEGORY_LABEL[cat]}</div>
          {KNOWN_BOTS.filter((b) => b.category === cat).map((b) => {
            const blocked = policy[b.id] === "block";
            return (
              <label key={b.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span>
                  {b.name} <span className="text-[#8C9099]">· {b.vendor}</span>
                </span>
                <select
                  value={blocked ? "block" : "allow"}
                  onChange={(e) => set([b.id], e.target.value as BotDecision)}
                  className="h-7 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-background px-1.5 text-[11px]"
                >
                  <option value="allow">İzinli</option>
                  <option value="block">Engelli</option>
                </select>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
