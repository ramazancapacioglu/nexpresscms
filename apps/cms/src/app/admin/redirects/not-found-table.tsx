"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clearNotFoundAction, ignoreNotFoundAction } from "./actions";

interface Row {
  path: string;
  hits: number;
  lastSeenAt: string;
  lastReferrer: string;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export function NotFoundTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  if (rows.length === 0) {
    return <p className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-10 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]`}>Kayıtlı 404 yok. Ziyaretçilerin bulamadığı adresler burada sıralanır.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">En çok istenenler önce. Sık gelen gerçek bir adres için “Yönlendir”; bot gürültüsü için “Yok say”.</p>
        <button type="button" disabled={pending} onClick={() => window.confirm("Tüm 404 kayıtları silinsin mi?") && act(() => clearNotFoundAction())} className="h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10">Listeyi temizle</button>
      </div>
      <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
        {rows.map((r) => (
          <li key={r.path} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12px]">
            <span className="w-10 text-right font-mono text-[12px] font-semibold tabular-nums">{r.hits}</span>
            <code className="min-w-0 flex-1 break-all">{r.path}</code>
            <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{r.lastReferrer && `${r.lastReferrer} · `}{new Date(r.lastSeenAt).toLocaleDateString("tr-TR")}</span>
            <Link href={`/admin/redirects?from=${encodeURIComponent(r.path)}`} className={`inline-flex h-7 items-center rounded-md border ${border} px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}>Yönlendir</Link>
            <button type="button" disabled={pending} onClick={() => act(() => ignoreNotFoundAction({ path: r.path }))} className="h-7 rounded-md px-2 text-[12px] text-[#5F6570] dark:text-[#8C9099] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]">Yok say</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
