"use client";

import React, { useState } from "react";
import type { MenuLookup, NavigationMenuItem, NavigationLink } from "@nexpress/core";
import { resolveMenuHref } from "@nexpress/core";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { SvgIconPreview } from "@/components/admin/editor/icon-picker-modal";
import { KIND_LABEL } from "./menu-sources";

interface Props {
  items: NavigationMenuItem[];
  selectedId: string | null;
  checkedIds: string[];
  lookup: MenuLookup;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}

const btn = "inline-flex h-5 w-5 items-center justify-center rounded text-[#5C6370] hover:bg-[#E9ECF1] disabled:opacity-30 dark:text-[#9AA1AD] dark:hover:bg-[#22252D]";

/** Düz satırlar: küçük ad, küçük simge, girinti kutusu yok. Onay kutusu çoklu seçimdir. */
export function MenuTree(props: Props) {
  const { items, selectedId, checkedIds, lookup, onSelect, onToggle, onMove, onIndent, onOutdent, onRemove, onReorder } = props;
  const checked = new Set(checkedIds);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const render = (list: NavigationLink[], depth: number): React.ReactNode => (
    <ul className={depth > 1 ? "ml-3 border-l border-[#E6E8EC] pl-2 dark:border-[#2A2E36]" : ""}>
      {list.map((n, i) => {
        const resolved = resolveMenuHref(n.source, n.href, lookup);
        const broken = resolved === null;
        const active = n.id === selectedId;
        const isDragging = n.id === draggingId;
        const isOver = n.id === overId && draggingId !== n.id;
        const mega = "megaMenu" in n && (n as NavigationMenuItem).megaMenu?.enabled;

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
              if (sourceId && onReorder) onReorder(sourceId, n.id);
              setDraggingId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            className={`${isDragging ? "opacity-40" : ""} ${isOver ? "rounded-md bg-blue-50/70 dark:bg-blue-950/30" : ""}`}
          >
            <div className={`group flex items-center gap-1 rounded px-1 py-0.5 ${active ? "bg-[#266DF0]/10" : "hover:bg-[#F4F6F8] dark:hover:bg-[#1C1F26]"}`}>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0"
                checked={checked.has(n.id)}
                aria-label={`${n.label} seç`}
                onChange={() => onToggle(n.id)}
              />
              <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-[#8B919C]" aria-hidden="true" />
              <button type="button" onClick={() => onSelect(n.id)} aria-current={active ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                {n.icon ? <SvgIconPreview name={n.icon} size={12} /> : null}
                <span className="truncate text-[12px] font-medium leading-5">{n.label}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#6A7180]">{KIND_LABEL[n.source?.kind ?? "custom"]}</span>
                {mega ? <span className="shrink-0 text-[10px] font-semibold text-[#266DF0]">Mega</span> : null}
                <span className="min-w-0 truncate font-mono text-[10px] text-[#8B919C]">{resolved ?? n.href}</span>
                {broken ? <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" aria-label="Hedef yok" /> : null}
              </button>
              <div className="flex shrink-0 items-center opacity-60 group-hover:opacity-100 group-focus-within:opacity-100">
                <button type="button" className={btn} aria-label={`${n.label} yukarı taşı`} disabled={i === 0} onClick={() => onMove(n.id, -1)}><ArrowUp className="h-3 w-3" /></button>
                <button type="button" className={btn} aria-label={`${n.label} aşağı taşı`} disabled={i === list.length - 1} onClick={() => onMove(n.id, 1)}><ArrowDown className="h-3 w-3" /></button>
                <button type="button" className={btn} aria-label={`${n.label} alt öğe yap`} disabled={i === 0 || depth >= 3} onClick={() => onIndent(n.id)}><ChevronRight className="h-3 w-3" /></button>
                <button type="button" className={btn} aria-label={`${n.label} üst düzeye al`} disabled={depth === 1} onClick={() => onOutdent(n.id)}><ChevronLeft className="h-3 w-3" /></button>
                <button type="button" className={`${btn} hover:!text-red-600`} aria-label={`${n.label} sil`} onClick={() => onRemove(n.id)}><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            {n.children?.length ? render(n.children, depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );

  if (items.length === 0) return <p className="px-3 py-8 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">Bu menü boş. Soldan bağlantı ekleyin.</p>;
  return <div className="p-1.5">{render(items, 1)}</div>;
}
