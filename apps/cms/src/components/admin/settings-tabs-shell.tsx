"use client";

import React, { useState } from "react";
import { Cookie, Globe, Settings2, ShieldAlert } from "lucide-react";

const SECTIONS = [
  { id: "general", label: "Genel & Sistem", hint: "Site adı, iletişim, saat dilimi", icon: Settings2 },
  { id: "locales", label: "Diller", hint: "Tek/çok dilli adresleme", icon: Globe },
  { id: "consent", label: "Çerez & KVKK", hint: "Onay şeridi ve politika", icon: Cookie },
  { id: "ops", label: "Bakım & Sıfırlama", hint: "Bakım modu ve veri kapıları", icon: ShieldAlert },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Genel Ayarlar: Tüm sekmeler ve sağ içerik alanları tek tip genişlik, yükseklik ve hizada.
 */
export function SettingsTabsShell({
  general,
  locales,
  consent,
  ops,
}: {
  general: React.ReactNode;
  locales: React.ReactNode;
  consent: React.ReactNode;
  ops: React.ReactNode;
}) {
  const [tab, setTab] = useState<SectionId>("general");

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav
        aria-label="Ayar kategorileri"
        className="grid grid-cols-2 gap-1.5 rounded-xl border border-border/80 bg-card p-1.5 shadow-2xs sm:grid-cols-4 lg:grid-cols-1"
      >
        {SECTIONS.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[54px] w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                active
                  ? "border-blue-500/30 bg-blue-500/10 text-foreground shadow-2xs"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                  active ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[12px] ${active ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {item.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 w-full max-w-4xl [&>*]:w-full [&>*]:max-w-none">
        {tab === "general" ? general : null}
        {tab === "locales" ? locales : null}
        {tab === "consent" ? consent : null}
        {tab === "ops" ? ops : null}
      </div>
    </div>
  );
}
