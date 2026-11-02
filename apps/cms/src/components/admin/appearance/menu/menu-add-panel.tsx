"use client";

import React, { useMemo, useState } from "react";
import type { MenuSource } from "@nexpress/core";
import { Plus, Search } from "lucide-react";
import type { MenuSourceLists } from "./menu-sources";

type Tab = "pages" | "posts" | "category" | "tag" | "product" | "custom";
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "pages", label: "Sayfalar" },
  { id: "posts", label: "Yazılar" },
  { id: "category", label: "Kategoriler" },
  { id: "tag", label: "Etiketler" },
  { id: "product", label: "Ürünler" },
  { id: "custom", label: "Özel" },
];

export interface AddRequest {
  label: string;
  href: string;
  source: MenuSource;
}

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/ı/g, "i").replace(/[̀-ͯ]/g, "");
const box = "w-full rounded border border-[#D5D8DE] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#266DF0]/40 dark:border-[#2E333D] dark:bg-[#121317]";

/** WordPress benzeri "Menüye ekle": sayfa/yazı/kategori/etiket/ürün listesinde arayıp işaretleyerek ya da özel bağlantı yazarak ekler. */
export function MenuAddPanel({ lists, onAdd, locale = "tr" }: { lists: MenuSourceLists; onAdd: (items: AddRequest[]) => void; locale?: string }) {
  const [tab, setTab] = useState<Tab>("pages");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState({ label: "", href: "https://" });

  const rows = useMemo(() => {
    const needle = norm(q.trim());
    const match = (s: string) => !needle || norm(s).includes(needle);
    if (tab === "pages") return lists.contents.filter((c) => c.type === "page" && match(c.title)).map((c) => ({ key: c.id, title: c.title, note: c.published ? `/${c.slug}` : "Taslak — yayında görünmez", req: { label: c.title, href: `/${locale}/${c.slug}`, source: { kind: "content", refId: c.id } as MenuSource } }));
    if (tab === "posts") return lists.contents.filter((c) => c.type !== "page" && c.type !== "product" && match(c.title)).map((c) => ({ key: c.id, title: c.title, note: c.published ? `/${c.slug}` : "Taslak — yayında görünmez", req: { label: c.title, href: `/${locale}/${c.slug}`, source: { kind: "content", refId: c.id } as MenuSource } }));
    if (tab === "category" || tab === "tag") return lists.taxonomies.filter((t) => t.type === tab && match(t.name)).map((t) => ({ key: t.id, title: t.name, note: `/${tab === "category" ? "kategori" : "etiket"}/${t.slug}`, req: { label: t.name, href: `/${locale}/${tab === "category" ? "kategori" : "etiket"}/${t.slug}`, source: { kind: tab, refId: t.id } as MenuSource } }));
    if (tab === "product") return lists.products.filter((p) => match(p.name)).map((p) => ({ key: p.id, title: p.name, note: p.published ? `/magaza/${p.slug}` : "Taslak — yayında görünmez", req: { label: p.name, href: `/${locale}/magaza/${p.slug}`, source: { kind: "product", refId: p.id } as MenuSource } }));
    return [];
  }, [tab, q, lists]);

  const addPicked = () => {
    onAdd(rows.filter((r) => picked.has(r.key)).map((r) => r.req));
    setPicked(new Set());
  };

  return (
    <section aria-label="Menüye ekle" className="rounded-lg border border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]">
      <div className="border-b border-[#D5D8DE] px-3 py-2 text-[13px] font-semibold dark:border-[#2E333D]">Menüye ekle</div>
      <div role="tablist" aria-label="Kaynak türü" className="flex flex-wrap gap-1 border-b border-[#D5D8DE] p-2 dark:border-[#2E333D]">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setQ(""); setPicked(new Set()); }} className={`rounded px-2.5 py-1 text-[12px] font-medium ${tab === t.id ? "bg-[#266DF0] text-white" : "text-[#454B55] hover:bg-[#E9ECF1] dark:text-[#B4BAC5] dark:hover:bg-[#22252D]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-2 p-3">
        {tab === "custom" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onAdd([{ label: "Ana sayfa", href: `/${locale}`, source: { kind: "home" } }])} className="rounded border border-[#D5D8DE] px-2 py-1.5 text-[12px] hover:bg-[#F1F3F6] dark:border-[#2E333D] dark:hover:bg-[#1C1F26]">+ Ana sayfa</button>
              <button type="button" onClick={() => onAdd([{ label: "Mağaza", href: `/${locale}/magaza`, source: { kind: "store" } }])} className="rounded border border-[#D5D8DE] px-2 py-1.5 text-[12px] hover:bg-[#F1F3F6] dark:border-[#2E333D] dark:hover:bg-[#1C1F26]">+ Mağaza</button>
            </div>
            <label className="block text-[12px] font-medium">Bağlantı metni<input value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} className={`${box} mt-1`} /></label>
            <label className="block text-[12px] font-medium">Adres<input value={custom.href} onChange={(e) => setCustom({ ...custom, href: e.target.value })} placeholder="https://… veya /tr/sayfa veya #bolum" className={`${box} mt-1 font-mono`} /></label>
            <button type="button" disabled={!custom.label.trim() || !/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(custom.href.trim()) || custom.href.trim() === "https://"} onClick={() => { onAdd([{ label: custom.label.trim(), href: custom.href.trim(), source: { kind: "custom" } }]); setCustom({ label: "", href: "https://" }); }} className="inline-flex h-8 items-center gap-1 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Menüye ekle</button>
            <p className="text-[11px] text-[#454B55] dark:text-[#B4BAC5]">Yalnızca site içi (/…), çapa (#…), http(s), mailto ve tel adresleri kabul edilir.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-[#5F6570]" aria-hidden="true" />
              <input type="search" aria-label="Listede ara" placeholder="Ara…" value={q} onChange={(e) => setQ(e.target.value)} className={`${box} pl-8`} />
            </div>
            <ul className="max-h-64 divide-y divide-[#E6E8EC] overflow-y-auto rounded border border-[#D5D8DE] dark:divide-[#262A33] dark:border-[#2E333D]">
              {rows.length === 0 ? <li className="px-3 py-6 text-center text-[12px] text-[#454B55] dark:text-[#B4BAC5]">Sonuç yok.</li> : null}
              {rows.map((r) => (
                <li key={r.key}>
                  <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-[13px] hover:bg-[#F1F3F6] dark:hover:bg-[#1C1F26]">
                    <input type="checkbox" className="mt-1" checked={picked.has(r.key)} onChange={() => setPicked((cur) => { const n = new Set(cur); if (n.has(r.key)) n.delete(r.key); else n.add(r.key); return n; })} />
                    <span className="min-w-0"><span className="block truncate font-medium">{r.title}</span><span className="block truncate font-mono text-[11px] text-[#454B55] dark:text-[#B4BAC5]">{r.note}</span></span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setPicked(new Set(rows.map((r) => r.key)))} className="text-[12px] underline">Görünenlerin hepsi</button>
              <button type="button" disabled={picked.size === 0} onClick={addPicked} className="inline-flex h-8 items-center gap-1 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Menüye ekle ({picked.size})</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
