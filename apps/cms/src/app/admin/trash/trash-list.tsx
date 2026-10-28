"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { emptyTrashAction, purgeContentsAction, restoreContentsAction } from "../lifecycle-actions";

interface Item {
  contentId: string;
  title: string;
  slug: string;
  type: string;
  previousStatus: string;
  deletedAt: string;
  deletedBy: string;
  daysLeft: number;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = "h-7 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50";
const fmt = (iso: string) => new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

export function TrashList({ items, isAdmin }: { items: Item[]; isAdmin: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const ids = [...selected];
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));

  const run = (fn: () => Promise<{ ok: boolean; affected?: number; error?: string }>, done: (n: number) => string) =>
    start(async () => {
      try {
        const res = await fn();
        setMsg(res.ok ? done(res.affected ?? 0) : (res.error ?? "İşlem başarısız."));
        setSelected(new Set());
        router.refresh();
      } catch {
        setMsg("İşlem tamamlanamadı.");
      }
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={pending || ids.length === 0} onClick={() => run(() => restoreContentsAction({ ids }), (n) => `${n} içerik taslak olarak geri yüklendi.`)}>
          Geri yükle ({ids.length})
        </button>
        {isAdmin && (
          <>
            <button
              type="button"
              className={`${btn} text-red-600`}
              disabled={pending || ids.length === 0}
              onClick={() => window.confirm(`${ids.length} içerik KALICI silinsin mi? Geri alınamaz.`) && run(() => purgeContentsAction({ ids }), (n) => `${n} içerik kalıcı silindi.`)}
            >
              Kalıcı sil
            </button>
            <button
              type="button"
              className={`${btn} ml-auto text-red-600`}
              disabled={pending}
              onClick={() => window.confirm(`Çöp kutusundaki ${items.length} içeriğin tümü KALICI silinsin mi?`) && run(() => emptyTrashAction(), (n) => `Çöp kutusu boşaltıldı (${n}).`)}
            >
              Çöpü boşalt
            </button>
          </>
        )}
      </div>
      {msg && <p role="status" className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">{msg}</p>}
      <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
        {items.map((i) => (
          <li key={i.contentId} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
            <input type="checkbox" aria-label={`${i.title} seç`} checked={selected.has(i.contentId)} onChange={() => toggle(i.contentId)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#14151A] dark:text-[#F3F4F6]">{i.title}</p>
              <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                {i.type} · önceki durum: {i.previousStatus} · {fmt(i.deletedAt)}{i.deletedBy && ` · ${i.deletedBy}`}
              </p>
            </div>
            <span className={`shrink-0 font-mono text-[11px] ${i.daysLeft <= 3 ? "text-red-600" : "text-[#5F6570] dark:text-[#8C9099]"}`}>{i.daysLeft} gün kaldı</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
