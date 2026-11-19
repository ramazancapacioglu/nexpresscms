import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings, sitemapArchiveTypes } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Site haritası</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Şu an haritada: {seo.sitemapTypes.length} içerik türü
            {archives.includes("kategori") ? ", kategoriler" : ""}
            {archives.includes("etiket") ? ", etiketler" : ""}. Özel türler kendi ayarındaki harita kutusundan girer.
          </p>
        </div>
        <a className="text-[12px] underline" href="/sitemap.xml" target="_blank" rel="noreferrer">
          sitemap.xml
        </a>
      </div>
      {seo.searchIndexing === false ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          Arama indeksi kapalı. Harita boş döner. Açmak için Ayarlar sayfasını kullanın.
        </p>
      ) : null}
      <SitemapPanel seo={seo} />
    </div>
  );
}
