"use client";

import React, { useState, useTransition } from "react";
import type { FooterConfig } from "@nexpress/core";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar, fieldClass } from "./appearance-ui";
import { ChromeLibraryModal } from "./chrome-library-modal";

export function FooterEditor({ initial }: { initial: FooterConfig }) {
  const [footer, setFooter] = useState<FooterConfig>(initial);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const save = () => {
    start(async () => {
      await saveChromeAction({ footerConfig: footer });
      setNotice("Footer kaydedildi.");
    });
  };

  return (
    <div className="space-y-4">
      <AppearanceTabs current="footer" />
      <SaveBar title="Footer şablonu" pending={pending} notice={notice} onSave={save} />
      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        className="rounded-lg border border-[#E6E7EA] bg-white px-3 py-2 text-left text-[12px] font-semibold dark:border-[#23262E] dark:bg-[#15171C]"
      >
        Tasarım kütüphanesini aç
      </button>
      <ChromeLibraryModal
        open={libraryOpen}
        kind="footer"
        onClose={() => setLibraryOpen(false)}
        onApplyFooter={(value) => {
          setFooter(value);
          setNotice("Tasarım forma alındı. Kaydet ile yayınlanır.");
        }}
      />
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <input
          aria-label="Telif metni"
          className={fieldClass}
          value={footer.copyrightText}
          onChange={(e) => setFooter((prev) => ({ ...prev, copyrightText: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-[11px]">
          <input
            type="checkbox"
            checked={footer.showNewsletter}
            onChange={(e) => setFooter((prev) => ({ ...prev, showNewsletter: e.target.checked }))}
          />
          Bülten satırı
        </label>
        {footer.columns.map((col) => (
          <div key={col.id} className="space-y-2 rounded border border-[#E6E7EA] p-3 dark:border-[#23262E]">
            <div className="flex gap-2">
              <input
                aria-label="Kolon başlığı"
                className={fieldClass}
                value={col.title}
                onChange={(e) =>
                  setFooter((prev) => ({
                    ...prev,
                    columns: prev.columns.map((row) =>
                      row.id === col.id ? { ...row, title: e.target.value } : row
                    ),
                  }))
                }
              />
              <button
                type="button"
                className="text-[11px] text-[#5F6570] dark:text-[#8C9099]"
                onClick={() =>
                  setFooter((prev) => ({
                    ...prev,
                    columns: prev.columns.filter((row) => row.id !== col.id),
                  }))
                }
              >
                Kolonu sil
              </button>
            </div>
            {col.links.map((link, index) => (
              <div key={`${col.id}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  aria-label="Bağlantı metni"
                  className={fieldClass}
                  value={link.label}
                  onChange={(e) => updateLink(col.id, index, { label: e.target.value })}
                />
                <input
                  aria-label="Bağlantı adresi"
                  className={fieldClass}
                  value={link.href}
                  onChange={(e) => updateLink(col.id, index, { href: e.target.value })}
                />
                <button type="button" className="text-[#5F6570] dark:text-[#8C9099]" onClick={() => removeLink(col.id, index)}>
                  Sil
                </button>
              </div>
            ))}
            <button type="button" className="text-[11px]" onClick={() => addLink(col.id)}>
              Bağlantı ekle
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-[11px] font-medium"
          onClick={() =>
            setFooter((prev) => ({
              ...prev,
              columns: [
                ...prev.columns,
                { id: `fcol_${Date.now()}`, title: "Yeni kolon", colSpan: 1, links: [] },
              ],
            }))
          }
        >
          Kolon ekle
        </button>
      </section>
    </div>
  );

  function updateLink(columnId: string, index: number, patch: { label?: string; href?: string }) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              links: col.links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
            }
          : col
      ),
    }));
  }

  function removeLink(columnId: string, index: number) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, links: col.links.filter((_, i) => i !== index) } : col
      ),
    }));
  }

  function addLink(columnId: string) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? { ...col, links: [...col.links, { label: "Bağlantı", href: "/tr" }] }
          : col
      ),
    }));
  }
}
