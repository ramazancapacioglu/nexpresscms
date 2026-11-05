import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SearchConsolePanel } from "@/components/admin/seo/search-console-panel";
import { SeoIntegrationsStudio } from "@/components/admin/seo/seo-integrations-studio";

export const dynamic = "force-dynamic";

export default async function AdminSeoIntegrationsPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const seo = resolveSiteSettings(site?.settings).seo;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <div className="rounded-lg border border-[#D5D8DE] bg-white p-4 dark:border-[#2C303A] dark:bg-[#1A1D24]">
        <h1 className="text-lg font-semibold text-[#111318] dark:text-white">
          Arama Motoru & Analitik Entegrasyonları
        </h1>
        <p className="mt-1 text-sm text-[#5C6470] dark:text-[#9DA4B0]">
          Google Search Console, Google Analytics 4, Bing Webmaster ve Yandex Metrika API bağlantılarını
          tek bir panelden yönetin, anahtar kelime fırsatlarını ve AI arama yönlendirmelerini canlı izleyin.
        </p>
      </div>
      <SeoIntegrationsStudio
        initialIntegrations={seo.integrations}
        siteUrl={site?.domain ? `https://${site.domain}` : "http://localhost:3000"}
      />
      <SearchConsolePanel verification={seo.verification} />
    </div>
  );
}

