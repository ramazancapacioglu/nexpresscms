"use client";

import { useState, useTransition } from "react";
import { saveLocalesAction } from "@/app/admin/translations/actions";

const COMMON = ["en", "de", "fr", "es", "it", "pt", "nl", "ru", "ar", "fa", "zh", "ja"];
const nameOf = (code: string) => {
  try {
    return new Intl.DisplayNames(["tr"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Site dilleri: etkin dil listesi. Varsayılan dil kaldırılamaz; çıkarılan dilin çevirileri silinmez, ziyaretçiye kapanır. */
export function LocalesCard({ initial, defaultLocale }: { initial: string[]; defaultLocale: string }) {
  const [locales, setLocales] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = locales.join() !== saved.join();

  const add = (code: string) => {
    const c = code.trim().toLowerCase();
    if (c && !locales.includes(c)) setLocales([...locales, c]);
    setCustom("");
  };

  const save = () =>
    start(async () => {
      try {
        const res = await saveLocalesAction({ locales });
        if (res.ok) {
          setLocales(res.locales);
          setSaved(res.locales);
          setMsg({ tone: "ok", text: "Diller kaydedildi." });
        } else setMsg({ tone: "err", text: res.error });
      } catch {
        setMsg({ tone: "err", text: "Kaydedilemedi." });
      }
    });

  return (
    <section className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-3">
      <div>
        <h2 className="text-[13px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">Site dilleri</h2>
        <p className="text-[12px] text-[#8C9099]">Ziyaretçi sayfaları <code>/{"{dil}"}/…</code> adresinde yayınlanır. Yeni bir dil eklemek içerik oluşturmaz; çeviriyi editörün "Diller" bölümünden oluşturursunuz.</p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {locales.map((code) => (
          <li key={code} className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-[#F4F5F7] dark:bg-[#1C1E24] px-2 py-1 text-[12px]">
            <span className="font-mono text-[11px] uppercase">{code}</span>
            <span>{nameOf(code)}</span>
            {code === defaultLocale ? (
              <span className="rounded bg-[#266DF0]/10 px-1 text-[10px] font-semibold text-[#266DF0]">varsayılan</span>
            ) : (
              <button type="button" aria-label={`${nameOf(code)} dilini kaldır`} onClick={() => setLocales(locales.filter((l) => l !== code))} className="text-[#8C9099] hover:text-red-600">×</button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <select value="" onChange={(e) => e.target.value && add(e.target.value)} aria-label="Dil ekle" className="h-8 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-2 text-[12px]">
          <option value="">Dil ekle…</option>
          {COMMON.filter((c) => !locales.includes(c)).map((c) => (
            <option key={c} value={c}>{nameOf(c)} ({c})</option>
          ))}
        </select>
        <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(custom))} placeholder="Başka kod (ör. pt-br)" aria-label="Özel dil kodu" className="h-8 w-44 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-transparent px-2 text-[12px] outline-none focus:border-[#266DF0]" />
        <button type="button" onClick={() => add(custom)} disabled={!custom.trim()} className="h-8 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-3 text-[12px] disabled:opacity-50">Ekle</button>
        <button type="button" onClick={save} disabled={pending || !dirty} className="ml-auto h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-50">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
      </div>
      {msg && <p role="status" className={`text-[12px] ${msg.tone === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>{msg.text}</p>}
    </section>
  );
}
