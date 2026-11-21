import React from "react";
import { headers } from "next/headers";
import { PluginSlot } from "@nexpress/core";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";

export const dynamic = "force-dynamic";

const groups = [
  { slot: "seo.reports.queries" as const, title: "Sorgular", detail: "Kayıtlı kelimeler, kümeler ve arama sonuçları." },
  { slot: "seo.reports.content" as const, title: "İçerik", detail: "Erime, içerik açığı, kaynak denetimi ve katalog." },
  { slot: "seo.reports.visibility" as const, title: "Görünürlük", detail: "AI yönlendirme, bot taraması, yorumlar ve cevapsız aramalar." },
];

/** Rapor kartları üç grupta. Ana sayfa paneline taşınmaz. */
export default async function AdminSeoReportsPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="SEO & GEO Raporları"
        description="Sorgu fırsatları, içerik sağlığı ve yapay zeka görünürlük kartları."
      />
      {groups.map((group) => (
        <section key={group.slot} className="space-y-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">{group.title}</h2>
            <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{group.detail}</p>
          </div>
          <PluginSlot name={group.slot} siteId={siteId} className="space-y-3" />
        </section>
      ))}
    </div>
  );
}
