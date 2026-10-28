"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTranslationAction } from "./actions";

/** Rapor satırından tek tıkla çeviri taslağı oluşturur ve editöre götürür. */
export function CreateTranslationButton({ contentId, from, to }: { contentId: string; from: string; to: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const res = await createTranslationAction({ contentId, from, to });
            if (res.ok) router.push(`/admin/contents?id=${encodeURIComponent(contentId)}&locale=${to}`);
            else setError(res.error);
          })
        }
        className="rounded border border-[#E6E7EA] dark:border-[#23262E] px-2 py-0.5 text-[11px] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50"
      >
        {pending ? "…" : "Oluştur"}
      </button>
      {error && <span role="alert" className="text-[10px] text-red-600">{error}</span>}
    </span>
  );
}
