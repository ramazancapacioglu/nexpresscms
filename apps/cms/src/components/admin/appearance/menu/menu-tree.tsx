"use client";

import React, { useState } from "react";
import type { MenuLookup, NavigationMenuItem, NavigationLink } from "@nexpress/core";
import { resolveMenuHref } from "@nexpress/core";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { KIND_LABEL } from "./menu-sources";

interface Props {
  items: NavigationMenuItem[];
  selectedId: string | null;
  lookup: MenuLookup;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}

const btn = "inline-flex h-7 w-7 items-center justify-center rounded text-[#454B55] hover:bg-[#E9ECF1] disabled:opacity-30 dark:text-[#B4BAC5] dark:hover:bg-[#22252D]";

/** Menü ağacı: sürükle-bırak (HTML5 Drag & Drop) veya her satırda yukarı/aşağı, girinti/girinti azalt butonları ile kolay sıralama. */
export function MenuTree(props: Props) {
  const { items, selectedId, lookup, onSelect, onMove, onIndent, onOutdent, onRemove, onReorder } = props;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const render = (list: NavigationLink[], depth: number): React.ReactNode => (
    <ul className={depth > 1 ? "border-l border-[#D5D8DE] pl-3 dark:border-[#2E333D]" : ""}>
      {list.map((n, i) => {
        const resolved = resolveMenuHref(n.source, n.href, lookup);
        const broken = resolved === null;
        const active = n.id === selectedId;
        const isDragging = n.id === draggingId;
        const isOver = n.id === overId && draggingId !== n.id;

        return (
          <li
            key={n.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", n.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggingId(n.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overId !== n.id) setOverId(n.id);
            }}
            onDragLeave={() => {
              if (overId === n.id) setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
              if (sourceId && onReorder) {
                onReorder(sourceId, n.id);
              }
              setDraggingId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            className={`transition-all ${isDragging ? "opacity-40" : ""} ${isOver ? "rounded-lg ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/30" : ""}`}
          >
            <div className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 ${active ? "bg-[#266DF0]/10 ring-1 ring-[#266DF0]/40" : "hover:bg-[#F1F3F6] dark:hover:bg-[#1C1F26]"}`}>
              {/* Sürükle Bırak Tutamacı */}
              <div
                title="Sıralamak için sürükleyip bırakın"
                className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/60 hover:text-foreground shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </div>

              <button type="button" onClick={() => onSelect(n.id)} aria-current={active ? "true" : undefined} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">{n.label}</span>
                  <span className="shrink-0 rounded bg-[#E9ECF1] px-1.5 py-px text-[10px] font-semibold uppercase text-[#3F4650] dark:bg-[#22252D] dark:text-[#C5CAD3]">{KIND_LABEL[n.source?.kind ?? "custom"]}</span>
                  {"megaMenu" in n && (n as NavigationMenuItem).megaMenu?.enabled ? <span className="shrink-0 rounded bg-[#266DF0] px-1.5 py-px text-[10px] font-semibold text-white">MEGA</span> : null}
                  {broken ? <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-red-600"><AlertTriangle className="h-3 w-3" aria-hidden="true" /> Hedef yok / yayında değil — gizlenir</span> : null}
                </span>
                <span className="block truncate font-mono text-[11px] text-[#454B55] dark:text-[#B4BAC5]">{resolved ?? n.href}</span>
              </button>

              <div className="flex shrink-0 items-center opacity-70 group-hover:opacity-100 group-focus-within:opacity-100">
                <button type="button" className={btn} aria-label={`${n.label} yukarı taşı`} disabled={i === 0} onClick={() => onMove(n.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className={btn} aria-label={`${n.label} aşağı taşı`} disabled={i === list.length - 1} onClick={() => onMove(n.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" className={btn} aria-label={`${n.label} bir düzey içeri al (alt öğe yap)`} disabled={i === 0 || depth >= 3} onClick={() => onIndent(n.id)}><ChevronRight className="h-3.5 w-3.5" /></button>
                <button type="button" className={btn} aria-label={`${n.label} bir düzey dışarı al`} disabled={depth === 1} onClick={() => onOutdent(n.id)}><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" className={`${btn} hover:!text-red-600`} aria-label={`${n.label} sil`} onClick={() => onRemove(n.id)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {n.children?.length ? render(n.children, depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );
  if (items.length === 0) return <p className="px-4 py-10 text-center text-[13px] text-[#454B55] dark:text-[#B4BAC5]">Menü boş. Soldaki panelden sayfa, yazı, kategori veya özel bağlantı ekleyin.</p>;
  return <div className="p-2">{render(items, 1)}</div>;
}
