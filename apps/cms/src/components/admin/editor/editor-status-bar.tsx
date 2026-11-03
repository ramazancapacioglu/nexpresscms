"use client";

import React from "react";
import {
  getBlockAncestors,
  summarizeBlockPreview,
} from "@nexpress/core";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import { ChevronRight, Layers, FileText } from "lucide-react";
import type { DualModeEditorState } from "../use-dual-mode-editor";

/**
 * Editörün alt durum ve hiyerarşi (breadcrumb) çubuğu.
 * Seçili bloğun kök sayfadan itibaren ata zincirini (`Sayfa › Bölüm › Satır (6+6) › Sütun › Başlık`)
 * tıklanabilir adımlar olarak gösterir; sağda toplam blok ve kelime sayısını sunar.
 */
export function EditorStatusBar({ s }: { s: DualModeEditorState }) {
  const ancestors = React.useMemo(
    () => (s.selectedBlockId ? getBlockAncestors(s.blocks, s.selectedBlockId) : []),
    [s.blocks, s.selectedBlockId]
  );

  return (
    <footer
      aria-label="Blok hiyerarşisi ve belge durumu"
      className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-3 text-[11px] text-muted-foreground select-none"
    >
      {/* Sol: Tıklanabilir Blok Breadcrumb Zinciri */}
      <nav aria-label="Blok yolu" className="flex min-w-0 items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => s.setSelectedBlockId(null)}
          className={`inline-flex h-6 shrink-0 items-center gap-1 rounded px-1.5 font-medium transition-colors ${
            ancestors.length === 0
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-3 w-3" />
          Sayfa
        </button>

        {ancestors.map((node, idx) => {
          const isLast = idx === ancestors.length - 1;
          const label = BLOCK_TYPE_LABELS[node.type] ?? node.type;
          const summary = summarizeBlockPreview(node);
          return (
            <React.Fragment key={node.id}>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              <button
                type="button"
                onClick={() => {
                  s.setSelectedBlockId(node.id);
                  s.setRightTab("block");
                }}
                className={`inline-flex h-6 shrink-0 items-center gap-1 rounded px-1.5 transition-colors ${
                  isLast
                    ? "bg-blue-600 font-semibold text-white shadow-2xs"
                    : "font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{label}</span>
                {summary && (
                  <span
                    className={`max-w-[140px] truncate text-[10px] ${
                      isLast ? "text-white/90" : "text-muted-foreground"
                    }`}
                  >
                    ({summary})
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Sağ: Blok & Kelime Sayacı + Aktif Görünüm */}
      <div className="hidden shrink-0 items-center gap-3 text-[11px] text-muted-foreground sm:flex">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3 w-3" />
          <strong className="font-semibold text-foreground">{s.flatBlockOutline.length}</strong> blok
        </span>
        <span>·</span>
        <span>
          <strong className="font-semibold text-foreground">{s.totalWords}</strong> kelime
        </span>
        <span>·</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground">
          {s.viewport === "desktop"
            ? "Masaüstü"
            : s.viewport === "tablet"
              ? "Tablet (768px)"
              : "Mobil (390px)"}
        </span>
      </div>
    </footer>
  );
}
