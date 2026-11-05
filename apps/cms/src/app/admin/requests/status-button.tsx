"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { purgeOldRequestsAction, setRequestStatusAction } from "./actions";

export function StatusButton({ id, status }: { id: string; status: "new" | "handled" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = status === "new" ? "handled" : "new";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setRequestStatusAction({ id, status: next });
          router.refresh();
        })
      }
      className="h-7 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[12px] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50"
    >
      {status === "new" ? "İşlendi say" : "Yeniye al"}
    </button>
  );
}

/** 180 günden eski talepleri siler. */
export function PurgeButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await purgeOldRequestsAction();
            setNote(res.ok ? `${res.removed} eski talep silindi.` : "Silinemedi.");
            router.refresh();
          })
        }
        className="h-7 rounded-md border border-[#E6E7EA] px-2.5 text-[12px] hover:bg-[#F4F5F7] disabled:opacity-50 dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
      >
        180 günden eskileri sil
      </button>
      {note && <span className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{note}</span>}
    </div>
  );
}
