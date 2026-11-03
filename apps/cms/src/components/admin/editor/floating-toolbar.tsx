"use client";

import { applyStylePreset, type BlockNode, type BlockStyle, type BlockStyleValues } from "@nexpress/core";
import { AlignCenter, AlignLeft, AlignRight, Paintbrush } from "lucide-react";
import type { ProseStructureKind } from "./prose-field";
import { useStylePresets } from "./use-style-presets";

const TEXT_TYPES = new Set(["heading", "heading_element", "paragraph", "paragraph_element", "text_div", "quote", "tldr_box"]);
const HEADING_TYPES = new Set(["heading", "heading_element"]);
const btn = "inline-flex h-6 w-6 items-center justify-center rounded text-foreground hover:bg-muted";

/** Seçili bloğun başlık çubuğunda beliren araç çubuğu (butonlarla çakışmaz): başlık düzeyi, hizalama, stil ön ayarı ve Stil sekmesine kısayol. */
export function FloatingToolbar({ block, onConvertText, onUpdateStyle, onSetStyle, onInspectStyle }: {
  block: BlockNode;
  onConvertText: (id: string, kind: ProseStructureKind, level?: number) => void;
  onUpdateStyle: (id: string, patch: Partial<BlockStyleValues>) => void;
  onSetStyle: (id: string, style: BlockStyle) => void;
  onInspectStyle: (id: string) => void;
}) {
  const { presets } = useStylePresets();
  const text = TEXT_TYPES.has(block.type);
  const align = block.style?.textAlign;
  return (
    <div
      role="toolbar"
      aria-label="Blok araç çubuğu"
      onClick={(e) => e.stopPropagation()}
      className="ml-auto mr-2 flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 text-[11px]"
    >
      {HEADING_TYPES.has(block.type) && (
        <select aria-label="Başlık düzeyi" value={Number(block.props?.level ?? 2)} onChange={(e) => onConvertText(block.id, "heading", Number(e.target.value))} className="h-6 rounded border border-border bg-background px-1 text-[11px] font-semibold">
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>H{n}</option>)}
        </select>
      )}
      {text && (
        <>
          {([["left", AlignLeft, "Sola hizala"], ["center", AlignCenter, "Ortala"], ["right", AlignRight, "Sağa hizala"]] as const).map(([v, Icon, label]) => (
            <button key={v} type="button" aria-label={label} aria-pressed={align === v} onClick={() => onUpdateStyle(block.id, { textAlign: align === v ? undefined : v })} className={`${btn} ${align === v ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}>
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
        </>
      )}
      <select
        aria-label="Stil ön ayarı uygula"
        value=""
        disabled={presets.length === 0}
        title={presets.length ? "Stil ön ayarı uygula" : "Stil sekmesinden ön ayar kaydedin"}
        onChange={(e) => { const p = presets.find((x) => x.id === e.target.value); if (p) onSetStyle(block.id, applyStylePreset(block.style, p)); }}
        className="h-6 max-w-28 rounded border border-border bg-background px-1 text-[11px]"
      >
        <option value="">{presets.length ? "Ön ayar" : "Ön ayar yok"}</option>
        {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button type="button" aria-label="Stil sekmesini aç" title="Stil sekmesini aç" onClick={() => onInspectStyle(block.id)} className={btn}><Paintbrush className="h-3.5 w-3.5" /></button>
    </div>
  );
}
