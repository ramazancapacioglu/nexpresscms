"use client";

import React from "react";
import { Plus, Sparkles, Columns3, Type } from "lucide-react";
import { RscBlockRenderer } from "@nexpress/themes";
import {
  appendRepeaterItem,
  duplicateBlockById,
  moveBlockStep,
  removeBlockById,
  updateBlockById,
  type BlockNode,
} from "@nexpress/core";
import { buildEmptyRow } from "@nexpress/editor";
import { CanvasFrame } from "./editor/canvas-frame";
import { CanvasBlock } from "./editor/canvas-block";
import { DropZone } from "./editor/dnd";
import { TitleField } from "./editor/title-field";
import { PageSchemaContext } from "./editor/page-schema-context";
import type { DualModeEditorState } from "./use-dual-mode-editor";

export function DualModeEditorCanvas({ s }: { s: DualModeEditorState }) {
  const isTemplateMode = s.lockedType === "template";

  const addEmptyRowAtRoot = () => {
    s.handleInsertBlock(buildEmptyRow(), null);
  };

  const handleOpenMediaPickerForBlock = (blockId: string) => {
    s.setSelectedBlockId(blockId);
    s.setMediaPickerTarget("block_image");
  };

  const handleAppendRepeaterItem = (blockId: string) => {
    s.setBlocks((prev) => updateBlockById(prev, blockId, (b) => appendRepeaterItem(b)));
  };

  const handleMoveBlock = (id: string, dir: "up" | "down") => {
    s.setBlocks((prev) => moveBlockStep(prev, id, dir));
  };

  const handleDuplicateBlock = (id: string) => {
    s.setBlocks((prev) => duplicateBlockById(prev, id));
  };

  const handleRemoveBlock = (id: string) => {
    s.setBlocks((prev) => removeBlockById(prev, id));
    if (s.selectedBlockId === id) s.setSelectedBlockId(null);
  };

  const handleCodeChange = (raw: string) => {
    s.setCodeJsonDraft(raw);
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        s.setBlocks(parsed as BlockNode[]);
        s.setCodeJsonError(null);
      } else {
        s.setCodeJsonError("Kök yapı bir blok dizisi (Array) olmalıdır.");
      }
    } catch (err) {
      s.setCodeJsonError(err instanceof Error ? err.message : "Geçersiz JSON");
    }
  };

  return (
    <PageSchemaContext.Provider
      value={{
        title: s.title,
        tldr: s.tldr,
        rich: s.richSchema as Record<string, unknown>,
      }}
    >
      <main
        onClick={() => s.setSelectedBlockId(null)}
        className="flex flex-1 flex-col items-center overflow-y-auto bg-slate-200/70 p-3 dark:bg-slate-950"
      >
        {/* Görsel veya Önizleme Modu — Yalıtılmış Tema Iframe */}
        {(s.editorMode === "visual" || s.editorMode === "preview") && (
          <CanvasFrame
            device={s.viewport}
            tokens={s.siteTokens}
            blockCss={s.compiledBlockCss}
          >
            <div className="mx-auto max-w-[var(--nx-container,1200px)] px-6 py-8">
              {/* Sayfa Başlığı (H1) — Kanvas Üstünde Doğrudan Düzenlenebilir */}
              {!isTemplateMode && s.editorMode === "visual" && (
                <div onClick={(e) => e.stopPropagation()}>
                  <TitleField
                    value={s.title}
                    onChange={s.setTitle}
                    fontFamily={s.siteTokens.typography.headingFont}
                  />
                </div>
              )}

              {s.editorMode === "visual" && (
                <>
                  {s.blocks.length === 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="my-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white/95 p-10 text-center shadow-xs"
                    >
                      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Columns3 className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Sayfanızı Oluşturmaya Başlayın
                      </h3>
                      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                        Sütunlu bir satır düzeni seçin, tasarım kütüphanesinden hazır bir bölüm ekleyin veya doğrudan metin yazmaya başlayın.
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                          onClick={addEmptyRowAtRoot}
                        >
                          <Columns3 className="h-3.5 w-3.5" />
                          Satır / Sütun Düzeni Ekle
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          onClick={() => s.setLibraryOpen(true)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Tasarım Kütüphanesinden Seç
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() =>
                            s.handleInsertBlock(
                              {
                                id: "tpl_p",
                                type: "paragraph",
                                props: { text: "" },
                              },
                              null
                            )
                          }
                        >
                          <Type className="h-3.5 w-3.5" />
                          Metin Bloğu ile Başla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 items-start gap-x-6 gap-y-2">
                      <div className="col-span-12">
                        <DropZone parentId={null} index={0} />
                      </div>
                      {s.blocks.map((block, index) => (
                        <React.Fragment key={block.id}>
                          <CanvasBlock
                            block={block}
                            index={index}
                            total={s.blocks.length}
                            parentId={null}
                            selectedId={s.selectedBlockId}
                            deviceViewport={s.viewport}
                            tokens={s.siteTokens}
                            proseSyncToken={s.proseSyncToken}
                            onSelect={(id) => {
                              s.setSelectedBlockId(id);
                              s.setRightTab("block");
                            }}
                            onMove={handleMoveBlock}
                            onDuplicate={handleDuplicateBlock}
                            onRemove={handleRemoveBlock}
                            onUpdateProp={(id, key, val, recordHistory = true) =>
                              s.updateBlockPropsById(id, { [key]: val }, recordHistory)
                            }
                            onUpdateProps={(id, patch, recordHistory = true) =>
                              s.updateBlockPropsById(id, patch, recordHistory)
                            }
                            onUpdateStyle={s.updateBlockStyleById}
                            onConvertText={s.convertTextBlock}
                            onCommitHistory={s.flushHistory}
                            onOpenStyleInspector={(id) => {
                              s.setSelectedBlockId(id);
                              s.setRightSidebarOpen(true);
                              s.setRightTab("block");
                              s.setBlockInspectorSubTab("style");
                            }}
                            onReplaceWithBlock={s.replaceBlockById}
                            onApplyColumnPreset={s.handleChangeColumnLayout}
                            onInsertIntoContainer={(b, pid) =>
                              s.handleInsertBlock(b, pid)
                            }
                            onOpenMediaPicker={handleOpenMediaPickerForBlock}
                            onOpenLibrary={() => s.setLibraryOpen(true)}
                            onAppendRepeaterItem={handleAppendRepeaterItem}
                            onUpdateBlock={(id, updater) =>
                              s.setBlocks((prev) => updateBlockById(prev, id, updater))
                            }
                          />
                          <div className="col-span-12">
                            <DropZone parentId={null} index={index + 1} />
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Kanvas Alt Hızlı Ekleme Çubuğu (Satır Ekle / Tasarım Kütüphanesi) */}
                  {s.blocks.length > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300/90 bg-slate-50/70 px-4 py-3 transition hover:border-blue-300 hover:bg-white"
                    >
                      <button
                        type="button"
                        onClick={addEmptyRowAtRoot}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Yeni Satır / Sütun Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => s.setLibraryOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 shadow-2xs transition hover:bg-indigo-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Tasarım Kütüphanesinden Bölüm Ekle
                      </button>
                    </div>
                  )}
                </>
              )}

              {s.editorMode === "preview" && (
                <div>
                  {!isTemplateMode && s.title && (
                    <h1
                      style={{
                        fontFamily: s.siteTokens.typography.headingFont,
                        fontWeight: 800,
                      }}
                      className="mb-6 text-4xl leading-tight tracking-tight"
                    >
                      {s.title}
                    </h1>
                  )}
                  <RscBlockRenderer
                    blocks={s.blocks}
                    themeId="corporate-clean"
                    tokens={s.siteTokens}
                    pageSchema={{
                      title: s.title,
                      tldr: s.tldr,
                      rich: s.richSchema as Record<string, unknown>,
                    }}
                    preview
                  />
                </div>
              )}
            </div>
          </CanvasFrame>
        )}

        {/* Ham JSON AST Modu */}
        {s.editorMode === "code" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl space-y-3 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Saf Blok JSON AST</h3>
                <p className="text-xs text-muted-foreground">
                  Ön yüzde 0 KB istemci JS ile doğrudan React Server Components olarak işlenen şema.
                </p>
              </div>
              <span className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold">
                JSON Schema v1
              </span>
            </div>
            {s.codeJsonError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                JSON Hatası: {s.codeJsonError}
              </div>
            )}
            <textarea
              value={s.codeJsonDraft}
              onChange={(e) => handleCodeChange(e.target.value)}
              rows={26}
              aria-label="Ham Blok JSON AST"
              className="w-full rounded-xl border bg-slate-950 p-4 font-mono text-xs text-emerald-400 focus:outline-none"
            />
          </div>
        )}

        {/* Derlenen Markdown Önizleme Modu */}
        {s.editorMode === "markdown" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl space-y-3 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Derlenen Saf Markdown (`markdownCache`)</h3>
                <p className="text-xs text-muted-foreground">
                  `?format=md`, `/llms.txt` ve RAG indeksleme motoruna sunulan çıktı.
                </p>
              </div>
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                Kayıpsız Derleme
              </span>
            </div>
            <pre className="overflow-x-auto rounded-xl border bg-slate-950 p-6 font-mono text-xs leading-relaxed text-slate-200">
              {s.compiledMarkdown}
            </pre>
          </div>
        )}
      </main>
    </PageSchemaContext.Provider>
  );
}
