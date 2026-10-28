import React from "react";
import Link from "next/link";
import { Download, MailOpen } from "lucide-react";
import { FORM_STATUSES, getFormSubmissionRepository, type FormStatus } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { SubmissionList } from "./submission-list";
import { getFormDefinitionRepository } from "@nexpress/database";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const TABS: Array<[FormStatus, string]> = [["new", "Yeni"], ["read", "Okundu"], ["spam", "Spam"], ["archived", "Arşiv"]];

export default async function AdminFormsPage({ searchParams }: { searchParams: Promise<{ status?: string; form?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const s = sp.status as FormStatus | undefined;
  const formId = sp.form && /^[A-Za-z0-9_-]{1,80}$/.test(sp.form) ? sp.form : undefined;
  const status: FormStatus = s && FORM_STATUSES.includes(s) ? s : "new";
  const repo = getFormSubmissionRepository(me.siteId);
  const [counts, rows, forms] = await Promise.all([repo.counts(formId), repo.list({ status, formId, limit: 100 }), getFormDefinitionRepository(me.siteId).list({ includeArchived: true })]);
  const current = forms.find((f) => f.id === formId);
  const q = formId ? `&form=${formId}` : "";

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Gelen kutusu{current ? ` — ${current.name}` : ""}</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Form gönderimleri. <Link href="/admin/forms" className="underline">Formlara dön</Link>. Kişisel veri içerir; 365 gün sonra kendiliğinden silinir. Spam korumaları: gizli alan, zaman belirteci, hız sınırı, bağlantı sezgisi.</p>
        </div>
        <div className="flex items-center gap-2">
          {me.role === "admin" && (
            <a href={`/api/admin/forms/export?status=${status}${q}`} className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}>
              <Download className="h-3.5 w-3.5" /> CSV indir
            </a>
          )}
          <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5 text-[12px] font-medium">
            {TABS.map(([id, label]) => (
              <Link key={id} role="tab" aria-selected={status === id} href={`/admin/forms/inbox?status=${id}${q}`} className={`rounded px-3 py-1 ${status === id ? "bg-white dark:bg-[#2A2D35] shadow-sm text-[#14151A] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>
                {label} ({counts[id]})
              </Link>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <MailOpen className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">Bu klasörde gönderim yok</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">Görsel editörde sayfaya bir <strong>Form</strong> bloğu ekleyip bir form seçin; ziyaretçi mesajları burada görünür.</p>
        </div>
      ) : (
        <SubmissionList
          status={status}
          isAdmin={me.role === "admin"}
          items={rows.map((r) => ({ id: r.id, pagePath: r.pagePath, formTitle: r.formTitle, fields: r.fields, createdAt: r.createdAt.toISOString(), notifyStatus: r.notifyStatus, notifyError: r.notifyError }))}
        />
      )}
    </div>
  );
}
