import React from "react";
import Link from "next/link";
import { CAPABILITIES, CAPABILITY_LABEL, ROLE_CAPABILITIES, ROLE_DESCRIPTION, ROLE_LABEL, USER_ROLES } from "@nexpress/core";
import { getUserRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { Check, Minus } from "lucide-react";

export const dynamic = "force-dynamic";

/** Roller ve izinler matrisi (salt okunur): hangi rol neyi yapabilir; her rolün kaç kullanıcısı var. */
export default async function RolesPage() {
  const me = await requireAdminPage();
  const users = await getUserRepository(me.siteId).list();
  const count = (role: string) => users.filter((u) => u.role === role && u.status === "active").length;
  const groups = [...new Set(CAPABILITIES.map((c) => CAPABILITY_LABEL[c].group))];
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div>
          <h1 className="text-[18px] font-semibold">Roller ve izinler</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Rolü kullanıcılar sayfasından atarsınız. Rol değişince kişinin açık oturumları kapanır.</p>
        </div>
        <Link href="/admin/users" className="text-[12px] text-[#266DF0] hover:underline">← Kullanıcılar</Link>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {USER_ROLES.map((r) => (
          <section key={r} className="rounded-lg border border-[#E6E7EA] bg-white p-3 dark:border-[#23262E] dark:bg-[#15171C]">
            <div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold">{ROLE_LABEL[r]}</h2><span className="font-mono text-[10px] text-[#8C9099]">{count(r)} kullanıcı</span></div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5F6570] dark:text-[#8C9099]">{ROLE_DESCRIPTION[r]}</p>
          </section>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]">
        <table className="w-full min-w-[560px] text-left text-[12px]">
          <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#5F6570] dark:bg-[#111318]">
            <tr><th className="px-3 py-2">İzin</th>{USER_ROLES.map((r) => <th key={r} className="px-3 py-2 text-center">{ROLE_LABEL[r]}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
            {groups.map((g) => (
              <React.Fragment key={g}>
                <tr className="bg-[#F8FAFC]/60 dark:bg-[#111318]/60"><th colSpan={USER_ROLES.length + 1} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5F6570]">{g}</th></tr>
                {CAPABILITIES.filter((c) => CAPABILITY_LABEL[c].group === g).map((c) => (
                  <tr key={c}>
                    <td className="px-3 py-2">{CAPABILITY_LABEL[c].label}</td>
                    {USER_ROLES.map((r) => {
                      const yes = ROLE_CAPABILITIES[r].includes(c);
                      return <td key={r} className="px-3 py-2 text-center">{yes ? <Check aria-label="Var" className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus aria-label="Yok" className="mx-auto h-4 w-4 text-[#C2C6CE]" />}</td>;
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Yazar ve Katkıcı yalnızca kendi içeriğine erişir; içeriğin sahibi ilk kayıtta sunucu tarafından yazılır, eski (sahipsiz) içerik yalnızca Editör ve Yönetici tarafından düzenlenir. Katkıcı kaydı her zaman taslak olur.</p>
    </div>
  );
}
