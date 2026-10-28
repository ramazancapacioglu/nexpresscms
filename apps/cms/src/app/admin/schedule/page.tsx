import React from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { runScheduler } from "@/lib/scheduler";
import { ScheduleRow } from "./schedule-row";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function AdminSchedulePage() {
  const me = await requireUser();
  await runScheduler(me.siteId, true);
  const repo = getScopedRepository(me.siteId);
  const [items, site] = await Promise.all([repo.listScheduled(), repo.getSite()]);
  const tz = resolveSiteSettings(site?.settings).general.timezone;
  const dayFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });

  const groups = new Map<string, typeof items>();
  for (const i of items) {
    const key = i.dueAt ? dayFmt.format(i.dueAt) : "Tarihi eksik veya geçersiz";
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }

  return (
    <div className="space-y-5">
      <div className={`border-b ${border} pb-3.5`}>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Zamanlanmış yayınlar</h1>
        <p className="text-[12px] text-[#8C9099]">
          Saat dilimi: <code>{tz}</code> (Ayarlar). Zamanı gelen içerik kendiliğinden yayınlanır (trafik varken dakikada bir, ayrıca <code>/api/cron/scheduled</code> ile kesin). Zamanlamak için editörde Yayın sekmesinden durumu “Zamanlanmış” yapıp tarih seçin.
        </p>
      </div>
      {items.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <CalendarClock className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">Zamanlanmış içerik yok</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#8C9099]">
            <Link href="/admin/contents" className="text-[#266DF0] underline">Görsel Blok Stüdyosu</Link>nda bir içeriği açıp Yayın sekmesinden durumunu “Zamanlanmış” yapın.
          </p>
        </div>
      ) : (
        [...groups.entries()].map(([day, rows]) => (
          <section key={day} className="space-y-1.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">{day}</h2>
            <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
              {rows.map((r) => (
                <ScheduleRow key={r.contentId} contentId={r.contentId} title={r.title} type={r.type} time={r.dueAt ? timeFmt.format(r.dueAt) : "—"} invalid={!r.dueAt} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
