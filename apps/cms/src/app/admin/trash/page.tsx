import React from "react";
import { Trash2 } from "lucide-react";
import { trashDaysLeft } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { TrashList } from "./trash-list";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function AdminTrashPage() {
  const me = await requireUser();
  const repo = getScopedRepository(me.siteId);
  await repo.purgeExpiredTrash();
  const items = (await repo.listTrashed()).map((i) => ({
    contentId: i.contentId,
    title: i.title,
    slug: i.slug,
    type: i.type,
    previousStatus: i.previousStatus,
    deletedAt: i.deletedAt.toISOString(),
    deletedBy: i.deletedBy,
    daysLeft: trashDaysLeft(i.deletedAt.toISOString()),
  }));

  return (
    <div className="space-y-5">
      <div className={`border-b ${border} pb-3.5`}>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Çöp kutusu</h1>
        <p className="text-[12px] text-[#8C9099]">Silinen içerikler 30 gün burada kalır; süresi dolanlar kendiliğinden kalıcı silinir. Geri yüklenenler güvenlik için <strong>taslak</strong> olarak döner.</p>
      </div>
      {items.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <Trash2 className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">Çöp kutusu boş</p>
          <p className="mx-auto mt-1 max-w-[50ch] text-[12px] text-[#8C9099]">Sayfalar ve Blog Yazıları listesinden sildiğiniz içerikler önce buraya gelir.</p>
        </div>
      ) : (
        <TrashList items={items} isAdmin={me.role === "admin"} />
      )}
    </div>
  );
}
