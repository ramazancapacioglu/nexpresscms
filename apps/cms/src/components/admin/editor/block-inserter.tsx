"use client";

import { useMemo, useState } from "react";
import { BLOCK_CATALOG, BLOCK_CATEGORIES, ROW_TEMPLATES, buildRow, searchCatalog } from "@nexpress/editor";
import type { BlockNode } from "@nexpress/core";
import { GripVertical, Plus, Search } from "lucide-react";
import { useEditorDnd } from "./dnd";

type Insert = (block: BlockNode, parentId?: string | null) => void;

function Tile({ label, hint, block, onInsert }: { label: string; hint: string; block: BlockNode; onInsert: Insert }) {
  const { begin } = useEditorDnd();
  return (
    <button
      type="button"
      draggable
      title={`${hint} — tıklayın ya da tuvale sürükleyin`}
      onClick={() => onInsert(block)}
      onDragStart={(e) => begin(e, { kind: "new", block }, e.currentTarget)}
      className="group flex cursor-grab items-center gap-1.5 rounded-lg border border-border bg-background p-2 text-left text-[11px] font-medium transition hover:border-blue-500 hover:bg-blue-500/5 active:cursor-grabbing"
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        <span className="block truncate text-[10px] font-normal text-[#5F6570] dark:text-[#8C9099]">{hint}</span>
      </span>
      <Plus className="ml-auto h-3 w-3 shrink-0 text-blue-600 opacity-0 group-hover:opacity-100" aria-hidden />
    </button>
  );
}

/** "+ Blok & Satır": aranabilir, gruplu kitaplık. Her öğe tıklanınca eklenir, sürüklenince tuvale/gezgine bırakılır. */
export function BlockInserter({ onInsert, targetLabel }: { onInsert: Insert; targetLabel: string | null }) {
  const [query, setQuery] = useState("");
  const found = useMemo(() => searchCatalog(query), [query]);
  const showRows = !query.trim() || "satır sütun düzen row".includes(query.trim().toLowerCase());
  return (
    <div className="space-y-3">
      {targetLabel && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-[11px] text-blue-700 dark:text-blue-300">
          Seçili hedef: <strong>{targetLabel}</strong> içine eklenecek.
        </div>
      )}
      <label className="relative block">
        <span className="sr-only">Blok ara</span>
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${BLOCK_CATALOG.length} blok içinde ara…`}
          className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs"
        />
      </label>

      {showRows && (
        <section>
          <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">Satır ve sütun düzenleri</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {ROW_TEMPLATES.map((t) => (
              <Tile key={t.id} label={t.label} hint={t.hint} block={buildRow(t.layout, t.widths, t.opts)} onInsert={(b) => onInsert(b, null)} />
            ))}
          </div>
        </section>
      )}

      {BLOCK_CATEGORIES.map((cat) => {
        const list = found.filter((i) => i.category === cat.id);
        if (!list.length) return null;
        return (
          <section key={cat.id}>
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">{cat.label}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {list.map((i) => (
                <Tile key={i.id} label={i.label} hint={i.hint} block={i.block} onInsert={onInsert} />
              ))}
            </div>
          </section>
        );
      })}
      {query.trim() && found.length === 0 && !showRows && <p className="py-6 text-center text-xs text-muted-foreground">“{query}” için blok bulunamadı.</p>}
    </div>
  );
}


