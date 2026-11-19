import React from "react";
import { headers } from "next/headers";
import { getChunkRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import Link from "next/link";
import { SearchIndexCard } from "@/components/admin/seo/search-index-card";
import { SeoTabs } from "@/components/admin/section-tabs";

export const dynamic = "force-dynamic";

/** Motor, dizin ve bağlantı denetimi. Konsol bağlantısı webmaster sekmesindedir. */
export default async function AdminSeoEnginePage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: site?.defaultLocale ?? "tr" });
  let model = "yerel";
  let semantic = false;
  try {
    const provider = providerFromEnv();
    model = provider.model;
    semantic = provider.semantic;
  } catch {
    model = "anahtar yok";
  }
  const stats = await getChunkRepository(siteId).stats();
  const published = contents.filter((c) => c.status === "published").length;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <SearchIndexCard stats={stats} activeModel={model} semantic={semantic} publishedCount={published} />
      <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
        Bu sayfa yalnızca site içi arama dizinidir. Başlık ve indeks{" "}
        <Link href="/admin/seo/settings" className="underline">
          Ayarlar
        </Link>
        , etiket ve kategori haritası{" "}
        <Link href="/admin/seo/sitemap" className="underline">
          Site haritası
        </Link>
        , kırık bağlantı{" "}
        <Link href="/admin/seo/audit" className="underline">
          Denetim
        </Link>{" "}
        sayfasındadır.
      </p>
    </div>
  );
}
