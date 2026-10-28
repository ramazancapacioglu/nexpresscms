import React from "react";
import { FooterEditor } from "@/components/admin/appearance/footer-editor";
import { loadChrome } from "../load-chrome";

export default async function FooterAppearancePage() {
  const chrome = await loadChrome();
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Footer</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Kolonlar ve telif satırı. Şablon seçince kayıt değişmez; Kaydet deyince yayınlanır.
        </p>
      </header>
      <FooterEditor initial={chrome.footer} />
    </div>
  );
}
