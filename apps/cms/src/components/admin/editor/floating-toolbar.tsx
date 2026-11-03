"use client";

import React from "react";
import {
  canAppendRepeaterItem,
  type BlockNode,
  type BlockStyleValues,
} from "@nexpress/core";
import { BLOCK_TYPE_LABELS, COLUMN_LAYOUT_PRESETS } from "./studio-model";
import {
  CornerLeftUp,
  GripVertical,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paintbrush,
  Copy,
  Trash2,
  Image as ImageIcon,
  Plus,
  Columns3,
} from "lucide-react";

export interface FloatingToolbarProps {
  block: BlockNode;
  index: number;
  total: number;
  parentId: string | null;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
  onSelectParent?: () => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateProp: (id: string, key: string, value: unknown) => void;
  onUpdateStyle?: (id: string, patch: Partial<BlockStyleValues>) => void;
  onConvertText?: (kind: "paragraph" | "heading" | "div", level?: number) => void;
  onOpenStyle: (id: string) => void;
  onApplyColumnPreset?: (blockId: string, presetId: string) => void;
  onToggleRowPicker?: () => void;
  onOpenMediaPicker?: (blockId: string) => void;
  onAppendRepeaterItem?: (blockId: string) => void;
}

/**
 * Seçili bloğun sol-üst köşesinde yüzen bağlamsal kontrol çubuğu.
 * Blok türüne göre (Satır, Bölüm, Başlık, Paragraf, Görsel, Buton, Çok Öğeli Bloklar)
 * özel hızlı aksiyonlar ve üst bloğa tek tıkla geçiş düğmesi sunar.
 */
export function FloatingToolbar({
  block,
  index,
  total,
  parentId,
  onDragStart,
  onSelectParent,
  onMove,
  onDuplicate,
  onRemove,
  onUpdateProp,
  onUpdateStyle,
  onConvertText,
  onOpenStyle,
  onApplyColumnPreset,
  onToggleRowPicker,
  onOpenMediaPicker,
  onAppendRepeaterItem,
}: FloatingToolbarProps) {
  const align = String(block.props.align ?? block.style?.textAlign ?? "left");
  const isRepeater = canAppendRepeaterItem(block.type);
  const isMedia =
    block.type === "image_figure" ||
    block.type === "media_file" ||
    block.type === "image_overlay";

  const isText =
    block.type === "heading" ||
    block.type === "paragraph" ||
    block.type === "heading_element" ||
    block.type === "paragraph_element" ||
    block.type === "text_div";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-10 left-2 z-30 flex max-w-[94vw] flex-wrap items-center gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/95 px-1.5 py-1 text-[11px] text-white shadow-xl backdrop-blur-md select-none"
    >
      {/* Üst Bloğu Seç (Parent Jump) */}
      {parentId && onSelectParent && (
        <>
          <button
            type="button"
            onClick={onSelectParent}
            aria-label="Üst kapsayıcı bloğu seç"
            title="Üst Bloğu Seç (↑)"
            className="inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded bg-slate-800 px-1.5 text-[10px] font-semibold text-blue-300 transition hover:bg-blue-600 hover:text-white"
          >
            <CornerLeftUp className="h-3 w-3" />
            <span className="hidden sm:inline">Üst</span>
          </button>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
        </>
      )}

      {/* Sürükle Tutamacı */}
      {onDragStart && (
        <span
          draggable
          onDragStart={onDragStart}
          aria-label="Sürükleyerek taşı"
          title="Sürükleyip taşı"
          className="inline-flex h-6 w-6 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
      )}

      {/* Blok Türü Etiketi */}
      <span className="rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-bold tracking-tight text-white">
        {BLOCK_TYPE_LABELS[block.type] ?? block.type}
      </span>

      {/* Yukarı / Aşağı Taşı */}
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(block.id, "up")}
        aria-label="Bloğu yukarı taşı"
        title="Yukarı Taşı"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30"
      >
        <ArrowUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(block.id, "down")}
        aria-label="Bloğu aşağı taşı"
        title="Aşağı Taşı"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30"
      >
        <ArrowDown className="h-3 w-3" />
      </button>

      {/* SATIR (columns): Sütun Oranı & Düzen Seçici */}
      {block.type === "columns" && onApplyColumnPreset && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <div className="flex items-center gap-0.5">
            {COLUMN_LAYOUT_PRESETS.map((p) => {
              const active = String(block.props.layout ?? "6+6") === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onApplyColumnPreset(block.id, p.id)}
                  aria-label={`Sütun oranı ${p.id}`}
                  title={p.label}
                  className={`h-6 min-w-6 rounded px-1.5 text-[10px] font-bold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {p.id}
                </button>
              );
            })}
            {onToggleRowPicker && (
              <button
                type="button"
                onClick={onToggleRowPicker}
                aria-label="Görsel sütun seçiciyi aç"
                title="Görsel Sütun Seçici"
                className="ml-0.5 inline-flex h-6 items-center gap-1 rounded bg-slate-800 px-1.5 text-[10px] font-semibold text-blue-300 hover:bg-slate-700 hover:text-white"
              >
                <Columns3 className="h-3 w-3" />
                Düzen
              </button>
            )}
          </div>
        </>
      )}

      {/* BÖLÜM (section): Kapsayıcı Genişliği Seçici */}
      {block.type === "section" && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          {(
            [
              ["narrow", "Dar"],
              ["boxed", "Kutu"],
              ["full", "Tam"],
            ] as const
          ).map(([mode, label]) => {
            const active = (block.props.containerMode ?? "boxed") === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateProp(block.id, "containerMode", mode)}
                aria-label={`Bölüm genişliği: ${label}`}
                className={`h-6 min-w-6 rounded px-1.5 text-[10px] font-semibold ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </>
      )}

      {/* BAŞLIK (heading): H1 - H4 */}
      {(block.type === "heading" || block.type === "heading_element") && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          {([1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onUpdateProp(block.id, "level", lvl)}
              aria-label={`Başlık seviyesi H${lvl}`}
              className={`h-6 min-w-6 rounded px-1.5 text-[10px] font-bold ${
                Number(block.props.level ?? 2) === lvl
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              H{lvl}
            </button>
          ))}
        </>
      )}

      {/* METİN & BUTON HİZALAMA */}
      {(isText || block.type === "button_element") && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          {(
            [
              ["left", "Sola hizala", AlignLeft],
              ["center", "Ortala", AlignCenter],
              ["right", "Sağa hizala", AlignRight],
            ] as const
          ).map(([a, label, Icon]) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                onUpdateProp(block.id, "align", a);
                onUpdateStyle?.(block.id, { textAlign: a });
              }}
              aria-label={label}
              title={label}
              className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                align === a
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </>
      )}

      {/* BUTON STİL VARYANTI */}
      {block.type === "button_element" && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          {(
            [
              ["primary", "Birincil"],
              ["secondary", "İkincil"],
              ["outline", "Çerçeve"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => onUpdateProp(block.id, "styleVariant", v)}
              aria-label={`Buton stili: ${label}`}
              className={`h-6 rounded px-1.5 text-[10px] font-semibold ${
                (block.props.styleVariant ?? "primary") === v
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </>
      )}

      {/* METİN DÖNÜŞTÜRME */}
      {isText && onConvertText && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <select
            aria-label="Metin blok türünü dönüştür"
            value={
              block.type === "heading" || block.type === "heading_element"
                ? Number(block.props.level ?? 2) === 3
                  ? "h3"
                  : "h2"
                : block.type === "text_div"
                  ? "div"
                  : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "h2") onConvertText("heading", 2);
              else if (v === "h3") onConvertText("heading", 3);
              else if (v === "div") onConvertText("div");
              else onConvertText("paragraph");
            }}
            className="h-6 rounded bg-slate-800 px-1.5 text-[10px] text-slate-200 focus:outline-none"
          >
            <option value="p">→ Paragraf</option>
            <option value="h2">→ H2 Başlık</option>
            <option value="h3">→ H3 Alt Başlık</option>
            <option value="div">→ Div</option>
          </select>
        </>
      )}

      {/* GÖRSEL BLOKLARI: Görsel Seç / Değiştir */}
      {isMedia && onOpenMediaPicker && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onOpenMediaPicker(block.id)}
            aria-label="Medya kütüphanesinden görsel seç"
            className="inline-flex h-6 items-center gap-1 rounded bg-blue-600 px-2 text-[10px] font-semibold text-white hover:bg-blue-500"
          >
            <ImageIcon className="h-3 w-3" />
            Görsel Seç
          </button>
        </>
      )}

      {/* ÇOK ÖĞELİ BLOKLAR: + Öğe Ekle */}
      {isRepeater && onAppendRepeaterItem && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onAppendRepeaterItem(block.id)}
            aria-label="Bloğa yeni öğe ekle"
            className="inline-flex h-6 items-center gap-1 rounded bg-emerald-600 px-2 text-[10px] font-semibold text-white hover:bg-emerald-500"
          >
            <Plus className="h-3 w-3" />
            Öğe Ekle
          </button>
        </>
      )}

      <span className="mx-0.5 h-3.5 w-px bg-slate-700" />

      {/* Stil Sekmesi + Çoğalt + Sil */}
      <button
        type="button"
        onClick={() => onOpenStyle(block.id)}
        aria-label="Sağ denetçide stil ve boşluk ayarlarını aç"
        title="Stil & Boşluk Ayarları"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <Paintbrush className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onDuplicate(block.id)}
        aria-label="Bloğu çoğalt"
        title="Çoğalt"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <Copy className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        aria-label="Bloğu sil"
        title="Sil"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-rose-300 hover:bg-rose-600 hover:text-white"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
