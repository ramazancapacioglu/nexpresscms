"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
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
  Sparkles,
  Maximize2,
} from "lucide-react";
import { ToolbarProseAndAi } from "./toolbar-prose-ai";

export interface FloatingToolbarProps {
  block: BlockNode;
  index: number;
  total: number;
  parentId: string | null;
  editor?: Editor | null;
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
  onOpenCreatePattern?: (blockId: string) => void;
  onDetachPattern?: (blockId: string) => void;
}

/**
 * Seçili bloğun üst kısmında yer alan birleşik bağlamsal kontrol ve biçimlendirme çubuğu.
 * Yapısal blok kontrollerini, TipTap zengin metin biçimlendirmesini ve AI yazım/düzenleme
 * aracını tek bir çubukta birleştirir.
 */
export function FloatingToolbar({
  block,
  index,
  total,
  parentId,
  editor,
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
  onOpenCreatePattern,
  onDetachPattern,
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

  const barRef = useRef<HTMLDivElement>(null);
  const [shiftX, setShiftX] = useState(0);
  /** Üstte araç çubuğuna yer yoksa (ilk blok, bitişik bloklar) çubuk bloğun içinde, sol üstte durur: başlığı/üstteki bloğu örtmez. */
  const [inside, setInside] = useState(false);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const updatePosition = () => {
      const doc = el.ownerDocument;
      const win = doc.defaultView;
      if (!win) return;
      const parentEl = el.parentElement;
      if (!parentEl) return;
      const parentRect = parentEl.getBoundingClientRect();
      const barWidth = el.offsetWidth;
      const viewportW = doc.documentElement.clientWidth || win.innerWidth;
      const margin = 12;
      const naturalLeft = parentRect.left;
      const naturalRight = naturalLeft + barWidth;
      let nextShift = 0;
      if (naturalRight > viewportW - margin) {
        nextShift = Math.round(viewportW - margin - naturalRight);
      }
      if (naturalLeft + nextShift < margin) {
        nextShift = Math.round(margin - naturalLeft);
      }
      setShiftX((prev) => (prev === nextShift ? prev : nextShift));
      const above = parentEl.previousElementSibling ?? parentEl.parentElement;
      const gap = above ? parentRect.top - (parentEl.previousElementSibling ? above.getBoundingClientRect().bottom : above.getBoundingClientRect().top) : 0;
      setInside(gap < 44);
    };
    updatePosition();
    const win = el.ownerDocument.defaultView;
    win?.addEventListener("resize", updatePosition);
    return () => win?.removeEventListener("resize", updatePosition);
  }, [block.id, block.type, Boolean(editor)]);

  return (
    <div
      ref={barRef}
      onClick={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
      data-nx-toolbar="block"
      style={{ left: `${inside ? shiftX + 8 : shiftX}px` }}
      className={`
        absolute ${inside ? "top-2" : "-top-10"} z-50 flex w-max max-w-[calc(100vw-24px)]
        flex-nowrap items-center gap-0.5 overflow-visible rounded-lg
        border border-slate-700/90 bg-slate-900/98 px-1.5 py-1
        text-[11px] whitespace-nowrap text-white shadow-2xl backdrop-blur-md select-none
      `}
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

      {/* SÜTUN (column): Hızlı Yüzdelik Genişlik Seçici */}
      {block.type === "column" && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <span className="text-[10px] text-slate-400 font-medium">Genişlik:</span>
          <div className="flex items-center gap-0.5 rounded bg-slate-800/80 p-0.5">
            {([20, 25, 33, 50, 66, 75, 100] as const).map((pct) => {
              const currentPct = Number(block.props.widthPct ?? 50);
              const isActive = Math.round(currentPct) === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateProp(block.id, "widthPct", pct)}
                  aria-label={`Sütun genişliği %${pct}`}
                  title={`Sütun genişliğini %${pct} yap`}
                  className={`h-5 rounded px-1.5 text-[10px] font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  %{pct}
                </button>
              );
            })}
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

      {/* BİRLEŞİK METİN ETİKETİ, ZENGİN METİN VE AI YAZ/DÜZENLE ÇUBUĞU */}
      <ToolbarProseAndAi
        block={block}
        editor={editor}
        onUpdateProp={onUpdateProp}
        onConvertText={onConvertText}
      />

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

      {/* GÖRSEL ÖLÇEKLENDİRME & BOYUT */}
      {block.type === "image_figure" && (
        <>
          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <div className="flex items-center gap-0.5 rounded bg-slate-800/80 p-0.5">
            {(["25%", "50%", "75%", "100%"] as const).map((pct) => {
              const currentWidth = String(block.props.width ?? "100%");
              const isActive = currentWidth === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdateProp(block.id, "width", pct)}
                  aria-label={`Görsel genişliği ${pct}`}
                  title={`Görsel genişliğini ${pct} yap`}
                  className={`h-5 rounded px-1.5 text-[10px] font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {pct}
                </button>
              );
            })}
          </div>

          <span className="mx-0.5 h-3.5 w-px bg-slate-700" />
          <div className="flex items-center gap-0.5">
            {(
              [
                ["left", "Sola hizala", AlignLeft],
                ["center", "Ortala", AlignCenter],
                ["right", "Sağa hizala", AlignRight],
                ["full", "Tam genişlik", Maximize2],
              ] as const
            ).map(([a, label, Icon]) => {
              const currentAlign = String(block.props.align ?? "left");
              const isAlignActive = currentAlign === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    onUpdateProp(block.id, "align", a);
                    if (a === "full") onUpdateProp(block.id, "width", "100%");
                  }}
                  aria-label={label}
                  title={label}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded transition ${
                    isAlignActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </button>
              );
            })}
          </div>
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

      {/* Senkronize Model (Synced Pattern) Kontrolleri */}
      {block.type === "synced_pattern" ? (
        <>
          <span className="inline-flex items-center gap-1 rounded bg-purple-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Sparkles className="h-3 w-3" />
            Model
          </span>
          {block.props?.patternId ? (
            <a
              href={`/admin/contents?id=${block.props.patternId}&type=template`}
              target="_blank"
              rel="noopener noreferrer"
              title="Bu modeli ana şablon stüdyosunda düzenleyin (tüm sayfalarda güncellenir)"
              className="inline-flex h-6 items-center gap-1 rounded bg-slate-800 px-2 text-[10px] text-purple-300 hover:bg-purple-900 hover:text-white"
            >
              Modeli Düzenle ↗
            </a>
          ) : null}
          {onDetachPattern && (
            <button
              type="button"
              onClick={() => onDetachPattern(block.id)}
              title="Model bağlantısını kopar: Bu sayfada bağımsız bloklara dönüştürür"
              className="inline-flex h-6 items-center gap-1 rounded bg-slate-800 px-2 text-[10px] text-amber-300 hover:bg-amber-900 hover:text-white"
            >
              Bağlantıyı Kopar
            </button>
          )}
        </>
      ) : (
        onOpenCreatePattern && (
          <button
            type="button"
            onClick={() => onOpenCreatePattern(block.id)}
            aria-label="Bu bloğu ortak senkronize model olarak kaydet"
            title="Model Oluştur (Birden fazla sayfada ortak kullanın, tek yerden güncelleyin)"
            className="inline-flex h-6 items-center gap-1 rounded bg-purple-600/80 px-1.5 text-[10px] font-semibold text-white hover:bg-purple-600"
          >
            <Sparkles className="h-3 w-3 text-purple-200" />
            <span>{isText ? "Model" : "Model Oluştur"}</span>
          </button>
        )
      )}

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
