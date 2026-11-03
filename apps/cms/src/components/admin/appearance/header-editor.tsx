"use client";

import React, { useState, useTransition } from "react";
import type { HeaderConfig, NavigationLink } from "@nexpress/core";
import { Sparkles } from "lucide-react";
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

      {/* Canlı Header Önizlemesi */}
      <section aria-label="Canlı header önizlemesi" className="overflow-hidden rounded-xl border border-[#D5D8DE] bg-white shadow-2xs dark:border-[#2E333D] dark:bg-[#15171C]">
        <div className="flex items-center justify-between border-b border-[#E6E7EA] bg-[#F8FAFC] px-4 py-2 text-[11px] dark:border-[#23262E] dark:bg-[#111318]">
          <span className="font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
            Canlı Header (Üst Bölüm) Önizlemesi
          </span>
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            <Sparkles className="h-3 w-3" /> Hazır Header Kütüphanesini Aç
          </button>
        </div>

        <div>
          {header.topBar.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-5 py-1.5 text-[11px] text-white">
              <span>{header.topBar.announcementText || "Üst duyuru metni buraya gelecek…"}</span>
              <div className="flex items-center gap-3 opacity-85">
                {header.topBar.contactPhone && <span>{header.topBar.contactPhone}</span>}
                {header.topBar.contactEmail && <span>{header.topBar.contactEmail}</span>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                N
              </span>
              <span className="text-sm font-bold">Site Logosu</span>
              {header.mainBar.sticky && (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                  Yapışkan
                </span>
              )}
              {header.mainBar.glassmorphism && (
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-purple-600">
                  Cam Yüzey
                </span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-5 text-xs font-medium opacity-80">
              <span>Ana Sayfa</span>
              <span>Çözümler</span>
              <span>Blog</span>
              <span>İletişim</span>
            </div>
            {header.mainBar.ctaLabel ? (
              <span className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                {header.mainBar.ctaLabel}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">CTA Yok</span>
            )}
          </div>

          {header.bottomBar.enabled && links.length > 0 && (
            <div className="flex gap-4 border-t border-[#E6E7EA] bg-[#FBFBFD] px-5 py-2 text-[11px] dark:border-[#23262E] dark:bg-[#12141A]">
              {links.map((l) => (
                <span key={l.id} className="font-medium opacity-80">
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

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
          <span className="font-semibold">1. Üst duyuru & iletişim şeridi (Top Bar)</span>
          <input
            type="checkbox"
            checked={header.topBar.enabled}
            onChange={(e) => setTop({ enabled: e.target.checked })}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className={fieldClass}
            value={header.topBar.announcementText ?? ""}
            placeholder="Duyuru metni"
            onChange={(e) => setTop({ announcementText: e.target.value })}
          />
          <input
            className={fieldClass}
            value={header.topBar.contactPhone ?? ""}
            placeholder="Telefon (+90...)"
            onChange={(e) => setTop({ contactPhone: e.target.value })}
          />
          <input
            className={fieldClass}
            value={header.topBar.contactEmail ?? ""}
            placeholder="E-posta (bilgi@...)"
            onChange={(e) => setTop({ contactEmail: e.target.value })}
          />
        </div>
      </section>
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="font-semibold">2. Ana şerit (Logo, Menü & Çağrı Düğmesi)</div>
        <div className="flex flex-wrap gap-4 text-[11px] text-[#5C5F66]">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={header.mainBar.sticky ?? false}
              onChange={(e) => setMain({ sticky: e.target.checked })}
            />
            Yapışkan (Sticky)
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={header.mainBar.glassmorphism ?? false}
              onChange={(e) => setMain({ glassmorphism: e.target.checked })}
            />
            Cam yüzey (Glassmorphism)
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={fieldClass}
            value={header.mainBar.ctaLabel ?? ""}
            placeholder="Çağrı etiketi (ör: Teklif Alın)"
            onChange={(e) => setMain({ ctaLabel: e.target.value })}
          />
          <input
            className={fieldClass}
            value={header.mainBar.ctaHref ?? ""}
            placeholder="Çağrı adresi (ör: /tr/iletisim)"
            onChange={(e) => setMain({ ctaHref: e.target.value })}
          />
        </div>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Ana menü ve mega menü bağlantıları Menü sekmesinden düzenlenir.</p>
      </section>
      <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
        <label className="flex items-center justify-between">
          <span className="font-semibold">3. Alt kategori / kısayol şeridi (Bottom Bar)</span>
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
          className="text-[11px] font-medium text-blue-600 hover:underline"
          onClick={() =>
            setLinks([...links, { id: `bl_${Date.now()}`, label: "Bağlantı", href: "/tr" }])
          }
        >
          + Alt şeride bağlantı ekle
        </button>
      </section>
    </div>
  );
}
