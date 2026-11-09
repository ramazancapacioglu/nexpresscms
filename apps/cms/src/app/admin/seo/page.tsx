import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { resolveSiteSettings } from "@nexpress/core";
import { getChunkRepository, getIntelRepository, getScopedRepository } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { SeoTabs } from "@/components/admin/section-tabs";
import { SyncNowButton } from "@/components/admin/seo/sync-now-button";
import { buildSeoSummary } from "@/components/admin/seo/seo-summary";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin/seo/engine", label: "Motor ve dizin", detail: "Skor, şema ve bağlantı denetimi" },
  { href: "/admin/seo/reports", label: "Raporlar", detail: "Sorgu, içerik ve görünürlük" },
  { href: "/admin/seo/integrations", label: "Webmaster", detail: "Search Console, Bing, Yandex" },
  { href: "/admin/seo/audit", label: "Site denetimi", detail: "Yayın öncesi kontrol" },
  { href: "/admin/redirects", label: "Yönlendirmeler", detail: "301 ve 404" },
  { href: "/admin/seo/schemas", label: "Şemalar", detail: "Tür, sayfa, blog ve kategori" },
  { href: "/admin/seo/settings", label: "Ayarlar", detail: "Marka, yorum ve yazım kuralları" },
];

/** SEO çatısının özeti. Ayrıntı ilgili sekmededir. */
export default async function AdminSeoPage() {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: site?.defaultLocale ?? "tr" });
  const summary = buildSeoSummary(contents, resolveSiteSettings(site?.settings).seo);
  const index = await getChunkRepository(siteId).stats();
  const intel = getIntelRepository(siteId);
  const [signals, imports] = await Promise.all([intel.listSignals(500), intel.listImports(30)]);
  let embedding = "Sözcük örtüşmesi";
  try {
    const provider = providerFromEnv();
    embedding = provider.semantic ? "Anlam kümesi" : "Sözcük örtüşmesi";
  } catch {
    embedding = "Anahtar yok";
  }
  const cards = [
    { label: "Ortalama skor", value: summary.average },
    { label: "Yayın", value: summary.published },
    { label: "Eksik açıklama", value: summary.missingDescription },
    { label: "Dizin parçası", value: index.chunks },
    { label: "Kayıtlı sorgu", value: signals.length },
    { label: "Kaynak", value: imports.length },
  ];

  return (
    <div className="space-y-4">
      <SeoTabs />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">SEO gösterge</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            {site?.name ?? "Site"} · kümeleme: {embedding}. Anahtar yoksa örnek satır kaydedilmez.
          </p>
        </div>
        <SyncNowButton />
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[#E6E7EA] bg-white px-3.5 py-2.5 dark:border-[#23262E] dark:bg-[#15171C]">
            <dt className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{card.label}</dt>
            <dd className="text-[20px] font-semibold tabular-nums text-[#14151A] dark:text-[#F3F4F6]">{card.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-[#E6E7EA] bg-white px-4 py-3 hover:border-[#266DF0] dark:border-[#23262E] dark:bg-[#15171C]">
            <div className="text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">{item.label}</div>
            <div className="mt-0.5 text-[12px] text-[#5F6570] dark:text-[#8C9099]">{item.detail}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
