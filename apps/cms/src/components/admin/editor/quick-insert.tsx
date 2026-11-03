"use client";

import { useEffect, useRef, useState } from "react";
import { BLOCK_CATALOG, ROW_TEMPLATES, buildRow, searchCatalog } from "@nexpress/editor";
import type { BlockNode } from "@nexpress/core";
import { Plus } from "lucide-react";

type Choice = { id: string; label: string; hint: string; block: BlockNode };
const ROWS: Choice[] = ROW_TEMPLATES.slice(0, 4).map((t) => ({ id: t.id, label: t.label, hint: "satır", block: buildRow(t.layout, t.widths, t.opts) }));

/** İki blok arasındaki "+" noktası: üzerine gelince belirir, tıklayınca arama kutulu hızlı ekleme açılır. */
export function InsertPoint({ onInsert }: { onInsert: (block: BlockNode) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const doc = box.current?.ownerDocument ?? document;
    doc.addEventListener("mousedown", away);
    return () => doc.removeEventListener("mousedown", away);
  }, [open]);
  const results: Choice[] = query.trim() ? searchCatalog(query).slice(0, 8).map((i) => ({ id: i.id, label: i.label, hint: i.hint, block: i.block })) : [...ROWS, ...BLOCK_CATALOG.slice(3, 7).map((i) => ({ id: i.id, label: i.label, hint: i.hint, block: i.block }))];
  const pick = (c: Choice) => { setOpen(false); setQuery(""); onInsert(c.block); };
  return (
    <div ref={box} className="group/ins relative flex h-3 items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <span aria-hidden className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-blue-500/0 transition-colors group-hover/ins:bg-blue-500/40" />
      <button
        type="button"
        aria-label="Buraya blok ekle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative z-10 h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 ${open ? "inline-flex" : "invisible group-hover/ins:visible"} group-hover/ins:inline-flex`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div role="dialog" aria-label="Blok ekle" className="absolute left-1/2 top-5 z-30 w-72 -translate-x-1/2 rounded-lg border border-border bg-background p-2 shadow-xl">
          <input
            autoFocus
            type="search"
            aria-label="Blok ara"
            value={query}
            placeholder="Blok ara… (ör. SSS, fiyat, galeri)"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter" && results[0]) pick(results[0]); }}
            className="mb-1.5 h-8 w-full rounded border border-border bg-background px-2 text-xs"
          />
          <ul className="max-h-64 overflow-y-auto">
            {results.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => pick(c)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted">
                  <span className="font-medium">{c.label}</span>
                  <span className="truncate text-[10px] text-[#5F6570] dark:text-[#8C9099]">{c.hint}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">Sonuç yok</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
