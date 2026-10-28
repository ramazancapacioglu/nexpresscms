import React from "react";
import { MenuEditor } from "@/components/admin/appearance/menu-editor";
import { loadChrome } from "../load-chrome";

export default async function MenuAppearancePage() {
  const chrome = await loadChrome();
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Menü</h1>
        <p className="text-[12px] text-[#8C9099]">
          Header’dan ayrıdır. Tutamacı sürükleyerek sıralayın. Bir düzey alt bağlantı desteklenir.
        </p>
      </header>
      <MenuEditor initial={chrome.menu} />
    </div>
  );
}
