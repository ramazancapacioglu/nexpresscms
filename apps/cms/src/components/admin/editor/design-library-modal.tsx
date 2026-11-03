"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeImportedBlock, type BlockNode } from "@nexpress/core";
import {
  LIBRARY_GROUPS,
  NEXPRESS_AI_DESIGN_SYSTEM_PROMPT,
  NEXPRESS_DESIGN_LIBRARY,
  NEXPRESS_STARTER_PAGE_PACKS,
  type StarterPagePack,
} from "@nexpress/editor";
import { Check, Layers, LayoutTemplate, Plus, Search, Sparkles, X } from "lucide-react";
import { LibraryWireframe } from "./library-wireframe";
import { BLOCK_TYPE_LABELS } from "./studio-model";
import { exportPromptAction, validateDesignJsonAction } from "@/app/admin/design-library/actions";
import { listPatternsAction } from "@/app/admin/appearance/templates/actions";

type LibraryTab = "sections" | "packs" | "mine" | "ai_import";

interface SavedDesign {
  id: string;
  kind: "section" | "page";
  name: string;
  description: string;
  category: string;
  placeholderData: boolean;
  payload: Record<string, unknown>;
}

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
  const [saved, setSaved] = useState<SavedDesign[] | null>(null);
  const [patterns, setPatterns] = useState<Array<{ id: string; name: string; description: string; category: string; blocks: BlockNode[] }> | null>(null);
  const [sitePrompt, setSitePrompt] = useState<string | null>(null);
  const [report, setReport] = useState<{
    score: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    if (!open || tab !== "mine") return;
    if (!saved) {
      fetch("/api/admin/design-library", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { ok: boolean; items?: SavedDesign[] }) =>
          setSaved(j.ok ? (j.items ?? []) : [])
        )
        .catch(() => setSaved([]));
    }
    if (!patterns) {
      void listPatternsAction().then((res) => {
        if (res.ok) setPatterns(res.patterns);
        else setPatterns([]);
      }).catch(() => setPatterns([]));
    }
  }, [open, tab, saved, patterns]);

  useEffect(() => {
    if (!open || tab !== "ai_import" || sitePrompt) return;
    void exportPromptAction({ mode: "page" }).then((r) =>
      setSitePrompt(r.ok ? r.prompt : NEXPRESS_AI_DESIGN_SYSTEM_PROMPT)
    );
  }, [open, tab, sitePrompt]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: NEXPRESS_DESIGN_LIBRARY.length };
    for (const g of LIBRARY_GROUPS) {
      if (g.id === "all") continue;
      counts[g.id] = NEXPRESS_DESIGN_LIBRARY.filter((item) =>
        g.categories.includes(item.category)
      ).length;
    }
    return counts;
  }, []);

  const items = useMemo(() => {
    const group = LIBRARY_GROUPS.find((entry) => entry.id === groupId);
    const needle = query.trim().toLocaleLowerCase("tr");
    return NEXPRESS_DESIGN_LIBRARY.filter((item) => {
      const inGroup =
        !group || group.id === "all" || group.categories.includes(item.category);
      const haystack = `${item.name} ${item.description} ${item.badge ?? ""}`.toLocaleLowerCase("tr");
      return inGroup && (!needle || haystack.includes(needle));
    });
  }, [groupId, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tasarım Kütüphanesi"
        className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Üst Başlık ve Sekmeler */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Stüdyo Tasarım Kütüphanesi</h2>
              <p className="text-[11px] text-muted-foreground">
                {NEXPRESS_DESIGN_LIBRARY.length} hazır 0-KB RSC bölüm şablonu ve{" "}
                {NEXPRESS_STARTER_PAGE_PACKS.length} tam sayfa başlangıç paketi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                ["sections", `Hazır Bölümler (${NEXPRESS_DESIGN_LIBRARY.length})`],
                ["packs", `Tam Sayfa Paketleri (${NEXPRESS_STARTER_PAGE_PACKS.length})`],
                ["mine", "Benim Tasarımlarım"],
                ["ai_import", "AI / JSON Aktar"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tab === id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              aria-label="Kapat"
              onClick={onClose}
              className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. HAZIR BÖLÜMLER SEKMESİ */}
        {tab === "sections" ? (
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-muted/10 p-3">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Bölüm veya özellik ara…"
                  aria-label="Bölüm ara"
                  className="h-8 w-full rounded-lg border border-border bg-background pr-2 pl-8 text-xs outline-none focus:border-blue-600"
                />
              </div>
              {LIBRARY_GROUPS.map((group) => {
                const count = groupCounts[group.id] ?? 0;
                if (group.id !== "all" && count === 0) return null;
                const active = groupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setGroupId(group.id)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      active
                        ? "bg-blue-600 font-semibold text-white shadow-2xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{group.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </aside>

            <div
              className="flex-1 overflow-y-auto p-5"
              tabIndex={0}
              role="region"
              aria-label="Hazır bölümler listesi"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const childCount = Array.isArray(item.block.children)
                    ? item.block.children.length
                    : 0;
                  const typeLabel =
                    BLOCK_TYPE_LABELS[item.block.type] ?? item.block.type;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onInsert(item.block)}
                      className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
                    >
                      <div>
                        <LibraryWireframe kind={item.previewKind} />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold leading-snug group-hover:text-blue-600">
                            {item.name}
                          </h3>
                          {item.badge ? (
                            <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[10px]">
                        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          {typeLabel}
                          {childCount > 0 ? ` • ${childCount} alt kapsayıcı` : " • 0-KB RSC"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-600/10 px-2 py-0.5 font-semibold text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                          <Plus className="h-3 w-3" /> Kanvasa Ekle
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {items.length === 0 ? (
                <p className="py-12 text-center text-xs text-muted-foreground">
                  Aramanıza uygun bölüm şablonu bulunamadı.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 2. TAM SAYFA BAŞLANGIÇ PAKETLERİ SEKMESİ */}
        {tab === "packs" ? (
          <div
            className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2"
            tabIndex={0}
            role="region"
            aria-label="Tam sayfa başlangıç paketleri"
          >
            {NEXPRESS_STARTER_PAGE_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-2xs transition hover:border-blue-500/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <LayoutTemplate className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">{pack.name}</h3>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Schema.org: <strong>{pack.schemaType}</strong> • {pack.blocks.length} Hazır Bölüm
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      Tam Sayfa
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {pack.description}
                  </p>

                  {/* Paket İçi Bölüm Akışı Rozetleri */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pack.blocks.map((b, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground"
                      >
                        {i + 1}. {BLOCK_TYPE_LABELS[b.type] ?? b.type}
                      </span>
                    ))}
                  </div>

                  {pack.tldr && (
                    <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-[11px] text-muted-foreground">
                      <strong className="text-foreground">Hazır TL;DR Özeti:</strong> {pack.tldr}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => onApplyPack(pack)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Sayfaya Uygula ({pack.blocks.length} Bölüm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      pack.blocks.forEach((b) => onInsert(b));
                      onClose();
                    }}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Mevcut Sayfaya Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 3. BENİM TASARIMLARIM SEKMESİ */}
        {tab === "mine" ? (
          <div
            className="flex-1 overflow-y-auto p-5"
            tabIndex={0}
            role="region"
            aria-label="Kayıtlı tasarımlar"
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-xs">
              <p className="text-muted-foreground">
                Tasarım kütüphanesine kaydettiğiniz (AI veya elle) bölümler ve sayfa paketleri.
              </p>
              <a
                href="/admin/design-library"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-semibold text-blue-700 underline dark:text-blue-300"
              >
                AI ile yeni tasarım üret →
              </a>
            </div>
            {/* 1. Senkronize Modeller (Global / Ortak Akıllı Bloklar) */}
            {patterns && patterns.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-white text-[11px]">✨</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Senkronize Modeller ({patterns.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Düzenlendiğinde tüm sayfalarda otomatik güncellenir</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {patterns.map((p) => (
                    <div key={p.id} className="rounded-xl border border-purple-200 bg-purple-50/30 p-3.5 dark:border-purple-900/60 dark:bg-purple-950/20">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                        <span className="shrink-0 rounded-full bg-purple-600/10 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                          {p.category}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {p.description || "Senkronize ortak model"}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onInsert({
                              type: "synced_pattern",
                              props: { patternId: p.id, title: p.name },
                              children: p.blocks,
                            });
                            onClose();
                          }}
                          className="flex-1 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-700"
                        >
                          Model Olarak Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            p.blocks.forEach((b) => onInsert(b));
                            onClose();
                          }}
                          title="Model bağlantısı olmadan bağımsız kopya olarak ekle"
                          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Kopya ({p.blocks.length})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Kayıtlı Statik Tasarımlar */}
            {!saved ? (
              <p className="py-10 text-center text-xs text-muted-foreground">Yükleniyor…</p>
            ) : saved.length === 0 && (!patterns || patterns.length === 0) ? (
              <p className="py-10 text-center text-xs text-muted-foreground">
                Henüz kayıtlı model veya sayfa tasarımı yok.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {saved.map((d) => {
                  const blocks =
                    (d.payload.blocks as Array<Omit<BlockNode, "id">> | undefined) ?? [];
                  const page = d.payload.page as
                    | { schemaType?: string; tldr?: string }
                    | undefined;
                  return (
                    <div key={d.id} className="rounded-xl border border-border bg-card p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold">{d.name}</h3>
                        <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:text-blue-300">
                          {d.kind === "page" ? "Sayfa" : "Bölüm"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {d.description}
                      </p>
                      {d.placeholderData && (
                        <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                          Yer tutucu veri içerir: yayından önce güncelleyin.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          d.kind === "page"
                            ? onApplyPack({
                                id: d.id,
                                name: d.name,
                                description: d.description,
                                recommendedType: "page",
                                schemaType: page?.schemaType ?? "WebPage",
                                tldr: page?.tldr ?? "",
                                blocks,
                              })
                            : blocks.forEach((b) => onInsert(b))
                        }
                        className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {d.kind === "page"
                          ? `Sayfa paketi olarak uygula (${blocks.length})`
                          : `Kanvasa ekle (${blocks.length})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* 4. AI / JSON AKTARIM SEKMESİ */}
        {tab === "ai_import" ? (
          <div
            className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-2"
            tabIndex={0}
            role="region"
            aria-label="AI JSON aktarım alanı"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold">
                  Sistem istemi{" "}
                  <span className="font-normal text-muted-foreground">
                    (sitenize özel: sayfalar, medya, formlar, SEO ve tasarım sınırları)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      sitePrompt ?? NEXPRESS_AI_DESIGN_SYSTEM_PROMPT
                    )
                  }
                  className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white"
                >
                  Kopyala
                </button>
              </div>
              <pre className="max-h-[52vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[10px]">
                {sitePrompt ?? NEXPRESS_AI_DESIGN_SYSTEM_PROMPT}
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
                onClick={async () => {
                  const r = await validateDesignJsonAction({
                    mode: aiJson.trim().startsWith("[") ? "section" : "page",
                    json: aiJson.trim().startsWith("[")
                      ? `{"blocks":${aiJson}}`
                      : aiJson,
                  });
                  setReport(
                    r.ok
                      ? {
                          score: r.design.score,
                          errors: r.design.errors,
                          warnings: r.design.warnings,
                        }
                      : { score: 0, errors: [r.error], warnings: [] }
                  );
                }}
                disabled={aiJson.trim().length < 5}
                className="w-full rounded-lg border border-border py-2 text-xs font-semibold disabled:opacity-50"
              >
                Doğrula (blok sözleşmesi, SEO/GEO, kontrast)
              </button>
              {report && (
                <div
                  className="space-y-1 rounded-lg border border-border p-2 text-[11px]"
                  role="status"
                >
                  <p className="font-semibold">
                    Skor {report.score}/100 · {report.errors.length} hata ·{" "}
                    {report.warnings.length} uyarı
                  </p>
                  {report.errors.length > 0 && (
                    <ul className="list-disc pl-4 text-red-600">
                      {report.errors.slice(0, 8).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                  {report.warnings.length > 0 && (
                    <ul className="list-disc pl-4 text-amber-800 dark:text-amber-300">
                      {report.warnings.slice(0, 8).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-muted-foreground">
                    Doğrulama bilgilendiricidir; aktarma bu sınırlarla engellenmez.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(aiJson) as unknown;
                    if (Array.isArray(parsed)) {
                      onImport({
                        blocks: parsed.map((block, index) =>
                          normalizeImportedBlock(block, index)
                        ),
                        replace: false,
                      });
                      return;
                    }
                    if (
                      !parsed ||
                      typeof parsed !== "object" ||
                      !Array.isArray((parsed as { blocks?: unknown }).blocks)
                    ) {
                      onError("Kök bir dizi veya blocks alanı olmalı.");
                      return;
                    }
                    const page = parsed as {
                      title?: unknown;
                      slug?: unknown;
                      tldr?: unknown;
                      blocks: unknown[];
                    };
                    onImport({
                      title: typeof page.title === "string" ? page.title : undefined,
                      slug: typeof page.slug === "string" ? page.slug : undefined,
                      tldr: typeof page.tldr === "string" ? page.tldr : undefined,
                      blocks: page.blocks.map((block, index) =>
                        normalizeImportedBlock(block, index)
                      ),
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
