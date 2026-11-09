"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { ADMIN_SEARCH_GROUP_ORDER, normalizeSearch, type AdminSearchGroup, type AdminSearchHit } from "@nexpress/core";
import { WORKSPACE_SECTIONS } from "./admin-nav";

interface Entry { key: string; group: string; title: string; subtitle: string; href: string; hint?: string }

const GROUP_LABEL: Record<AdminSearchGroup, string> = { content: "İçerik", form: "Formlar", taxonomy: "Kategori & Etiket", media: "Medya", redirect: "Yönlendirmeler", user: "Kullanıcılar" };
const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** ⌘K komut paleti: panel sayfaları (anında) + veri araması (içerik, form, medya…). Klavyeyle tam kullanılır (combobox/listbox). */
export function CommandPalette({ open, onClose, role, hiddenHrefs = [] }: { open: boolean; onClose: () => void; role?: "admin" | "editor"; hiddenHrefs?: string[] }) {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(0);

  const pages = useMemo<Entry[]>(
    () => WORKSPACE_SECTIONS.flatMap((s) => s.items).filter((i) => (!i.adminOnly || role === "admin") && !hiddenHrefs.includes(i.href)).map((i) => ({ key: `p:${i.href}`, group: "Sayfalar", title: i.label, subtitle: i.href, href: i.href, hint: i.shortcut })),
    [role, hiddenHrefs]
  );
  const q = normalizeSearch(query);
  const pageMatches = q ? pages.filter((p) => normalizeSearch(`${p.title} ${p.subtitle}`).includes(q)) : pages.slice(0, 8);
  const dataEntries: Entry[] = hits.map((h) => ({ key: `${h.group}:${h.id}`, group: GROUP_LABEL[h.group], title: h.title, subtitle: h.subtitle, href: h.href }));
  const entries = [...pageMatches.slice(0, q ? 6 : 8), ...ADMIN_SEARCH_GROUP_ORDER.flatMap((g) => dataEntries.filter((e) => e.group === GROUP_LABEL[g]))];

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    setQuery("");
    setHits([]);
    setActive(0);
    return () => { (opener.current as HTMLElement | null)?.focus?.(); };
  }, [open]);

  useEffect(() => {
    if (!open || q.length < 2) { setHits([]); setState("idle"); return; }
    const ctl = new AbortController();
    setState("loading");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: ctl.signal, cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; hits?: AdminSearchHit[] };
        if (!json.ok) throw new Error("search");
        setHits(json.hits ?? []);
        setState("idle");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState("error");
      }
    }, 180);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [open, query, q.length]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" }), [active, uid]);

  if (!open) return null;
  const go = (e: Entry) => { onClose(); router.push(e.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (entries.length ? (a + 1) % entries.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (entries.length ? (a - 1 + entries.length) % entries.length : 0)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(Math.max(0, entries.length - 1)); }
    else if (e.key === "Enter" && entries[active]) { e.preventDefault(); go(entries[active]!); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
    else if (e.key === "Tab") { e.preventDefault(); input.current?.focus(); }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-3 pt-[10vh] backdrop-blur-[1px] sm:px-4 sm:pt-20" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Komut paleti" onKeyDown={onKey} onClick={(e) => e.stopPropagation()} className={`w-full max-w-xl overflow-hidden rounded-lg border ${border} bg-white shadow-2xl dark:bg-[#15171C]`}>
        <div className={`flex items-center gap-2.5 border-b ${border} px-3.5 py-2.5`}>
          <Search className="h-4 w-4 shrink-0 text-[#5F6570] dark:text-[#8C9099]" strokeWidth={1.75} aria-hidden />
          <input
            ref={input}
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={entries[active] ? `${uid}-opt-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Ara: sayfa, içerik, form, medya"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa, içerik, form, medya veya kullanıcı ara…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8C9099]"
          />
          <button type="button" onClick={onClose} aria-label="Kapat (Esc)" className={`shrink-0 rounded border ${border} px-1.5 py-0.5 font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]`}>ESC</button>
        </div>
        <ul id={listId} role="listbox" aria-label="Sonuçlar" className="max-h-[60vh] overflow-y-auto p-1.5 sm:max-h-80">
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? e.group : null;
            lastGroup = e.group;
            return (
              <li key={e.key} role="presentation">
                {header && <div role="presentation" className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">{header}</div>}
                <div id={`${uid}-opt-${i}`} role="option" aria-selected={i === active} onMouseMove={() => setActive(i)} onClick={() => go(e)} className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 ${i === active ? "bg-[#266DF0]/10" : ""}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6]">{e.title}</span>
                    <span className="block truncate text-[11px] text-[#5F6570] dark:text-[#8C9099]">{e.subtitle}</span>
                  </span>
                  {e.hint ? <kbd className="shrink-0 font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{e.hint}</kbd> : <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#5F6570] dark:text-[#8C9099]" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
        {entries.length === 0 && state !== "loading" && <p className="px-4 py-6 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">{q.length < 2 ? "Aramak için en az 2 karakter yazın." : "Sonuç bulunamadı."}</p>}
        {state === "error" && <p role="alert" className="border-t border-red-500/20 px-4 py-2 text-[11px] text-red-600">Veri araması şu an çalışmıyor; yalnızca sayfalar listeleniyor.</p>}
        <div className="sr-only" aria-live="polite">{state === "loading" ? "Aranıyor" : `${entries.length} sonuç`}</div>
        <div className={`flex justify-between border-t ${border} px-3 py-1.5 text-[10px] text-[#5F6570] dark:text-[#8C9099]`}><span>↑↓ seç · Enter aç · Esc kapat</span><span>{state === "loading" ? "Aranıyor…" : ""}</span></div>
      </div>
    </div>
  );
}
