"use client";

import React, { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  canAppendRepeaterItem,
  safeBlockDomId,
  toCssVarTokens,
  type BlockNode,
  type BlockStyleValues,
  type DesignTokens,
  type DeviceKey,
} from "@nexpress/core";
import { RscSingleBlock } from "@nexpress/themes";
import { GripVertical, Image as ImageIcon, Plus } from "lucide-react";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import { FloatingToolbar } from "./floating-toolbar";
import { InlineEditable } from "./inline-editable";
import { ProseField } from "./prose-field";
import { SlashMenu } from "./slash-menu";
import { DropZone, readPayload, useEditorDnd } from "./dnd";
import { InsertPoint } from "./quick-insert";
import { RowLayoutPicker } from "./row-layout-picker";
import { CanvasTabsBlock } from "./canvas-tabs-block";
import { CanvasImageScaler, ColumnSplitterHandle } from "./canvas-block-helpers";
import { usePageSchema } from "./page-schema-context";

const SPAN_CLASSES: Record<number, string> = {
  1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4",
  5: "col-span-5", 6: "col-span-6", 7: "col-span-7", 8: "col-span-8",
  9: "col-span-9", 10: "col-span-10", 11: "col-span-11", 12: "col-span-12",
};

const PROSE_TEXT_KEY: Partial<Record<BlockNode["type"], string>> = {
  heading: "text",
  heading_element: "text",
  paragraph: "text",
  paragraph_element: "text",
  text_div: "text",
  quote: "quote",
  tldr_box: "summary",
};

export interface CanvasBlockProps {
  block: BlockNode;
  index: number;
  total: number;
  parentId: string | null;
  selectedId: string | null;
  deviceViewport: DeviceKey;
  tokens: DesignTokens;
  proseSyncToken: number;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateProp: (id: string, key: string, value: unknown, recordHistory?: boolean) => void;
  onUpdateProps: (id: string, patch: Record<string, unknown>, recordHistory?: boolean) => void;
  onUpdateStyle: (id: string, patch: Partial<BlockStyleValues>) => void;
  onConvertText: (id: string, kind: "paragraph" | "heading" | "div", level?: number) => void;
  onCommitHistory: () => void;
  onOpenStyleInspector: (id: string) => void;
  onReplaceWithBlock: (id: string, newBlock: BlockNode) => void;
  onApplyColumnPreset: (blockId: string, presetId: string) => void;
  onInsertIntoContainer: (block: BlockNode, parentId: string | null) => void;
  onOpenMediaPicker?: (blockId: string) => void;
  onOpenLibrary?: () => void;
  onAppendRepeaterItem?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updater: (b: BlockNode) => BlockNode) => void;
  onOpenCreatePattern?: (blockId: string) => void;
  onDetachPattern?: (blockId: string) => void;
}

export function CanvasBlock(props: CanvasBlockProps) {
  const {
    block,
    index,
    total,
    parentId,
    selectedId,
    deviceViewport,
    tokens,
    proseSyncToken,
    onSelect,
    onMove,
    onDuplicate,
    onRemove,
    onUpdateProp,
    onUpdateProps,
    onUpdateStyle,
    onConvertText,
    onCommitHistory,
    onOpenStyleInspector,
    onReplaceWithBlock,
    onApplyColumnPreset,
    onInsertIntoContainer,
    onOpenMediaPicker,
    onOpenLibrary,
    onAppendRepeaterItem,
    onUpdateBlock,
    onOpenCreatePattern,
    onDetachPattern,
  } = props;

  const [showRowPicker, setShowRowPicker] = useState(false);
  const [dropSide, setDropSide] = useState<"before" | "after" | null>(null);
  const [overColId, setOverColId] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [colWidthOverrides, setColWidthOverrides] = useState<Record<string, number> | null>(null);
  const { begin, drop } = useEditorDnd();
  const pageSchema = usePageSchema();

  const isSelected = selectedId === block.id;
  const span = block.gridSpan?.[deviceViewport] ?? block.gridSpan?.desktop ?? 12;
  const spanClass = SPAN_CLASSES[span] || "col-span-12";
  const rawHide = block.style?.hideOn;
  const hiddenNow = Array.isArray(rawHide)
    ? rawHide.includes(deviceViewport)
    : Boolean(rawHide?.[deviceViewport]);
  const domId = safeBlockDomId(block.id);
  const proseKey = PROSE_TEXT_KEY[block.type];

  const renderChild = (child: BlockNode, cIdx: number, cTotal: number, cParent: string) => (
    <CanvasBlock
      key={child.id}
      {...props}
      block={child}
      index={cIdx}
      total={cTotal}
      parentId={cParent}
    />
  );

  const isEmptyRow = block.type === "columns" && (block.children ?? []).length === 0;
  const isEmptyImage =
    block.type === "image_figure" && !String(block.props.url ?? "").trim();

  const rawProseText = proseKey ? String(block.props[proseKey] ?? "") : "";
  const showSlash =
    (block.type === "paragraph" || block.type === "paragraph_element") &&
    rawProseText.startsWith("/") &&
    !rawProseText.includes(" ");

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const nextSide = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
        if (dropSide !== nextSide) setDropSide(nextSide);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDropSide(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const side = dropSide ?? "after";
        setDropSide(null);
        const payload = readPayload(e);
        if (!payload) return;
        if (payload.kind === "move" && payload.id === block.id) return;
        drop(payload, parentId, side === "before" ? index : index + 1);
      }}
      className={`${spanClass} group/blk relative rounded-lg transition-all ${
        isSelected
          ? "z-10 bg-blue-500/[0.05] outline-[3px] outline-offset-2 outline-blue-600 shadow-[0_0_0_8px_rgba(37,99,235,0.14)]"
          : "hover:outline-1 hover:outline-dashed hover:outline-blue-400/75"
      } ${
        dropSide === "before"
          ? "before:pointer-events-none before:absolute before:-top-1 before:right-0 before:left-0 before:z-30 before:h-1 before:rounded-full before:bg-blue-600"
          : dropSide === "after"
            ? "after:pointer-events-none after:absolute after:right-0 after:-bottom-1 after:left-0 after:z-30 after:h-1 after:rounded-full after:bg-blue-600"
            : ""
      } ${hiddenNow ? "opacity-40" : ""}`}
    >
      {/* Seçili Olmayan Bloklar İçin Doğrudan Sürükle-Taşı ve Hızlı Seçim Rozeti */}
      {!isSelected && (
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            begin(e, { kind: "move", id: block.id }, e.currentTarget.parentElement);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(block.id);
          }}
          title="Sürükleyip başka bir satır veya sütuna taşıyın"
          className="absolute -top-5 left-2 z-20 hidden h-5 cursor-grab items-center gap-1 rounded-t bg-slate-800/90 px-2 text-[10px] font-semibold text-white opacity-0 shadow-xs transition select-none group-hover/blk:flex group-hover/blk:opacity-100 active:cursor-grabbing hover:bg-blue-600"
        >
          <GripVertical className="h-3 w-3 opacity-80" />
          <span>
            {block.type === "columns"
              ? `Satır (${String(block.props.layout ?? "6+6")})`
              : BLOCK_TYPE_LABELS[block.type] ?? block.type}
          </span>
          {block.style?.anchorId ? (
            <span className="ml-1 rounded bg-blue-500 px-1 py-0.2 font-mono text-[9px] font-bold text-white">
              #{block.style.anchorId}
            </span>
          ) : null}
        </div>
      )}

      {block.style?.anchorId ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onSelect(block.id);
          }}
          title="Bu bölümün HTML çapa kimliği (Yapışkan çapa menüsü hedefi)"
          className=" absolute right-2 -top-2.5 z-20 inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-500/40 bg-blue-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs"
        >
          <span>#{block.style.anchorId}</span>
        </span>
      ) : null}

      {hiddenNow && (
        <span className="pointer-events-none absolute right-2 top-2 z-20 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {deviceViewport} görünümde gizli
        </span>
      )}

      {isSelected && (
        <FloatingToolbar
          block={block}
          index={index}
          total={total}
          parentId={parentId}
          editor={activeEditor}
          onDragStart={(e) => begin(e, { kind: "move", id: block.id })}
          onSelectParent={parentId ? () => onSelect(parentId) : undefined}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onUpdateProp={(id, key, val) => onUpdateProp(id, key, val, true)}
          onUpdateStyle={onUpdateStyle}
          onConvertText={(kind, lvl) => onConvertText(block.id, kind, lvl)}
          onOpenStyle={onOpenStyleInspector}
          onApplyColumnPreset={onApplyColumnPreset}
          onToggleRowPicker={
            block.type === "columns" ? () => setShowRowPicker((v) => !v) : undefined
          }
          onOpenMediaPicker={onOpenMediaPicker}
          onAppendRepeaterItem={onAppendRepeaterItem}
          onOpenCreatePattern={onOpenCreatePattern}
          onDetachPattern={onDetachPattern}
        />
      )}

      {/* 1. SATIR & SÜTUNLAR (`columns`) */}
      {block.type === "columns" && (
        <div data-nx-b={domId} className="rounded-lg py-1">
          {isEmptyRow || showRowPicker ? (
            <RowLayoutPicker
              currentLayout={String(block.props.layout ?? "")}
              onSelectPreset={(presetId) => {
                onApplyColumnPreset(block.id, presetId);
                setShowRowPicker(false);
              }}
              onOpenLibrary={onOpenLibrary}
              onClose={!isEmptyRow ? () => setShowRowPicker(false) : undefined}
            />
          ) : (
            <div
              ref={rowRef}
              className="flex flex-col md:flex-row relative items-stretch"
              style={{
                gap: String(block.props.gap ?? "24px"),
                alignItems:
                  block.props.verticalAlign === "center"
                    ? "center"
                    : block.props.verticalAlign === "bottom" ||
                        block.props.verticalAlign === "end"
                      ? "flex-end"
                      : "stretch",
              }}
            >
              {(block.children ?? []).map((col, colIdx) => {
                const widthPct =
                  colWidthOverrides?.[col.id] ??
                  Number(
                    col.props?.widthPct ?? Math.round(100 / (block.children?.length || 1))
                  );
                const colSelected = selectedId === col.id;
                const colChildren = col.children ?? [];
                return (
                  <React.Fragment key={col.id}>
                    <div
                      data-nx-b={safeBlockDomId(col.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(col.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        if (overColId !== col.id) setOverColId(col.id);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          setOverColId((prev) => (prev === col.id ? null : prev));
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOverColId(null);
                        const payload = readPayload(e);
                        if (payload) drop(payload, col.id, colChildren.length);
                      }}
                      style={{
                        flexBasis: `${widthPct}%`,
                        flexGrow: 1,
                      }}
                      className={`group/col relative flex min-h-[72px] min-w-0 flex-col rounded-lg transition-colors ${
                        overColId === col.id
                          ? "bg-blue-50/40 outline-2 outline-dashed outline-blue-600"
                          : colSelected
                            ? "z-10 bg-blue-500/[0.06] outline-[3px] outline-offset-2 outline-blue-600 shadow-[0_0_0_8px_rgba(37,99,235,0.16)]"
                            : "hover:outline-1 hover:outline-dashed hover:outline-slate-300"
                      }`}
                    >
                      {colSelected && (
                        <span className="pointer-events-none absolute -top-3 left-3 z-30 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                          Seçili sütun {colIdx + 1} · %{Math.round(widthPct)}
                        </span>
                      )}
                      {/* Sütun Seçiliyse Yüzen Araç Çubuğu */}
                      {colSelected && (
                        <FloatingToolbar
                          block={col}
                          index={colIdx}
                          total={(block.children ?? []).length}
                          parentId={block.id}
                          onSelectParent={() => onSelect(block.id)}
                          onMove={onMove}
                          onDuplicate={onDuplicate}
                          onRemove={onRemove}
                          onUpdateProp={(id, key, val) => onUpdateProp(id, key, val, true)}
                          onUpdateStyle={onUpdateStyle}
                          onOpenStyle={onOpenStyleInspector}
                        />
                      )}

                      {/* Sütun Üzerine Gelindiğinde Küçük Sütun Seçim Rozeti */}
                      {!colSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(col.id);
                          }}
                          className="absolute right-1.5 top-1.5 z-10 hidden h-5 items-center rounded bg-slate-900/75 px-1.5 text-[9px] font-semibold text-white opacity-0 transition group-hover/col:inline-flex group-hover/col:opacity-100 hover:bg-blue-600"
                        >
                          {colIdx + 1}. Sütun (%{Math.round(widthPct)})
                        </button>
                      )}

                      <div className="flex flex-1 flex-col gap-2">
                        <DropZone parentId={col.id} index={0} />
                        {colChildren.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300/90 bg-slate-50/50 py-6">
                            <span className="text-[11px] font-medium text-slate-400">
                              {colIdx + 1}. Sütun (%{Math.round(widthPct)})
                            </span>
                            <div className="[&_.invisible]:!visible [&_.invisible]:!inline-flex">
                              <InsertPoint
                                onInsert={(b) => onInsertIntoContainer(b, col.id)}
                              />
                            </div>
                          </div>
                        ) : (
                          colChildren.map((child, cIdx) => (
                            <React.Fragment key={child.id}>
                              {renderChild(child, cIdx, colChildren.length, col.id)}
                              <DropZone parentId={col.id} index={cIdx + 1} />
                            </React.Fragment>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Sütunlar Arası Mouse ile Tutup Genişletip-Daraltma Tutamacı */}
                    {colIdx < (block.children?.length ?? 0) - 1 && (
                      <ColumnSplitterHandle
                        leftColId={col.id}
                        rightColId={block.children![colIdx + 1]!.id}
                        leftPct={widthPct}
                        rightPct={
                          colWidthOverrides?.[block.children![colIdx + 1]!.id] ??
                          Number(
                            block.children![colIdx + 1]!.props?.widthPct ??
                              Math.round(100 / (block.children?.length || 1))
                          )
                        }
                        rowRef={rowRef}
                        onResizeMove={(lId, lPct, rId, rPct) => {
                          setColWidthOverrides((prev) => ({
                            ...prev,
                            [lId]: lPct,
                            [rId]: rPct,
                          }));
                        }}
                        onResizeEnd={(lId, lPct, rId, rPct) => {
                          setColWidthOverrides(null);
                          onUpdateProp(lId, "widthPct", lPct, true);
                          onUpdateProp(rId, "widthPct", rPct, true);
                          onUpdateProp(block.id, "layout", "custom", true);
                          onCommitHistory();
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. KAPSAYICI BÖLÜM (`section`) */}
      {block.type === "section" && (
        <div data-nx-b={domId} className="rounded-xl p-6 transition-all">
          <div className="space-y-2">
            <DropZone parentId={block.id} index={0} />
            {(block.children ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300/90 bg-white/60 py-8">
                <span className="text-xs text-slate-400">
                  Bu kapsayıcı bölüm henüz boş
                </span>
                <div className="[&_.invisible]:!visible [&_.invisible]:!inline-flex">
                  <InsertPoint
                    onInsert={(b) => onInsertIntoContainer(b, block.id)}
                  />
                </div>
              </div>
            ) : (
              (block.children ?? []).map((child, cIdx) => (
                <React.Fragment key={child.id}>
                  {renderChild(
                    child,
                    cIdx,
                    (block.children ?? []).length,
                    block.id
                  )}
                  <DropZone parentId={block.id} index={cIdx + 1} />
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2B. ETKİLEŞİMLİ KAPSAYICI SEKMELER (`tabs`) */}
      {block.type === "tabs" && (
        <CanvasTabsBlock
          block={block}
          tokens={tokens}
          renderChild={renderChild}
          onSelect={onSelect}
          onInsertIntoContainer={onInsertIntoContainer}
          onUpdateBlock={onUpdateBlock}
          onAppendRepeaterItem={onAppendRepeaterItem}
        />
      )}

      {/* 2C. SENKRONİZE MODEL (`synced_pattern`) */}
      {block.type === "synced_pattern" && (
        <div data-nx-b={domId} className="rounded-xl border-2 border-purple-400/80 bg-purple-50/20 p-4 transition-all dark:bg-purple-950/10 dark:border-purple-600/60">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-200/60 dark:border-purple-800/40">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white shadow-xs text-xs">
                ✨
              </span>
              <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Senkronize Model: {String(block.props?.title ?? "Ortak Model")}
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                Global Akıllı Blok
              </span>
            </div>
            <div className="flex items-center gap-2">
              {block.props?.patternId ? (
                <a
                  href={`/admin/contents?id=${block.props.patternId}&type=template`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 underline"
                >
                  Ana Modeli Düzenle ↗
                </a>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            {(block.children ?? []).length === 0 ? (
              <div className="p-6 rounded-lg bg-background/80 border border-dashed border-purple-300 text-center text-xs text-muted-foreground">
                Model içeriği ana şablondan senkronize ediliyor
              </div>
            ) : (
              (block.children ?? []).map((child, cIdx) => (
                <React.Fragment key={child.id}>
                  {renderChild(child, cIdx, (block.children ?? []).length, block.id)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. METİN BLOKLARI (TipTap Satır İçi Zengin Metin) */}
      {block.type !== "columns" && block.type !== "section" && block.type !== "tabs" && block.type !== "synced_pattern" && proseKey && (
        <div
          data-nx-b={domId}
          className={`relative ${
            block.type === "heading" || block.type === "heading_element"
              ? Number(block.props.level ?? 2) === 1
                ? "text-3xl font-extrabold tracking-tight"
                : Number(block.props.level ?? 2) === 3
                  ? "text-xl font-bold"
                  : Number(block.props.level ?? 2) === 4
                    ? "text-lg font-semibold"
                    : "text-2xl font-bold tracking-tight"
              : block.type === "tldr_box"
                ? "rounded-xl border border-blue-200 bg-blue-50/60 p-4"
                : block.type === "quote"
                  ? "border-l-4 border-blue-600 pl-4"
                  : ""
          }`}
        >
          <ProseField
            text={rawProseText}
            html={
              typeof block.props.html === "string"
                ? block.props.html
                : undefined
            }
            placeholder={
              block.type === "heading" || block.type === "heading_element"
                ? "Başlık yazın…"
                : block.type === "quote"
                  ? "Alıntı metni yazın…"
                  : block.type === "tldr_box"
                    ? "Kısa yanıt özeti yazın…"
                    : "Metin yazın veya blok seçmek için '/' tuşuna basın…"
            }
            variant={
              block.type === "heading" || block.type === "heading_element"
                ? "inline"
                : block.type === "quote"
                  ? "quote"
                  : "paragraph"
            }
            syncToken={proseSyncToken}
            onEditorReady={setActiveEditor}
            structure={
              block.type === "heading" ||
              block.type === "heading_element" ||
              block.type === "paragraph" ||
              block.type === "paragraph_element" ||
              block.type === "text_div"
                ? {
                    kind:
                      block.type === "heading" ||
                      block.type === "heading_element"
                        ? "heading"
                        : block.type === "text_div"
                          ? "div"
                          : "paragraph",
                    level: Number(block.props.level ?? 2),
                    onChange: (kind, lvl) => onConvertText(block.id, kind, lvl),
                  }
                : undefined
            }
            onChange={({ text, html }) =>
              onUpdateProps(block.id, { [proseKey]: text, html }, false)
            }
            onCommit={onCommitHistory}
          />
          {block.type === "quote" && (
            <div className="mt-2 flex gap-2 text-xs text-slate-500">
              <input
                type="text"
                value={String(block.props.author ?? "")}
                onChange={(e) =>
                  onUpdateProp(block.id, "author", e.target.value, true)
                }
                placeholder="Yazar adı…"
                aria-label="Alıntı yazarı"
                className="border-b border-transparent bg-transparent focus:border-slate-300 focus:outline-none"
              />
              <span>·</span>
              <input
                type="text"
                value={String(block.props.role ?? "")}
                onChange={(e) =>
                  onUpdateProp(block.id, "role", e.target.value, true)
                }
                placeholder="Unvan / kaynak…"
                aria-label="Alıntı unvanı veya kaynağı"
                className="border-b border-transparent bg-transparent focus:border-slate-300 focus:outline-none"
              />
            </div>
          )}
          {showSlash && (
            <SlashMenu
              query={rawProseText.slice(1)}
              onPick={(item) => onReplaceWithBlock(block.id, item)}
            />
          )}
        </div>
      )}

      {/* 4. DİĞER TÜM YAPRAK BLOKLAR (Gerçek Tema Görünümü + Satır İçi Düzenleme) */}
      {block.type !== "columns" && block.type !== "section" && block.type !== "tabs" && block.type !== "synced_pattern" && !proseKey && (
        <div className="relative">
          {isEmptyImage && onOpenMediaPicker ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
                onOpenMediaPicker(block.id);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/90 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Medya Kütüphanesinden Görsel Seçin veya Yükleyin
              </span>
              <span className="text-[11px] text-slate-400">
                Tıklayarak medya seçiciyi açın
              </span>
            </div>
          ) : block.type === "image_figure" ? (
            <CanvasImageScaler
              block={block}
              tokens={tokens}
              pageSchema={pageSchema}
              isSelected={isSelected}
              onUpdateProp={onUpdateProp}
              onCommitHistory={onCommitHistory}
            />
          ) : (
            <InlineEditable
              block={block}
              onChange={(key, value) => onUpdateProp(block.id, key, value, false)}
              onCommit={onCommitHistory}
            >
              <RscSingleBlock
                block={block}
                themeId="corporate-clean"
                tokens={toCssVarTokens(tokens)}
                isEditorial={false}
                isCommerce={false}
                pageSchema={pageSchema}
                preview
              />
            </InlineEditable>
          )}

          {/* Çok Öğeli Bloklar İçin Kanvas Altı "+ Yeni Öğe Ekle" Çubuğu */}
          {isSelected && canAppendRepeaterItem(block.type) && onAppendRepeaterItem && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 flex justify-center"
            >
              <button
                type="button"
                onClick={() => onAppendRepeaterItem(block.id)}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 text-[11px] font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-600 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Öğe Ekle ({BLOCK_TYPE_LABELS[block.type]})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
