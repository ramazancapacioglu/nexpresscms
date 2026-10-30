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
import { Sparkles, X } from "lucide-react";
import { LibraryWireframe } from "./library-wireframe";
import { exportPromptAction, validateDesignJsonAction } from "@/app/admin/design-library/actions";

type LibraryTab = "sections" | "packs" | "mine" | "ai_import";

interface SavedDesign { id: string; kind: "section" | "page"; name: string; description: string; category: string; placeholderData: boolean; payload: Record<string, unknown> }

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
  const [sitePrompt, setSitePrompt] = useState<string | null>(null);
  const [report, setReport] = useState<{ score: number; errors: string[]; warnings: string[] } | null>(null);

  useEffect(() => {
    if (!open || tab !== "mine" || saved) return;
    fetch("/api/admin/design-library", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok: boolean; items?: SavedDesign[] }) => setSaved(j.ok ? j.items ?? [] : []))
      .catch(() => setSaved([]));
  }, [open, tab, saved]);
  useEffect(() => {
    if (!open || tab !== "ai_import" || sitePrompt) return;
    void exportPromptAction({ mode: "page" }).then((r) => setSitePrompt(r.ok ? r.prompt : NEXPRESS_AI_DESIGN_SYSTEM_PROMPT));
  }, [open, tab, sitePrompt]);

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
                ["mine", "Benim tasarımlarım"],
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
            <div className="flex-1 overflow-y-auto p-4" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
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
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
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

        {tab === "mine" ? (
          <div className="flex-1 overflow-y-auto p-4" tabIndex={0} role="region" aria-label="Kayıtlı tasarımlar">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs">
              <p className="text-muted-foreground">Tasarım kütüphanesine kaydettiğiniz (AI veya elle) bölümler ve sayfa paketleri.</p>
              <a href="/admin/design-library" target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-blue-700 underline dark:text-blue-300">AI ile yeni tasarım üret →</a>
            </div>
            {!saved ? <p className="py-10 text-center text-xs text-muted-foreground">Yükleniyor…</p> : saved.length === 0 ? <p className="py-10 text-center text-xs text-muted-foreground">Henüz kayıtlı bölüm veya sayfa tasarımı yok.</p> : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {saved.map((d) => {
                  const blocks = (d.payload.blocks as Array<Omit<BlockNode, "id">> | undefined) ?? [];
                  const page = d.payload.page as { schemaType?: string; tldr?: string } | undefined;
                  return (
                    <div key={d.id} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold">{d.name}</h3><span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:text-blue-300">{d.kind === "page" ? "Sayfa" : "Bölüm"}</span></div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{d.description}</p>
                      {d.placeholderData && <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">Yer tutucu veri içerir: yayından önce güncelleyin.</p>}
                      <button
                        type="button"
                        onClick={() => d.kind === "page"
                          ? onApplyPack({ id: d.id, name: d.name, description: d.description, recommendedType: "page", schemaType: page?.schemaType ?? "WebPage", tldr: page?.tldr ?? "", blocks })
                          : blocks.forEach((b) => onInsert(b))}
                        className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {d.kind === "page" ? `Sayfa paketi olarak uygula (${blocks.length})` : `Kanvasa ekle (${blocks.length})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {tab === "ai_import" ? (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2" tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold">Sistem istemi <span className="font-normal text-muted-foreground">(sitenize özel: sayfalar, medya, formlar, SEO ve tasarım sınırları)</span></span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(sitePrompt ?? NEXPRESS_AI_DESIGN_SYSTEM_PROMPT)}
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
                  const r = await validateDesignJsonAction({ mode: aiJson.trim().startsWith("[") ? "section" : "page", json: aiJson.trim().startsWith("[") ? `{"blocks":${aiJson}}` : aiJson });
                  setReport(r.ok ? { score: r.design.score, errors: r.design.errors, warnings: r.design.warnings } : { score: 0, errors: [r.error], warnings: [] });
                }}
                disabled={aiJson.trim().length < 5}
                className="w-full rounded-lg border border-border py-2 text-xs font-semibold disabled:opacity-50"
              >
                Doğrula (blok sözleşmesi, SEO/GEO, kontrast)
              </button>
              {report && (
                <div className="space-y-1 rounded-lg border border-border p-2 text-[11px]" role="status">
                  <p className="font-semibold">Skor {report.score}/100 · {report.errors.length} hata · {report.warnings.length} uyarı</p>
                  {report.errors.length > 0 && <ul className="list-disc pl-4 text-red-600">{report.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul>}
                  {report.warnings.length > 0 && <ul className="list-disc pl-4 text-amber-800 dark:text-amber-300">{report.warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}</ul>}
                  <p className="text-muted-foreground">Doğrulama bilgilendiricidir; aktarma bu sınırlarla engellenmez.</p>
                </div>
              )}
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
