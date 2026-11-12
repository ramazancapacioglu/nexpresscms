import React from "react";
import { HeaderEditor } from "@/components/admin/appearance/header-editor";
import { headers } from "next/headers";
import { listTemplates } from "@/lib/templates";
import { loadChrome } from "../load-chrome";

export default async function HeaderAppearancePage() {
  const chrome = await loadChrome();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const templateActive = (await listTemplates(siteId)).some((t) => t.meta.kind === "header" && t.meta.isDefault);
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Header</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Üç şerit ve sol/orta/sağ bölgeler. Öğeleri sürükleyin, masaüstü ve mobil düzeni ayrı kurun. Menü bağlantıları Menüler sekmesindedir.
        </p>
      </header>
      <HeaderEditor initial={chrome.header} templateActive={templateActive} />
    </div>
  );
}
