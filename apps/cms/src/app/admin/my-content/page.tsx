import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { contentAccess, contentOwnerId, resolveSiteSettings, roleCan, ROLE_LABEL } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { draft: "Taslak", published: "Yayında", scheduled: "Zamanlanmış", restricted: "Kısıtlı", archived: "Arşiv" };
const TYPE: Record<string, string> = { page: "Sayfa", post: "Yazı" };

/** Kişinin kendi içerikleri: yazar ve katkıcının tek giriş sayfası (editör ve yönetici de kullanabilir). */
export default async function MyContentPage() {
  const session = await requireUser({ can: "content.create" });
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const customTypes = resolveSiteSettings(site?.settings).general.contentTypes ?? [];
  const typeLabel = (id: string) => TYPE[id] ?? customTypes.find((t) => t.id === id)?.label ?? id;
  const listable = new Set(["page", "post", ...customTypes.map((t) => t.id)]);
  const items = (await repo.listContents({ locale: site?.defaultLocale ?? "tr" }))
    .filter((c) => listable.has(c.type) && contentOwnerId(c.schemaAttributes) === session.sub)
    .sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
  const canPublish = roleCan(session.role, "content.publish");
  const creatable = [{ id: "post", label: "Yazı" }, { id: "page", label: "Sayfa" }, ...customTypes.map((t) => ({ id: t.id, label: t.label }))];
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div>
          <h1 className="text-[18px] font-semibold">İçeriklerim</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            {ROLE_LABEL[session.role]} · {items.length} içerik{canPublish ? "" : " · taslak olarak kaydedilir, bir editör yayınlar"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {creatable.map((t) => (
            <Link key={t.id} href={`/admin/contents?type=${t.id}&new=1`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white hover:bg-[#1f5bd0]">
              <Plus className="h-3.5 w-3.5" /> Yeni {t.label.toLocaleLowerCase("tr")}
            </Link>
          ))}
        </div>
      </header>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#D5D8DE] p-8 text-center text-[12px] text-[#5F6570] dark:border-[#2E333D]">Henüz içeriğiniz yok. Yukarıdan yeni bir içerik başlatın.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#5F6570] dark:bg-[#111318]">
              <tr><th className="px-3 py-2">Başlık</th><th className="px-3 py-2">Tür</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2">Güncelleme</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
              {items.map((c) => {
                const editable = contentAccess(session.role, session.sub, c).edit;
                return (
                  <tr key={c.contentId}>
                    <td className="px-3 py-2">
                      {editable ? <Link href={`/admin/contents?id=${c.contentId}&type=${c.type}`} className="font-medium text-[#266DF0] hover:underline">{c.title || "(başlıksız)"}</Link> : <span title="Yayınlandı: değişiklik için bir editöre başvurun">{c.title || "(başlıksız)"}</span>}
                    </td>
                    <td className="px-3 py-2">{typeLabel(c.type)}</td>
                    <td className="px-3 py-2">{STATUS[c.status] ?? c.status}</td>
                    <td className="px-3 py-2 text-[#5F6570]">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("tr-TR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
