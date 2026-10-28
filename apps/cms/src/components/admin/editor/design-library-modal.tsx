"use client";

import { useMemo, useState } from "react";
import { normalizeImportedBlock, type BlockNode } from "@nexpress/core";
import {
  LIBRARY_GROUPS,
  NEXPRESS_AI_DESIGN_SYSTEM_PROMPT,
  NEXPRESS_DESIGN_LIBRARY,
  NEXPRESS_STARTER_PAGE_PACKS,
  type StarterPagePack,
} from "@nexpress/editor";
import { Sparkles, X } from "lucide-react";
import { LibraryWireframe } from "./library-wireframe";

type LibraryTab = "sections" | "packs" | "ai_import";

interface DesignLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (block: Omit<BlockNode, "id"> | BlockNode) => void;
  onApplyPack: (pack: StarterPagePack) => void;
  onImport: (page: {
    title?: string;
    slug?: string;
    tldr?: string;
    blocks: BlockNode[];
    replace: boolean;
  }) => void;
  onError: (message: string) => void;
}

export function DesignLibraryModal({
  open,
  onClose,
  onInsert,
  onApplyPack,
  onImport,
  onError,
}: DesignLibraryModalProps) {
  const [tab, setTab] = useState<LibraryTab>("sections");
  const [groupId, setGroupId] = useState("all");
  const [query, setQuery] = useState("");
  const [aiJson, setAiJson] = useState("");

  const items = useMemo(() => {
    const group = LIBRARY_GROUPS.find((entry) => entry.id === groupId);
    const needle = query.trim().toLocaleLowerCase("tr");
    return NEXPRESS_DESIGN_LIBRARY.filter((item) => {
      const inGroup =
        !group || group.id === "all" || group.categories.includes(item.category);
      const haystack = `${item.name} ${item.description}`.toLocaleLowerCase("tr");
      return inGroup && (!needle || haystack.includes(needle));
    });
  }, [groupId, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold">Tasarım kütüphanesi</h2>
              <p className="text-[11px] text-muted-foreground">
                {NEXPRESS_DESIGN_LIBRARY.length} hazır bölüm. Kategori seçin, kanvasa ekleyin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(
              [
                ["sections", "Bölümler"],
                ["packs", "Sayfa paketleri"],
                ["ai_import", "JSON aktar"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  tab === id ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {tab === "sections" ? (
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border p-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ara"
                className="mb-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
              {LIBRARY_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className={`rounded-md px-2 py-1.5 text-left text-xs ${
                    groupId === group.id ? "bg-blue-600 font-semibold text-white" : "hover:bg-muted"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </aside>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onInsert(item.block)}
                    className="rounded-xl border border-border bg-card p-3 text-left hover:border-blue-500"
                  >
                    <LibraryWireframe kind={item.previewKind} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold">{item.name}</h3>
                      {item.badge ? (
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
              {items.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">Bu aramada bölüm yok.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "packs" ? (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
            {NEXPRESS_STARTER_PAGE_PACKS.map((pack) => (
              <div key={pack.id} className="rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold">{pack.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
                <button
                  type="button"
                  onClick={() => onApplyPack(pack)}
                  className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Paketi uygula ({pack.blocks.length} bölüm)
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "ai_import" ? (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold">Sistem istemi</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(NEXPRESS_AI_DESIGN_SYSTEM_PROMPT)}
                  className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
                >
                  Kopyala
                </button>
              </div>
              <pre className="max-h-[52vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[10px]">
                {NEXPRESS_AI_DESIGN_SYSTEM_PROMPT}
              </pre>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold">JSON yapıştır</span>
              <textarea
                rows={14}
                value={aiJson}
                onChange={(event) => setAiJson(event.target.value)}
                placeholder='{"title":"...","blocks":[...]}'
                className="w-full rounded-lg border border-border bg-zinc-950 p-3 font-mono text-xs text-emerald-300"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(aiJson) as unknown;
                    if (Array.isArray(parsed)) {
                      onImport({
                        blocks: parsed.map((block, index) => normalizeImportedBlock(block, index)),
                        replace: false,
                      });
                      return;
                    }
                    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { blocks?: unknown }).blocks)) {
                      onError("Kök bir dizi veya blocks alanı olmalı.");
                      return;
                    }
                    const page = parsed as { title?: unknown; slug?: unknown; tldr?: unknown; blocks: unknown[] };
                    onImport({
                      title: typeof page.title === "string" ? page.title : undefined,
                      slug: typeof page.slug === "string" ? page.slug : undefined,
                      tldr: typeof page.tldr === "string" ? page.tldr : undefined,
                      blocks: page.blocks.map((block, index) => normalizeImportedBlock(block, index)),
                      replace: true,
                    });
                  } catch {
                    onError("Geçersiz JSON.");
                  }
                }}
                className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white"
              >
                Kanvasa aktar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
