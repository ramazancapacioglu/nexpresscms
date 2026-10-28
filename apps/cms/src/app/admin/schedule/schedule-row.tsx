"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveScheduledAction } from "../lifecycle-actions";

const btn = "h-7 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50";

export function ScheduleRow({ contentId, title, type, time, invalid }: { contentId: string; title: string; type: string; time: string; invalid: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const act = (outcome: "draft" | "published") =>
    start(async () => {
      const res = await resolveScheduledAction({ contentId, outcome });
      if (res.ok) router.refresh();
      else setErr(res.error);
    });
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12px]">
      <span className={`w-12 shrink-0 font-mono text-[12px] tabular-nums ${invalid ? "text-red-600" : "text-[#1D5ED8] dark:text-[#7AA7FF]"}`}>{time}</span>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/contents?id=${encodeURIComponent(contentId)}`} className="truncate font-medium text-[#14151A] dark:text-[#F3F4F6] hover:underline">
          {title}
        </Link>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{type}{invalid && " · tarih eksik/geçersiz: yayınlanmaz, düzenleyin"}</p>
        {err && <p role="alert" className="text-[11px] text-red-600">{err}</p>}
      </div>
      <button type="button" className={btn} disabled={pending} onClick={() => act("published")}>
        Şimdi yayınla
      </button>
      <button type="button" className={btn} disabled={pending} onClick={() => act("draft")}>
        Zamanlamayı kaldır
      </button>
    </li>
  );
}
