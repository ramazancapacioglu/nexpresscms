"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Search } from "lucide-react";

export interface LinkItem { group: string; title: string; href: string }
let cache: Promise<LinkItem[]> | null = null;
const load = () => (cache ??= fetch("/api/admin/links", { cache: "no-store" }).then((r) => r.json()).then((j: { ok: boolean; items?: LinkItem[] }) => (j.ok ? j.items ?? [] : [])).catch(() => []));

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/ı/g, "i").replace(/[̀-ͯ]/g, "");

/** Bağlantı alanı: adres yazılabilir ya da sayfa/yazı/kategori/etiket/ürün aranıp seçilebilir. */
export function LinkField({
  value,
  onChange,
  label,
  placeholder = "https://… veya /sayfa",
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  onSelect?: (item: LinkItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<LinkItem[]>([]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    void load().then(setItems);
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const rows = useMemo(() => items.filter((i) => !q || norm(`${i.title} ${i.href} ${i.group}`).includes(norm(q))).slice(0, 40), [items, q]);
  return (
    <div ref={box} className="relative">
      <div className="flex gap-1">
        <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 font-mono text-[12px]" />
        <button type="button" aria-label={`${label}: ara ve seç`} title="Siteden ara ve seç" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"><Link2 className="h-3.5 w-3.5" /></button>
      </div>
      {open && (
        <div role="listbox" aria-label="Site içi bağlantılar" className="absolute right-0 z-30 mt-1 w-80 max-w-[90vw] rounded-lg border border-border bg-background p-2 shadow-xl">
          <div className="relative mb-2"><Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input autoFocus aria-label="Bağlantı ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sayfa, ürün veya URL ara…" className="h-8 w-full rounded border border-border bg-background pl-7 pr-2 text-[12px]" /></div>
          <ul className="max-h-60 overflow-y-auto">
            {rows.length === 0 ? <li className="px-2 py-4 text-center text-[12px] text-muted-foreground">Sonuç yok</li> : null}
            {rows.map((i, n) => (
              <li key={`${i.href}-${n}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === i.href}
                  onClick={() => {
                    onChange(i.href);
                    onSelect?.(i);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.title}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{i.href}</span>
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{i.group}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
