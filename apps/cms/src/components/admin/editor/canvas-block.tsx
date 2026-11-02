"use client";

import { usePageSchema } from "./page-schema-context";
import {
  safeBlockDomId,
  type BlockNode,
  type DesignTokens,
} from "@nexpress/core";
import { ATOMIC_ELEMENTS_QUICK_BAR } from "@nexpress/editor";
import { RscBlockRenderer } from "@nexpress/themes";
import { ArrowDown, ArrowUp, Columns, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Fragment, type DragEvent, type MouseEvent } from "react";
import { DropZone, useEditorDnd } from "./dnd";
import { ProseField, type ProseStructureKind } from "./prose-field";
import { BLOCK_TYPE_LABELS, COLUMN_LAYOUT_PRESETS } from "./studio-model";

interface CanvasBlockProps {
  block: BlockNode;
  selectedId: string | null;
  activeColumnInsertId: string | null;
  tokens: DesignTokens;
  syncToken: number;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onChangeLayout: (id: string, layoutId: string) => void;
  onUpdateProps: (id: string, patch: Record<string, unknown>) => void;
  onConvertText: (id: string, kind: ProseStructureKind, level?: number) => void;
  onCommit: () => void;
  onInsert: (template: Omit<BlockNode, "id"> | BlockNode, parentId: string | null) => void;
  onToggleInsert: (columnId: string | null) => void;
  onInspectStyle: (id: string) => void;
}

function BlockActions({
  onUp,
  onDown,
  onDuplicate,
  onRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const stop = (event: MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };
  return (
    <div className="flex items-center gap-1">
      <button type="button" title="Yukarı" className="rounded p-1 hover:bg-background" onClick={(event) => stop(event, onUp)}>
        <ArrowUp className="h-3 w-3" />
      </button>
      <button type="button" title="Aşağı" className="rounded p-1 hover:bg-background" onClick={(event) => stop(event, onDown)}>
        <ArrowDown className="h-3 w-3" />
      </button>
      <button type="button" title="Çoğalt" className="rounded p-1 hover:bg-background" onClick={(event) => stop(event, onDuplicate)}>
        <Copy className="h-3 w-3" />
      </button>
      <button type="button" title="Sil" className="rounded p-1 text-rose-600 hover:bg-rose-500/10" onClick={(event) => stop(event, onRemove)}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export function CanvasBlock(props: CanvasBlockProps) {
  const { block } = props;
  const pageSchema = usePageSchema();
  const selected = props.selectedId === block.id;
  const domId = safeBlockDomId(block.id);
  const propsOf = block.props ?? {};
  const { begin } = useEditorDnd();
  /** Başlık çubuğundan tutup sürüklemek bloğu taşır (tüm blok sürükleme görüntüsü olur). */
  const dragProps = {
    draggable: true,
    title: "Sürükleyerek taşı",
    onDragStart: (event: DragEvent<HTMLElement>) => {
      event.stopPropagation();
      begin(event, { kind: "move", id: block.id }, event.currentTarget.parentElement);
    },
  };

  const select = (event: MouseEvent) => {
    event.stopPropagation();
    props.onSelect(block.id);
  };

  if (block.type === "columns") {
    const columns = block.children ?? [];
    const layout = String(propsOf.layout ?? "6+6");
    return (
      <div
        data-nx-b={domId}
        onClick={select}
        className={`relative rounded-xl border-2 p-3 transition-all ${
          selected
            ? "border-blue-600 bg-blue-500/[0.02] shadow-sm"
            : "border-dashed border-slate-300 hover:border-blue-400 dark:border-zinc-700"
        }`}
      >
        <div {...dragProps} className="mb-3 flex cursor-grab flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/70 px-2.5 py-1.5 text-[11px] active:cursor-grabbing">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
              <Columns className="h-3.5 w-3.5" />
              Satır ({layout})
            </span>
            <div className="hidden items-center gap-1 border-l border-border pl-2 sm:flex">
              {COLUMN_LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onChangeLayout(block.id, preset.id);
                  }}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    layout === preset.id
                      ? "bg-blue-600 text-white"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {preset.id}
                </button>
              ))}
            </div>
          </div>
          <BlockActions
            onUp={() => props.onMove(block.id, "up")}
            onDown={() => props.onMove(block.id, "down")}
            onDuplicate={() => props.onDuplicate(block.id)}
            onRemove={() => props.onRemove(block.id)}
          />
        </div>
        <div className="flex flex-col items-stretch md:flex-row" style={{ gap: String(propsOf.gap ?? "24px") }}>
          {columns.map((column, index) => {
            const width = Number(column.props?.widthPct ?? 100 / Math.max(1, columns.length));
            const columnSelected = props.selectedId === column.id;
            const children = column.children ?? [];
            return (
              <div
                key={column.id}
                data-nx-b={safeBlockDomId(column.id)}
                style={{ flexBasis: `${width}%` }}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onSelect(column.id);
                }}
                className={`flex min-w-0 flex-1 flex-col justify-between rounded-lg border p-3 ${
                  columnSelected
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-dashed border-slate-300/80 hover:border-blue-400/70"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1 font-mono text-[10px] text-muted-foreground">
                    <span>Sütun {index + 1} · {Math.round(width)}%</span>
                    <button
                      type="button"
                      className="font-sans font-medium text-blue-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        props.onInspectStyle(column.id);
                      }}
                    >
                      Sütun stili
                    </button>
                  </div>
                  <div className="space-y-3">
                    {children.length === 0 ? (
                      <DropZone parentId={column.id} index={0} large label="Bu sütun boş — blok sürükleyin" />
                    ) : (
                      <>
                        <DropZone parentId={column.id} index={0} />
                        {children.map((child, at) => (
                          <Fragment key={child.id}>
                            <CanvasBlock {...props} block={child} />
                            <DropZone parentId={column.id} index={at + 1} />
                          </Fragment>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-border/50 pt-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onToggleInsert(props.activeColumnInsertId === column.id ? null : column.id);
                    }}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-blue-500/40 bg-blue-500/5 py-1.5 text-[11px] font-semibold text-blue-600"
                  >
                    <Plus className="h-3 w-3" />
                    Sütuna element ekle
                  </button>
                  {props.activeColumnInsertId === column.id ? (
                    <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
                      {ATOMIC_ELEMENTS_QUICK_BAR.filter(
                        (item) => item.block.type !== "columns" && item.block.type !== "section"
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            props.onInsert(item.block, column.id);
                          }}
                          className="truncate rounded px-2 py-1.5 text-left text-[11px] font-medium hover:bg-muted"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "section") {
    const children = block.children ?? [];
    return (
      <div
        data-nx-b={domId}
        onClick={select}
        className={`relative rounded-xl border-2 p-4 ${
          selected ? "border-blue-600 shadow-sm" : "border-dashed border-indigo-400/60"
        }`}
      >
        <div {...dragProps} className="mb-3 flex cursor-grab items-center justify-between rounded-md bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 active:cursor-grabbing">
          <span className="inline-flex items-center gap-1"><GripVertical className="h-3.5 w-3.5" aria-hidden />Kapsayıcı bölüm</span>
          <BlockActions
            onUp={() => props.onMove(block.id, "up")}
            onDown={() => props.onMove(block.id, "down")}
            onDuplicate={() => props.onDuplicate(block.id)}
            onRemove={() => props.onRemove(block.id)}
          />
        </div>
        <div className="space-y-4">
          {children.length === 0 ? (
            <DropZone parentId={block.id} index={0} large label="Bölüm boş — blok sürükleyin" />
          ) : (
            <>
              <DropZone parentId={block.id} index={0} />
              {children.map((child, at) => (
                <Fragment key={child.id}>
                  <CanvasBlock {...props} block={child} />
                  <DropZone parentId={block.id} index={at + 1} />
                </Fragment>
              ))}
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
          {ATOMIC_ELEMENTS_QUICK_BAR.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                props.onInsert(item.block, block.id);
              }}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-medium hover:border-blue-500"
            >
              <Plus className="h-2.5 w-2.5 text-blue-600" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <article
      onClick={select}
      className={`relative rounded-xl border bg-white transition-all dark:bg-zinc-900 ${
        selected
          ? "border-blue-600 shadow-sm ring-2 ring-blue-500/20"
          : "border-slate-200 hover:border-blue-400 dark:border-zinc-800"
      }`}
    >
      <div
        {...dragProps}
        className={`flex cursor-grab items-center justify-between border-b px-3 py-1.5 text-[11px] active:cursor-grabbing ${
          selected
            ? "border-blue-500/20 bg-blue-500/5 text-blue-700"
            : "border-slate-100 bg-slate-50/70 text-muted-foreground"
        }`}
      >
        <span className="inline-flex items-center gap-1 font-semibold"><GripVertical className="h-3.5 w-3.5 opacity-60" aria-hidden />{BLOCK_TYPE_LABELS[block.type] ?? block.type}</span>
        <BlockActions
          onUp={() => props.onMove(block.id, "up")}
          onDown={() => props.onMove(block.id, "down")}
          onDuplicate={() => props.onDuplicate(block.id)}
          onRemove={() => props.onRemove(block.id)}
        />
      </div>
      <div className="p-4" data-nx-b={domId}>
        {block.type === "heading" || block.type === "heading_element" ? (
          <div
            className={
              Number(propsOf.level ?? 2) === 3
                ? "text-xl font-bold"
                : Number(propsOf.level ?? 2) === 4
                  ? "text-lg font-semibold"
                  : "text-2xl font-bold"
            }
          >
            <ProseField
              variant="inline"
              text={String(propsOf.text ?? "")}
              html={typeof propsOf.html === "string" ? propsOf.html : undefined}
              placeholder="Başlık"
              syncToken={props.syncToken}
              structure={{
                kind: "heading",
                level: Number(propsOf.level ?? 2),
                onChange: (kind, level) => props.onConvertText(block.id, kind, level),
              }}
              onChange={(value) =>
                props.onUpdateProps(block.id, { text: value.text, html: value.html })
              }
              onCommit={props.onCommit}
            />
          </div>
        ) : block.type === "paragraph" ||
          block.type === "paragraph_element" ||
          block.type === "text_div" ? (
          <ProseField
            variant="paragraph"
            text={String(propsOf.text ?? "")}
            html={typeof propsOf.html === "string" ? propsOf.html : undefined}
            placeholder={block.type === "text_div" ? "Metin yazın" : "Paragrafı yazın"}
            syncToken={props.syncToken}
            structure={{
              kind: block.type === "text_div" ? "div" : "paragraph",
              level: 2,
              onChange: (kind, level) => props.onConvertText(block.id, kind, level),
            }}
            onChange={(value) =>
              props.onUpdateProps(block.id, { text: value.text, html: value.html })
            }
            onCommit={props.onCommit}
          />
        ) : block.type === "tldr_box" ? (
          <div className="space-y-1.5 rounded-lg border-l-4 border-blue-600 bg-slate-50 p-4 dark:bg-zinc-800/70">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Kısa yanıt
            </div>
            <ProseField
              variant="paragraph"
              text={String(propsOf.summary ?? "")}
              html={typeof propsOf.html === "string" ? propsOf.html : undefined}
              placeholder="Doğrudan yanıt"
              syncToken={props.syncToken}
              onChange={(value) =>
                props.onUpdateProps(block.id, { summary: value.text, html: value.html })
              }
              onCommit={props.onCommit}
            />
          </div>
        ) : block.type === "quote" ? (
          <div className="space-y-2 rounded-r-lg border-l-4 border-blue-600 bg-slate-50/70 p-4 dark:bg-zinc-800/50">
            <ProseField
              variant="quote"
              text={String(propsOf.quote ?? propsOf.text ?? "")}
              html={typeof propsOf.html === "string" ? propsOf.html : undefined}
              placeholder="Alıntı"
              syncToken={props.syncToken}
              onChange={(value) =>
                props.onUpdateProps(block.id, {
                  quote: value.text,
                  text: value.text,
                  html: value.html,
                })
              }
              onCommit={props.onCommit}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={String(propsOf.author ?? "")}
                onChange={(event) => props.onUpdateProps(block.id, { author: event.target.value })}
                placeholder="Yazar"
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <input
                value={String(propsOf.role ?? "")}
                onChange={(event) => props.onUpdateProps(block.id, { role: event.target.value })}
                placeholder="Ünvan"
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="pointer-events-none">
            <RscBlockRenderer blocks={[block]} themeId="corporate-aurora" tokens={props.tokens} pageSchema={pageSchema} preview />
          </div>
        )}
      </div>
    </article>
  );
}
