import React from "react";
import { HeaderEditor } from "@/components/admin/appearance/header-editor";
import { loadChrome } from "../load-chrome";

export default async function HeaderAppearancePage() {
  const chrome = await loadChrome();
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Header</h1>
        <p className="text-[12px] text-[#8C9099]">
          Duyuru, ana şerit ve alt şerit. Menü bağlantıları ayrı sayfadadır. Şablon kayda kopyalanır, sonra düzenlenir.
        </p>
      </header>
      <HeaderEditor initial={chrome.header} />
    </div>
  );
}
