"use client";

import React, { useState, useTransition } from "react";
import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { folderSubtreeIds, thumbnailUrl } from "@nexpress/core";
import { saveMediaAssetAction } from "@/app/admin/actions";
import { moveMediaAction } from "@/app/admin/media/actions";
import { MediaDelete } from "./media-delete";
import { MediaBulkUpload } from "./media-bulk-upload";
import { MediaFolderTree, type FolderFilter } from "./media-folder-tree";
import { MediaGrid } from "./media-grid";
import { Image as ImageIcon, Plus, Check, Sparkles, Sliders } from "lucide-react";

/** Kökten klasöre kadar klasör zinciri (girinti için). */
function folderPath(folders: MediaFolderDto[], id: string): MediaFolderDto[] {
  const out: MediaFolderDto[] = [];
  for (let cur = folders.find((f) => f.id === id); cur && out.length < 4; cur = folders.find((f) => f.id === cur!.parentId)) out.unshift(cur);
  return out;
}

export function MediaStudioClient({
  initialMedia,
  initialFolders,
  initialUnusedIds,
}: {
  initialMedia: MediaAssetDto[];
  initialFolders: MediaFolderDto[];
  initialUnusedIds: string[];
}) {
  const [assets, setAssets] = useState<MediaAssetDto[]>(initialMedia);
  const [folders, setFolders] = useState<MediaFolderDto[]>(initialFolders);
  const [filter, setFilter] = useState<FolderFilter>("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [unused, setUnused] = useState<Set<string>>(new Set(initialUnusedIds));
  const [moveTarget, setMoveTarget] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    initialMedia[0]?.id ?? ""
  );
  const selected = assets.find((a) => a.id === selectedId) ?? assets[0] ?? null;

  // Seçili Görsel SEO Düzenleme State
  const [editAlt, setEditAlt] = useState(selected?.altText ?? "");
  const [editTitle, setEditTitle] = useState(selected?.titleText ?? "");
  const [editCaption, setEditCaption] = useState(selected?.caption ?? "");
  const [focalX, setFocalX] = useState(selected?.focalPoint?.x ?? 50);
  const [focalY, setFocalY] = useState(selected?.focalPoint?.y ?? 50);

  // Yeni Görsel Ekleme State
  const [newFilename, setNewFilename] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const [banner, setBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scope = filter === "all" || filter === "none" || filter === "unused" ? null : new Set(folderSubtreeIds(folders, filter));
  const visible = assets.filter((a) => (filter === "all" ? true : filter === "none" ? !a.folderId : filter === "unused" ? unused.has(a.id) : scope!.has(a.folderId ?? "")));
  const counts: Record<string, number> = {};
  for (const a of assets) counts[a.folderId ?? ""] = (counts[a.folderId ?? ""] ?? 0) + 1;
  const currentFolder = scope ? folders.find((f) => f.id === filter) : undefined;

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
      const ids = [...checked];
      const res = await moveMediaAction({ ids, folderId: target });
      if (!res.ok) return setBanner(res.error);
      setAssets((prev) => prev.map((a) => (checked.has(a.id) ? { ...a, folderId: target } : a)));
      setChecked(new Set());
      setBanner(`${res.moved} görsel taşındı.`);
    });

  const handleSelect = (item: MediaAssetDto) => {
    setSelectedId(item.id);
    setEditAlt(item.altText);
    setEditTitle(item.titleText ?? "");
    setEditCaption(item.caption ?? "");
    setFocalX(item.focalPoint?.x ?? 50);
    setFocalY(item.focalPoint?.y ?? 50);
    setBanner(null);
  };

  const handleUpdateSelectedSeo = () => {
    if (!selected) return;
    startTransition(async () => {
      const res = await saveMediaAssetAction({
        id: selected.id,
        filename: selected.filename,
        url: selected.url,
        altText: editAlt,
        titleText: editTitle,
        caption: editCaption,
        focalPoint: { x: focalX, y: focalY },
      });
      if (res.ok) {
        setAssets((prev) =>
          prev.map((a) => (a.id === res.media.id ? res.media : a))
        );
        setBanner(
          `"${res.media.filename}" görsel SEO verileri güncellendi (Skor: ${res.media.seoScore}/100).`
        );
      }
    });
  };

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newAlt.trim()) return;
    startTransition(async () => {
      const res = await saveMediaAssetAction({
        filename: newFilename.trim() || `media-${Date.now()}.webp`,
        url: newUrl.trim(),
        altText: newAlt.trim(),
        titleText: newTitle.trim(),
        caption: newCaption.trim(),
      });
      if (res.ok) {
        setAssets((prev) => [res.media, ...prev]);
        handleSelect(res.media);
        setNewFilename("");
        setNewUrl("");
        setNewAlt("");
        setNewTitle("");
        setNewCaption("");
        setBanner(`Yeni medya varlığı eklendi.`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] pb-3">
        <div>
          <h1 className="text-[16px] font-bold tracking-tight flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#1D5ED8] dark:text-[#7AA7FF]" />
            <span>Medya Kütüphanesi & Görsel SEO Denetçisi</span>
          </h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Tüm görseller için Alt Text, Title, Figcaption, Odak Noktası (Focal Point) ve Schema.org ImageObject optimizasyonu.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 py-1">
            Toplam Medya: {assets.length}
          </span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-2.5 py-1">
            Eksik Alt Metin: {assets.filter((a) => !a.altText.trim()).length}
          </span>
        </div>
      </div>

      {banner && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)] items-start">
      <MediaFolderTree
        folders={folders}
        counts={counts}
        total={assets.length}
        unused={assets.filter((a) => unused.has(a.id)).length}
        filter={filter}
        onFilter={(f) => { setFilter(f); setChecked(new Set()); }}
        onFolders={setFolders}
        onDeleted={(id, parentId) => setAssets((prev) => prev.map((a) => (a.folderId === id ? { ...a, folderId: parentId } : a)))}
      />
      <div className="space-y-4 min-w-0">
      <MediaBulkUpload
        folderId={currentFolder?.id ?? null}
        folderName={currentFolder?.name ?? "Klasörsüz"}
        onUploaded={(media) => {
          setAssets((prev) => [media, ...prev]);
          setUnused((u) => new Set(u).add(media.id));
          setBanner(`"${media.filename}" yüklendi (${media.width}×${media.height}).`);
        }}
      />

      {checked.size > 0 && (
        <div role="region" aria-label="Toplu işlem" className="flex flex-wrap items-center gap-2 rounded-lg border border-[#266DF0]/40 bg-[#266DF0]/5 px-3 py-2 text-[12px]">
          <strong>{checked.size} görsel seçili</strong>
          <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className="h-7 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-1" aria-label="Taşınacak klasör">
            <option value="">Klasör seçin…</option>
            <option value="__root">Klasörsüz (kök)</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
          </select>
          <button type="button" disabled={!moveTarget || isPending} onClick={() => moveChecked(moveTarget === "__root" ? null : moveTarget)} className="h-7 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-50">Taşı</button>
          <button type="button" onClick={() => setChecked(new Set(visible.map((a) => a.id)))} className="text-[#1D5ED8] dark:text-[#7AA7FF] underline">Görünenlerin hepsi</button>
          <button type="button" onClick={() => setChecked(new Set())} className="text-[#5C5F66] underline">Seçimi temizle</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Sol: Görsel Izgarası + Yeni Medya Kayıt Kartı */}
        <div className="lg:col-span-8 space-y-4">
          <MediaGrid items={visible} selectedId={selected?.id} checked={checked} folders={folders} onOpen={handleSelect} onToggle={toggle} />

          {/* Yeni Görsel Ekleme Kutusu */}
          <form
            onSubmit={handleCreateMedia}
            className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-3 text-[12px]"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1D5ED8] dark:text-[#7AA7FF] flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Yeni Medya Varlığı & Görsel SEO Kaydı Ekle</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="Dosya Adı (örn: nexpress-hero-2026.webp)"
                aria-label="Dosya Adı (örn: nexpress-hero-2026.webp)"
                className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
              />
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Görsel URL veya SVG Data URI..."
                aria-label="Görsel URL veya SVG Data URI..."
                className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 font-mono text-[11px] outline-none"
              />
              <input
                type="text"
                required
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                placeholder="SEO Alt Metni (altText — Zorunlu)"
                aria-label="SEO Alt Metni (altText — Zorunlu)"
                className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Görsel Title Etiketi (titleText)"
                aria-label="Görsel Title Etiketi (titleText)"
                className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Görsel Altı Açıklaması (Figcaption — SGE & Bağlamsal SEO için önerilir)..."
                aria-label="Görsel Altı Açıklaması (Figcaption — SGE & Bağlamsal SEO için önerilir)..."
                className="flex-1 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="h-8 rounded-md bg-[#266DF0] px-4 text-white font-semibold hover:bg-[#1D5ED8] cursor-pointer"
              >
                + Medya Ekle
              </button>
            </div>
          </form>
        </div>

        {/* Sağ Yapışkan (Sticky) Görsel SEO Denetçisi */}
        {selected && (
          <div className="lg:col-span-4 sticky top-12 rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-3.5 text-[12px]">
            <div className="flex items-center justify-between border-b border-[#E6E7EA] dark:border-[#23262E] pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1D5ED8] dark:text-[#7AA7FF] flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                <span>Görsel SEO Denetçisi</span>
              </span>
              <span className="rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold">
                Skor: {selected.seoScore}/100
              </span>
            </div>

            <div className="h-40 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-slate-900 overflow-hidden">
              <img
                src={thumbnailUrl(selected.url, 480)}
                alt={editAlt}
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                Dosya Adı & Boyut
              </label>
              <div className="font-mono text-[11px] text-[#5C5F66]">
                {selected.filename} ({selected.width}×{selected.height}px)
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                Alt Metin (altText — Google Images & Erişilebilirlik)
              </label>
              <textarea aria-label="Alt metin"
                rows={2}
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] p-2 text-[11px] outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                Title Etiketi (titleText)
              </label>
              <input aria-label="Title Etiketi (titleText)"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1.5 text-[11px] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                Altyazı (Figcaption & MarkdownCache)
              </label>
              <textarea aria-label="Altyazı (Figcaption & MarkdownCache)"
                rows={2}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] p-2 text-[11px] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                  Odak X ({focalX}%)
                </label>
                <input aria-label="Odak X (%)"
                  type="range"
                  min={0}
                  max={100}
                  value={focalX}
                  onChange={(e) => setFocalX(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]">
                  Odak Y ({focalY}%)
                </label>
                <input aria-label="Odak Y (%)"
                  type="range"
                  min={0}
                  max={100}
                  value={focalY}
                  onChange={(e) => setFocalY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleUpdateSelectedSeo}
              className="w-full h-8 rounded-md bg-[#14151A] dark:bg-white text-white dark:text-[#14151A] font-semibold hover:opacity-90 cursor-pointer"
            >
              {isPending ? "Güncelleniyor..." : "Görsel SEO Ayarlarını Kaydet"}
            </button>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-[#5F6570] dark:text-[#8C9099]" htmlFor="media-folder-select">Klasör</label>
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
                className="h-8 w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 text-[11px]"
              >
                <option value="">Klasörsüz (kök)</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{"— ".repeat(folderPath(folders, f.id).length - 1)}{f.name}</option>)}
              </select>
            </div>

            <MediaDelete
              key={selected.id}
              media={selected}
              onDeleted={(id) => {
                const rest = assets.filter((a) => a.id !== id);
                setChecked((c) => { const n = new Set(c); n.delete(id); return n; });
                setAssets(rest);
                if (rest[0]) handleSelect(rest[0]);
                setBanner("Görsel silindi.");
              }}
            />
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
