import React from "react";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { getNotificationRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { syncSystemNotifications } from "@/lib/notify";
import { NotificationActions } from "./notification-actions";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const SEV = { critical: ["Kritik", "bg-red-500/10 text-red-700 dark:text-red-300"], warning: ["Uyarı", "bg-amber-500/10 text-amber-700 dark:text-amber-300"], info: ["Bilgi", "bg-[#266DF0]/10 text-[#266DF0]"] } as const;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const me = await requireUser();
  if (me.role === "admin") await syncSystemNotifications(me.siteId);
  const unreadOnly = (await searchParams).show === "unread";
  const repo = getNotificationRepository(me.siteId);
  const items = await repo.list(me.sub, me.role, { unreadOnly, limit: 100 });
  const unread = (await repo.unread(me.sub, me.role)).count;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Bildirim merkezi</h1>
          <p className="text-[12px] text-[#8C9099]">Form gönderimleri, zamanlanmış yayınlar, e-posta ve IndexNow hataları, içe aktarma sonuçları ve sistem sağlığı uyarıları. Sistem uyarıları sorun düzelince kendiliğinden kapanır; kayıtlar 30 gün görünür.</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:bg-[#1C1E24]">
            <Link role="tab" aria-selected={!unreadOnly} href="/admin/notifications" className={`rounded px-3 py-1 ${!unreadOnly ? "bg-white shadow-sm dark:bg-[#2A2D35]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>Tümü</Link>
            <Link role="tab" aria-selected={unreadOnly} href="/admin/notifications?show=unread" className={`rounded px-3 py-1 ${unreadOnly ? "bg-white shadow-sm dark:bg-[#2A2D35]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>Okunmamış ({unread})</Link>
          </div>
          <NotificationActions unread={unread} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center dark:bg-[#15171C]`}>
          <BellOff className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium">{unreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}</p>
        </div>
      ) : (
        <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {items.map((n) => {
            const [label, cls] = SEV[n.severity];
            return (
              <li key={n.id} className={`flex flex-wrap items-start gap-3 px-4 py-3 text-[12px] ${n.read ? "opacity-70" : ""}`}>
                <span className={`mt-0.5 rounded px-2 py-0.5 text-[11px] font-medium ${n.resolved ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : cls}`}>{n.resolved ? "Çözüldü" : label}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#14151A] dark:text-[#F3F4F6]">{n.title}{n.count > 1 ? <span className="ml-1 text-[#8C9099]">×{n.count}</span> : null}{!n.read && <span aria-label="okunmamış" className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#266DF0] align-middle" />}</p>
                  {n.body && <p className="text-[#5C5F66] dark:text-[#9CA3AF]">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-[#8C9099]">{n.updatedAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}{n.audience === "admin" ? " · yalnızca yöneticiler" : ""}</p>
                </div>
                {n.href && <Link href={n.href} className={`inline-flex h-7 items-center rounded-md border ${border} px-2.5 font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}>Aç</Link>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
