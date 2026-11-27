import React from "react";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { FORM_STATUSES, getFormDefinitionRepository, getFormSubmissionRepository, type FormStatus } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { SubmissionInbox } from "./submission-inbox";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function AdminFormsInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; form?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const initialFormId = sp.form && /^[A-Za-z0-9_-]{1,80}$/.test(sp.form) ? sp.form : "all";
  const initialStatus: FormStatus | "all" =
    sp.status && FORM_STATUSES.includes(sp.status as FormStatus) ? (sp.status as FormStatus) : "all";

  const repo = getFormSubmissionRepository(me.siteId);
  const [rows, forms] = await Promise.all([
    repo.list({ limit: 300 }),
    getFormDefinitionRepository(me.siteId).list({ includeArchived: true }),
  ]);

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b ${border} pb-3.5`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Inbox className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
              Form Gelen Kutusu
            </h1>
            <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
              Tüm form gönderimlerini tek ekrandan filtreleyin, inceleyin ve yönetin. Kişisel veriler 365 gün sonra otomatik silinir.
            </p>
          </div>
        </div>

        <Link
          href="/admin/forms"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} bg-white dark:bg-[#15171C] px-3 text-[12px] font-medium hover:bg-muted`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Formlara Dön
        </Link>
      </div>

      <SubmissionInbox
        initialItems={rows.map((r) => ({
          id: r.id,
          formId: r.formId,
          formTitle: r.formTitle,
          pagePath: r.pagePath,
          status: r.status,
          fields: r.fields,
          createdAt: r.createdAt.toISOString(),
          notifyStatus: r.notifyStatus,
          notifyError: r.notifyError,
        }))}
        forms={forms.map((f) => ({ id: f.id, name: f.name }))}
        initialFormId={initialFormId}
        initialStatus={initialStatus}
        isAdmin={me.role === "admin"}
      />
    </div>
  );
}
