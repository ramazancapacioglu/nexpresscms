import React from "react";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { ContentTypesManager } from "@/components/admin/content-types/content-types-manager";

export const dynamic = "force-dynamic";

export default async function AdminContentTypesPage() {
  await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const types = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
  const counts: Record<string, number> = {};
  for (const t of types) counts[t.id] = (await repo.listContents({ locale, type: t.id })).length;
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">İçerik türleri ve özel alanlar</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Sayfa ve yazı dışında kendi içerik türlerinizi (referans, etkinlik, ekip üyesi, ilan…) ve her türün alanlarını tanımlayın.
          Tür tanımlandığında kenar çubuğunda kendi listesi, editörde &quot;Alanlar&quot; sekmesi ve ziyaretçide alan tablosu açılır.
        </p>
      </header>
      <ContentTypesManager initial={types} counts={counts} />
    </div>
  );
}
