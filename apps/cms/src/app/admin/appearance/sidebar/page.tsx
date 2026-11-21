import React from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChromeSubNav } from "@/components/admin/section-tabs";
import { SidebarEditor } from "@/components/admin/appearance/sidebar-editor";
import { loadChrome } from "../load-chrome";

export default async function SidebarAppearancePage() {
  const chrome = await loadChrome();
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site İskeleti — Kenar Çubuğu"
        description="Blog, sayfa, arşiv ve mağaza için bağımsız kenar çubuğu alanları ve bileşenleri."
        actions={<ChromeSubNav />}
      />
      <SidebarEditor initial={chrome.sidebar} menus={chrome.menus.map((m) => ({ id: m.id, name: m.name }))} />
    </div>
  );
}
