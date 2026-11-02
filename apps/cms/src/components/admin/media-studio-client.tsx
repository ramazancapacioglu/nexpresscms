"use client";

import React, { useMemo, useState, useTransition } from "react";
import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { folderSubtreeIds } from "@nexpress/core";
import { moveMediaAction } from "@/app/admin/media/actions";
import { Check, Image as ImageIcon } from "lucide-react";
import { MediaBulkUpload } from "./media-bulk-upload";
import { MediaDelete } from "./media-delete";
import { MediaFolderTree, type FolderFilter } from "./media-folder-tree";
import { MediaGrid } from "./media-grid";
import { MediaDetailForm } from "./media/media-detail-form";
import { DEFAULT_QUERY, queryMedia, type MediaQuery } from "./media/media-filter";
import { MediaToolbar } from "./media/media-toolbar";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Kökten klasöre kadar klasör zinciri (girinti için). */
function folderPath(folders: MediaFolderDto[], id: string): MediaFolderDto[] {
  const out: MediaFolderDto[] = [];
  for (let cur = folders.find((f) => f.id === id); cur && out.length < 4; cur = folders.find((f) => f.id === cur!.parentId)) out.unshift(cur);
  return out;
}

export function MediaStudioClient({ initialMedia, initialFolders, initialUnusedIds }: { initialMedia: MediaAssetDto[]; initialFolders: MediaFolderDto[]; initialUnusedIds: string[] }) {
  const [assets, setAssets] = useState<MediaAssetDto[]>(initialMedia);
  const [folders, setFolders] = useState<MediaFolderDto[]>(initialFolders);
  const [filter, setFilter] = useState<FolderFilter>("all");
  const [query, setQuery] = useState<MediaQuery>(DEFAULT_QUERY);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [unused, setUnused] = useState<Set<string>>(new Set(initialUnusedIds));
  const [moveTarget, setMoveTarget] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [banner, setBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = assets.find((a) => a.id === selectedId) ?? null;
  const scope = filter === "all" || filter === "none" || filter === "unused" ? null : new Set(folderSubtreeIds(folders, filter));
  const inFolder = useMemo(
    () => assets.filter((a) => (filter === "all" ? true : filter === "none" ? !a.folderId : filter === "unused" ? unused.has(a.id) : scope!.has(a.folderId ?? ""))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, filter, unused, folders]
  );
  const visible = useMemo(() => queryMedia(inFolder, query), [inFolder, query]);
  const counts: Record<string, number> = {};
  for (const a of assets) counts[a.folderId ?? ""] = (counts[a.folderId ?? ""] ?? 0) + 1;
  const currentFolder = scope ? folders.find((f) => f.id === filter) : undefined;
  const missingAlt = assets.filter((a) => a.kind === "image" && !a.altText.trim()).length;

  const toggle = (id: string, range: boolean) => {
    setChecked((cur) => {
      const next = new Set(cur);
      if (range && lastChecked) {
        const ids = visible.map((a) => a.id);
        const [a, b] = [ids.indexOf(lastChecked), ids.indexOf(id)];
        if (a >= 0 && b >= 0) for (const x of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(x);
      } else if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastChecked(id);
  };

  const moveChecked = (target: string | null) =>
    startTransition(async () => {
      const res = await moveMediaAction({ ids: [...checked], folderId: target });
      if (!res.ok) return setBanner(res.error);
      setAssets((prev) => prev.map((a) => (checked.has(a.id) ? { ...a, folderId: target } : a)));
      setChecked(new Set());
      setBanner(`${res.moved} dosya taşındı.`);
    });

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b ${border} pb-3`}>
        <div>
          <h1 className="flex items-center gap-2 text-[16px] font-bold tracking-tight"><ImageIcon className="h-4 w-4 text-[#1D5ED8] dark:text-[#7AA7FF]" /> Medya Kitaplığı</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Görsel, PDF, video ve ses dosyaları. Başlık, alt metin, alt yazı ve açıklama SEO puanını ve arama görünürlüğünü belirler.</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={`rounded border ${border} bg-white px-2.5 py-1 dark:bg-[#15171C]`}>Toplam: {assets.length}</span>
          <button type="button" onClick={() => setQuery({ ...DEFAULT_QUERY, problem: "noalt" })} className={`rounded border px-2.5 py-1 ${missingAlt ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"}`}>Alt metni eksik: {missingAlt}</button>
        </div>
      </div>

      {banner && <div role="status" className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800 dark:text-emerald-300"><Check className="h-4 w-4" /><span>{banner}</span></div>}

      <div className="grid items-start gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
        <MediaFolderTree folders={folders} counts={counts} total={assets.length} unused={assets.filter((a) => unused.has(a.id)).length} filter={filter} onFilter={(f) => { setFilter(f); setChecked(new Set()); }} onFolders={setFolders} onDeleted={(id, parentId) => setAssets((prev) => prev.map((a) => (a.folderId === id ? { ...a, folderId: parentId } : a)))} />
        <div className="min-w-0 space-y-3">
          <MediaBulkUpload folderId={currentFolder?.id ?? null} folderName={currentFolder?.name ?? "Klasörsüz"} onUploaded={(media) => { setAssets((prev) => [media, ...prev]); setUnused((u) => new Set(u).add(media.id)); setSelectedId(media.id); setBanner(`"${media.filename}" yüklendi. Aşağıdaki panelden başlık ve alt metni girin.`); }} />
          <MediaToolbar query={query} onQuery={setQuery} view={view} onView={setView} />

          {checked.size > 0 && (
            <div role="region" aria-label="Toplu işlem" className="flex flex-wrap items-center gap-2 rounded-lg border border-[#266DF0]/40 bg-[#266DF0]/5 px-3 py-2 text-[12px]">
              <strong>{checked.size} dosya seçili</strong>
              <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className={`h-7 rounded border ${border} bg-transparent px-1`} aria-label="Taşınacak klasör">
                <option value="">Klasör seçin…</option><option value="__root">Klasörsüz (kök)</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
              </select>
              <button type="button" disabled={!moveTarget || isPending} onClick={() => moveChecked(moveTarget === "__root" ? null : moveTarget)} className="h-7 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-50">Taşı</button>
              <button type="button" onClick={() => setChecked(new Set(visible.map((a) => a.id)))} className="text-[#1D5ED8] underline dark:text-[#7AA7FF]">Görünenlerin hepsi</button>
              <button type="button" onClick={() => setChecked(new Set())} className="text-[#5C5F66] underline">Seçimi temizle</button>
            </div>
          )}

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <MediaGrid items={visible} selectedId={selected?.id} checked={checked} folders={folders} view={view} onOpen={(a) => { setSelectedId(a.id); setBanner(null); }} onToggle={toggle} />
            {selected && (
              <aside aria-label="Medya ayrıntıları" className={`sticky top-12 space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
                <MediaDetailForm asset={selected} onSaved={(a) => setAssets((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...a } : x)))}>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]" htmlFor="media-folder-select">Klasör</label>
                    <select id="media-folder-select" value={selected.folderId ?? ""} disabled={isPending} onChange={(e) => { const target = e.target.value || null; startTransition(async () => { const res = await moveMediaAction({ ids: [selected.id], folderId: target }); if (res.ok) setAssets((prev) => prev.map((a) => (a.id === selected.id ? { ...a, folderId: target } : a))); else setBanner(res.error); }); }} className={`h-8 w-full rounded border ${border} bg-[#FBFBFB] px-2 text-[11px] dark:bg-[#121317]`}>
                      <option value="">Klasörsüz (kök)</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
                    </select>
                  </div>
                  <MediaDelete key={selected.id} media={selected} onDeleted={(id) => { setChecked((c) => { const n = new Set(c); n.delete(id); return n; }); setAssets((prev) => prev.filter((a) => a.id !== id)); setSelectedId(""); setBanner("Dosya silindi."); }} />
                </MediaDetailForm>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
