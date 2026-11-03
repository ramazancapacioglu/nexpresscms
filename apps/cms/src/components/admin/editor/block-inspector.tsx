"use client";

import React from "react";
import {
  duplicateBlockById,
  getBlockAncestors,
  removeBlockById,
  summarizeBlockPreview,
  updateBlockById,
} from "@nexpress/core";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import {
  Sliders,
  Paintbrush,
  Settings2,
  CornerLeftUp,
  Copy,
  Trash2,
  MousePointerClick,
  FileText,
  Layers,
  X,
} from "lucide-react";
import { BlockGeneralTab } from "./block-general-tab";
import { BlockStyleTab } from "./block-style-tab";
import { BlockAdvancedTab } from "./block-advanced-tab";
import { PublishTab } from "./publish-tab";
import { SeoTab } from "./seo-tab";
import { EngageTab } from "./engage-tab";
import { TemplateTab } from "./template-tab";
import { useStudioInspector } from "./studio-inspector-context";

/**
 * Sağ denetçi paneli:
 * - Üstte 2 net çalışma modu: "Blok" | "Sayfa Ayarları" (veya Şablon)
 * - "Blok" modunda: üst kapsayıcı (Parent) breadcrumb yolu + 3 sekme (Genel & Düzen | Stil | Gelişmiş)
 * - "Sayfa Ayarları" modunda: Yayın | SEO ({score}) | Medya & Etk. alt sekmeleri
 */
export function BlockInspector() {
  const ed = useStudioInspector();
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    rightTab,
    setRightTab,
    blockInspectorSubTab,
    setBlockInspectorSubTab,
    selectedBlock,
    setSelectedBlockId,
    blocks,
    setBlocks,
    templateKind,
    seoAnalysis,
  } = ed;

  const isTemplateMode = Boolean(templateKind);
  const isBlockMode = rightTab === "block";

  const ancestors = React.useMemo(
    () => (selectedBlock ? getBlockAncestors(blocks, selectedBlock.id) : []),
    [blocks, selectedBlock]
  );
  const parentAncestors = ancestors.slice(0, -1);

  if (!rightSidebarOpen) return null;

  const resetSelectedBlockStyle = () => {
    if (!selectedBlock) return;
    setBlocks((prev) =>
      updateBlockById(prev, selectedBlock.id, (b) => ({ ...b, style: {} }))
    );
  };

  return (
    <aside
      aria-label="Sağ blok ve sayfa denetçisi"
      className="flex w-80 shrink-0 flex-col border-l bg-card text-card-foreground select-none"
    >
      {/* Üst 2 Modlu Ana Seçici: Blok | Sayfa Ayarları */}
      <div className="flex items-center justify-between gap-1 border-b px-2.5 py-2">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setRightTab("block")}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
              isBlockMode
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Blok
          </button>
          <button
            type="button"
            onClick={() =>
              setRightTab(
                isTemplateMode
                  ? "template"
                  : rightTab === "block"
                    ? "publish"
                    : rightTab
              )
            }
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
              !isBlockMode
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {isTemplateMode ? "Şablon" : "Sayfa Ayarları"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRightSidebarOpen(false)}
          aria-label="Sağ denetçiyi kapat"
          title="Kapat"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sayfa Ayarları Modu Alt Sekmeleri (Yayın | SEO | Medya & Etk.) */}
      {!isBlockMode && !isTemplateMode && (
        <div className="grid grid-cols-3 gap-1 border-b bg-muted/30 px-2.5 py-1.5 text-[11px]">
          {(
            [
              ["publish", "Yayın"],
              ["seo", `SEO (${seoAnalysis.score})`],
              ["engage", "Medya & Etk."],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRightTab(key)}
              className={`rounded-md py-1 font-semibold transition-colors ${
                rightTab === key
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Denetçi Gövdesi */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {isBlockMode ? (
          !selectedBlock ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <div className="font-semibold text-foreground">Seçili Blok Yok</div>
              <p className="mt-1 text-[11px] leading-relaxed">
                Düzen, renk, tipografi ve boşluk ayarlarını görmek için kanvas üzerindeki herhangi bir bloğa veya satıra tıklayın.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {blocks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBlockId(blocks[0]!.id)}
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                  >
                    İlk Bloğu Seç
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setRightTab(isTemplateMode ? "template" : "publish")
                  }
                  className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  <FileText className="h-3 w-3" />
                  {isTemplateMode ? "Şablon Ayarları" : "Sayfa Ayarları"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Üst Kapsayıcı (Parent) Hızlı Geçiş Yolu */}
              {parentAncestors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-blue-200/70 bg-blue-50/50 px-2.5 py-1.5 text-[10px] dark:border-blue-900/50 dark:bg-blue-950/30">
                  <span className="font-semibold text-muted-foreground">Üst:</span>
                  {parentAncestors.map((anc) => {
                    const sum = summarizeBlockPreview(anc);
                    return (
                      <button
                        key={anc.id}
                        type="button"
                        onClick={() => setSelectedBlockId(anc.id)}
                        className="inline-flex h-5 items-center gap-0.5 rounded bg-background px-1.5 font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-600 hover:text-white dark:text-blue-300"
                      >
                        <CornerLeftUp className="h-2.5 w-2.5" />
                        {BLOCK_TYPE_LABELS[anc.type] ?? anc.type}
                        {sum ? ` (${sum})` : ""}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Seçili Blok Başlığı & Hızlı İşlemler */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {BLOCK_TYPE_LABELS[selectedBlock.type] ?? selectedBlock.type}
                  </span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    #{selectedBlock.id.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {selectedBlock.style &&
                    Object.keys(selectedBlock.style).length > 0 && (
                      <button
                        type="button"
                        onClick={resetSelectedBlockStyle}
                        className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Stili Sıfırla
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() =>
                      setBlocks((prev) => duplicateBlockById(prev, selectedBlock.id))
                    }
                    aria-label="Seçili bloğu çoğalt"
                    title="Çoğalt"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idToRemove = selectedBlock.id;
                      setBlocks((prev) => removeBlockById(prev, idToRemove));
                      setSelectedBlockId(null);
                    }}
                    aria-label="Seçili bloğu sil"
                    title="Sil"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-rose-600 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Katmanlı Sekme Çubuğu: Genel & Düzen | Stil | Gelişmiş */}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
                {(
                  [
                    ["general", "Genel & Düzen", Sliders],
                    ["style", "Stil", Paintbrush],
                    ["advanced", "Gelişmiş", Settings2],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBlockInspectorSubTab(key)}
                    className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
                      blockInspectorSubTab === key
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>

              {blockInspectorSubTab === "general" && <BlockGeneralTab />}
              {blockInspectorSubTab === "style" && <BlockStyleTab />}
              {blockInspectorSubTab === "advanced" && <BlockAdvancedTab />}
            </div>
          )
        ) : rightTab === "template" ? (
          <TemplateTab />
        ) : rightTab === "publish" ? (
          <PublishTab />
        ) : rightTab === "seo" ? (
          <SeoTab />
        ) : (
          <EngageTab />
        )}
      </div>
    </aside>
  );
}
