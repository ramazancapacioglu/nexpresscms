"use client";

import React from "react";
import { COLUMN_LAYOUT_PRESETS } from "./studio-model";
import { Sparkles, Columns3, X } from "lucide-react";

/**
 * Sütun oranlarını (`[50, 50]`, `[33.33, 66.67]` vb.) görsel SVG çubukları olarak çizer.
 * Kanvas içi satır seçicide, yüzen araç çubuğunda ve sol blok ekleme çekmecesinde ortak kullanılır.
 */
export function ColumnPresetSvg({
  widths,
  className = "h-7 w-12",
}: {
  widths: number[];
  className?: string;
}) {
  const gap = 3;
  const totalGap = gap * (widths.length - 1);
  const available = 100 - totalGap;
  let x = 0;

  return (
    <svg
      viewBox="0 0 100 44"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {widths.map((w, idx) => {
        const barW = Math.max(8, (w / 100) * available);
        const curX = x;
        x += barW + gap;
        return (
          <rect
            key={idx}
            x={curX}
            y={4}
            width={barW}
            height={36}
            rx={4}
            className="fill-current opacity-80 transition-opacity group-hover:opacity-100"
          />
        );
      })}
    </svg>
  );
}

export interface RowLayoutPickerProps {
  currentLayout?: string;
  onSelectPreset: (presetId: string) => void;
  onOpenLibrary?: () => void;
  onClose?: () => void;
}

/**
 * Boş bir satır (`columns`) eklendiğinde veya satırda "Düzen Değiştir" tıklandığında
 * kanvas üzerinde beliren görsel sütun düzeni seçicisi.
 */
export function RowLayoutPicker({
  currentLayout,
  onSelectPreset,
  onOpenLibrary,
  onClose,
}: RowLayoutPickerProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-slate-50/95 to-white p-5 text-center shadow-sm"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Düzen seçiciyi kapat"
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
        <Columns3 className="h-3.5 w-3.5" />
        Satır & Sütun Düzeni Seçin
      </div>
      <p className="mx-auto mb-4 max-w-md text-xs text-slate-500">
        Başlamak için aşağıdan bir sütun oranı seçin veya hazır tasarım kütüphanesinden tek tıkla bölüm ekleyin.
      </p>

      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {COLUMN_LAYOUT_PRESETS.map((preset) => {
          const active = currentLayout === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              aria-label={`Sütun düzeni ${preset.label}`}
              className={`group flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                active
                  ? "border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700"
              }`}
            >
              <ColumnPresetSvg widths={preset.cols} className="h-7 w-14" />
              <span className="text-[11px] font-bold tracking-tight">{preset.id}</span>
              <span className="line-clamp-1 text-[10px] text-slate-500 group-hover:text-blue-600">
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {onOpenLibrary && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/80 pt-3.5">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Tasarım Kütüphanesinden Hazır Bölüm Seç
          </button>
        </div>
      )}
    </div>
  );
}
