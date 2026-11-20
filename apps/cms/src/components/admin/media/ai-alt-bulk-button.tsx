"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { fillMissingAltAction } from "@/app/admin/media/alt-actions";

/** Alt metni boş görselleri (her seferde en çok 15) AI ile doldurur; dolu alt metinlere dokunmaz. Tekrar basarak devam edilir. */
export function AiAltBulkButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        title="Alt metni boş görselleri yapay zekâ ile doldurur (her seferde en çok 15). Dolu alt metinlere dokunmaz."
        onClick={() => {
          if (!window.confirm("Alt metni boş görseller (en çok 15) yapay zekâ ile doldurulacak ve kaydedilecek. Görseller küçültülmüş kopyayla OpenAI'ye gönderilir. Devam edilsin mi?")) return;
          start(async () => {
            const res = await fillMissingAltAction();
            setNote(res.ok ? `${res.filled} görsele alt metin yazıldı${res.failed ? `, ${res.failed} başarısız` : ""}${res.remaining ? `; ${res.remaining} görsel kaldı, tekrar çalıştırın` : ""}.` : res.error);
            if (res.ok) router.refresh();
          });
        }}
        className="inline-flex h-8 items-center gap-1 rounded border border-[#E6E7EA] px-2 text-[12px] font-medium hover:bg-black/5 disabled:opacity-60 dark:border-[#23262E] dark:hover:bg-white/5"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {pending ? "Yazılıyor…" : "Boş alt metinleri AI ile doldur"}
      </button>
      {note ? <span role="status" className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{note}</span> : null}
    </span>
  );
}
