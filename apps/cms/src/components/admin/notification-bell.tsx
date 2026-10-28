"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

interface Item { id: string; severity: "info" | "warning" | "critical"; title: string; body: string; href: string; count: number; read: boolean; resolved: boolean; updatedAt: string }
interface Payload { ok: boolean; unread: { count: number; top: Item["severity"] | null }; items: Item[] }

const DOT = { info: "bg-[#266DF0]", warning: "bg-amber-500", critical: "bg-red-600" } as const;
const BADGE = { info: "bg-[#266DF0]", warning: "bg-amber-500", critical: "bg-red-600" } as const;
const border = "border-[#E6E7EA] dark:border-[#23262E]";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "şimdi" : m < 60 ? `${m} dk` : m < 1440 ? `${Math.round(m / 60)} sa` : `${Math.round(m / 1440)} g`;
};

/** Üst çubuktaki zil: okunmamış sayısı (dakikada bir ve sekmeye dönünce tazelenir) + son bildirimler. */
export function NotificationBell() {
  const [data, setData] = useState<Payload | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (res.ok) setData((await res.json()) as Payload);
    } catch {
      /* ağ yoksa sayı eski kalır */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    const onVis = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const post = async (body: object) => {
    await fetch("/api/admin/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    await load();
  };
  const count = data?.unread.count ?? 0;

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => { setOpen((v) => !v); void load(); }} aria-label={count ? `Bildirimler, ${count} okunmamış` : "Bildirimler"} aria-expanded={open} className={`relative inline-flex h-6 w-6 items-center justify-center rounded border ${border} bg-white text-[#5C5F66] hover:bg-[#F4F5F7] dark:bg-[#1C1E24] dark:text-[#9CA3AF]`}>
        <Bell className="h-3 w-3" />
        {count > 0 && <span className={`absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${BADGE[data?.unread.top ?? "info"]}`}>{count > 99 ? "99+" : count}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Bildirimler" className={`absolute right-0 top-8 z-50 w-80 overflow-hidden rounded-lg border ${border} bg-white shadow-xl dark:bg-[#15171C]`}>
          <div className={`flex items-center justify-between border-b ${border} px-3 py-2 text-[12px]`}>
            <strong>Bildirimler</strong>
            {count > 0 && <button type="button" onClick={() => void post({ action: "readAll" })} className="text-[#1D5ED8] dark:text-[#7AA7FF] hover:underline">Tümünü okundu say</button>}
          </div>
          {!data || data.items.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">{data ? "Bildirim yok." : "Yükleniyor…"}</p>
          ) : (
            <ul className="max-h-96 divide-y divide-[#E6E7EA] overflow-y-auto dark:divide-[#23262E]">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href || "/admin/notifications"} onClick={() => { setOpen(false); if (!n.read) void post({ action: "read", ids: [n.id] }); }} className={`flex gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] ${n.read ? "bg-[#F9FAFB] dark:bg-[#121317]" : ""}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.severity]}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2"><span className="truncate font-medium">{n.title}{n.count > 1 ? ` ×${n.count}` : ""}</span><span className="shrink-0 text-[10px] text-[#5F6570] dark:text-[#8C9099]">{ago(n.updatedAt)}</span></span>
                      {n.body && <span className="line-clamp-2 text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">{n.body}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/notifications" onClick={() => setOpen(false)} className={`block border-t ${border} px-3 py-2 text-center text-[12px] text-[#1D5ED8] dark:text-[#7AA7FF] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}>Tüm bildirimler</Link>
        </div>
      )}
    </div>
  );
}
