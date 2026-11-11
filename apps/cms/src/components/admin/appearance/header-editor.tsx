"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type { HeaderConfig } from "@nexpress/core";
import { Sparkles } from "lucide-react";
import { saveChromeAction } from "@/app/admin/actions";
import { AppearanceTabs, SaveBar } from "./appearance-ui";
import { ChromeLibraryModal } from "./chrome-library-modal";
import { HeaderBuilder } from "./header-builder";

export function HeaderEditor({ initial, templateActive = false }: { initial: HeaderConfig; templateActive?: boolean }) {
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

  return (
    <div className="space-y-4">
      <AppearanceTabs current="header" />
      <SaveBar title="Header" pending={pending} notice={notice} onSave={save} />

      {templateActive ? (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          Bu sitede <strong>varsayılan bir header şablonu</strong> açık; ziyaretçiye o şablon gösterilir ve buradaki yerleşim kullanılmaz.
          Buradaki düzeni kullanmak için <Link href="/admin/appearance/templates" className="font-semibold underline">Şablonlar</Link> sekmesinde o şablonun varsayılan işaretini kaldırın.
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" onClick={() => setLibraryOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700">
          <Sparkles className="h-3.5 w-3.5" /> Hazır tasarımlar
        </button>
      </div>

      <HeaderBuilder header={header} onChange={setHeader} />

      <ChromeLibraryModal
        open={libraryOpen}
        kind="header"
        onClose={() => setLibraryOpen(false)}
        onApplyHeader={(value) => {
          setHeader(value);
          setNotice("Tasarım forma alındı. Kaydet ile yayınlanır.");
        }}
      />
    </div>
  );
}
