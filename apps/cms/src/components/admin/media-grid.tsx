"use client";

import { thumbnailUrl } from "@nexpress/core";
import type { MediaAssetDto, MediaFolderDto } from "@nexpress/database";
import { Check } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Görsel ızgarası: tıkla = denetçide aç; onay kutusu = toplu seçim (Shift ile aralık). */
export function MediaGrid({ items, selectedId, checked, folders, onOpen, onToggle }: { items: MediaAssetDto[]; selectedId: string | undefined; checked: Set<string>; folders: MediaFolderDto[]; onOpen: (a: MediaAssetDto) => void; onToggle: (id: string, range: boolean) => void }) {
  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name;
  if (items.length === 0) return <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center text-[12px] text-[#8C9099] dark:bg-[#15171C]`}>Bu görünümde görsel yok. Yukarıdan yükleyin ya da başka bir klasör seçin.</div>;
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const isChecked = checked.has(item.id);
        return (
          <li key={item.id} className={`relative overflow-hidden rounded-lg border bg-white transition dark:bg-[#15171C] ${isChecked ? "border-[#266DF0] ring-2 ring-[#266DF0]/25" : isSelected ? "border-[#266DF0] ring-2 ring-[#266DF0]/15" : `${border} hover:border-[#B8BCC6]`}`}>
            <button type="button" onClick={() => onOpen(item)} className="block w-full text-left">
              <div className="relative h-36 overflow-hidden bg-slate-900">
                <img src={thumbnailUrl(item.url)} alt={item.altText} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute right-2 top-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">SEO {item.seoScore}/100</span>
              </div>
              <div className="space-y-1 p-3 text-[11px]">
                <div className="truncate font-semibold">{item.filename}</div>
                <div className="font-mono text-[10px] text-[#8C9099]">{item.width}×{item.height}px • {(item.sizeBytes / 1024).toFixed(1)} KB</div>
                <p className="line-clamp-1 text-[10px] text-[#5C5F66]">alt: {item.altText || "⚠️ Eksik alt metin"}</p>
                {folderName(item.folderId) && <p className="truncate text-[10px] text-[#8C9099]">📁 {folderName(item.folderId)}</p>}
              </div>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              aria-label={`${item.filename} seç`}
              onClick={(e) => onToggle(item.id, e.shiftKey)}
              className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border ${isChecked ? "border-[#266DF0] bg-[#266DF0] text-white" : "border-white/80 bg-black/40 text-transparent hover:text-white"}`}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
