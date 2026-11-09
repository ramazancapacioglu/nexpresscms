"use client";

import { useState, useTransition } from "react";
import type { LocalizedSiteIdentity } from "@nexpress/core";
import { saveLocalesAction } from "@/app/admin/translations/actions";
import { saveLocalizedIdentitiesAction } from "@/app/admin/settings/actions";

const COMMON = ["en", "de", "fr", "es", "it", "pt", "nl", "ru", "ar", "fa", "zh", "ja"];
const nameOf = (code: string) => {
  try {
    return new Intl.DisplayNames(["tr"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Site dilleri: etkin dil listesi ve ikincil diller için site adı/slogan/SEO başlık şablonu. */
export function LocalesCard({
  initial,
  defaultLocale,
  initialIdentities = {},
}: {
  initial: string[];
  defaultLocale: string;
  initialIdentities?: Record<string, LocalizedSiteIdentity>;
}) {
  const [locales, setLocales] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [identities, setIdentities] = useState<Record<string, LocalizedSiteIdentity>>(initialIdentities);
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = locales.join() !== saved.join();
  const secondaryLocales = locales.filter((l) => l !== defaultLocale);

  const add = (code: string) => {
    const c = code.trim().toLowerCase();
    if (c && !locales.includes(c)) setLocales([...locales, c]);
    setCustom("");
  };

  const updateIdentity = (code: string, patch: Partial<LocalizedSiteIdentity>) => {
    setIdentities((prev) => ({
      ...prev,
      [code]: { ...(prev[code] ?? {}), ...patch },
    }));
  };

  const save = () =>
    start(async () => {
      try {
        const res = await saveLocalesAction({ locales });
        if (res.ok) {
          setLocales(res.locales);
          setSaved(res.locales);
          await saveLocalizedIdentitiesAction({ locales: identities });
          setMsg({ tone: "ok", text: "Diller ve dil kimlikleri kaydedildi." });
        } else setMsg({ tone: "err", text: res.error });
      } catch {
        setMsg({ tone: "err", text: "Kaydedilemedi." });
      }
    });

  const saveIdentitiesOnly = () =>
    start(async () => {
      try {
        const res = await saveLocalizedIdentitiesAction({ locales: identities });
        if (res.ok) setMsg({ tone: "ok", text: "Dil başına site adı ve SEO şablonları kaydedildi." });
        else setMsg({ tone: "err", text: res.error });
      } catch {
        setMsg({ tone: "err", text: "Kaydedilemedi." });
      }
    });

  return (
    <section className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 space-y-3">
      <div>
        <h2 className="text-[13px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">Site dilleri</h2>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Ziyaretçi sayfaları <code>/{"{dil}"}/…</code> adresinde yayınlanır. Yeni bir dil eklemek içerik oluşturmaz; çeviriyi editörün "Diller" bölümünden oluşturursunuz.</p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {locales.map((code) => (
          <li key={code} className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-[#F4F5F7] dark:bg-[#1C1E24] px-2 py-1 text-[12px]">
            <span className="font-mono text-[11px] uppercase">{code}</span>
            <span>{nameOf(code)}</span>
            {code === defaultLocale ? (
              <span className="rounded bg-[#266DF0]/10 px-1 text-[10px] font-semibold text-[#1D5ED8] dark:text-[#7AA7FF]">varsayılan</span>
            ) : (
              <button type="button" aria-label={`${nameOf(code)} dilini kaldır`} onClick={() => setLocales(locales.filter((l) => l !== code))} className="text-[#5F6570] dark:text-[#8C9099] hover:text-red-600">×</button>
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
      {secondaryLocales.length > 0 && (
        <div className="space-y-2.5 border-t border-[#E6E7EA] dark:border-[#23262E] pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">Dil başına site adı, slogan ve SEO başlık şablonu</h3>
            <button type="button" onClick={saveIdentitiesOnly} disabled={pending} className="h-7 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-2.5 text-[11px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]">
              Dil kimliklerini kaydet
            </button>
          </div>
          <div className="space-y-2">
            {secondaryLocales.map((code) => {
              const idVal = identities[code] ?? {};
              return (
                <div key={code} className="grid gap-2 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] p-2.5 sm:grid-cols-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#5F6570] dark:text-[#8C9099]">{code.toUpperCase()} — Site adı</label>
                    <input value={idVal.name ?? ""} onChange={(e) => updateIdentity(code, { name: e.target.value })} placeholder="Varsayılan site adı" aria-label={`${code} site adı`} className="mt-1 h-7 w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 text-[12px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#5F6570] dark:text-[#8C9099]">{code.toUpperCase()} — Slogan</label>
                    <input value={idVal.tagline ?? ""} onChange={(e) => updateIdentity(code, { tagline: e.target.value })} placeholder="Varsayılan slogan" aria-label={`${code} slogan`} className="mt-1 h-7 w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 text-[12px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#5F6570] dark:text-[#8C9099]">{code.toUpperCase()} — Başlık şablonu</label>
                    <input value={idVal.titleTemplate ?? ""} onChange={(e) => updateIdentity(code, { titleTemplate: e.target.value })} placeholder="%title% | %site%" aria-label={`${code} başlık şablonu`} className="mt-1 h-7 w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 font-mono text-[11px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#5F6570] dark:text-[#8C9099]">{code.toUpperCase()} — Ana sayfa şablonu</label>
                    <input value={idVal.homeTitleTemplate ?? ""} onChange={(e) => updateIdentity(code, { homeTitleTemplate: e.target.value })} placeholder="%site% — %tagline%" aria-label={`${code} ana sayfa şablonu`} className="mt-1 h-7 w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 font-mono text-[11px]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {msg && <p role="status" className={`text-[12px] ${msg.tone === "ok" ? "text-emerald-800 dark:text-emerald-300" : "text-red-600"}`}>{msg.text}</p>}
    </section>
  );
}
