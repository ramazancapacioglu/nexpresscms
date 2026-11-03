"use client";

import { useStudioInspector } from "./studio-inspector-context";

const box = "h-8 w-full rounded border border-border bg-background px-2 text-[12px]";
const cap = "mb-1 block text-[11px] text-muted-foreground";

export const ANCHOR_ID_PRESETS = [
  { id: "genel-bakis", label: "Genel Bakış" },
  { id: "urunler", label: "Ürünler" },
  { id: "detayli-incele", label: "Detaylı İncele" },
  { id: "karsilastirma", label: "Karşılaştırma" },
  { id: "sss", label: "SSS" },
  { id: "basari-hikayeleri", label: "Başarı Hikayeleri" },
  { id: "referanslar", label: "Referanslar" },
  { id: "teklif-formu", label: "Teklif Formu" },
] as const;

export function QuickAnchorIdField() {
  const { selectedBlock, updateSelectedBlockStyleRoot } = useStudioInspector();
  if (!selectedBlock) return null;
  const currentAnchor = selectedBlock.style?.anchorId ?? "";
  const setAnchor = (raw: string) => {
    const clean = raw
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9-_]/g, "");
    updateSelectedBlockStyleRoot({ anchorId: clean || undefined });
  };

  return (
    <div className="space-y-1.5 rounded-lg border border-blue-500/25 bg-blue-500/5 p-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-foreground" htmlFor="sec-anchor-id">
          🔗 HTML Çapa Kimliği (#id — Yapışkan Menü Hedefi)
        </label>
        {currentAnchor ? (
          <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
            #{currentAnchor}
          </span>
        ) : null}
      </div>
      <div className="flex items-center rounded border border-border bg-background px-2">
        <span className="font-mono text-xs font-bold text-muted-foreground">#</span>
        <input
          id="sec-anchor-id"
          className="h-7 w-full bg-transparent px-1 font-mono text-[12px] outline-none"
          placeholder="genel-bakis, urunler, sss..."
          value={currentAnchor}
          onChange={(e) => setAnchor(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {ANCHOR_ID_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setAnchor(preset.id)}
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition ${
              currentAnchor === preset.id
                ? "bg-blue-600 font-bold text-white"
                : "border border-border bg-background text-muted-foreground hover:border-blue-500 hover:text-foreground"
            }`}
          >
            #{preset.id}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Kapsayıcı bölüm: başlık, içerik genişliği, HTML çapa kimliği ve arka plan videosu. */
export function SectionFields() {
  const { selectedBlock, updateSelectedBlockProps } = useStudioInspector();
  if (!selectedBlock) return null;
  const p = selectedBlock.props ?? {};
  const set = (patch: Record<string, unknown>) => updateSelectedBlockProps(patch);
  return (
    <div className="space-y-2.5">
      <QuickAnchorIdField />
      <div>
        <label className={cap} htmlFor="sec-title">Bölüm başlığı (isteğe bağlı, h2)</label>
        <input id="sec-title" className={box} value={String(p.title ?? "")} maxLength={120} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div>
        <label className={cap} htmlFor="sec-mode">İçerik genişliği</label>
        <select id="sec-mode" className={box} value={String(p.containerMode ?? "boxed")} onChange={(e) => set({ containerMode: e.target.value })}>
          <option value="boxed">Site kapsayıcısı</option>
          <option value="narrow">Dar (840px)</option>
          <option value="full">Tam genişlik</option>
        </select>
      </div>
      <div className="space-y-2 rounded-lg border border-border p-2.5">
        <div className="text-[11px] font-semibold">Arka plan videosu</div>
        <p className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Sessiz, döngülü, otomatik oynar. Mobilde ve "hareketi azalt" ayarında oynamaz; kapak görseli gösterilir. Kısa (≤10 sn) ve küçük dosya kullanın.</p>
        <div>
          <label className={cap} htmlFor="sec-video">Video adresi (mp4 / webm)</label>
          <input id="sec-video" className={`${box} font-mono`} value={String(p.bgVideo ?? "")} placeholder="/media/…/arka-plan.mp4" onChange={(e) => set({ bgVideo: e.target.value || undefined })} />
        </div>
        <div>
          <label className={cap} htmlFor="sec-poster">Kapak görseli</label>
          <input id="sec-poster" className={`${box} font-mono`} value={String(p.bgPoster ?? "")} placeholder="/media/…" onChange={(e) => set({ bgPoster: e.target.value || undefined })} />
        </div>
      </div>
    </div>
  );
}
