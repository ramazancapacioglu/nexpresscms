import { BLOCK_TYPE_LABELS } from "@/components/admin/editor/studio-model";
import { BlockInserter } from "@/components/admin/editor/block-inserter";
import { BlockOutline } from "@/components/admin/editor/block-outline";
import { PanelLeftClose, PanelLeftOpen, Redo2, Sparkles, Undo2 } from "lucide-react";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** 1. SOL PANEL: YAPI GEZGİNİ VE BLOK EKLEME */
export function DualModeEditorLeftPanel({ s }: { s: DualModeEditorState }) {
  const { title, leftDrawerOpen, setLeftDrawerOpen, leftTab, setLeftTab, setRightTab, selectedBlockId, setSelectedBlockId, setLibraryOpen, setBlocks, canUndo, canRedo, handleUndo, handleRedo, selectedBlock, totalWords, flatBlockOutline, handleInsertBlock } = s;
  return (
    <>
        {/* 1. SOL PANEL: YAPI GEZGİNİ VE BLOK EKLEME */}
        {leftDrawerOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-hidden="true" onClick={() => setLeftDrawerOpen(false)} />}
        <aside
          aria-label="Yapı paneli"
          className={`flex shrink-0 flex-col overflow-hidden border-r border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#111317] ${
            leftDrawerOpen ? "fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shadow-xl lg:static lg:z-auto lg:w-64 lg:max-w-none lg:shadow-none" : "w-11"
          }`}
        >
            <div className="flex items-center gap-1 border-b border-border px-1.5 py-1.5">
              <button
                type="button"
                onClick={() => setLeftDrawerOpen((open) => !open)}
                title={leftDrawerOpen ? "Yapı panelini gizle" : "Yapı panelini göster"}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                {leftDrawerOpen ? (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                )}
              </button>
              {leftDrawerOpen ? (
              <>
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className="inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Kütüphane
              </button>
              <div className="inline-flex h-7 shrink-0 items-center rounded-md border border-border bg-background">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  title="Geri al"
                  className="px-1.5 text-muted-foreground hover:text-foreground disabled:opacity-35"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  title="İleri al"
                  className="border-l border-border px-1.5 text-muted-foreground hover:text-foreground disabled:opacity-35"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              </div>
              </>
              ) : null}
            </div>
            {leftDrawerOpen ? (
            <>
            <div className="grid grid-cols-2 border-b border-border p-1 bg-muted/30 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLeftTab("tree")}
                className={`rounded py-1.5 transition ${
                  leftTab === "tree"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yapı Gezgini ({flatBlockOutline.length})
              </button>
              <button
                type="button"
                onClick={() => setLeftTab("inserter")}
                className={`rounded py-1.5 transition ${
                  leftTab === "inserter"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                + Blok & Satır
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
              {leftTab === "tree" ? (
                <>
                  <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Blok Hiyerarşisi</span>
                    <span>{totalWords} kelime</span>
                  </div>
                  <BlockOutline
                    blocks={s.blocks}
                    outline={flatBlockOutline}
                    selectedId={selectedBlockId}
                    onSelect={(id) => {
                      setSelectedBlockId(id);
                      setRightTab("block");
                    }}
                    setBlocks={setBlocks}
                  />
                </>
              ) : (
                <BlockInserter
                  onInsert={handleInsertBlock}
                  targetLabel={selectedBlock && (selectedBlock.type === "column" || selectedBlock.type === "section") ? (BLOCK_TYPE_LABELS[selectedBlock.type] ?? null) : null}
                />
              )}
            </div>
            </>
            ) : null}
          </aside>
    </>
  );
}
