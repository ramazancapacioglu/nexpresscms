import React from "react";
import { headers } from "next/headers";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChromeSubNav } from "@/components/admin/section-tabs";
import { HeaderEditor } from "@/components/admin/appearance/header-editor";
import { listTemplates } from "@/lib/templates";
import { loadChrome } from "../load-chrome";

export default async function HeaderAppearancePage() {
  const chrome = await loadChrome();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const templateActive = (await listTemplates(siteId)).some((t) => t.meta.kind === "header" && t.meta.isDefault);
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site İskeleti — Header"
        description="Üç şerit ve sol/orta/sağ bölgeler. Masaüstü ve mobil düzeni ayrı kurun; menü bağlantıları Menüler sekmesindedir."
        actions={<ChromeSubNav />}
      />
      <HeaderEditor initial={chrome.header} templateActive={templateActive} />
    </div>
  );
}
