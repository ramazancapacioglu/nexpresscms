"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Folder, FolderOpen, FolderPlus, ImageOff, Images, Pencil, Trash2 } from "lucide-react";
import { buildFolderTree, type FolderNode } from "@nexpress/core";
import type { MediaFolderDto } from "@nexpress/database";
import { createMediaFolderAction, deleteMediaFolderAction, updateMediaFolderAction } from "@/app/admin/media/actions";

export type FolderFilter = "all" | "none" | "unused" | string;

const border = "border-[#E6E7EA] dark:border-[#23262E]";

interface Props {
  folders: MediaFolderDto[];
  /** Klasör kimliği → doğrudan içindeki dosya sayısı; `""` = klasörsüz */
  counts: Record<string, number>;
  total: number;
  unused: number;
  filter: FolderFilter;
  onFilter: (f: FolderFilter) => void;
  onFolders: (next: MediaFolderDto[]) => void;
  /** Klasör silinince içerik üste çıkar: istemci durumu yenilemek için */
  onDeleted: (id: string, parentId: string | null) => void;
}

/** Soldaki klasör ağacı: tümü / klasörsüz / kullanılmayanlar ve en çok 3 düzey klasör; oluştur, yeniden adlandır, sil. */
export function MediaFolderTree({ folders, counts, total, unused, filter, onFilter, onFolders, onDeleted }: Props) {
  const [adding, setAdding] = useState<string | null | false>(false); // false: kapalı, null: kök, id: o klasörün altı
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const tree = buildFolderTree(folders);

  const subtreeCount = (n: FolderNode): number => (counts[n.id] ?? 0) + n.children.reduce((s, c) => s + subtreeCount(c), 0);
  const submit = () =>
    start(async () => {
      setError("");
      if (editing) {
        const r = await updateMediaFolderAction({ id: editing, name });
        if (!r.ok) return setError(r.error);
        onFolders(folders.map((f) => (f.id === editing ? r.folder : f)));
        setEditing(null);
      } else if (adding !== false) {
        const r = await createMediaFolderAction({ name, parentId: adding });
        if (!r.ok) return setError(r.error);
        onFolders([...folders, r.folder]);
        if (adding) setOpen((o) => new Set(o).add(adding));
        setAdding(false);
        onFilter(r.folder.id);
      }
      setName("");
    });
  const remove = (n: FolderNode) => {
    if (!window.confirm(`"${n.name}" klasörü silinsin mi? İçindeki dosyalar ve alt klasörler üst klasöre taşınır; hiçbir dosya silinmez.`)) return;
    start(async () => {
      const r = await deleteMediaFolderAction({ id: n.id });
      if (!r.ok) return setError(r.error);
      onFolders(folders.filter((f) => f.id !== n.id).map((f) => (f.parentId === n.id ? { ...f, parentId: n.parentId } : f)));
      onDeleted(n.id, n.parentId);
      if (filter === n.id) onFilter(n.parentId ?? "all");
    });
  };

  const row = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count: number, pad = 0) => (
    <button type="button" onClick={onClick} aria-current={active} style={{ paddingLeft: 8 + pad * 14 }} className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[12px] ${active ? "bg-[#266DF0]/10 font-semibold text-[#1D5ED8] dark:text-[#7AA7FF]" : "hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]"}`}>
      {icon}<span className="min-w-0 flex-1 truncate">{label}</span><span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{count}</span>
    </button>
  );

  const nodes = (list: FolderNode[]): React.ReactNode =>
    list.map((n) => {
      const expanded = open.has(n.id);
      const active = filter === n.id;
      return (
        <li key={n.id}>
          <div className="group flex items-center">
            {n.children.length > 0 ? (
              <button type="button" aria-label={expanded ? "Daralt" : "Genişlet"} onClick={() => setOpen((o) => { const x = new Set(o); if (x.has(n.id)) x.delete(n.id); else x.add(n.id); return x; })} className="h-6 w-5 shrink-0 text-[#5F6570] dark:text-[#8C9099]"><ChevronRight className={`h-3.5 w-3.5 transition ${expanded ? "rotate-90" : ""}`} /></button>
            ) : <span className="w-5 shrink-0" />}
            <div className="min-w-0 flex-1">
              {editing === n.id ? (
                <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="py-0.5"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !pending && setEditing(null)} onKeyDown={(e) => e.key === "Escape" && setEditing(null)} maxLength={60} className={`h-7 w-full rounded border ${border} bg-transparent px-2 text-[12px]`} /></form>
              ) : row(active, () => onFilter(n.id), active || expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />, n.name, subtreeCount(n))}
            </div>
            {editing !== n.id && (
              <span className="flex shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                {n.depth < 3 && <button type="button" aria-label={`${n.name} altına klasör ekle`} title="Alt klasör" onClick={() => { setAdding(n.id); setEditing(null); setName(""); setOpen((o) => new Set(o).add(n.id)); }} className="p-1 text-[#5F6570] dark:text-[#8C9099] hover:text-[#266DF0]"><FolderPlus className="h-3 w-3" /></button>}
                <button type="button" aria-label={`${n.name} yeniden adlandır`} title="Yeniden adlandır" onClick={() => { setEditing(n.id); setAdding(false); setName(n.name); }} className="p-1 text-[#5F6570] dark:text-[#8C9099] hover:text-[#266DF0]"><Pencil className="h-3 w-3" /></button>
                <button type="button" aria-label={`${n.name} sil`} title="Sil" onClick={() => remove(n)} className="p-1 text-red-500"><Trash2 className="h-3 w-3" /></button>
              </span>
            )}
          </div>
          {adding === n.id && <div className="pl-5"><NewFolderInput name={name} setName={setName} submit={submit} cancel={() => setAdding(false)} pending={pending} /></div>}
          {expanded && n.children.length > 0 && <ul className="pl-3">{nodes(n.children)}</ul>}
        </li>
      );
    });

  return (
    <nav aria-label="Medya klasörleri" className={`space-y-1 rounded-lg border ${border} bg-white p-2 dark:bg-[#15171C]`}>
      {row(filter === "all", () => onFilter("all"), <Images className="h-3.5 w-3.5 shrink-0" />, "Tüm medya", total)}
      {row(filter === "none", () => onFilter("none"), <Folder className="h-3.5 w-3.5 shrink-0 opacity-50" />, "Klasörsüz", counts[""] ?? 0)}
      {row(filter === "unused", () => onFilter("unused"), <ImageOff className="h-3.5 w-3.5 shrink-0" />, "Kullanılmayanlar", unused)}
      <div className={`my-1 flex items-center justify-between border-t ${border} px-2 pt-2`}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">Klasörler</span>
        <button type="button" onClick={() => { setAdding(null); setEditing(null); setName(""); }} aria-label="Yeni klasör" title="Yeni klasör" className="text-[#5F6570] dark:text-[#8C9099] hover:text-[#266DF0]"><FolderPlus className="h-3.5 w-3.5" /></button>
      </div>
      {adding === null && <NewFolderInput name={name} setName={setName} submit={submit} cancel={() => setAdding(false)} pending={pending} />}
      <ul>{nodes(tree)}</ul>
      {tree.length === 0 && adding !== null && <p className="px-2 pb-1 text-[11px] text-[#5F6570] dark:text-[#8C9099]">Henüz klasör yok.</p>}
      {error && <p role="alert" className="px-2 text-[11px] text-red-600">{error}</p>}
    </nav>
  );
}

function NewFolderInput({ name, setName, submit, cancel, pending }: { name: string; setName: (v: string) => void; submit: () => void; cancel: () => void; pending: boolean }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="px-1 py-0.5">
      <input autoFocus value={name} placeholder="Klasör adı" maxLength={60} disabled={pending} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Escape" && cancel()} onBlur={() => !name && cancel()} className={`h-7 w-full rounded border ${border} bg-transparent px-2 text-[12px]`} />
    </form>
  );
}
