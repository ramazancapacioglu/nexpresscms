import React from "react";
import { headers } from "next/headers";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChromeSubNav } from "@/components/admin/section-tabs";
import { FooterEditor } from "@/components/admin/appearance/footer-editor";
import { listTemplates } from "@/lib/templates";
import { loadChrome } from "../load-chrome";

export default async function FooterAppearancePage() {
  const chrome = await loadChrome();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const templateActive = (await listTemplates(siteId)).some((t) => t.meta.kind === "footer" && t.meta.isDefault);
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site İskeleti — Footer"
        description="Kolonlar, bileşenler, satır stilleri ve telif satırı. Değişiklikler Kaydet ile yayınlanır."
        actions={<ChromeSubNav />}
      />
      {templateActive ? (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          Bu sitede <strong>varsayılan bir footer şablonu</strong> açık; ziyaretçiye o şablon gösterilir. Buradaki yerleşimi kullanmak için Şablonlar &amp; Modeller sekmesinde o şablonun varsayılan işaretini kaldırın.
        </div>
      ) : null}
      <FooterEditor initial={chrome.footer} menus={chrome.menus.map((m) => ({ id: m.id, name: m.name }))} />
    </div>
  );
}
