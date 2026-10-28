"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function NotificationActions({ unread }: { unread: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || unread === 0}
      onClick={() => start(async () => { await fetch("/api/admin/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "readAll" }) }); router.refresh(); })}
      className="h-8 rounded-md border border-[#E6E7EA] px-3 text-[12px] font-medium hover:bg-[#F4F5F7] disabled:opacity-50 dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
    >
      Tümünü okundu say
    </button>
  );
}
