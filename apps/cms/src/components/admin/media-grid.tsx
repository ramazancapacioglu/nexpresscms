"use client";

import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { Check } from "lucide-react";
import { formatBytes } from "./media/media-filter";
import { MediaThumb, kindLabel } from "./media/media-thumb";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const scoreClass = (n: number) => (n >= 80 ? "text-emerald-400" : n >= 60 ? "text-amber-300" : "text-red-400");

interface Props {
  items: MediaAssetDto[];
  selectedId: string | undefined;
  checked: Set<string>;
  folders: MediaFolderDto[];
  view?: "grid" | "list";
  onOpen: (a: MediaAssetDto) => void;
  /** Verilmezse onay kutuları gösterilmez (medya seçici) */
  onToggle?: (id: string, range: boolean) => void;
}

/** Kitaplık: ızgara veya liste. Tıkla = ayrıntı paneli; onay kutusu = toplu seçim (Shift ile aralık). */
export function MediaGrid({ items, selectedId, checked, folders, view = "grid", onOpen, onToggle }: Props) {
  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name;
  if (items.length === 0) return <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099] dark:bg-[#15171C]`}>Bu görünümde medya yok. Yükleyin, süzgeci temizleyin ya da başka bir klasör seçin.</div>;

  const checkbox = (item: MediaAssetDto, cls: string) => {
    if (!onToggle) return null;
    const on = checked.has(item.id);
    return (
      <button type="button" role="checkbox" aria-checked={on} aria-label={`${item.filename} seç`} onClick={(e) => onToggle(item.id, e.shiftKey)}
        className={`${cls} flex h-6 w-6 items-center justify-center rounded border ${on ? "border-[#266DF0] bg-[#266DF0] text-white" : "border-white/80 bg-black/40 text-transparent hover:text-white"}`}>
        <Check className="h-3.5 w-3.5" />
      </button>
    );
  };

  if (view === "list") {
    return (
      <div className={`overflow-x-auto rounded-lg border ${border} bg-white dark:bg-[#15171C]`} tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
        <table className="w-full text-[12px]">
          <thead className="bg-[#FBFBFB] text-left text-[10px] uppercase tracking-wider text-[#5F6570] dark:bg-[#121317] dark:text-[#8C9099]"><tr><th className="w-10 px-2 py-2"><span className="sr-only">Seç</span></th><th className="w-16 px-2 py-2"><span className="sr-only">Önizleme</span></th><th className="px-2 py-2">Dosya</th><th className="px-2 py-2">Tür</th><th className="px-2 py-2">Boyut</th><th className="px-2 py-2">Alt metin</th><th className="px-2 py-2">SEO</th></tr></thead>
          <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
            {items.map((item) => (
              <tr key={item.id} className={item.id === selectedId ? "bg-[#266DF0]/5" : ""}>
                <td className="px-2 py-1.5"><div className="relative h-6 w-6">{checkbox(item, "absolute inset-0")}</div></td>
                <td className="px-2 py-1.5"><div className="h-10 w-14 overflow-hidden rounded bg-slate-900"><MediaThumb asset={item} /></div></td>
                <td className="px-2 py-1.5"><button type="button" onClick={() => onOpen(item)} className="max-w-64 truncate text-left font-medium underline-offset-2 hover:underline">{item.titleText || item.filename}</button><div className="max-w-64 truncate font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{item.filename}{folderName(item.folderId) ? ` • 📁 ${folderName(item.folderId)}` : ""}</div></td>
                <td className="px-2 py-1.5">{kindLabel(item.kind)}</td>
                <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px]">{formatBytes(item.sizeBytes)}{item.kind === "image" ? ` • ${item.width}×${item.height}` : ""}</td>
                <td className="max-w-56 truncate px-2 py-1.5 text-[11px]">{item.kind !== "image" ? "—" : item.altText || <span className="text-red-600">Eksik</span>}</td>
                <td className="px-2 py-1.5 font-mono text-[11px]">{item.seoScore}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isChecked = checked.has(item.id);
        const isSelected = item.id === selectedId;
        return (
          <li key={item.id} className={`relative overflow-hidden rounded-lg border bg-white transition dark:bg-[#15171C] ${isChecked ? "border-[#266DF0] ring-2 ring-[#266DF0]/25" : isSelected ? "border-[#266DF0] ring-2 ring-[#266DF0]/15" : `${border} hover:border-[#B8BCC6]`}`}>
            <button type="button" onClick={() => onOpen(item)} className="block w-full text-left">
              <div className="relative h-32 overflow-hidden bg-slate-900">
                <MediaThumb asset={item} />
                <span className={`absolute right-2 top-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-bold ${scoreClass(item.seoScore)}`}>SEO {item.seoScore}</span>
              </div>
              <div className="space-y-0.5 p-2.5 text-[11px]">
                <div className="truncate font-semibold">{item.titleText || item.filename}</div>
                <div className="font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{kindLabel(item.kind)} • {formatBytes(item.sizeBytes)}{item.kind === "image" ? ` • ${item.width}×${item.height}` : ""}</div>
                {item.kind === "image" && !item.altText.trim() && <p className="text-[10px] font-medium text-red-600">⚠ Alt metin eksik</p>}
                {folderName(item.folderId) && <p className="truncate text-[10px] text-[#5F6570] dark:text-[#8C9099]">📁 {folderName(item.folderId)}</p>}
              </div>
            </button>
            {checkbox(item, "absolute left-2 top-2")}
          </li>
        );
      })}
    </ul>
  );
}
