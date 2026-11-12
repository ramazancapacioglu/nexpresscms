import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { findContentType, resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { draft: "Taslak", published: "Yayında", scheduled: "Zamanlanmış", restricted: "Kısıtlı", archived: "Arşiv" };

/** Özel içerik türünün listesi: başlık, adres, durum ve son değişiklik; her satır editöre gider. */
export default async function AdminEntriesPage({ params }: { params: Promise<{ type: string }> }) {
  await requireUser();
  const { type: typeId } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const def = findContentType(resolveSiteSettings(site?.settings).general.contentTypes, typeId);
  if (!def) notFound();
  const items = await repo.listContents({ locale: site?.defaultLocale ?? "tr", type: typeId });
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div>
          <h1 className="text-[18px] font-semibold">{def.labelPlural}</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{items.length} kayıt · {def.fields.length} özel alan</p>
        </div>
        <Link href={`/admin/contents?type=${def.id}&new=1`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white hover:bg-[#1f5bd0]">
          <Plus className="h-3.5 w-3.5" /> Yeni {def.label}
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#D5D8DE] p-8 text-center text-[12px] text-[#5F6570] dark:border-[#2E333D]">
          Henüz {def.label.toLocaleLowerCase("tr")} yok. &quot;Yeni {def.label}&quot; ile ilkini ekleyin.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#5F6570] dark:bg-[#111318]">
              <tr><th className="px-3 py-2">Başlık</th><th className="px-3 py-2">Adres</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2">Güncelleme</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
              {items.map((c) => (
                <tr key={c.contentId}>
                  <td className="px-3 py-2"><Link href={`/admin/contents?id=${c.contentId}&type=${def.id}`} className="font-medium text-[#266DF0] hover:underline">{c.title || "(başlıksız)"}</Link></td>
                  <td className="px-3 py-2 font-mono text-[11px] text-[#5F6570]">/{c.slug}</td>
                  <td className="px-3 py-2">{STATUS[c.status] ?? c.status}</td>
                  <td className="px-3 py-2 text-[#5F6570]">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("tr-TR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
