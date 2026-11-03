import { SearchSnippetBar } from "@/components/admin/editor/search-snippet-bar";
import { CanvasBlock } from "@/components/admin/editor/canvas-block";
import { duplicateBlockById, moveBlockStep, normalizeImportedBlock, removeBlockById, type BlockNode } from "@nexpress/core";
import { ATOMIC_ELEMENTS_QUICK_BAR } from "@nexpress/editor";
import { PageSchemaContext } from "@/components/admin/editor/page-schema-context";
import { RscBlockRenderer } from "@nexpress/themes";
import { Columns, Globe, Sparkles } from "lucide-react";
import { Fragment } from "react";
import { DropZone } from "@/components/admin/editor/dnd";
import { CanvasFrame } from "@/components/admin/editor/canvas-frame";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** 2. ORTA KANVAS: GÖRSEL STÜDYO / CANLI RSC / JSON AST / MARKDOWN */
export function DualModeEditorCanvas({ s }: { s: DualModeEditorState }) {
  const { siteTokens, title, setTitle, slug, setSlug, schemaType, blocks, proseSyncToken, editorMode, viewport, setRightTab, setBlockInspectorSubTab, selectedBlockId, setSelectedBlockId, activeColumnInsertId, setActiveColumnInsertId, setLibraryOpen, codeJsonDraft, setCodeJsonDraft, codeJsonError, setCodeJsonError, setBlocks, flushHistory, showToast, compiledMarkdown, totalWords, convertTextBlock, updateBlockPropsById, handleChangeColumnLayout, handleInsertBlock, updateBlockStyleById, setBlockStyleById } = s;
  const pageSchema = { title, tldr: s.tldr, rich: s.richSchema as never };
  return (
    <PageSchemaContext.Provider value={pageSchema}>
        {/* 2. ORTA KANVAS: GÖRSEL STÜDYO / CANLI RSC / JSON AST / MARKDOWN */}
        <main
          onClick={() => setActiveColumnInsertId(null)}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#111317]">
            <div className="flex items-center justify-between gap-3 px-4 py-1.5 text-[11px] text-muted-foreground">
              <div className="flex min-w-0 items-center gap-1.5 font-mono">
                <Globe className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span>/tr/</span>
                <input
                  type="text"
                  value={slug}
                  aria-label="Sayfa adresi (slug)"
                  onChange={(e) => setSlug(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span>{blocks.length} kök blok</span>
                <span>•</span>
                <span>{totalWords} kelime</span>
              </div>
            </div>
            <textarea
              rows={Math.min(3, Math.max(1, Math.ceil(title.length / 36)))}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Başlık"
              className="w-full min-w-0 resize-none overflow-hidden bg-transparent px-4 pb-2 text-3xl font-extrabold leading-tight tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <SearchSnippetBar title={title} tldr={s.tldr} metaTitle={s.metaTitle} setMetaTitle={s.setMetaTitle} metaDescription={s.metaDescription} setMetaDescription={s.setMetaDescription} />
          </div>
          {editorMode === "visual" || editorMode === "preview" ? (
            <div className="min-h-0 flex-1 bg-muted/40 p-3">
              <CanvasFrame device={viewport} tokens={siteTokens} blockCss={s.compiledBlockCss}>
                <div className="px-6 py-8">
            {/* MOD 1: GÖRSEL KANVAS */}
                  {editorMode === "visual" && (
                    <div className="space-y-4 pb-16">
                      <DropZone parentId={null} index={0} />
                      {blocks.map((block, at) => (
                        <Fragment key={block.id}>
                        <CanvasBlock
                          block={block}
                          selectedId={selectedBlockId}
                          activeColumnInsertId={activeColumnInsertId}
                          tokens={siteTokens}
                          syncToken={proseSyncToken}
                          onSelect={(id) => {
                            setSelectedBlockId(id);
                            setRightTab("block");
                          }}
                          onMove={(id, direction) =>
                            setBlocks((prev) => moveBlockStep(prev, id, direction))
                          }
                          onDuplicate={(id) => setBlocks((prev) => duplicateBlockById(prev, id))}
                          onRemove={(id) => setBlocks((prev) => removeBlockById(prev, id))}
                          onChangeLayout={handleChangeColumnLayout}
                          onUpdateProps={(id, patch) => updateBlockPropsById(id, patch, false)}
                          onConvertText={convertTextBlock}
                          onCommit={flushHistory}
                          onInsert={handleInsertBlock}
                          onToggleInsert={setActiveColumnInsertId}
                          onUpdateStyle={(id, patch) => updateBlockStyleById(id, patch)}
                          onSetStyle={(id, style) => setBlockStyleById(id, style)}
                          onInspectStyle={(id) => {
                            setSelectedBlockId(id);
                            setRightTab("block");
                            setBlockInspectorSubTab("style");
                          }}
                        />
                        <DropZone parentId={null} index={at + 1} />
                        </Fragment>
                      ))}

                      <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background/60 p-6">
                        <button
                          type="button"
                          onClick={() => setLibraryOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Tasarım Kütüphanesinden Bölüm Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleInsertBlock(ATOMIC_ELEMENTS_QUICK_BAR[0]!.block, null)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          <Columns className="h-3.5 w-3.5 text-blue-600" />
                          + 2 sütunlu satır ekle
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MOD 2: CANLI 0-KB RSC ÖNİZLEME */}
                  {editorMode === "preview" && (
                    <div className="rounded-2xl border border-border bg-white p-6 md:p-10 shadow-sm space-y-8">
                      <div className="border-b pb-6 space-y-3">
                        <span className="inline-flex items-center rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
                          Canlı 0-KB RSC Ön Yüz Önizlemesi ({schemaType})
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                          {title}
                        </h1>
                      </div>
                      <RscBlockRenderer
                        blocks={blocks}
                        themeId="corporate-aurora"
                        tokens={siteTokens}
                        pageSchema={pageSchema}
                      />
                    </div>
                  )}

                </div>
              </CanvasFrame>
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto p-3 md:p-5" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
          <div
            style={{ backgroundColor: siteTokens.colors.background, color: siteTokens.colors.foreground, fontFamily: siteTokens.typography.bodyFont }}
            className="mx-auto max-w-[1400px] rounded-xl px-6 py-8 shadow-sm ring-1 ring-black/5"
          >
            {/* MOD 3: KOD & JSON AST EDİTÖRÜ */}
            {editorMode === "code" && (
              <div className="rounded-xl border border-border bg-zinc-950 p-4 text-zinc-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">
                    Saf JSON AST (satır, sütun ve cihaz stili)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(codeJsonDraft);
                        if (!Array.isArray(parsed)) {
                          throw new Error("Kök yapı bir BlockNode[] dizisi olmalıdır.");
                        }
                        setBlocks(parsed.map((b, i) => normalizeImportedBlock(b, i)));
                        setCodeJsonError(null);
                        showToast("JSON AST kanvasa başarıyla uygulandı!");
                      } catch (err: any) {
                        setCodeJsonError(err?.message ?? "Geçersiz JSON");
                      }
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    JSON Değişikliklerini Kanvasa Uygula
                  </button>
                </div>
                {codeJsonError && (
                  <div className="rounded bg-rose-500/20 p-2 text-xs text-rose-300">
                    {codeJsonError}
                  </div>
                )}
                <textarea
                  rows={24}
                  value={codeJsonDraft}
                  onChange={(e) => setCodeJsonDraft(e.target.value)}
                  className="w-full rounded bg-zinc-900 p-3 font-mono text-xs text-emerald-300 focus:outline-none"
                />
              </div>
            )}

            {/* MOD 4: SIFIR KAYIPLI MARKDOWN CACHE */}
            {editorMode === "markdown" && (
              <div className="rounded-xl border border-border bg-zinc-950 p-5 text-zinc-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Ön-Derlenmiş <code>markdownCache</code> (?format=md & /llms.txt çıktısı)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(compiledMarkdown);
                      showToast("Markdown panoya kopyalandı.");
                    }}
                    className="rounded border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-200"
                  >
                    Kopyala
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-sky-300 leading-relaxed">
                  {compiledMarkdown}
                </pre>
              </div>
            )}
          </div>
          </div>
          )}
        </main>
    </PageSchemaContext.Provider>
  );
}
