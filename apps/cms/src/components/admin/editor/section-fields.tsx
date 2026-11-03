"use client";

import { useStudioInspector } from "./studio-inspector-context";

const box = "h-8 w-full rounded border border-border bg-background px-2 text-[12px]";
const cap = "mb-1 block text-[11px] text-muted-foreground";

/** Kapsayıcı bölüm: başlık, içerik genişliği ve (isteğe bağlı) arka plan videosu. */
export function SectionFields() {
  const { selectedBlock, updateSelectedBlockProps } = useStudioInspector();
  if (!selectedBlock) return null;
  const p = selectedBlock.props ?? {};
  const set = (patch: Record<string, unknown>) => updateSelectedBlockProps(patch);
  return (
    <div className="space-y-2.5">
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
