"use client";

import React, { useState, useTransition } from "react";
import type { HeaderConfig, NavigationLink } from "@nexpress/core";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, fieldClass } from "./appearance-ui";
import { ChromeLibraryModal } from "./chrome-library-modal";

export function HeaderEditor({ initial }: { initial: HeaderConfig }) {
  const [header, setHeader] = useState<HeaderConfig>(initial);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const save = () => {
    start(async () => {
      await saveChromeAction({ headerConfig: header });
      setNotice("Header kaydedildi.");
    });
  };

  const setTop = (patch: Partial<HeaderConfig["topBar"]>) =>
    setHeader((prev) => ({ ...prev, topBar: { ...prev.topBar, ...patch } }));
  const setMain = (patch: Partial<HeaderConfig["mainBar"]>) =>
    setHeader((prev) => ({ ...prev, mainBar: { ...prev.mainBar, ...patch } }));

  const links = header.bottomBar.links ?? [];
  const setLinks = (next: NavigationLink[]) =>
    setHeader((prev) => ({ ...prev, bottomBar: { ...prev.bottomBar, links: next } }));

  return (
    <div className="space-y-4">
      <AppearanceTabs current="header" />
      <SaveBar title="Header şablonu" pending={pending} notice={notice} onSave={save} />
      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        className="rounded-lg border border-[#E6E7EA] bg-white px-3 py-2 text-left text-[12px] font-semibold dark:border-[#23262E] dark:bg-[#15171C]"
      >
        Tasarım kütüphanesini aç
      </button>
      <ChromeLibraryModal
        open={libraryOpen}
        kind="header"
        onClose={() => setLibraryOpen(false)}
        onApplyHeader={(value) => {
          setHeader(value);
          setNotice("Tasarım forma alındı. Kaydet ile yayınlanır.");
        }}
      />
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <label className="flex items-center justify-between">
          <span className="font-semibold">Üst duyuru şeridi</span>
          <input
            type="checkbox"
            checked={header.topBar.enabled}
            onChange={(e) => setTop({ enabled: e.target.checked })}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={fieldClass}
            value={header.topBar.announcementText ?? ""}
            placeholder="Duyuru"
            onChange={(e) => setTop({ announcementText: e.target.value })}
          />
          <input
            className={fieldClass}
            value={header.topBar.contactPhone ?? ""}
            placeholder="Telefon"
            onChange={(e) => setTop({ contactPhone: e.target.value })}
          />
        </div>
      </section>
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="font-semibold">Ana şerit</div>
        <div className="flex flex-wrap gap-4 text-[11px] text-[#5C5F66]">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={header.mainBar.sticky ?? false}
              onChange={(e) => setMain({ sticky: e.target.checked })}
            />
            Yapışkan
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={header.mainBar.glassmorphism ?? false}
              onChange={(e) => setMain({ glassmorphism: e.target.checked })}
            />
            Cam yüzey
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={fieldClass}
            value={header.mainBar.ctaLabel ?? ""}
            placeholder="Çağrı etiketi"
            onChange={(e) => setMain({ ctaLabel: e.target.value })}
          />
          <input
            className={fieldClass}
            value={header.mainBar.ctaHref ?? ""}
            placeholder="Çağrı adresi"
            onChange={(e) => setMain({ ctaHref: e.target.value })}
          />
        </div>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Menü bağlantıları bu ekranda durmaz. Menü sayfasından düzenlenir.</p>
      </section>
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <label className="flex items-center justify-between">
          <span className="font-semibold">Alt şerit</span>
          <input
            type="checkbox"
            checked={header.bottomBar.enabled}
            onChange={(e) =>
              setHeader((prev) => ({
                ...prev,
                bottomBar: { ...prev.bottomBar, enabled: e.target.checked },
              }))
            }
          />
        </label>
        {links.map((link) => (
          <div key={link.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              className={fieldClass}
              value={link.label}
              onChange={(e) =>
                setLinks(links.map((row) => (row.id === link.id ? { ...row, label: e.target.value } : row)))
              }
            />
            <input
              className={fieldClass}
              value={link.href}
              onChange={(e) =>
                setLinks(links.map((row) => (row.id === link.id ? { ...row, href: e.target.value } : row)))
              }
            />
            <button type="button" className="text-[#5F6570] dark:text-[#8C9099]" onClick={() => setLinks(links.filter((row) => row.id !== link.id))}>
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-[11px] font-medium"
          onClick={() =>
            setLinks([...links, { id: `bl_${Date.now()}`, label: "Bağlantı", href: "/tr" }])
          }
        >
          Alt şeride bağlantı ekle
        </button>
      </section>
    </div>
  );
}
