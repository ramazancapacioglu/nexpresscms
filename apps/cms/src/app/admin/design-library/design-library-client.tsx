"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Layers, LayoutTemplate, Palette, Sparkles } from "lucide-react";
import type { BlockNode } from "@nexpress/core";
import type { DesignPreview } from "@/lib/design-library";
import { createPageFromDesignAction, deleteDesignAction, installThemeDesignAction, renameDesignAction } from "./actions";
import { DesignPreviewView } from "./design-preview";
import { GeneratorPanel } from "./generator-panel";

export interface LibraryItem {
  id: string;
  kind: "section" | "page" | "theme";
  name: string;
  description: string;
  category: string;
  source: "ai" | "manual";
  prompt: string;
  placeholderData: boolean;
  score: number;
  createdAt: string;
  payload: Record<string, unknown>;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = `h-7 rounded-md border ${border} px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] disabled:opacity-50 dark:hover:bg-[#1C1E24]`;
const KIND = { section: ["Bölüm", Layers], page: ["Sayfa", LayoutTemplate], theme: ["Tema", Palette] } as const;

function toPreview(i: LibraryItem): DesignPreview {
  const blocks = (i.payload.blocks as BlockNode[] | undefined) ?? [];
  const theme = i.payload.theme as DesignPreview["theme"] | undefined;
  return { mode: i.kind, name: i.name, description: i.description, category: i.category, blocks, page: i.payload.page as DesignPreview["page"], theme: theme ? { ...theme, contrast: [] } : undefined, errors: [], warnings: [], score: i.score, placeholderData: i.placeholderData };
}

function Card({ item, onChanged }: { item: LibraryItem; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const [label, Icon] = KIND[item.kind];
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const r = await fn();
      setNote(r.ok ? ok ?? "" : r.error ?? "İşlem başarısız.");
      if (r.ok) onChanged();
    });
  return (
    <li className={`space-y-2 rounded-lg border ${border} bg-white p-3 text-[12px] dark:bg-[#15171C]`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1D5ED8] dark:text-[#7AA7FF]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{item.name}</p>
          <p className="text-[#5F6570] dark:text-[#8C9099]">{label}{item.kind === "section" ? ` · ${item.category}` : ""} · {item.source === "ai" ? "AI" : "elle"} · {new Date(item.createdAt).toLocaleDateString("tr-TR")} · skor {item.score}</p>
        </div>
        {item.placeholderData && <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">Gerçek veri gerekli</span>}
      </div>
      {item.description && <p className="text-[#5F6570] dark:text-[#9CA3AF]">{item.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Gizle" : "Yapıyı gör"}</button>
        {item.kind === "page" && <button type="button" className={btn} disabled={pending} onClick={() => run(async () => { const r = await createPageFromDesignAction({ id: item.id }); if (r.ok) router.push(`/admin/contents?id=${encodeURIComponent(r.contentId)}`); return r; }, "Taslak sayfa oluşturuldu.")}>Taslak sayfa oluştur</button>}
        {item.kind === "theme" && <button type="button" className={btn} disabled={pending} onClick={() => run(() => installThemeDesignAction({ id: item.id }), "Tema kuruldu; Tema paketleri sayfasından etkinleştirin.")}>Temayı kur</button>}
        <button type="button" className={btn} onClick={() => void navigator.clipboard?.writeText(JSON.stringify(item.payload, null, 2)).then(() => setNote("JSON kopyalandı."))}>JSON kopyala</button>
        <button type="button" className={btn} disabled={pending} onClick={() => { const n = window.prompt("Yeni ad", item.name); if (n && n.trim()) run(() => renameDesignAction({ id: item.id, name: n }), "Yeniden adlandırıldı."); }}>Adlandır</button>
        <button type="button" disabled={pending} onClick={() => window.confirm(`"${item.name}" silinsin mi?`) && run(() => deleteDesignAction({ id: item.id }))} className="h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10">Sil</button>
      </div>
      {item.kind === "theme" && note.includes("Tema kuruldu") && <Link href="/admin/themes/packages" className="text-[#1D5ED8] underline dark:text-[#7AA7FF]">Tema paketlerine git</Link>}
      {note && <p role="status" className="text-[11px] text-[#5F6570] dark:text-[#9CA3AF]">{note}</p>}
      {open && <div className={`border-t ${border} pt-2`}><DesignPreviewView d={toPreview(item)} /></div>}
    </li>
  );
}

export function DesignLibraryClient({ items, aiReady, pluginOn }: { items: LibraryItem[]; aiReady: boolean; pluginOn: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"library" | "generate">(items.length ? "library" : "generate");
  const [kind, setKind] = useState<"all" | LibraryItem["kind"]>("all");
  const shown = items.filter((i) => kind === "all" || i.kind === kind);
  const tabCls = (on: boolean) => `rounded px-3 py-1 ${on ? "bg-white shadow-sm dark:bg-[#2A2D35]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`;
  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Tasarım kütüphanesi</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Bölüm, sayfa ve tema tasarımlarınız. AI, sitenizin blok sözleşmesini, SEO/GEO ve kontrast sınırlarını bilerek üretir; çıktı doğrulanır ve hiçbir şey otomatik yayınlanmaz.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:bg-[#1C1E24]">
          <button role="tab" type="button" aria-selected={tab === "library"} onClick={() => setTab("library")} className={tabCls(tab === "library")}>Kütüphanem ({items.length})</button>
          <button role="tab" type="button" aria-selected={tab === "generate"} onClick={() => setTab("generate")} className={tabCls(tab === "generate")}><Sparkles className="mr-1 inline h-3 w-3" aria-hidden />AI ile tasarla</button>
        </div>
      </div>
      {tab === "generate" ? (
        <GeneratorPanel aiReady={aiReady} pluginOn={pluginOn} onSaved={() => { router.refresh(); setTab("library"); }} />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1.5 text-[12px]">
            {(["all", "section", "page", "theme"] as const).map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 ${kind === k ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" : border}`}>{k === "all" ? "Tümü" : KIND[k][0]}</button>)}
          </div>
          {shown.length === 0 ? (
            <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center dark:bg-[#15171C]`}>
              <Sparkles className="mx-auto h-8 w-8 text-[#C9CDD4]" aria-hidden />
              <p className="mt-3 text-[13px] font-medium">Kütüphane boş</p>
              <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">"AI ile tasarla" sekmesinden bir bölüm, sayfa veya tema üretip kaydedin. Kaydedilen bölümler ve paketler görsel editörün tasarım kütüphanesinde "Benim tasarımlarım" altında görünür.</p>
              <button type="button" onClick={() => setTab("generate")} className="mt-4 h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white">Tasarlamaya başla</button>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((i) => <Card key={i.id} item={i} onChanged={() => router.refresh()} />)}</ul>
          )}
        </div>
      )}
    </div>
  );
}
