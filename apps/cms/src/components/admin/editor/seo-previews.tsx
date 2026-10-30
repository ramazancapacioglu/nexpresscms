"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

const border = "border-border";

/** Uzunluk ölçeri: ideal aralıkta yeşil, kısa/uzun amber; metinle de söyler (renk tek başına anlam taşımaz). */
export function LengthMeter({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const state = value === 0 ? "boş" : value < min ? "kısa" : value > max ? "uzun" : "ideal";
  const pct = Math.min(100, Math.round((value / (max * 1.25)) * 100));
  const color = state === "ideal" ? "bg-emerald-600" : state === "boş" ? "bg-muted-foreground/40" : "bg-amber-600";
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{label}</span><span>{value}/{max} · {state} (ideal {min}–{max})</span></div>
      <div className="mt-0.5 h-1 rounded-full bg-muted" role="img" aria-label={`${label}: ${value} karakter, ${state}`}><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Google sonuç önizlemesi: gerçek site adresi (NEXT_PUBLIC_APP_URL) ve masaüstü/mobil kırpma. */
export function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const [mobile, setMobile] = useState(false);
  let host = url;
  let crumbs = "";
  try {
    const u = new URL(url);
    host = u.host;
    crumbs = u.pathname.split("/").filter(Boolean).join(" › ");
  } catch {
    /* göreli adres */
  }
  return (
    <div className={`space-y-1.5 rounded-lg border ${border} bg-muted/20 p-3`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Arama sonucu önizlemesi</span>
        <span className="inline-flex rounded border border-border">
          <button type="button" aria-pressed={!mobile} aria-label="Masaüstü önizleme" onClick={() => setMobile(false)} className={`p-1 ${!mobile ? "bg-background" : ""}`}><Monitor className="h-3 w-3" /></button>
          <button type="button" aria-pressed={mobile} aria-label="Mobil önizleme" onClick={() => setMobile(true)} className={`p-1 ${mobile ? "bg-background" : ""}`}><Smartphone className="h-3 w-3" /></button>
        </span>
      </div>
      <div className={mobile ? "max-w-[320px]" : "max-w-[600px]"}>
        <div className="truncate text-[11px] text-foreground/80">{host}{crumbs ? ` › ${crumbs}` : ""}</div>
        <div className="text-[15px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{clip(title || "Başlık yok", mobile ? 55 : 60)}</div>
        <div className="text-[11px] leading-snug text-muted-foreground">{clip(description || "Açıklama yok: arama motoru sayfadan kendisi bir parça seçer.", mobile ? 120 : 160)}</div>
      </div>
    </div>
  );
}

/** Sosyal paylaşım kartı önizlemesi (öne çıkan görsel, başlık, açıklama). */
export function SocialPreview({ title, description, image, host }: { title: string; description: string; image: string; host: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border ${border} bg-muted/20`}>
      <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sosyal paylaşım kartı</div>
      <div className="m-3 overflow-hidden rounded-md border border-border bg-background">
        {image ? <div className="aspect-[1.91/1] bg-muted"><img src={image.startsWith("/media/") ? `${image.split("?")[0]}?w=600` : image} alt="" className="h-full w-full object-cover" /></div> : <div className="flex aspect-[1.91/1] items-center justify-center bg-muted text-[10px] text-muted-foreground">Öne çıkan görsel yok: site varsayılan görseli kullanılır</div>}
        <div className="p-2"><div className="text-[10px] uppercase text-muted-foreground">{host}</div><div className="line-clamp-1 text-xs font-semibold">{title || "Başlık"}</div><div className="line-clamp-2 text-[11px] text-muted-foreground">{description}</div></div>
      </div>
    </div>
  );
}
