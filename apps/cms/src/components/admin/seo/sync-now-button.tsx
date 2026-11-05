"use client";

import { useState } from "react";
import { syncSeoNowAction } from "@/app/admin/seo/sync-action";

/** Gösterge üzerindeki elle eşitleme. Sonuç kısa not olarak kalır. */
export function SyncNowButton() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const res = await syncSeoNowAction();
    setBusy(false);
    setNote(res.ok ? res.report.notes.join(" · ") : res.error);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="h-8 rounded-md bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-50"
      >
        {busy ? "Eşitleniyor" : "Şimdi eşitle"}
      </button>
      {note && <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{note}</p>}
    </div>
  );
}
