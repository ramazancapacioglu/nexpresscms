"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import type { KindFilter, MediaQuery, ProblemFilter, SortKey } from "./media-filter";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const ctl = `h-8 rounded border ${border} bg-transparent px-2 text-[12px]`;

export function MediaToolbar({ query, onQuery, view, onView, showView = true }: { query: MediaQuery; onQuery: (q: MediaQuery) => void; view: "grid" | "list"; onView: (v: "grid" | "list") => void; showView?: boolean }) {
  return (
    <div role="search" className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1">
        <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-[#5F6570]" aria-hidden="true" />
        <input type="search" aria-label="Medyada ara" placeholder="Ad, başlık, alt metin ara…" value={query.search} onChange={(e) => onQuery({ ...query, search: e.target.value })} className={`${ctl} w-full pl-8`} />
      </div>
      <select aria-label="Tür" value={query.kind} onChange={(e) => onQuery({ ...query, kind: e.target.value as KindFilter })} className={ctl}>
        <option value="all">Tüm türler</option><option value="image">Görseller</option><option value="document">Belgeler</option><option value="video">Videolar</option><option value="audio">Sesler</option>
      </select>
      <select aria-label="Sorun süzgeci" value={query.problem} onChange={(e) => onQuery({ ...query, problem: e.target.value as ProblemFilter })} className={ctl}>
        <option value="all">Hepsi</option><option value="noalt">Alt metni eksik</option><option value="lowscore">SEO &lt; 80</option>
      </select>
      <select aria-label="Sırala" value={query.sort} onChange={(e) => onQuery({ ...query, sort: e.target.value as SortKey })} className={ctl}>
        <option value="newest">En yeni</option><option value="oldest">En eski</option><option value="name">Ada göre</option><option value="size">Boyuta göre</option><option value="score">SEO (düşükten)</option>
      </select>
      {showView && (
        <div role="group" aria-label="Görünüm" className={`inline-flex overflow-hidden rounded border ${border}`}>
          {([["grid", LayoutGrid, "Izgara"], ["list", List, "Liste"]] as const).map(([v, Icon, name]) => (
            <button key={v} type="button" aria-pressed={view === v} aria-label={name} onClick={() => onView(v)} className={`flex h-8 w-8 items-center justify-center ${view === v ? "bg-[#266DF0] text-white" : ""}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      )}
    </div>
  );
}
