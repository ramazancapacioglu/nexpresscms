"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setRequestStatusAction } from "./actions";

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
