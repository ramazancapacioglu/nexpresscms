import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings, sitemapArchiveTypes } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SitemapPanel } from "@/components/admin/seo/sitemap-panel";

export const dynamic = "force-dynamic";

/** Site haritasına hangi türlerin ve arşivlerin gireceği. */
export default async function AdminSeoSitemapPage() {
  await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const site = await getScopedRepository(siteId).getSite();
  const seo = resolveSiteSettings(site?.settings).seo;
  const archives = sitemapArchiveTypes(seo);

  return (
    <div className="space-y-4">
      <SeoTabs />
      <AdminPageHeader
        title="Site Haritası"
        description={`Şu an haritada: ${seo.sitemapTypes.length} içerik türü${archives.includes("kategori") ? ", kategoriler" : ""}${archives.includes("etiket") ? ", etiketler" : ""}. Özel türler kendi ayarındaki harita kutusundan girer.`}
        actions={
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md border border-[#E6E7EA] bg-white px-3 text-[12px] font-medium text-[#14151A] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#F3F4F6]"
          >
            sitemap.xml ↗
          </a>
        }
      />
      {seo.searchIndexing === false ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          Arama indeksi kapalı. Harita boş döner. Açmak için Ayarlar › Yayın bölümünü kullanın.
        </p>
      ) : null}
      <SitemapPanel seo={seo} />
    </div>
  );
}
