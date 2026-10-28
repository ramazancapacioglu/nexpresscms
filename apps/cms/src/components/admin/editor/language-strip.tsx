"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TranslationState } from "@nexpress/core";
import { createTranslationAction, deleteTranslationAction } from "@/app/admin/translations/actions";
import { useStudioInspector } from "./studio-inspector-context";

const STATE_LABEL: Record<TranslationState, string> = { none: "Yok", draft: "Taslak", published: "Yayında", stale: "Kaynak değişti" };
const STATE_STYLE: Record<TranslationState, string> = {
  none: "bg-muted text-muted-foreground",
  draft: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  published: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  stale: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const nameOf = (code: string) => {
  try {
    return new Intl.DisplayNames(["tr"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** Diller şeridi: her etkin dil için durum; çeviri oluştur / aç / sil. Yalnızca birden çok dil etkinse görünür. */
export function LanguageStrip() {
  const { contentId, locale, defaultLocale, siteLocales, translations } = useStudioInspector();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  if (siteLocales.length < 2) return null;

  const open = (to: string) => router.push(`/admin/contents?id=${encodeURIComponent(contentId ?? "")}&locale=${to}`);
  const create = (to: string) =>
    start(async () => {
      setError("");
      const res = await createTranslationAction({ contentId: contentId!, from: defaultLocale, to });
      if (res.ok) open(to);
      else setError(res.error);
    });
  const remove = (to: string) => {
    if (!window.confirm(`${nameOf(to)} çevirisi silinsin mi? Bu işlem geri alınamaz.`)) return;
    start(async () => {
      setError("");
      const res = await deleteTranslationAction({ contentId: contentId!, locale: to });
      if (res.ok) {
        if (locale === to) router.push(`/admin/contents?id=${encodeURIComponent(contentId!)}`);
        else router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Diller</div>
      {!contentId ? (
        <p className="text-[11px] text-muted-foreground">Çeviri oluşturmak için önce içeriği kaydedin.</p>
      ) : (
        <ul className="space-y-1.5">
          {siteLocales.map((code) => {
            const row = translations.find((t) => t.locale === code);
            const state: TranslationState = row?.state ?? (code === locale ? "published" : "none");
            const current = code === locale;
            return (
              <li key={code} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-[11px] uppercase">{code}</span>
                  <span className={`truncate ${current ? "font-semibold" : ""}`}>{nameOf(code)}{code === defaultLocale && " · kaynak"}</span>
                  <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${STATE_STYLE[state]}`}>{STATE_LABEL[state]}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {state === "none" ? (
                    <button type="button" disabled={pending} onClick={() => create(code)} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted disabled:opacity-50">
                      Oluştur
                    </button>
                  ) : (
                    <>
                      {!current && (
                        <button type="button" onClick={() => open(code)} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted">
                          Düzenle
                        </button>
                      )}
                      {code !== defaultLocale && (
                        <button type="button" disabled={pending} onClick={() => remove(code)} className="rounded px-1.5 py-0.5 text-[11px] text-red-600 hover:bg-red-500/10 disabled:opacity-50">
                          Sil
                        </button>
                      )}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert" className="text-[11px] text-red-600">{error}</p>}
      <p className="text-[10px] text-muted-foreground">Çeviri kaynaktan taslak olarak kopyalanır; metni çevirip yayınlayın. Kaynak değişirse çeviri "Kaynak değişti" olur.</p>
    </div>
  );
}
