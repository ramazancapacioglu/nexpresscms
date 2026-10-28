import React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { getAgentRequestRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { StatusButton } from "./status-button";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { lead: "Teklif", ticket: "Destek", demo: "Demo" };
const border = "border-[#E6E7EA] dark:border-[#23262E]";
const fmt = (d: Date) => new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireAdminPage();
  const status = (await searchParams).status === "handled" ? "handled" : "new";
  const repo = getAgentRequestRepository(me.siteId);
  const [rows, newCount] = await Promise.all([repo.list({ status }), repo.countNew()]);

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Talepler</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Yapay zeka ajanlarının MCP üzerinden bıraktığı teklif, destek ve demo talepleri. Kişisel veri içerir; yalnızca yöneticiler görür.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5 text-[12px] font-medium">
          {[
            ["new", `Yeni (${newCount})`],
            ["handled", "İşlenenler"],
          ].map(([id, label]) => (
            <Link key={id} role="tab" aria-selected={status === id} href={`/admin/requests?status=${id}`} className={`rounded px-3 py-1 ${status === id ? "bg-white dark:bg-[#2A2D35] shadow-sm text-[#14151A] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <Inbox className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">{status === "new" ? "Yeni talep yok" : "İşlenmiş talep yok"}</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Talepler, ajanlar <code>nexpress_create_lead</code>, <code>nexpress_create_ticket</code> veya <code>nexpress_book_demo</code> araçlarını geçerli bir <code>X-Agent-Key</code> ile çağırdığında burada görünür. Sunucuda <code>MCP_AGENT_KEY</code> tanımlı olmalı ve Eklentiler sayfasında “Ajan eylemleri” modülü açık olmalıdır.
          </p>
        </div>
      ) : (
        <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="rounded bg-[#266DF0]/10 px-1.5 py-px text-[10px] font-semibold text-[#1D5ED8] dark:text-[#7AA7FF]">{KIND[r.kind] ?? r.kind}</span>
                  <span className="font-medium text-[#14151A] dark:text-[#F3F4F6]">{r.name}</span>
                  {r.company && r.company !== r.name && <span className="text-[#5C5F66] dark:text-[#9CA3AF]">· {r.company}</span>}
                </div>
                <div className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">
                  <a href={`mailto:${r.email}`} className="underline-offset-2 hover:underline">{r.email}</a>
                  {r.phone && <> · {r.phone}</>}
                  {r.productSlug && <> · ürün: <code>{r.productSlug}</code></>}
                </div>
                {r.message && <p className="max-w-[80ch] whitespace-pre-wrap text-[12px] leading-relaxed text-[#14151A] dark:text-[#E5E7EB]">{r.message}</p>}
                <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{fmt(r.createdAt)}{r.agent && ` · ajan: ${r.agent}`}</p>
              </div>
              <StatusButton id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
