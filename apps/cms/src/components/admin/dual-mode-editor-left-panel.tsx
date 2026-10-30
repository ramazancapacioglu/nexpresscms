import { BLOCK_TYPE_LABELS, COLUMN_LAYOUT_PRESETS } from "@/components/admin/editor/studio-model";
import { moveBlockStep, removeBlockById } from "@nexpress/core";
import { ATOMIC_ELEMENTS_QUICK_BAR } from "@nexpress/editor";
import { ArrowUp, Columns, Layers, PanelLeftClose, PanelLeftOpen, Plus, Redo2, Sparkles, Trash2, Type, Undo2 } from "lucide-react";
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
                  <div className="space-y-0.5">
                    {flatBlockOutline.map(({ block, depth }) => {
                      const active = selectedBlockId === block.id;
                      return (
                        <div
                          key={block.id}
                          style={{ paddingLeft: `${depth * 12 + 6}px` }}
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setRightTab("block");
                          }}
                          className={`group flex items-center justify-between rounded-md py-1.5 pr-2 text-xs cursor-pointer transition ${
                            active
                              ? "bg-blue-600 text-white font-semibold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {block.type === "columns" ? (
                              <Columns className="h-3 w-3 shrink-0" />
                            ) : block.type === "section" ||
                              block.type === "column" ? (
                              <Layers className="h-3 w-3 shrink-0" />
                            ) : (
                              <Type className="h-3 w-3 shrink-0 opacity-70" />
                            )}
                            <span className="truncate text-[11px]">
                              {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBlocks((prev) =>
                                  moveBlockStep(prev, block.id, "up")
                                );
                              }}
                              aria-label={`${block.type} bloğunu yukarı taşı`}
                              className="p-0.5 hover:opacity-80"
                            >
                              <ArrowUp className="h-2.5 w-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBlocks((prev) =>
                                  removeBlockById(prev, block.id)
                                );
                              }}
                              aria-label={`${block.type} bloğunu sil`}
                              className="p-0.5 hover:opacity-80"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* BLOK VE SATIR EKLEME */
                <div className="space-y-4">
                  {selectedBlock &&
                    (selectedBlock.type === "column" ||
                      selectedBlock.type === "section") && (
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-[11px] text-blue-700 dark:text-blue-300">
                        Seçili hedef:{" "}
                        <strong>
                          {BLOCK_TYPE_LABELS[selectedBlock.type]}
                        </strong>{" "}
                        içine eklenecek.
                      </div>
                    )}

                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Satır ve sütun düzenleri
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {COLUMN_LAYOUT_PRESETS.slice(0, 6).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            handleInsertBlock(
                              {
                                type: "columns",
                                props: {
                                  layout: preset.id,
                                  gap: "24px",
                                  verticalAlign: "stretch",
                                },
                                children: preset.cols.map((w, i) => ({
                                  id: `col_${i}`,
                                  type: "column",
                                  props: { widthPct: w },
                                  style: {
                                    paddingTop: "20px",
                                    paddingRight: "20px",
                                    paddingBottom: "20px",
                                    paddingLeft: "20px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "12px",
                                    borderWidth: "1px",
                                    borderColor: "#e2e8f0",
                                  },
                                  children: [
                                    {
                                      id: `col_h_${i}`,
                                      type: "heading",
                                      props: {
                                        level: 3,
                                        text: `${i + 1}. Sütun`,
                                      },
                                    },
                                    {
                                      id: `col_p_${i}`,
                                      type: "paragraph",
                                      props: {
                                        text: "Sütun içeriği...",
                                      },
                                    },
                                  ],
                                })),
                              },
                              null
                            )
                          }
                          className="flex flex-col items-start rounded-lg border border-border bg-muted/20 p-2 text-left hover:border-blue-500 hover:bg-blue-500/5 transition"
                        >
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            {preset.id}
                          </span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Temel & Atomik Elementler
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ATOMIC_ELEMENTS_QUICK_BAR.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInsertBlock(item.block)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-2 text-left text-[11px] font-medium hover:border-blue-500 hover:bg-blue-500/5 transition"
                        >
                          <Plus className="h-3 w-3 text-blue-600 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
            ) : null}
          </aside>
    </>
  );
}
