"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { folderSubtreeIds, type MediaKind } from "@nexpress/core";
import { MediaBulkUpload } from "../media-bulk-upload";
import { MediaGrid } from "../media-grid";
import { MediaDetailForm } from "./media-detail-form";
import { DEFAULT_QUERY, queryMedia, type MediaQuery } from "./media-filter";
import { MediaToolbar } from "./media-toolbar";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const revive = (a: MediaAssetDto): MediaAssetDto => ({ ...a, createdAt: new Date(a.createdAt) });

interface Props {
  open: boolean;
  onClose: () => void;
  /** Seçilen (ve varsa düzenlenip kaydedilen) medya */
  onPick: (asset: MediaAssetDto) => void;
  /** Hangi türler seçilebilir (varsayılan yalnızca görsel) */
  kinds?: MediaKind[];
  title?: string;
  /** Açılışta hemen gösterilecek liste (sonra güncelini getirir) */
  seed?: MediaAssetDto[];
  /** Kitaplık değişince (yükleme, düzenleme) editör durumunu güncellemek için */
  onLibraryChange?: (assets: MediaAssetDto[]) => void;
}

/**
 * WordPress benzeri medya seçici: kitaplık (klasör, arama, tür süzgeci) + aynı pencerede yükleme + seçilen dosyanın
 * başlık / alt metin / alt yazı / açıklama alanları. "Kaydet ve ekle" önce medya bilgilerini kitaplığa yazar, sonra seçer.
 */
export function MediaPickerDialog({ open, onClose, onPick, kinds = ["image"], title = "Medya seç", seed, onLibraryChange }: Props) {
  const [assets, setAssets] = useState<MediaAssetDto[]>(seed ?? []);
  const [folders, setFolders] = useState<MediaFolderDto[]>([]);
  const [folderId, setFolderId] = useState<string>("");
  const [query, setQuery] = useState<MediaQuery>(DEFAULT_QUERY);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; assets?: MediaAssetDto[]; folders?: MediaFolderDto[]; error?: string };
      if (!json.ok || !json.assets) throw new Error(json.error ?? "Kitaplık yüklenemedi.");
      setAssets(json.assets.map(revive));
      setFolders(json.folders ?? []);
      onLibraryChange?.(json.assets.map(revive));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kitaplık yüklenemedi.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, load]);

  const allowed = useMemo(() => assets.filter((a) => kinds.includes(a.kind)), [assets, kinds]);
  const scope = folderId ? new Set(folderSubtreeIds(folders, folderId)) : null;
  const visible = useMemo(() => queryMedia(allowed.filter((a) => !scope || scope.has(a.folderId ?? "")), query), [allowed, query, folderId, folders]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = assets.find((a) => a.id === selectedId) ?? null;

  const update = (next: MediaAssetDto[]) => {
    setAssets(next);
    onLibraryChange?.(next);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-xl border border-border bg-background shadow-2xl outline-none">
        <div className={`flex items-center justify-between border-b ${border} px-4 py-3`}>
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" aria-label="Kapat" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3">
            <MediaBulkUpload
              folderId={folderId || null}
              folderName={folders.find((f) => f.id === folderId)?.name ?? "Klasörsüz"}
              onUploaded={(media) => { update([media, ...assets]); setSelectedId(media.id); }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Klasör" value={folderId} onChange={(e) => setFolderId(e.target.value)} className={`h-8 rounded border ${border} bg-transparent px-2 text-[12px]`}>
                <option value="">Tüm klasörler</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="min-w-0 flex-1"><MediaToolbar query={query} onQuery={setQuery} view="grid" onView={() => {}} showView={false} /></div>
            </div>
            {error && <p role="alert" className="text-[12px] text-red-600">{error} <button type="button" className="underline" onClick={() => void load()}>Yeniden dene</button></p>}
            {loading && assets.length === 0 ? <p className="py-10 text-center text-[12px] text-muted-foreground">Yükleniyor…</p> : (
              <MediaGrid items={visible} selectedId={selected?.id} checked={new Set()} folders={folders} view="grid" onOpen={(a) => setSelectedId(a.id)} />
            )}
          </div>
          <aside aria-label="Seçilen medya" className={`space-y-3 rounded-lg border ${border} p-3 lg:sticky lg:top-0 lg:self-start`}>
            {selected ? (
              <MediaDetailForm asset={selected} onSaved={(a) => update(assets.map((x) => (x.id === a.id ? { ...x, ...a } : x)))} primary={{ label: "Kaydet ve ekle", onDone: (a) => { onPick({ ...selected, ...a }); onClose(); } }} />
            ) : (
              <p className="py-8 text-center text-[12px] text-muted-foreground">Bir dosya seçin ya da yukarıdan yükleyin. Başlık, alt metin, alt yazı ve açıklamayı burada girebilirsiniz.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
