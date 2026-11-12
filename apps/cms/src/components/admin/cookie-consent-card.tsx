"use client";

import { useState, useTransition } from "react";
import type { CookieConsentSettings } from "@nexpress/core";
import { saveCookieConsentAction, type SettingsResult } from "@/app/admin/settings/actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;

/** KVKK/GDPR çerez onayı: banner metni, politika bağlantısı ve betik kapısı. Ziyaretçi tarafında JS gerektirmez. */
export function CookieConsentCard({ initial }: { initial: CookieConsentSettings }) {
  const [value, setValue] = useState(initial);
  const [note, setNote] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<CookieConsentSettings>) => setValue((prev) => ({ ...prev, ...patch }));
  return (
    <form
      className={`max-w-2xl space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setNote(await saveCookieConsentAction(value)));
      }}
    >
      <div>
        <h2 className="text-[14px] font-semibold">Çerez onayı (KVKK / GDPR)</h2>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Açıkken ziyaretçiye onay bannerı gösterilir. Google Analytics ve Ayarlar/Tasarım'daki özel baş-son betikler yalnızca &quot;Tümünü kabul et&quot; ile yüklenir; zorunlu çerezler (oturum, sepet) her zaman çalışır.
        </p>
      </div>
      <label className="flex items-center gap-2 text-[12px] font-medium">
        <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Çerez onayı bannerını aç
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Banner metni
        <textarea maxLength={400} value={value.message} onChange={(e) => set({ message: e.target.value })} className={`${field} h-20 py-2`} placeholder="Boşsa hazır metin kullanılır (sitenin diline göre)." />
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Çerez / gizlilik politikası adresi
        <input value={value.policyHref} onChange={(e) => set({ policyHref: e.target.value })} className={field} placeholder="/gizlilik-politikasi" />
      </label>
      <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
        Not: Banner ziyaretçiye göre değişir; CDN HTML önbelleği (<code>PUBLIC_CACHE_SECONDS</code>) kullanıyorsanız önbelleği çerezli isteklerde atlayın. Gömülü video için <code>youtube-nocookie</code> adresi kullanın.
      </p>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex h-8 items-center rounded-md bg-[#14151A] px-3 text-[12px] font-medium text-white disabled:opacity-60 dark:bg-[#F3F4F6] dark:text-[#14151A]">{pending ? "Kaydediliyor" : "Kaydet"}</button>
        {note ? <span role="status" className={`text-[12px] ${note.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>{note.ok ? "Kaydedildi." : note.error}</span> : null}
      </div>
    </form>
  );
}
