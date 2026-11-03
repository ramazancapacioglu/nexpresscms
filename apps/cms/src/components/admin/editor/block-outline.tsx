"use client";

import React, { useState, type Dispatch, type SetStateAction } from "react";
import {
  duplicateBlockById,
  moveBlockStep,
  removeBlockById,
  summarizeBlockPreview,
  type BlockNode,
} from "@nexpress/core";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  GripVertical,
} from "lucide-react";
import { readPayload, useEditorDnd } from "./dnd";

export interface BlockOutlineProps {
  blocks: BlockNode[];
  selectedBlockId: string | null;
  setSelectedBlockId: Dispatch<SetStateAction<string | null>>;
  setRightTab: Dispatch<SetStateAction<"publish" | "seo" | "block" | "engage" | "template">>;
  setBlocks: (
    updater: BlockNode[] | ((prev: BlockNode[]) => BlockNode[]),
    recordHistory?: boolean
  ) => void;
}

/**
 * Sol "Yapı Gezgini" (blok ağacı):
 * - Kapsayıcı düğümleri (Bölüm, Satır, Sütun) daraltıp genişletebilir
 * - Her bloğun yanında içerik veya düzen özetini gösterir (`6+6`, `50%`, `"Başlık metni…"`)
 * - Sürükle-bırak, yukarı/aşağı taşıma, çoğaltma ve silme aksiyonlarını barındırır
 */
export function BlockOutline({
  blocks,
  selectedBlockId,
  setSelectedBlockId,
  setRightTab,
  setBlocks,
}: BlockOutlineProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (blocks.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Henüz blok yok. Sol sekmeden bir blok veya satır ekleyin.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>Sayfa Hiyerarşisi</span>
        {Object.keys(collapsed).length > 0 && (
          <button
            type="button"
            onClick={() => setCollapsed({})}
            className="font-semibold text-blue-600 hover:underline"
          >
            Tümünü Aç
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-xs">
        <OutlineLevel
          nodes={blocks}
          parentId={null}
          depth={0}
          selectedBlockId={selectedBlockId}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onSelect={(id) => {
            setSelectedBlockId(id);
            setRightTab("block");
          }}
          onMove={(id, dir) => setBlocks((prev) => moveBlockStep(prev, id, dir))}
          onDuplicate={(id) => setBlocks((prev) => duplicateBlockById(prev, id))}
          onRemove={(id) => {
            setBlocks((prev) => removeBlockById(prev, id));
            if (selectedBlockId === id) setSelectedBlockId(null);
          }}
        />
      </div>
    </div>
  );
}

interface LevelProps {
  nodes: BlockNode[];
  parentId: string | null;
  depth: number;
  selectedBlockId: string | null;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

function OutlineLevel(props: LevelProps) {
  return (
    <div className="space-y-0.5">
      {props.nodes.map((b, idx) => (
        <OutlineRow
          key={b.id}
          b={b}
          idx={idx}
          total={props.nodes.length}
          {...props}
        />
      ))}
    </div>
  );
}

function OutlineRow({
  b,
  idx,
  total,
  parentId,
  depth,
  selectedBlockId,
  collapsed,
  onToggleCollapse,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
}: LevelProps & { b: BlockNode; idx: number; total: number }) {
  const { begin, drop } = useEditorDnd();
  const [dropZone, setDropZone] = useState<"before" | "inside" | "after" | null>(null);
  const active = selectedBlockId === b.id;
  const hasChildren = Boolean(b.children && b.children.length > 0);
  const isContainer = b.type === "column" || b.type === "section";
  const isCollapsed = Boolean(collapsed[b.id]);
  const summary = summarizeBlockPreview(b);

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => begin(e, { kind: "move", id: b.id }, e.currentTarget)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          const rect = e.currentTarget.getBoundingClientRect();
          const relY = (e.clientY - rect.top) / Math.max(rect.height, 1);
          if (isContainer && relY > 0.25 && relY < 0.75) {
            setDropZone("inside");
          } else {
            setDropZone(relY < 0.5 ? "before" : "after");
          }
        }}
        onDragLeave={() => setDropZone(null)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const zone = dropZone ?? "after";
          setDropZone(null);
          const payload = readPayload(e);
          if (!payload) return;
          if (payload.kind === "move" && payload.id === b.id) return;
          if (zone === "inside" && isContainer) {
            drop(payload, b.id, (b.children ?? []).length);
          } else {
            drop(payload, parentId, zone === "before" ? idx : idx + 1);
          }
        }}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onClick={() => onSelect(b.id)}
        className={`group flex cursor-pointer items-center justify-between gap-1 rounded-md py-1.5 pr-1.5 transition-colors ${
          dropZone === "inside"
            ? "ring-2 ring-blue-500 bg-blue-500/15"
            : dropZone === "before"
              ? "border-t-2 border-blue-600"
              : dropZone === "after"
                ? "border-b-2 border-blue-600"
                : ""
        } ${
          active
            ? "bg-blue-600 text-white shadow-2xs"
            : "hover:bg-muted text-foreground"
        }`}
      >
        <div className="flex min-w-0 items-center gap-1">
          <span
            title="Sürükleyip yeniden sırala"
            className={`cursor-grab select-none active:cursor-grabbing ${
              active ? "text-white/80" : "text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            <GripVertical className="h-3 w-3" />
          </span>

          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(b.id);
              }}
              aria-label={isCollapsed ? "Alt blokları genişlet" : "Alt blokları daralt"}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-black/10"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          ) : (
            <span className="w-3 shrink-0" />
          )}

          <span className="shrink-0 text-[11px] font-semibold">
            {BLOCK_TYPE_LABELS[b.type] ?? b.type}
          </span>

          {summary && (
            <span
              className={`truncate text-[10px] ${
                active ? "text-white/90" : "text-muted-foreground"
              }`}
            >
              · {summary}
            </span>
          )}
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          className={`flex shrink-0 items-center gap-0.5 ${
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => onMove(b.id, "up")}
            aria-label="Yukarı taşı"
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10 disabled:opacity-30"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={idx === total - 1}
            onClick={() => onMove(b.id, "down")}
            aria-label="Aşağı taşı"
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10 disabled:opacity-30"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(b.id)}
            aria-label="Çoğalt"
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(b.id)}
            aria-label="Sil"
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-rose-500/20"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <OutlineLevel
          nodes={b.children!}
          parentId={b.id}
          depth={depth + 1}
          selectedBlockId={selectedBlockId}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onSelect={onSelect}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}
