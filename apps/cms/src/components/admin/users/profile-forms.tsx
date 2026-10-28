"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_MIN_LENGTH } from "@nexpress/core";
import { createTranslator, UI_LOCALES } from "@nexpress/i18n";
import { changePasswordAction, setUiLocaleAction, signOutEverywhereAction, updateProfileAction, type ProfileResult } from "@/app/admin/profile/actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`;

function Notice({ r }: { r: ProfileResult | null }) {
  if (!r) return null;
  return r.ok ? (
    <p role="status" className="text-[11px] text-emerald-700">Kaydedildi.</p>
  ) : (
    <p role="alert" className="text-[11px] text-red-600">{r.error}</p>
  );
}

export function ProfileForms({ name, email, role, uiLocale }: { name: string; email: string; role: string; uiLocale: string }) {
  const router = useRouter();
  const [lang, setLang] = useState(uiLocale);
  const [langResult, setLangResult] = useState<ProfileResult | null>(null);
  const tt = createTranslator(lang);
  const [pending, start] = useTransition();
  const [displayName, setDisplayName] = useState(name);
  const [nameResult, setNameResult] = useState<ProfileResult | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwResult, setPwResult] = useState<ProfileResult | null>(null);

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-[16px] font-bold tracking-tight">Profilim</h1>
        <p className="text-[12px] text-[#8C9099]">{email} • {role === "admin" ? "Yönetici" : "Editör"}</p>
      </div>

      <section className={card}>
        <label className="block space-y-1 text-[12px] font-medium">{tt("admin.account.language")}
          <select
            value={lang}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value;
              setLang(next);
              start(async () => {
                const res = await setUiLocaleAction({ locale: next });
                setLangResult(res);
                if (res.ok) router.refresh();
              });
            }}
            className={field}
          >
            {UI_LOCALES.map((l) => (
              <option key={l} value={l}>{new Intl.DisplayNames([l], { type: "language" }).of(l)}</option>
            ))}
          </select>
          <span className="block text-[11px] font-normal text-[#8C9099]">{tt("admin.account.languageHint")}</span>
        </label>
        <Notice r={langResult} />
      </section>

      <form className={card} onSubmit={(e) => { e.preventDefault(); start(async () => setNameResult(await updateProfileAction({ name: displayName }))); }}>
        <label className="block space-y-1 text-[12px] font-medium">Görünen ad
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className={field} />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60">Kaydet</button>
          <Notice r={nameResult} />
        </div>
      </form>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          if (pw.next !== pw.again) return setPwResult({ ok: false, error: "Yeni parolalar eşleşmiyor." });
          start(async () => {
            const res = await changePasswordAction({ current: pw.current, next: pw.next });
            setPwResult(res);
            if (res.ok) setPw({ current: "", next: "", again: "" });
          });
        }}
      >
        <div className="text-[12px] font-semibold">Parola değiştir</div>
        <input type="password" autoComplete="current-password" aria-label="Mevcut parola" placeholder="Mevcut parola" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={field} required />
        <input type="password" autoComplete="new-password" aria-label="Yeni parola" placeholder={`Yeni parola (en az ${PASSWORD_MIN_LENGTH} karakter)`} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={field} required />
        <input type="password" autoComplete="new-password" aria-label="Yeni parola (tekrar)" placeholder="Yeni parola (tekrar)" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} className={field} required />
        <p className="text-[11px] text-[#8C9099]">Değişimden sonra diğer tüm cihazlardaki oturumlarınız kapanır; bu oturum devam eder. Uzun bir cümle iyi bir paroladır.</p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60">Parolayı değiştir</button>
          <Notice r={pwResult} />
        </div>
      </form>

      <div className={card}>
        <div className="text-[12px] font-semibold">Oturumlar</div>
        <p className="text-[11px] text-[#8C9099]">Tüm cihazlardaki (bu cihaz dahil) oturumlarınızı kapatır.</p>
        <button type="button" disabled={pending} onClick={() => start(() => signOutEverywhereAction())} className={`h-8 rounded border ${border} px-3 text-[12px]`}>Her yerden çıkış yap</button>
      </div>
    </div>
  );
}
