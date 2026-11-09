import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SchemaPlacements } from "@/components/admin/seo/schema-placements";

export const dynamic = "force-dynamic";

/** Kayıtlı şema türleri ve bunların sayfa, blog veya kategoriye bağlanması. */
export default async function AdminSeoSchemasPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: site?.defaultLocale ?? "tr" });
  const counts = new Map<string, number>();
  for (const item of contents) {
    if (item.type === "template") continue;
    counts.set(item.schemaType, (counts.get(item.schemaType) ?? 0) + 1);
  }
  const inventory = [...counts.entries()].map(([schemaType, count]) => ({ schemaType, count })).sort((a, b) => b.count - a.count);
  return (
    <div className="space-y-4">
      <SeoTabs />
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight">Şemalar</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Bir kural sayfa, blog veya kategoriye uygulanır. İçeriğin kendi SSS, yazılım veya hakkımızda şeması durur.
        </p>
      </div>
      <SchemaPlacements initial={resolveSiteSettings(site?.settings).seo.schemaPlacements ?? []} inventory={inventory} />
    </div>
  );
}
