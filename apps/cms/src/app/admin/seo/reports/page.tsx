import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { PluginSlot, slotRegistry } from "@nexpress/core";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";

export const dynamic = "force-dynamic";

const GROUPS = [
  {
    id: "visibility",
    slot: "seo.reports.visibility" as const,
    title: "Görünürlük & AI",
    detail: "AI yönlendirme, bot taraması, alıntı hazırlığı, MCP günlüğü, yorumlar ve cevapsız aramalar.",
  },
  {
    id: "content",
    slot: "seo.reports.content" as const,
    title: "İçerik Sağlığı",
    detail: "İçerik açığı, erime (decay), kaynak denetimi ve katalog iyileştirmeleri.",
  },
  {
    id: "queries",
    slot: "seo.reports.queries" as const,
    title: "Sorgular & Kümeler",
    detail: "Kayıtlı kelimeler, konu kümeleri ve arama motoru sorgu fırsatları.",
  },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

/**
 * SEO & GEO Raporları:
 * Tüm kartları alt alta yığmak yerine kategori sekmeleriyle (?group=...) yalnız seçili grubu
 * 2 sütunlu ızgarada yükler (hem daha okunaklı hem daha hızlı).
 */
export default async function AdminSeoReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [reqHeaders, sp] = await Promise.all([headers(), searchParams]);
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const activeId: GroupId =
    sp.group === "content" || sp.group === "queries" || sp.group === "visibility"
      ? sp.group
      : "visibility";
  const active = GROUPS.find((g) => g.id === activeId) ?? GROUPS[0];

  const counts = Object.fromEntries(
    GROUPS.map((g) => [g.id, slotRegistry.getEntries(g.slot).length])
  ) as Record<GroupId, number>;

  return (
    <div className="space-y-4">
      <SeoTabs />
      <AdminPageHeader
        title="SEO & GEO Raporları"
        description={active.detail}
        actions={
          <nav
            aria-label="Rapor kategorileri"
            className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 dark:border-[#23262E] dark:bg-[#1C1E24]"
          >
            {GROUPS.map((g) => {
              const isCurrent = g.id === active.id;
              return (
                <Link
                  key={g.id}
                  href={`/admin/seo/reports?group=${g.id}`}
                  prefetch={false}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-medium transition ${
                    isCurrent
                      ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]"
                      : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
                  }`}
                >
                  <span>{g.title}</span>
                  <span className="rounded bg-[#E6E7EA]/70 px-1.5 py-0.2 font-mono text-[10px] text-[#5F6570] dark:bg-[#2E333D] dark:text-[#9CA3AF]">
                    {counts[g.id]}
                  </span>
                </Link>
              );
            })}
          </nav>
        }
      />

      <PluginSlot
        name={active.slot}
        siteId={siteId}
        className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 [&>*]:min-w-0"
        fallback={
          <div className="rounded-lg border border-[#E6E7EA] bg-white px-6 py-12 text-center text-[13px] text-[#5F6570] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#8C9099]">
            Bu kategoride etkin rapor kartı yok. İlgili modülleri Eklentiler sayfasından açabilirsiniz.
          </div>
        }
      />
    </div>
  );
}
