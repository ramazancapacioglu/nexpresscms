"use client";

import React, { useMemo, useState, useTransition } from "react";
import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { buildFolderTree, folderSubtreeIds, type FolderNode } from "@nexpress/core";
import { bulkDeleteUnusedMediaAction, createMediaFolderAction, deleteMediaFolderAction, moveMediaAction, updateMediaFolderAction } from "@/app/admin/media/actions";
import { Check, FolderPlus, Image as ImageIcon, ImageOff, Pencil, Trash2, X } from "lucide-react";
import { MediaBulkUpload } from "./media-bulk-upload";
import { MediaDelete } from "./media-delete";
import { MediaGrid } from "./media-grid";
import { MediaDetailForm } from "./media/media-detail-form";
import { DEFAULT_QUERY, formatBytes, queryMedia, type MediaQuery } from "./media/media-filter";
import { MediaToolbar } from "./media/media-toolbar";

export type FolderFilter = "all" | "none" | "unused" | string;

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const ctl = `h-8 rounded border ${border} bg-transparent px-2 text-[12px]`;

/** Kökten klasöre kadar klasör zinciri (girinti için). */
function folderPath(folders: MediaFolderDto[], id: string): MediaFolderDto[] {
  const out: MediaFolderDto[] = [];
  for (let cur = folders.find((f) => f.id === id); cur && out.length < 4; cur = folders.find((f) => f.id === cur!.parentId)) out.unshift(cur);
  return out;
}

function flattenTree(nodes: FolderNode[], out: Array<{ node: FolderNode; depth: number }> = [], depth = 0) {
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children.length > 0) flattenTree(n.children, out, depth + 1);
  }
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
  const [folderMode, setFolderMode] = useState<"idle" | "add" | "rename">("idle");
  const [folderName, setFolderName] = useState("");
  const [isPending, startTransition] = useTransition();

  const selected = assets.find((a) => a.id === selectedId) ?? null;
  const scope = filter === "all" || filter === "none" || filter === "unused" ? null : new Set(folderSubtreeIds(folders, filter));
  const inFolder = useMemo(
    () => assets.filter((a) => (filter === "all" ? true : filter === "none" ? !a.folderId : filter === "unused" ? unused.has(a.id) : scope!.has(a.folderId ?? ""))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, filter, unused, folders]
  );
  const visible = useMemo(() => queryMedia(inFolder, query), [inFolder, query]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of assets) map[a.folderId ?? ""] = (map[a.folderId ?? ""] ?? 0) + 1;
    return map;
  }, [assets]);
  const flatFolders = useMemo(() => flattenTree(buildFolderTree(folders)), [folders]);
  const subtreeCount = (n: FolderNode): number => (counts[n.id] ?? 0) + n.children.reduce((s, c) => s + subtreeCount(c), 0);

  const currentFolder = scope ? folders.find((f) => f.id === filter) : undefined;
  const missingAlt = assets.filter((a) => a.kind === "image" && !a.altText.trim()).length;
  const unusedAssets = useMemo(() => assets.filter((a) => unused.has(a.id)), [assets, unused]);
  const unusedCount = unusedAssets.length;
  const unusedTotalBytes = useMemo(() => unusedAssets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0), [unusedAssets]);

  const deleteUnusedBatch = (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`${ids.length} kullanılmayan medya dosyası ve türevleri kalıcı olarak silinsin mi?`)) return;
    startTransition(async () => {
      const res = await bulkDeleteUnusedMediaAction({ ids });
      if (!res.ok) return setBanner(res.error);
      const removed = new Set(res.deletedIds);
      setAssets((prev) => prev.filter((a) => !removed.has(a.id)));
      setUnused((prev) => {
        const next = new Set(prev);
        for (const id of removed) next.delete(id);
        return next;
      });
      setChecked((prev) => {
        const next = new Set(prev);
        for (const id of removed) next.delete(id);
        return next;
      });
      if (selectedId && removed.has(selectedId)) setSelectedId("");
      setBanner(
        `${res.deletedIds.length} kullanılmayan dosya kalıcı olarak silindi.${res.skippedInUse ? ` (${res.skippedInUse} dosya kullanımda olduğu için korundu.)` : ""}`
      );
    });
  };

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

  const submitFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      if (folderMode === "add") {
        const parentId = currentFolder && folderPath(folders, currentFolder.id).length < 3 ? currentFolder.id : null;
        const r = await createMediaFolderAction({ name: trimmed, parentId });
        if (!r.ok) return setBanner(r.error);
        setFolders((prev) => [...prev, r.folder]);
        setFilter(r.folder.id);
        setBanner(`"${r.folder.name}" klasörü eklendi.`);
      } else if (folderMode === "rename" && currentFolder) {
        const r = await updateMediaFolderAction({ id: currentFolder.id, name: trimmed });
        if (!r.ok) return setBanner(r.error);
        setFolders((prev) => prev.map((f) => (f.id === currentFolder.id ? r.folder : f)));
        setBanner(`Klasör "${r.folder.name}" olarak güncellendi.`);
      }
      setFolderMode("idle");
      setFolderName("");
    });
  };

  const removeCurrentFolder = () => {
    if (!currentFolder) return;
    if (!window.confirm(`"${currentFolder.name}" klasörü silinsin mi? Dosyalar silinmez, üst klasöre taşınır.`)) return;
    startTransition(async () => {
      const r = await deleteMediaFolderAction({ id: currentFolder.id });
      if (!r.ok) return setBanner(r.error);
      setFolders((prev) => prev.filter((f) => f.id !== currentFolder.id).map((f) => (f.parentId === currentFolder.id ? { ...f, parentId: currentFolder.parentId } : f)));
      setAssets((prev) => prev.map((a) => (a.folderId === currentFolder.id ? { ...a, folderId: currentFolder.parentId } : a)));
      setFilter(currentFolder.parentId ?? "all");
      setFolderMode("idle");
      setBanner(`"${currentFolder.name}" klasörü silindi.`);
    });
  };

  const folderSelect = (
    <select
      aria-label="Klasör filtresi"
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value);
        setChecked(new Set());
        setFolderMode("idle");
      }}
      className={ctl}
    >
      <option value="all">Tüm klasörler ({assets.length})</option>
      <option value="none">Klasörsüz ({counts[""] ?? 0})</option>
      <option value="unused">Kullanılmayanlar ({unusedCount})</option>
      {flatFolders.length > 0 && (
        <optgroup label="Klasörler">
          {flatFolders.map(({ node, depth }) => (
            <option key={node.id} value={node.id}>
              {"— ".repeat(depth)}
              {node.name} ({subtreeCount(node)})
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );

  return (
    <div className="space-y-2.5">
      {/* Kompakt başlık satırı */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b ${border} pb-2.5`}>
        <h1 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <ImageIcon className="h-4 w-4 text-[#1D5ED8] dark:text-[#7AA7FF]" /> Medya Kitaplığı
        </h1>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => { setFilter("all"); setChecked(new Set()); }}
            className={`rounded border px-2 py-0.5 ${filter === "all" ? "border-[#266DF0]/50 bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" : `${border} bg-white dark:bg-[#15171C]`}`}
          >
            Toplam: {assets.length}
          </button>
          <button
            type="button"
            onClick={() => { setFilter(filter === "unused" ? "all" : "unused"); setChecked(new Set()); }}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 ${filter === "unused" ? "border-rose-500/60 bg-rose-500/15 font-semibold text-rose-700 dark:text-rose-300" : unusedCount ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"}`}
          >
            <ImageOff className="h-3 w-3" aria-hidden="true" />
            Kullanılmayan: {unusedCount}{unusedCount > 0 ? ` (${formatBytes(unusedTotalBytes)})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setQuery({ ...DEFAULT_QUERY, problem: query.problem === "noalt" ? "all" : "noalt" })}
            className={`rounded border px-2 py-0.5 ${missingAlt ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"}`}
          >
            Alt metni eksik: {missingAlt}
          </button>
        </div>
      </div>

      {banner && (
        <div role="status" className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[12px] text-emerald-800 dark:text-emerald-300">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{banner}</span>
          <button type="button" aria-label="Bildirimi kapat" onClick={() => setBanner(null)} className="p-0.5 hover:opacity-70"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Yükleme + Klasör Ekle / Düzenle / Sil yan yana */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <MediaBulkUpload
            folderId={currentFolder?.id ?? null}
            folderName={currentFolder?.name ?? "Klasörsüz"}
            onUploaded={(media) => {
              setAssets((prev) => [media, ...prev]);
              setUnused((u) => new Set(u).add(media.id));
              setSelectedId(media.id);
              setBanner(`"${media.filename}" yüklendi.`);
            }}
          />
        </div>

        <div className={`flex shrink-0 flex-wrap items-center gap-1.5 rounded-lg border ${border} bg-white px-2.5 py-2 dark:bg-[#15171C]`}>
          {folderMode === "idle" ? (
            <>
              <button
                type="button"
                onClick={() => { setFolderMode("add"); setFolderName(""); }}
                className={`inline-flex h-8 items-center gap-1.5 rounded border ${border} px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}
              >
                <FolderPlus className="h-3.5 w-3.5 text-[#1D5ED8] dark:text-[#7AA7FF]" />
                {currentFolder ? "Alt Klasör" : "Klasör Ekle"}
              </button>
              {currentFolder && (
                <>
                  <button
                    type="button"
                    aria-label={`${currentFolder.name} yeniden adlandır`}
                    title="Seçili klasörü yeniden adlandır"
                    onClick={() => { setFolderMode("rename"); setFolderName(currentFolder.name); }}
                    className={`inline-flex h-8 items-center gap-1 rounded border ${border} px-2 text-[12px] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Düzenle
                  </button>
                  <button
                    type="button"
                    aria-label={`${currentFolder.name} klasörünü sil`}
                    title="Seçili klasörü sil"
                    disabled={isPending}
                    onClick={removeCurrentFolder}
                    className="inline-flex h-8 items-center gap-1 rounded border border-red-500/40 px-2 text-[12px] text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Sil
                  </button>
                </>
              )}
            </>
          ) : (
            <form onSubmit={submitFolder} className="flex items-center gap-1.5">
              <input
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setFolderMode("idle")}
                placeholder={folderMode === "add" ? "Yeni klasör adı" : "Klasör adı"}
                aria-label="Klasör adı"
                maxLength={60}
                disabled={isPending}
                className={`h-8 w-40 rounded border ${border} bg-transparent px-2 text-[12px]`}
              />
              <button type="submit" disabled={isPending || !folderName.trim()} className="h-8 rounded bg-[#266DF0] px-2.5 text-[12px] font-medium text-white disabled:opacity-50">
                {folderMode === "add" ? "Ekle" : "Kaydet"}
              </button>
              <button type="button" aria-label="İptal" onClick={() => setFolderMode("idle")} className={`inline-flex h-8 w-8 items-center justify-center rounded border ${border}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Arama + Klasör / Tür / Sorun / Sırala filtreleri */}
      <MediaToolbar query={query} onQuery={setQuery} view={view} onView={setView} folderSelect={folderSelect} />

      {filter === "unused" && (
        <div role="region" aria-label="Kullanılmayan medya raporu" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-500/35 bg-rose-500/5 px-3 py-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <ImageOff className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>
              <strong>{unusedCount} kullanılmayan dosya</strong> ({formatBytes(unusedTotalBytes)}) — hiçbir içerik, taksonomi, menü veya ayarda kullanılmıyor.
            </span>
          </div>
          {unusedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setChecked(new Set(visible.map((a) => a.id)))}
                className={`h-7 rounded border ${border} bg-white px-2.5 text-[11px] font-medium hover:bg-[#F4F5F7] dark:bg-[#15171C] dark:hover:bg-[#1C1E24]`}
              >
                Görünenleri Seç ({visible.length})
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => deleteUnusedBatch(unusedAssets.map((a) => a.id))}
                className="inline-flex h-7 items-center gap-1 rounded bg-red-600 px-2.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Tüm Kullanılmayanları Sil ({unusedCount})
              </button>
            </div>
          )}
        </div>
      )}

      {checked.size > 0 && (
        <div role="region" aria-label="Toplu işlem" className="flex flex-wrap items-center gap-2 rounded-lg border border-[#266DF0]/40 bg-[#266DF0]/5 px-2.5 py-1.5 text-[12px]">
          <strong>{checked.size} seçili</strong>
          <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className={`h-7 rounded border ${border} bg-transparent px-1.5 text-[12px]`} aria-label="Taşınacak klasör">
            <option value="">Klasör seçin…</option>
            <option value="__root">Klasörsüz (kök)</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
          </select>
          <button type="button" disabled={!moveTarget || isPending} onClick={() => moveChecked(moveTarget === "__root" ? null : moveTarget)} className="h-7 rounded bg-[#266DF0] px-2.5 font-medium text-white disabled:opacity-50">Taşı</button>
          {filter === "unused" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => deleteUnusedBatch([...checked])}
              className="inline-flex h-7 items-center gap-1 rounded bg-red-600 px-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Seçilenleri Sil ({checked.size})
            </button>
          )}
          <button type="button" onClick={() => setChecked(new Set(visible.map((a) => a.id)))} className="text-[#1D5ED8] underline dark:text-[#7AA7FF]">Tümünü seç</button>
          <button type="button" onClick={() => setChecked(new Set())} className="text-[#5C5F66] underline">Temizle</button>
        </div>
      )}

      {/* Tam genişlik ızgara + Sticky & sabit alt butonlu sağ denetçi */}
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <MediaGrid items={visible} selectedId={selected?.id} checked={checked} folders={folders} view={view} onOpen={(a) => { setSelectedId(a.id); setBanner(null); }} onToggle={toggle} />
        {selected && (
          <aside
            aria-label="Medya ayrıntıları"
            className={`sticky top-14 flex max-h-[calc(100vh-4.5rem)] flex-col overflow-hidden rounded-lg border ${border} bg-white dark:bg-[#15171C]`}
          >
            <MediaDetailForm
              stickyLayout
              asset={selected}
              onSaved={(a) => setAssets((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...a } : x)))}
              footer={
                <MediaDelete
                  key={selected.id}
                  compact
                  media={selected}
                  onDeleted={(id) => {
                    setChecked((c) => { const n = new Set(c); n.delete(id); return n; });
                    setAssets((prev) => prev.filter((a) => a.id !== id));
                    setSelectedId("");
                    setBanner("Dosya silindi.");
                  }}
                />
              }
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]" htmlFor="media-folder-select">Klasör</label>
                <select
                  id="media-folder-select"
                  value={selected.folderId ?? ""}
                  disabled={isPending}
                  onChange={(e) => {
                    const target = e.target.value || null;
                    startTransition(async () => {
                      const res = await moveMediaAction({ ids: [selected.id], folderId: target });
                      if (res.ok) setAssets((prev) => prev.map((a) => (a.id === selected.id ? { ...a, folderId: target } : a)));
                      else setBanner(res.error);
                    });
                  }}
                  className={`h-8 w-full rounded border ${border} bg-[#FBFBFB] px-2 text-[11px] dark:bg-[#121317]`}
                >
                  <option value="">Klasörsüz (kök)</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
                </select>
              </div>
            </MediaDetailForm>
          </aside>
        )}
      </div>
    </div>
  );
}
