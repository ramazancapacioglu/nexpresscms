"use client";

import React, { useRef, useState } from "react";
import {
  toCssVarTokens,
  type BlockNode,
  type DesignTokens,
} from "@nexpress/core";
import { RscSingleBlock } from "@nexpress/themes";
import { usePageSchema } from "./page-schema-context";

export interface CanvasImageScalerProps {
  block: BlockNode;
  tokens: DesignTokens;
  pageSchema?: ReturnType<typeof usePageSchema>;
  isSelected: boolean;
  onUpdateProp: (id: string, key: string, value: unknown, commit: boolean) => void;
  onCommitHistory: () => void;
}

/**
 * Etkileşimli görsel ölçeklendirme kanvas bileşeni:
 * - Seçildiğinde sağ kenar ve sağ alt köşe tutamaçları ile serbest sürükle-bırak ölçekleme sunar.
 * - Sürükleme sırasında canlı yüzde rozeti ("Genişlik: %50") gösterir.
 * - Hızlı ölçek (%25, %50, %75, %100), hizalama ve medya seçimi kontrolleri
 *   birleşik üst araç çubuğunda (`FloatingToolbar`) yer alır (çift araç çubuğu çıkmaz).
 */
export function CanvasImageScaler({
  block,
  tokens,
  pageSchema,
  isSelected,
  onUpdateProp,
  onCommitHistory,
}: CanvasImageScalerProps) {
  const [dragWidth, setDragWidth] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentWidth = dragWidth ?? String(block.props.width ?? "100%");
  const currentAlign = String(block.props.align ?? "left");

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    // Tuval bir iframe içindedir: fare olayları iframe penceresine düşer, üst pencereye değil
    const win =
      (e.currentTarget as HTMLElement).ownerDocument.defaultView ?? window;
    const startX = e.clientX;
    const parent = containerRef.current?.parentElement;
    const parentWidth = parent ? parent.getBoundingClientRect().width : 800;
    const initialWidthPx = containerRef.current
      ? containerRef.current.getBoundingClientRect().width
      : parentWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newPx = Math.max(
        80,
        Math.min(parentWidth, initialWidthPx + deltaX)
      );
      const pct = Math.round((newPx / parentWidth) * 100);
      const clampedPct = Math.max(15, Math.min(100, pct));
      setDragWidth(`${clampedPct}%`);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      win.removeEventListener("mousemove", onMouseMove);
      win.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);

      const deltaX = upEvent.clientX - startX;
      const newPx = Math.max(
        80,
        Math.min(parentWidth, initialWidthPx + deltaX)
      );
      const pct = Math.round((newPx / parentWidth) * 100);
      const finalPct = `${Math.max(15, Math.min(100, pct))}%`;
      setDragWidth(null);
      onUpdateProp(block.id, "width", finalPct, true);
      onCommitHistory();
    };

    win.addEventListener("mousemove", onMouseMove);
    win.addEventListener("mouseup", onMouseUp);
  };

  const previewBlock = dragWidth
    ? { ...block, props: { ...block.props, width: dragWidth } }
    : block;

  const alignClass =
    currentAlign === "center"
      ? "mx-auto"
      : currentAlign === "right"
        ? "ml-auto"
        : currentAlign === "full"
          ? "w-full"
          : "mr-auto";

  return (
    <div className="relative my-2 select-none">
      <div
        ref={containerRef}
        className={`relative transition-all ${alignClass} ${
          isSelected ? "ring-2 ring-blue-500 rounded-xl" : ""
        }`}
        style={{
          width: currentWidth,
          maxWidth: "100%",
        }}
      >
        <RscSingleBlock
          block={previewBlock}
          themeId="corporate-clean"
          tokens={toCssVarTokens(tokens)}
          isEditorial={false}
          isCommerce={false}
          pageSchema={pageSchema}
          preview
        />

        {isSelected && (
          <>
            {/* Sağ Kenar Sürükle-Ölçekle Tutamacı */}
            <div
              onMouseDown={handleMouseDown}
              title="Görseli ölçeklendirmek için sürükleyin"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-3 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md hover:scale-110 active:scale-125 transition"
            >
              <div className="h-3 w-0.5 rounded bg-white/80" />
            </div>

            {/* Sağ Alt Köşe Tutamacı */}
            <div
              onMouseDown={handleMouseDown}
              title="Görseli ölçeklendirmek için sürükleyin"
              className="absolute -right-2 -bottom-2 z-20 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-blue-600 shadow-md hover:scale-125 active:scale-125 transition"
            />

            {/* Canlı Yüzde Rozeti */}
            {isDragging && dragWidth && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none rounded-md bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg">
                Genişlik: {dragWidth}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export interface ColumnSplitterHandleProps {
  leftColId: string;
  rightColId: string;
  leftPct: number;
  rightPct: number;
  rowRef: React.RefObject<HTMLDivElement | null>;
  onResizeMove: (
    leftId: string,
    leftPct: number,
    rightId: string,
    rightPct: number
  ) => void;
  onResizeEnd: (
    leftId: string,
    leftPct: number,
    rightId: string,
    rightPct: number
  ) => void;
}

/**
 * İki sütun arasındaki etkileşimli genişletme/daraltma tutamacı.
 */
export function ColumnSplitterHandle({
  leftColId,
  rightColId,
  leftPct,
  rightPct,
  rowRef,
  onResizeMove,
  onResizeEnd,
}: ColumnSplitterHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentLeft, setCurrentLeft] = useState(leftPct);
  const [currentRight, setCurrentRight] = useState(rightPct);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const win =
      (e.currentTarget as HTMLElement).ownerDocument.defaultView ?? window;
    const startX = e.clientX;
    const rowEl = rowRef.current;
    const rowWidth = rowEl ? rowEl.getBoundingClientRect().width : 800;
    const sumPct = leftPct + rightPct;

    let finalLeft = leftPct;
    let finalRight = rightPct;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPct = (deltaX / rowWidth) * 100;
      const proposedLeft = Math.round(leftPct + deltaPct);
      const minPct = 10;
      const maxPct = sumPct - 10;
      const clampedLeft = Math.max(minPct, Math.min(maxPct, proposedLeft));
      const clampedRight = Math.round(sumPct - clampedLeft);

      finalLeft = clampedLeft;
      finalRight = clampedRight;
      setCurrentLeft(clampedLeft);
      setCurrentRight(clampedRight);
      onResizeMove(leftColId, clampedLeft, rightColId, clampedRight);
    };

    const onMouseUp = () => {
      win.removeEventListener("mousemove", onMouseMove);
      win.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      onResizeEnd(leftColId, finalLeft, rightColId, finalRight);
    };

    win.addEventListener("mousemove", onMouseMove);
    win.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={startResize}
      title="Sütun genişliğini ayarlamak için sağa/sola sürükleyin"
      className="group/resizer relative z-20 flex w-4 -mx-2 cursor-col-resize items-center justify-center select-none shrink-0"
    >
      <div
        className={`h-full min-h-[64px] w-0.5 rounded-full transition-colors ${
          isDragging
            ? "bg-blue-600"
            : "bg-slate-200 dark:bg-slate-700 group-hover/resizer:bg-blue-500"
        }`}
      />

      <div
        className={`absolute flex h-7 w-3.5 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md transition-all ${
          isDragging
            ? "scale-110 shadow-lg ring-2 ring-blue-300"
            : "opacity-40 group-hover/resizer:opacity-100 group-hover/resizer:scale-105"
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <div className="h-2 w-0.5 rounded-full bg-white/80" />
        </div>
      </div>

      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl">
          <span>%{currentLeft}</span>
          <span className="text-slate-500">|</span>
          <span>%{currentRight}</span>
        </div>
      )}
    </div>
  );
}

