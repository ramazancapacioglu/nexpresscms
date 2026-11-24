import React from "react";
import Link from "next/link";
import { Download, MailOpen } from "lucide-react";
import { FORM_STATUSES, getFormDefinitionRepository, getFormSubmissionRepository, type FormStatus } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { SubmissionList } from "./submission-list";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const TABS: Array<[FormStatus | "all", string]> = [
  ["all", "Tümü"],
  ["new", "Yeni"],
  ["read", "Okundu"],
  ["spam", "Spam"],
  ["archived", "Arşiv"],
];

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; form?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const formId = sp.form && /^[A-Za-z0-9_-]{1,80}$/.test(sp.form) ? sp.form : undefined;
  const repo = getFormSubmissionRepository(me.siteId);
  const [counts, forms] = await Promise.all([
    repo.counts(formId),
    getFormDefinitionRepository(me.siteId).list({ includeArchived: true }),
  ]);

  const totalCount = counts.new + counts.read + counts.spam + counts.archived;
  const requested = sp.status;
  const activeTab: FormStatus | "all" =
    requested === "all"
      ? "all"
      : requested && FORM_STATUSES.includes(requested as FormStatus)
        ? (requested as FormStatus)
        : counts.new > 0
          ? "new"
          : "all";

  const rows = await repo.list({
    status: activeTab === "all" ? undefined : activeTab,
    formId,
    limit: 150,
  });

  const current = forms.find((f) => f.id === formId);
  const qForm = formId ? `&form=${formId}` : "";
  const exportStatus = activeTab === "all" ? "new" : activeTab;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
            Gelen kutusu{current ? ` — ${current.name}` : ""}
          </h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Form gönderimleri.{" "}
            <Link href="/admin/forms" className="underline">
              Formlara dön
            </Link>
            . Kişisel veri içerir; 365 gün sonra kendiliğinden silinir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me.role === "admin" && (
            <a
              href={`/api/admin/forms/export?status=${exportStatus}${qForm}`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border ${border} bg-card px-3 text-[12px] font-medium hover:bg-muted`}
            >
              <Download className="h-3.5 w-3.5" /> CSV indir
            </a>
          )}
          <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted/60 p-0.5 text-[12px] font-medium">
            {TABS.map(([id, label]) => {
              const cnt = id === "all" ? totalCount : counts[id];
              return (
                <Link
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  href={`/admin/forms/inbox?status=${id}${qForm}`}
                  className={`rounded-md px-3 py-1 transition ${
                    activeTab === id
                      ? "bg-background shadow-2xs text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label} ({cnt})
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form bazlı hızlı filtre rozetleri */}
      {forms.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <Link
            href={`/admin/forms/inbox?status=${activeTab}`}
            className={`rounded-full border px-2.5 py-1 font-medium transition ${
              !formId
                ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Tüm Formlar
          </Link>
          {forms.map((f) => (
            <Link
              key={f.id}
              href={`/admin/forms/inbox?status=${activeTab}&form=${f.id}`}
              className={`rounded-full border px-2.5 py-1 font-medium transition ${
                formId === f.id
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.name}
            </Link>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className={`rounded-xl border ${border} bg-card px-6 py-14 text-center`}>
          <MailOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-[13px] font-medium text-foreground">Bu klasörde gönderim yok</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-muted-foreground">
            Görsel editörde sayfaya bir <strong>Form</strong> veya <strong>İletişim + Kampanya</strong> bloğu ekleyip bir form seçin; ziyaretçi mesajları burada görünür.
          </p>
        </div>
      ) : (
        <SubmissionList
          status={activeTab === "all" ? "new" : activeTab}
          isAdmin={me.role === "admin"}
          items={rows.map((r) => ({
            id: r.id,
            pagePath: r.pagePath,
            formTitle: r.formTitle,
            fields: r.fields,
            createdAt: r.createdAt.toISOString(),
            notifyStatus: r.notifyStatus,
            notifyError: r.notifyError,
          }))}
        />
      )}
    </div>
  );
}
