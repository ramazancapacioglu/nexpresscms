"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockNode } from "@nexpress/core";
import { blockChoices } from "./quick-insert";

/**
 * Eğik çizgi komutu: boş paragrafa `/` yazınca blok menüsü açılır; `/sss`, `/fiyat` gibi yazdıkça süzülür.
 * Ok tuşları + Enter seçer (paragraf seçilen blokla DEĞİŞTİRİLİR), Esc kapatır. Klavye çerçeve belgesinde yakalanır.
 */
export function SlashMenu({ query, onPick }: { query: string; onPick: (block: BlockNode) => void }) {
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const results = blockChoices(query);
  const box = useRef<HTMLDivElement>(null);
  const open = dismissed !== query;

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) return;
    const doc = box.current?.ownerDocument ?? document;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActive((i) => (results.length ? (i + 1) % results.length : 0)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
      else if (e.key === "Enter" && results[active]) { e.preventDefault(); e.stopPropagation(); onPick(results[active]!.block); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setDismissed(query); }
    };
    doc.addEventListener("keydown", onKey, true);
    return () => doc.removeEventListener("keydown", onKey, true);
  }, [open, results, active, onPick, query]);

  if (!open) return null;
  return (
    <div ref={box} role="listbox" aria-label="Blok komutları" className="absolute left-2 top-full z-30 mt-1 w-72 rounded-lg border border-border bg-background p-1 text-foreground shadow-xl">
      {results.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground">“{query}” için blok yok</p>
      ) : (
        results.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => onPick(c.block)}
            className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs ${i === active ? "bg-blue-600 text-white" : "hover:bg-muted"}`}
          >
            <span className="font-medium">{c.label}</span>
            <span className={`truncate text-[10px] ${i === active ? "text-white/80" : "text-[#5F6570] dark:text-[#8C9099]"}`}>{c.hint}</span>
          </button>
        ))
      )}
    </div>
  );
}
