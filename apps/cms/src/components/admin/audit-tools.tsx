"use client";

import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { purgeAuditAction } from "@/app/admin/audit/actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export function AuditTools({ exportHref, total }: { exportHref: string; total: number }) {
  const [days, setDays] = useState(365);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  return (
    <div className={`flex flex-wrap items-end gap-3 rounded-lg border ${border} bg-white p-3 text-[12px] dark:bg-[#15171C]`}>
      <a href={exportHref} download className={`inline-flex h-8 items-center gap-1.5 rounded border ${border} px-3 font-medium`}>
        <Download className="h-3.5 w-3.5" /> CSV indir (süzgece göre)
      </a>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!window.confirm(`${days} günden eski denetim kayıtları KALICI olarak silinsin mi? Önce CSV indirmeniz önerilir.`)) return;
          start(async () => {
            const r = await purgeAuditAction({ days });
            setMessage(r.ok ? { kind: "ok", text: `${r.deleted} kayıt silindi.` } : { kind: "error", text: r.error });
          });
        }}
      >
        <label className="space-y-1">
          <span className="block text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">Şundan eski kayıtları sil (gün)</span>
          <input type="number" min={30} max={3650} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className={`h-8 w-28 rounded border ${border} bg-transparent px-2`} />
        </label>
        <button type="submit" disabled={pending || total === 0} className={`inline-flex h-8 items-center gap-1.5 rounded border ${border} px-3 font-medium text-red-700 disabled:opacity-60 dark:text-red-400`}>
          <Trash2 className="h-3.5 w-3.5" /> Temizle
        </button>
      </form>
      <span className="pb-2 text-[11px] text-[#5F6570] dark:text-[#8C9099]">En az 30 gün korunur; temizleme günlüğe yazılır.</span>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`w-full rounded-md border px-3 py-2 ${message.kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"}`}>{message.text}</p>
      )}
    </div>
  );
}
