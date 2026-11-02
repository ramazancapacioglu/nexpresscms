"use client";

import { useState, type DragEvent } from "react";
import { locateBlock, moveBlockStep, removeBlockById, type BlockNode, type FlatBlockEntry } from "@nexpress/core";
import { ArrowUp, Columns, GripVertical, Layers, Trash2, Type } from "lucide-react";
import { readPayload, useEditorDnd } from "./dnd";
import { BLOCK_TYPE_LABELS } from "./studio-model";

type Pos = "before" | "inside" | "after";
const isContainer = (t: string) => t === "section" || t === "column";

/** Yapı gezgini: satırlar sürüklenip aynı ya da başka bir kapsayıcıya bırakılabilir (üst/orta/alt bölge = önce/içine/sonra). */
export function BlockOutline({ blocks, outline, selectedId, onSelect, setBlocks }: {
  blocks: BlockNode[];
  outline: FlatBlockEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  setBlocks: (u: (prev: BlockNode[]) => BlockNode[]) => void;
}) {
  const { begin, drop } = useEditorDnd();
  const [hover, setHover] = useState<{ id: string; pos: Pos } | null>(null);

  const posOf = (e: DragEvent<HTMLElement>, type: string): Pos => {
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(1, r.height);
    if (isContainer(type)) return y < 0.25 ? "before" : y > 0.75 ? "after" : "inside";
    return y < 0.5 ? "before" : "after";
  };

  const target = (entry: FlatBlockEntry, pos: Pos): { parentId: string | null; index: number } | null => {
    if (pos === "inside") return { parentId: entry.block.id, index: entry.block.children?.length ?? 0 };
    const loc = locateBlock(blocks, entry.block.id);
    return loc ? { parentId: loc.parentId, index: loc.index + (pos === "after" ? 1 : 0) } : null;
  };

  return (
    <div className="space-y-0.5" onDragLeave={() => setHover(null)}>
      {outline.map((entry) => {
        const { block, depth } = entry;
        const active = selectedId === block.id;
        const mark = hover?.id === block.id ? hover.pos : null;
        return (
          <div
            key={block.id}
            draggable={block.type !== "column"}
            onDragStart={(e) => begin(e, { kind: "move", id: block.id }, e.currentTarget)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const pos = posOf(e, block.type);
              if (hover?.id !== block.id || hover.pos !== pos) setHover({ id: block.id, pos });
            }}
            onDrop={(e) => {
              e.preventDefault();
              const payload = readPayload(e);
              const t = payload && target(entry, posOf(e, block.type));
              setHover(null);
              if (payload && t) drop(payload, t.parentId, t.index);
            }}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            onClick={() => onSelect(block.id)}
            className={`group relative flex cursor-pointer items-center justify-between rounded-md py-1.5 pr-2 text-xs transition ${
              active ? "bg-blue-600 font-semibold text-white" : "text-foreground hover:bg-muted"
            } ${mark === "inside" ? "ring-2 ring-blue-500" : ""}`}
          >
            {mark === "before" && <span className="pointer-events-none absolute inset-x-1 -top-px h-0.5 rounded bg-blue-500" />}
            {mark === "after" && <span className="pointer-events-none absolute inset-x-1 -bottom-px h-0.5 rounded bg-blue-500" />}
            <div className="flex items-center gap-1 truncate">
              <GripVertical className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
              {block.type === "columns" ? <Columns className="h-3 w-3 shrink-0" /> : isContainer(block.type) ? <Layers className="h-3 w-3 shrink-0" /> : <Type className="h-3 w-3 shrink-0 opacity-70" />}
              <span className="truncate text-[11px]">{BLOCK_TYPE_LABELS[block.type] ?? block.type}</span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={(e) => { e.stopPropagation(); setBlocks((prev) => moveBlockStep(prev, block.id, "up")); }} aria-label={`${block.type} bloğunu yukarı taşı`} className="p-0.5 hover:opacity-80">
                <ArrowUp className="h-2.5 w-2.5" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setBlocks((prev) => removeBlockById(prev, block.id)); }} aria-label={`${block.type} bloğunu sil`} className="p-0.5 hover:opacity-80">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
