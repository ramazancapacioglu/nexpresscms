"use client";

import { useState } from "react";
import { applyStylePreset, type StylePreset } from "@nexpress/core";
import { Bookmark, Trash2 } from "lucide-react";
import { useStudioInspector } from "./studio-inspector-context";
import { useStylePresets } from "./use-style-presets";

const field = "h-7 rounded border border-border bg-background px-1.5 text-[11px]";

/** Stil sekmesinin üstünde: kayıtlı ön ayarı bloğa uygula, bloğun stilini ön ayar olarak kaydet, ön ayar sil. */
export function StylePresetBar() {
  const { selectedBlock, setBlocks } = useStudioInspector();
  const selectedBlockId = selectedBlock?.id ?? null;
  const { presets, pending, save: savePreset, remove: removePreset } = useStylePresets();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const apply = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset || !selectedBlockId) return;
    setBlocks((prev) => {
      const walk = (list: typeof prev): typeof prev => list.map((b) => (b.id === selectedBlockId ? { ...b, style: applyStylePreset(b.style, preset) } : b.children ? { ...b, children: walk(b.children) } : b));
      return walk(prev);
    });
    setMsg(`"${preset.name}" uygulandı.`);
  };
  const save = async () => {
    const r = await savePreset(name, selectedBlock?.style ?? {});
    setMsg(r.ok ? `"${name.trim()}" kaydedildi.` : (r.error ?? ""));
    if (r.ok) setName("");
  };
  const remove = async (p: StylePreset) => {
    const r = await removePreset(p.id);
    setMsg(r.ok ? `"${p.name}" silindi.` : (r.error ?? ""));
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold"><Bookmark className="h-3.5 w-3.5" aria-hidden /> Stil ön ayarları</div>
      <div className="flex items-center gap-1.5">
        <select aria-label="Ön ayar uygula" value="" disabled={pending || presets.length === 0} onChange={(e) => apply(e.target.value)} className={`${field} min-w-0 flex-1`}>
          <option value="">{presets.length ? "Ön ayar uygula…" : "Henüz ön ayar yok"}</option>
          {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {presets.length > 0 && (
          <select aria-label="Ön ayar sil" value="" disabled={pending} onChange={(e) => { const p = presets.find((x) => x.id === e.target.value); if (p && window.confirm(`"${p.name}" ön ayarı silinsin mi? Uygulandığı bloklar değişmez.`)) remove(p); }} className={`${field} w-24`}>
            <option value="">Sil…</option>
            {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input aria-label="Ön ayar adı" value={name} maxLength={60} placeholder="Bu stili ön ayar olarak kaydet" onChange={(e) => setName(e.target.value)} className={`${field} min-w-0 flex-1`} />
        <button type="button" disabled={pending || !name.trim()} onClick={save} className="h-7 rounded bg-blue-700 px-2.5 text-[11px] font-semibold text-white disabled:opacity-50">Kaydet</button>
      </div>
      {msg && <p role="status" className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">{msg}</p>}
    </div>
  );
}
