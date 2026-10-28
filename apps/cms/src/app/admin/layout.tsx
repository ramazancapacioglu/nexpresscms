import React, { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCmsMode, PluginSlot } from "@nexpress/core";
import { getDbDialect, getScopedRepository } from "@nexpress/database";
import { logoutAction } from "@/app/login/actions";
import { getSession } from "@/lib/auth/session";
import { ThemeBoundary } from "@/components/admin/theme-boundary";
import { AdminShellClient } from "@/components/admin/admin-shell-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const cmsMode = getCmsMode();
  const dbDialect = getDbDialect();

  const session = await getSession();
  if (!session) redirect("/login");
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();

  return (
    <ThemeBoundary>
    <Suspense>
    <AdminShellClient
      siteId={siteId}
      cmsMode={cmsMode}
      dbDialect={dbDialect}
      activeThemeId={site?.activeThemeId ?? "corporate-aurora"}
      accountSlot={
        <div className="pt-2 border-t border-[#E6E7EA] dark:border-[#23262E] space-y-0.5">
        <Link
          href="/admin/profile"
          className="block rounded-md px-2 py-1 text-[12px] text-[#14151A] hover:bg-black/5 dark:text-[#F3F4F6] dark:hover:bg-white/5"
        >
          <span className="block truncate font-medium">{session.name || session.email}</span>
          <span className="block truncate text-[10px] text-[#8C9099]">
            {session.email} • {session.role === "admin" ? "Yönetici" : "Editör"}
          </span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-md px-2 py-1 text-left text-[12px] text-[#5C5F66] hover:bg-black/5 dark:text-[#9CA3AF] dark:hover:bg-white/5"
          >
            Çıkış yap
          </button>
        </form>
        </div>
      }
      role={session.role}
      sidebarSlot={
        <PluginSlot
          name="admin.sidebar.nav"
          siteId={siteId}
          fallback={
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-2.5 text-[11px] text-zinc-500">
              Pro eklenti yuvası hazır (<code>admin.sidebar.nav</code>).
            </div>
          }
        />
      }
    >
      {children}
    </AdminShellClient>
    </Suspense>
    </ThemeBoundary>
  );
}
