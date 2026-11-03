"use client";

import React, { useState } from "react";
import { newBlockId, safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";
import { buildEmptyRow } from "@nexpress/editor";
import { ArrowLeft, ArrowRight, Columns3, Plus, Trash2 } from "lucide-react";
import { DropZone, readPayload, useEditorDnd } from "./dnd";
import { IconPickerField, SvgIconPreview } from "./icon-picker-modal";
import { InsertPoint } from "./quick-insert";

export interface CanvasTabsBlockProps {
  block: BlockNode;
  tokens: DesignTokens;
  renderChild: (child: BlockNode, cIdx: number, cTotal: number, cParent: string) => React.ReactNode;
  onSelect: (id: string) => void;
  onInsertIntoContainer: (block: BlockNode, parentId: string | null) => void;
  onUpdateBlock?: (id: string, updater: (b: BlockNode) => BlockNode) => void;
  onAppendRepeaterItem?: (id: string) => void;
}

/**
 * Görsel Kanvas Sekmeler (`tabs`) Kapsayıcı Bileşeni:
 * - Ziyaretçi ön yüzünde %100 saf CSS radio-tab ile 0 KB JS olarak çalışır.
 * - Editör kanvasında sekmeler arası canlı geçiş, sekme başlığı ve simgesi düzenleme,
 *   ve her sekmenin içine Satır/Sütun (`columns`), Görsel, Buton, Metin vb. alt blok ekleme imkanı sunar.
 */
export function CanvasTabsBlock({
  block,
  tokens,
  renderChild,
  onSelect,
  onInsertIntoContainer,
  onUpdateBlock,
  onAppendRepeaterItem,
}: CanvasTabsBlockProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [overPane, setOverPane] = useState(false);
  const { drop } = useEditorDnd();

  const p = (block.props ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(p.items)
    ? (p.items as Array<Record<string, unknown>>)
    : [];
  const rawPanes = Array.isArray(block.children) ? block.children : [];
  const count = Math.max(rawItems.length, rawPanes.length, 1);
  const safeIdx = Math.min(activeIdx, count - 1);

  const tabStyle = String(p.tabStyle ?? "pills");

  /** Eski `props.items` yapısındaki sekmeleri tam kapsayıcı `children` (`column`) düğümlerine dönüştürür. */
  const materializePanes = (b: BlockNode): { panes: BlockNode[]; items: Array<Record<string, unknown>> } => {
    const bProps = (b.props ?? {}) as Record<string, unknown>;
    const bItems = Array.isArray(bProps.items)
      ? [...(bProps.items as Array<Record<string, unknown>>)]
      : [];
    const bPanes = Array.isArray(b.children) ? [...b.children] : [];
    const total = Math.max(bItems.length, bPanes.length, 1);

    const nextPanes: BlockNode[] = [];
    const nextItems: Array<Record<string, unknown>> = [];

    for (let i = 0; i < total; i++) {
      const existingPane = bPanes[i];
      const existingItem = bItems[i] ?? {};
      const label =
        (typeof existingPane?.props?.label === "string" && existingPane.props.label) ||
        (typeof existingItem.label === "string" && existingItem.label) ||
        `Sekme ${i + 1}`;
      const icon =
        (typeof existingPane?.props?.icon === "string" && existingPane.props.icon) ||
        (typeof existingItem.icon === "string" && existingItem.icon) ||
        "";
      const bodyText =
        typeof existingItem.body === "string" ? existingItem.body : "";
      const titleText =
        typeof existingItem.title === "string" ? existingItem.title : "";

      nextItems.push({ ...existingItem, label, icon: icon || undefined });

      if (existingPane) {
        nextPanes.push({
          ...existingPane,
          props: { ...existingPane.props, label, icon: icon || undefined },
        });
      } else {
        const defaultChildren: BlockNode[] = [];
        if (titleText) {
          defaultChildren.push({
            id: newBlockId("th"),
            type: "heading",
            props: { level: 3, text: titleText },
          });
        }
        defaultChildren.push({
          id: newBlockId("tp"),
          type: "paragraph",
          props: {
            text:
              bodyText ||
              `${label} içeriğini buradan düzenleyin veya alta yeni satır/sütun ekleyin.`,
          },
        });
        nextPanes.push({
          id: newBlockId("tab"),
          type: "column",
          props: { label, icon: icon || undefined },
          children: defaultChildren,
        });
      }
    }

    return { panes: nextPanes, items: nextItems };
  };

  const updateCurrentTabMeta = (patch: { label?: string; icon?: string }) => {
    if (!onUpdateBlock) return;
    onUpdateBlock(block.id, (b) => {
      const { panes, items } = materializePanes(b);
      const targetPane = panes[safeIdx];
      if (!targetPane) return b;
      const nextLabel = patch.label !== undefined ? patch.label : String(targetPane.props?.label ?? "");
      const nextIcon = patch.icon !== undefined ? patch.icon : String(targetPane.props?.icon ?? "");
      panes[safeIdx] = {
        ...targetPane,
        props: { ...targetPane.props, label: nextLabel, icon: nextIcon || undefined },
      };
      items[safeIdx] = {
        ...(items[safeIdx] ?? {}),
        label: nextLabel,
        icon: nextIcon || undefined,
      };
      return {
        ...b,
        props: { ...b.props, items },
        children: panes,
      };
    });
  };

  const moveTab = (dir: -1 | 1) => {
    if (!onUpdateBlock) return;
    const target = safeIdx + dir;
    if (target < 0 || target >= count) return;
    onUpdateBlock(block.id, (b) => {
      const { panes, items } = materializePanes(b);
      const [movedPane] = panes.splice(safeIdx, 1);
      const [movedItem] = items.splice(safeIdx, 1);
      if (movedPane) panes.splice(target, 0, movedPane);
      if (movedItem) items.splice(target, 0, movedItem);
      return { ...b, props: { ...b.props, items }, children: panes };
    });
    setActiveIdx(target);
  };

  const removeTab = () => {
    if (!onUpdateBlock || count <= 1) return;
    onUpdateBlock(block.id, (b) => {
      const { panes, items } = materializePanes(b);
      panes.splice(safeIdx, 1);
      items.splice(safeIdx, 1);
      return { ...b, props: { ...b.props, items }, children: panes };
    });
    setActiveIdx(Math.max(0, safeIdx - 1));
  };

  const insertIntoActiveTab = (newChild: BlockNode) => {
    const existingPane = rawPanes[safeIdx];
    if (existingPane) {
      onInsertIntoContainer(newChild, existingPane.id);
      return;
    }
    if (onUpdateBlock) {
      onUpdateBlock(block.id, (b) => {
        const { panes, items } = materializePanes(b);
        const pane = panes[safeIdx];
        if (pane) {
          panes[safeIdx] = {
            ...pane,
            children: [...(pane.children ?? []), newChild],
          };
        }
        return { ...b, props: { ...b.props, items }, children: panes };
      });
    }
  };

  const tabsMeta = Array.from({ length: count }, (_, i) => {
    const pane = rawPanes[i];
    const item = rawItems[i] ?? {};
    const label =
      (typeof pane?.props?.label === "string" && pane.props.label) ||
      (typeof item.label === "string" && item.label) ||
      `Sekme ${i + 1}`;
    const icon =
      (typeof pane?.props?.icon === "string" && pane.props.icon) ||
      (typeof item.icon === "string" && item.icon) ||
      "";
    const body = typeof item.body === "string" ? item.body : "";
    return { index: i, pane, label, icon, body };
  });

  const activeTab = tabsMeta[safeIdx]!;
  const activePane = activeTab.pane;
  const activeChildren = activePane?.children ?? [];

  return (
    <div
      data-nx-b={safeBlockDomId(block.id)}
      className="space-y-3 rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-2xs"
    >
      {/* Üst Sekme Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabsMeta.map((tab) => {
            const isActive = tab.index === safeIdx;
            return (
              <button
                key={tab.pane?.id ?? `tab-${tab.index}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(tab.index);
                  onSelect(block.id);
                }}
                style={
                  isActive
                    ? {
                        backgroundColor:
                          tabStyle === "underline" ? "transparent" : tokens.colors.primary,
                        color:
                          tabStyle === "underline"
                            ? tokens.colors.primary
                            : tokens.colors.primaryForeground,
                        borderColor: tokens.colors.primary,
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition ${
                  tabStyle === "underline"
                    ? `border-b-2 ${isActive ? "font-bold" : "border-transparent text-slate-600 hover:text-slate-900"}`
                    : `rounded-lg border ${
                        isActive
                          ? "shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`
                }`}
              >
                {tab.icon ? <SvgIconPreview name={tab.icon} size={15} /> : null}
                <span>{tab.label}</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-white/20" : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {(tab.pane?.children ?? []).length}
                </span>
              </button>
            );
          })}

          {onAppendRepeaterItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAppendRepeaterItem(block.id);
                setActiveIdx(count);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-blue-300 bg-blue-50/60 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Yeni Sekme
            </button>
          )}
        </div>
      </div>

      {/* Aktif Sekme Hızlı Düzenleme Şeridi (Başlık, Görsel İkon Seçici, Sıralama) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
            {safeIdx + 1}. Sekme Ayarı:
          </span>
          <input
            type="text"
            value={activeTab.label}
            onChange={(e) => updateCurrentTabMeta({ label: e.target.value })}
            placeholder="Sekme başlığı…"
            aria-label="Aktif sekme başlığı"
            className="h-7 min-w-[150px] rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
          />
          <div className="w-44">
            <IconPickerField
              value={activeTab.icon}
              onChange={(next) => updateCurrentTabMeta({ icon: next })}
              allowEmpty
              label="Sekme simgesi"
              placeholder="Simge seç…"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeIdx === 0}
            onClick={() => moveTab(-1)}
            title="Sekmeyi sola taşı"
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={safeIdx === count - 1}
            onClick={() => moveTab(1)}
            title="Sekmeyi sağa taşı"
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {count > 1 && (
            <button
              type="button"
              onClick={removeTab}
              title="Bu sekmeyi sil"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Aktif Sekme İçerik Kapsayıcısı (Satır, Sütun ve Bloklar Buraya Eklenir) */}
      <div
        onDragOver={(e) => {
          if (!activePane) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          if (!overPane) setOverPane(true);
        }}
        onDragLeave={() => setOverPane(false)}
        onDrop={(e) => {
          if (!activePane) return;
          e.preventDefault();
          e.stopPropagation();
          setOverPane(false);
          const payload = readPayload(e);
          if (payload) drop(payload, activePane.id, activeChildren.length);
        }}
        className={`min-h-[120px] space-y-2 rounded-xl border p-4 transition ${
          overPane
            ? "border-2 border-dashed border-blue-600 bg-blue-50/30"
            : "border-slate-200/90 bg-white"
        }`}
      >
        {activePane ? (
          <>
            <DropZone parentId={activePane.id} index={0} />
            {activeChildren.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 py-6 text-center">
                <span className="text-xs font-medium text-slate-500">
                  &ldquo;{activeTab.label}&rdquo; sekmesi henüz boş — içine satır/sütun veya blok ekleyin
                </span>
              </div>
            ) : (
              activeChildren.map((child, cIdx) => (
                <React.Fragment key={child.id}>
                  {renderChild(child, cIdx, activeChildren.length, activePane.id)}
                  <DropZone parentId={activePane.id} index={cIdx + 1} />
                </React.Fragment>
              ))
            )}
          </>
        ) : (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            {activeTab.body && <p>{activeTab.body}</p>}
          </div>
        )}

        {/* Sekme İçi Hızlı Satır / Sütun ve Blok Ekleme Çubuğu */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-dashed border-slate-200 pt-3"
        >
          <button
            type="button"
            onClick={() => insertIntoActiveTab(buildEmptyRow())}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50/80 px-2.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
          >
            <Columns3 className="h-3.5 w-3.5" />+ Sekmeye Satır / Sütun Ekle
          </button>
          <div className="[&_.invisible]:!visible [&_.invisible]:!inline-flex">
            <InsertPoint onInsert={(b) => insertIntoActiveTab(b)} />
          </div>
        </div>
      </div>
    </div>
  );
}

