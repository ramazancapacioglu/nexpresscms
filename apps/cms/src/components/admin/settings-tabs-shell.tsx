"use client";

import React, { useState } from "react";

const SECTIONS = [
  { id: "general", label: "Genel & Sistem", hint: "Site adı, iletişim, saat dilimi" },
  { id: "locales", label: "Diller", hint: "Tek/çok dilli adresleme" },
  { id: "consent", label: "Çerez & KVKK", hint: "Onay şeridi ve politika" },
  { id: "ops", label: "Bakım & Sıfırlama", hint: "Bakım modu ve veri kapıları" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Genel Ayarlar: 4 büyük kartı alt alta yığmak yerine SEO Ayarları ile aynı
 * sol dikey alt menü + sağ içerik düzeni.
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav
        aria-label="Ayar kategorileri"
        className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {SECTIONS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-2 text-left transition lg:w-full ${
                active
                  ? "bg-[#EAECED] text-[#14151A] dark:bg-[#22252D] dark:text-[#F3F4F6]"
                  : "text-[#5C5F66] hover:bg-[#EAECED]/60 hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:bg-[#1C1E24] dark:hover:text-[#F3F4F6]"
              }`}
            >
              <div className={`text-[12px] ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </div>
              <div className="hidden text-[11px] text-[#5F6570] dark:text-[#8C9099] lg:block">
                {item.hint}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {tab === "general" ? general : null}
        {tab === "locales" ? locales : null}
        {tab === "consent" ? consent : null}
        {tab === "ops" ? ops : null}
      </div>
    </div>
  );
}
