import React from "react";
import type { LocaleAlternate } from "@/lib/alternates";

/** Ziyaretçi dil değiştirici: düz bağlantılar, istemci JS'i yok. Tek dilde hiçbir şey çizmez. */
export function LanguageSwitcher({ alternates }: { alternates: LocaleAlternate[] }) {
  if (alternates.length < 2) return null;
  return (
    <nav aria-label="Language" className="flex justify-end gap-3 text-xs">
      {alternates.map((a) => (
        <a key={a.locale} href={a.href} hrefLang={a.locale} lang={a.locale} aria-current={a.current ? "true" : undefined} className={a.current ? "font-semibold underline underline-offset-4" : "opacity-70 hover:opacity-100"}>
          {a.label}
        </a>
      ))}
    </nav>
  );
}
