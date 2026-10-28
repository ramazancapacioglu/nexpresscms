import React from "react";
import { SidebarEditor } from "@/components/admin/appearance/sidebar-editor";
import { loadChrome } from "../load-chrome";

export default async function SidebarAppearancePage() {
  const chrome = await loadChrome();
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Kenar çubuğu</h1>
        <p className="text-[12px] text-[#8C9099]">
          Sayfa gövdesinin solu ya da sağı. Blok yerleşiminden ayrı bir site parçasıdır.
        </p>
      </header>
      <SidebarEditor initial={chrome.sidebar} />
    </div>
  );
}
