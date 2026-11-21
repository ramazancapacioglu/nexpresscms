import React from "react";
import Link from "next/link";
import { getRedirectRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeoTabs } from "@/components/admin/section-tabs";
import { NotFoundTable } from "./not-found-table";
import { RedirectsManager } from "./redirects-manager";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function AdminRedirectsPage({ searchParams }: { searchParams: Promise<{ tab?: string; from?: string }> }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const tab = sp.tab === "404" ? "404" : "rules";
  const repo = getRedirectRepository(me.siteId);
  const [rules, missing] = await Promise.all([repo.list(), repo.listNotFound()]);

  return (
    <div className="space-y-5">
      <SeoTabs />
      <AdminPageHeader
        title="Yönlendirmeler & 404"
        description="Elle 301/302 kuralları ve bulunamayan adres günlüğü. Adres değişince eski URL için otomatik 301 zaten oluşturulur."
        actions={
          <div role="tablist" className="inline-flex rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:border-[#23262E] dark:bg-[#1C1E24]">
            {[
              ["rules", `Yönlendirmeler (${rules.length})`, "/admin/redirects"],
              ["404", `404 izleyici (${missing.length})`, "/admin/redirects?tab=404"],
            ].map(([id, label, href]) => (
              <Link key={id} role="tab" aria-selected={tab === id} href={href!} className={`rounded-md px-3 py-1 ${tab === id ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>
                {label}
              </Link>
            ))}
          </div>
        }
      />

      {tab === "rules" ? (
        <RedirectsManager
          prefillFrom={sp.from ?? ""}
          rules={rules.map((r) => ({ id: r.id, fromPath: r.fromPath, toPath: r.toPath, code: r.code, enabled: r.enabled, hits: r.hits, note: r.note, lastHitAt: r.lastHitAt?.toISOString() ?? null }))}
        />
      ) : (
        <NotFoundTable rows={missing.map((m) => ({ path: m.path, hits: m.hits, lastSeenAt: m.lastSeenAt.toISOString(), lastReferrer: m.lastReferrer }))} />
      )}
    </div>
  );
}
