import React from "react";
import Link from "next/link";
import { getRedirectRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
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
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Yönlendirmeler & 404</h1>
          <p className="text-[12px] text-[#8C9099]">Elle 301/302 yönlendirmeleri ve bulunamayan adresler. Adres değişince eski adrese otomatik 301 zaten verilir; burası dış/eski adresler içindir.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5 text-[12px] font-medium">
          {[
            ["rules", `Yönlendirmeler (${rules.length})`, "/admin/redirects"],
            ["404", `404 izleyici (${missing.length})`, "/admin/redirects?tab=404"],
          ].map(([id, label, href]) => (
            <Link key={id} role="tab" aria-selected={tab === id} href={href!} className={`rounded px-3 py-1 ${tab === id ? "bg-white dark:bg-[#2A2D35] shadow-sm text-[#14151A] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

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
