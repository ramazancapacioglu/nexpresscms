"use client";

import { useState } from "react";
import { runOps } from "../content-ops/ops-client";

/** Places kaydı varsa puan ve yorumu ayara yazar. Anahtar yoksa uydurma. */
export function ReviewsPullButton() {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const pull = async () => {
    setBusy(true);
    const res = await runOps("reviews.pull", {});
    setBusy(false);
    setNote(res.ok ? "Yorumlar güncellendi. Sayfayı yenileyin." : (res.error ?? "Çekilemedi."));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void pull()} disabled={busy} className="rounded-lg border border-nx-line px-3 py-1.5 text-xs font-semibold text-nx-fg disabled:opacity-50">
        {busy ? "Çekiliyor" : "Places'tan çek"}
      </button>
      {note && <span className="text-xs text-nx-soft">{note}</span>}
    </div>
  );
}
