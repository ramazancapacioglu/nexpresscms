"use client";

import React from "react";
import { Plus, ListTree, X } from "lucide-react";
import { BlockInserter } from "./editor/block-inserter";
import { BlockOutline } from "./editor/block-outline";
import type { DualModeEditorState } from "./use-dual-mode-editor";

export function DualModeEditorLeftPanel({ s }: { s: DualModeEditorState }) {
  if (!s.leftDrawerOpen) return null;

  return (
    <aside
      aria-label="Sol blok ekleyici ve yapı gezgini"
      className="flex w-72 shrink-0 flex-col border-r bg-card text-card-foreground select-none"
    >
      <div className="flex items-center justify-between gap-1 border-b px-2.5 py-2">
        <div className="flex flex-1 rounded-lg bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => s.setLeftTab("inserter")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
              s.leftTab === "inserter"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Blok & Satır
          </button>
          <button
            type="button"
            onClick={() => s.setLeftTab("tree")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
              s.leftTab === "tree"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListTree className="h-3.5 w-3.5" />
            Yapı ({s.flatBlockOutline.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => s.setLeftDrawerOpen(false)}
          aria-label="Sol paneli kapat"
          title="Kapat"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {s.leftTab === "inserter" && (
        <BlockInserter
          onInsert={(b) => s.handleInsertBlock(b)}
          onOpenLibrary={() => s.setLibraryOpen(true)}
        />
      )}

      {s.leftTab === "tree" && (
        <BlockOutline
          blocks={s.blocks}
          selectedBlockId={s.selectedBlockId}
          setSelectedBlockId={s.setSelectedBlockId}
          setRightTab={s.setRightTab}
          setBlocks={s.setBlocks}
        />
      )}
    </aside>
  );
}
