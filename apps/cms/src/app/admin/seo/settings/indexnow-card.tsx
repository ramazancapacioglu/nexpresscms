"use client";

import { useState, useTransition } from "react";
import { saveIndexNowKeyAction } from "@/app/admin/actions";

/** IndexNow anahtarı. Kayıtlı değer geri gösterilmez. */
export function IndexNowCard({ stored, fromEnv }: { stored: boolean; fromEnv: boolean }) {
  const [key, setKey] = useState("");
  const [note, setNote] = useState("");
  const [hasStored, setHasStored] = useState(stored);
  const [pending, start] = useTransition();

  const status = hasStored ? "Panelde kayıtlı. /indexnow-key.txt bu anahtarı yayınlar." : fromEnv ? "Ortam değişkeni kullanılıyor. Panele yazarsanız o geçerli olur." : "Anahtar yok. Bing ve Yandex anında haberdar edilmez.";

  const save = (clear = false) => {
    start(async () => {
      const res = await saveIndexNowKeyAction({ key, clear });
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      setKey("");
      setHasStored(!clear);
      setNote(clear ? "Anahtar kaldırıldı." : "IndexNow anahtarı kaydedildi.");
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
      <div>
        <h2 className="text-[13px] font-semibold">IndexNow</h2>
        <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Yayın sekmesindeki bildirim açıkken, yeni yayın Bing ve Yandex'e bu anahtarla gider. 8–128 karakter; harf, rakam ve tire. Anahtar sayfada düz metin olarak durmaz.
        </p>
      </div>
      <p className="text-[12px]">{status}</p>
      <label className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">
        Yeni anahtar
        <input
          className="mt-1 h-8 w-full rounded-md border border-[#E6E7EA] bg-white px-2.5 font-mono text-[12px] outline-none focus:border-[#266DF0] dark:border-[#23262E] dark:bg-[#121317]"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={hasStored ? "Değiştirmek için yeni anahtar" : "Anahtarı yapıştırın"}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending || !key.trim()} onClick={() => save(false)} className="rounded-md bg-[#14151A] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 dark:bg-[#F3F4F6] dark:text-[#14151A]">
          {pending ? "Kaydediliyor" : "Anahtarı kaydet"}
        </button>
        {hasStored ? (
          <button type="button" disabled={pending} onClick={() => save(true)} className="rounded-md border border-[#E6E7EA] px-3 py-1.5 text-[12px] dark:border-[#23262E]">
            Kaldır
          </button>
        ) : null}
      </div>
      {note ? <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{note}</p> : null}
    </section>
  );
}
