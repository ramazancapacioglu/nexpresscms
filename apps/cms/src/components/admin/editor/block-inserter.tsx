"use client";

import React, { useState } from "react";
import type { BlockNode } from "@nexpress/core";
import {
  BLOCK_CATEGORIES,
  ROW_TEMPLATES,
  NEXPRESS_DESIGN_LIBRARY,
  buildRow,
  searchCatalog,
  type BlockCategoryId,
} from "@nexpress/editor";
import {
  Sparkles,
  Search,
  Columns3,
  LayoutTemplate,
  Type,
  AlignLeft,
  ListChecks,
  Quote,
  MousePointerClick,
  Image as ImageIcon,
  Video,
  HelpCircle,
  ListOrdered,
  Info,
  Code2,
  Star,
  Megaphone,
  BarChart3,
  Grid,
  CreditCard,
  Table2,
  FolderKanban,
  ShoppingBag,
  Layers,
} from "lucide-react";
import { useEditorDnd } from "./dnd";
import { ColumnPresetSvg } from "./row-layout-picker";

const BLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  columns: Columns3,
  section: LayoutTemplate,
  divider_spacer: Layers,
  split_content: Columns3,
  heading: Type,
  paragraph: AlignLeft,
  list_element: ListChecks,
  icon_list: ListChecks,
  quote: Quote,
  button_element: MousePointerClick,
  button_row: MousePointerClick,
  image_figure: ImageIcon,
  gallery: ImageIcon,
  image_overlay: ImageIcon,
  video_embed: Video,
  video_popup: Video,
  tldr_box: Sparkles,
  faq_accordion: HelpCircle,
  howto_steps: ListOrdered,
  info_box: Info,
  callout: Info,
  code_block: Code2,
  review_box: Star,
  hero: Megaphone,
  cta_banner: Megaphone,
  stats_strip: BarChart3,
  bento_features: Grid,
  pricing_table: CreditCard,
  testimonial_grid: Star,
  comparison_table: Table2,
  data_table: Table2,
  tabs: FolderKanban,
  accordion: FolderKanban,
  dynamic_list: Grid,
  product_row: ShoppingBag,
  product_embed: ShoppingBag,
};

export interface BlockInserterProps {
  onInsert: (block: Omit<BlockNode, "id"> | BlockNode) => void;
  onOpenLibrary: () => void;
}

/**
 * Sol "+ Blok & Satır" çekmecesi:
 * - Görsel SVG sütun önizlemeli satır şablonları
 * - İkonlu, aranabilir, sürükle-bırak destekli blok karoları
 * - Tek tıkla hazır bölüm ekleme sekmesi ("Hazır Bölümler")
 */
export function BlockInserter({ onInsert, onOpenLibrary }: BlockInserterProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BlockCategoryId | "all">("all");
  const [subMode, setSubMode] = useState<"blocks" | "sections">("blocks");
  const { begin } = useEditorDnd();

  const filtered = searchCatalog(search);
  const byCategory =
    category === "all" ? filtered : filtered.filter((i) => i.category === category);
  const showRows = (category === "all" || category === "layout") && !search.trim();

  const filteredSections = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return NEXPRESS_DESIGN_LIBRARY;
    return NEXPRESS_DESIGN_LIBRARY.filter((s) =>
      `${s.name} ${s.description} ${s.category}`.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Üst Arama + Alt Sekme (Bloklar / Hazır Bölümler) */}
      <div className="space-y-2 border-b p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Blok, satır veya bölüm ara…"
            aria-label="Blok veya bölüm ara"
            className="h-7 w-full rounded-md border bg-background pl-8 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSubMode("blocks")}
            className={`rounded py-1 font-semibold transition ${
              subMode === "blocks"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bloklar & Satırlar
          </button>
          <button
            type="button"
            onClick={() => setSubMode("sections")}
            className={`rounded py-1 font-semibold transition ${
              subMode === "sections"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hazır Bölümler ({NEXPRESS_DESIGN_LIBRARY.length})
          </button>
        </div>

        {subMode === "blocks" && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                category === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            {BLOCK_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  category === c.id
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className="flex-1 space-y-4 overflow-y-auto p-2.5">
        {subMode === "blocks" ? (
          <>
            {showRows && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Satır & Sütun Düzenleri
                  </span>
                  <span className="text-[9px] text-muted-foreground">tıkla veya sürükle</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ROW_TEMPLATES.map((r) => {
                    const rowBlock = buildRow(r.layout, r.widths, r.opts);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        draggable
                        onDragStart={(e) => begin(e, { kind: "new", block: rowBlock }, e.currentTarget)}
                        onClick={() => onInsert(rowBlock)}
                        className="group flex w-full cursor-grab flex-col items-center rounded-lg border bg-background p-2 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/40 active:cursor-grabbing dark:hover:bg-blue-950/30"
                      >
                        <ColumnPresetSvg
                          widths={r.widths}
                          className="mb-1 h-6 w-14 text-slate-500 group-hover:text-blue-600"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-semibold text-foreground">
                            {r.label}
                          </span>
                          <span className="rounded bg-blue-500/10 px-1 text-[9px] font-bold text-blue-600">
                            {r.layout}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                  Bloklar ({byCategory.length})
                </span>
                <span className="text-[9px] text-muted-foreground">tıkla veya sürükle</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {byCategory.map((item) => {
                  const Icon = BLOCK_ICONS[item.block.type] ?? Layers;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={(e) => begin(e, { kind: "new", block: item.block }, e.currentTarget)}
                      onClick={() => onInsert(item.block)}
                      className="group flex w-full cursor-grab items-start gap-2 rounded-lg border bg-background p-2 text-left transition-colors hover:border-blue-500 hover:bg-blue-50/40 active:cursor-grabbing dark:hover:bg-blue-950/30"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-semibold text-foreground">
                          {item.label}
                        </div>
                        <div className="line-clamp-1 text-[9px] text-muted-foreground">
                          {item.hint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                Hazır Tasarım Bölümleri ({filteredSections.length})
              </span>
            </div>
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                className="group rounded-lg border bg-background p-2.5 transition-all hover:border-blue-500 hover:shadow-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-foreground">{sec.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {sec.category}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                  {sec.description}
                </p>
                <button
                  type="button"
                  onClick={() => onInsert(sec.block)}
                  className="mt-2 inline-flex h-6 w-full items-center justify-center rounded bg-blue-600 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                >
                  + Sayfaya Ekle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt Tam Ekran Tasarım Kütüphanesi Düğmesi */}
      <div className="border-t p-2.5">
        <button
          type="button"
          onClick={onOpenLibrary}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:from-indigo-700 hover:to-blue-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tam Ekran Tasarım Kütüphanesi
        </button>
      </div>
    </div>
  );
}
