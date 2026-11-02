"use client";

import React, { useState, useTransition } from "react";
import type { SidebarConfig } from "@nexpress/core";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, fieldClass } from "./appearance-ui";

const STARTER: SidebarConfig = {
  enabled: true,
  position: "right",
  title: "Bu bölümde",
  links: [
    { id: "sb_urun", label: "Ürün", href: "/tr/urun" },
    { id: "sb_docs", label: "Doküman", href: "/tr/dokuman" },
    { id: "sb_price", label: "Fiyat", href: "/tr/fiyatlandirma" },
  ],
};

export function SidebarEditor({ initial }: { initial: SidebarConfig }) {
  const [sidebar, setSidebar] = useState<SidebarConfig>(initial);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const save = () => {
    start(async () => {
      await saveChromeAction({ sidebarConfig: sidebar });
      setNotice("Kenar çubuğu kaydedildi.");
    });
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="sidebar" />
      <SaveBar title="Site kenar çubuğu" pending={pending} notice={notice} onSave={save} />
      <button
        type="button"
        onClick={() => {
          setSidebar(structuredClone(STARTER));
          setNotice("Örnek kenar çubuğu forma alındı. Kaydet ile yayınlanır.");
        }}
        className="rounded-lg border border-[#E6E7EA] bg-white p-3 text-left text-[12px] dark:border-[#23262E] dark:bg-[#15171C]"
      >
        <div className="font-semibold">Doküman kenarı</div>
        <p className="mt-1 text-[11px] text-[#5F6570] dark:text-[#8C9099]">Ürün, doküman ve fiyat bağlantıları. Sağda durur.</p>
      </button>
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <label className="flex items-center justify-between">
          <span className="font-semibold">Yayında</span>
          <input
            type="checkbox"
            checked={sidebar.enabled}
            onChange={(e) => setSidebar((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
        </label>
        <div className="flex gap-3 text-[11px]">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              checked={sidebar.position === "left"}
              onChange={() => setSidebar((prev) => ({ ...prev, position: "left" }))}
            />
            Sol
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              checked={sidebar.position === "right"}
              onChange={() => setSidebar((prev) => ({ ...prev, position: "right" }))}
            />
            Sağ
          </label>
        </div>
        <input
          aria-label="Kenar çubuğu başlığı"
          className={fieldClass}
          value={sidebar.title}
          onChange={(e) => setSidebar((prev) => ({ ...prev, title: e.target.value }))}
        />
        {sidebar.links.map((link) => (
          <div key={link.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              aria-label="Bağlantı metni"
              className={fieldClass}
              value={link.label}
              onChange={(e) =>
                setSidebar((prev) => ({
                  ...prev,
                  links: prev.links.map((row) => (row.id === link.id ? { ...row, label: e.target.value } : row)),
                }))
              }
            />
            <input
              aria-label="Bağlantı adresi"
              className={fieldClass}
              value={link.href}
              onChange={(e) =>
                setSidebar((prev) => ({
                  ...prev,
                  links: prev.links.map((row) => (row.id === link.id ? { ...row, href: e.target.value } : row)),
                }))
              }
            />
            <button
              type="button"
              className="text-[#5F6570] dark:text-[#8C9099]"
              onClick={() =>
                setSidebar((prev) => ({ ...prev, links: prev.links.filter((row) => row.id !== link.id) }))
              }
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-[11px] font-medium"
          onClick={() =>
            setSidebar((prev) => ({
              ...prev,
              links: [...prev.links, { id: `sb_${Date.now()}`, label: "Bağlantı", href: "/tr" }],
            }))
          }
        >
          Bağlantı ekle
        </button>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Bu liste sayfa bloklarından bağımsızdır. Tüm herkese açık sayfalarda görünür.</p>
      </section>
    </div>
  );
}
