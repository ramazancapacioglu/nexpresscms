import React from "react";
import Link from "next/link";
import { Inbox, Mail, Plus } from "lucide-react";
import { getFormDefinitionRepository, getFormSubmissionRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { FormsListClient, type FormListItem } from "./forms-list-client";

export const dynamic = "force-dynamic";

const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted transition";

export default async function AdminFormsPage() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const subs = getFormSubmissionRepository(me.siteId);
  const [forms, summary, counts] = await Promise.all([
    getFormDefinitionRepository(me.siteId).list({ includeArchived: true }),
    subs.summaryByForm(),
    subs.counts(),
  ]);
  const known = new Set(forms.map((f) => f.id));
  const legacy = Object.entries(summary).filter(([id]) => !known.has(id));
  const legacyTotal = legacy.reduce((n, [, s]) => n + s.total, 0);

  const items: FormListItem[] = forms.map((f) => {
    const s = summary[f.id];
    return {
      id: f.id,
      name: f.name,
      status: f.status,
      fieldCount: f.spec.fields.filter(
        (x) => x.type !== "heading" && x.type !== "paragraph" && x.type !== "divider"
      ).length,
      notifyOn: Boolean(f.notify.enabled || f.notify.webhook.enabled),
      total: s?.total ?? 0,
      newCount: s?.new ?? 0,
      last30: s?.last30 ?? 0,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3.5">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-foreground">Formlar</h1>
          <p className="text-[12px] text-muted-foreground">
            Sürükle-bırak kurucuyla form oluşturun, sayfalara Form bloğuyla ekleyin; gönderimleri, e-posta bildirimlerini ve analizleri buradan izleyin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/forms/inbox" className={btn}>
            <Inbox className="h-3.5 w-3.5" /> Gelen kutusu{counts.new > 0 ? ` (${counts.new})` : ""}
          </Link>
          {isAdmin && (
            <Link href="/admin/forms/email" className={btn}>
              <Mail className="h-3.5 w-3.5" /> E-posta ayarları
            </Link>
          )}
          <Link
            href="/admin/forms/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni form
          </Link>
        </div>
      </div>

      <FormsListClient forms={items} isAdmin={isAdmin} />

      {legacyTotal > 0 && (
        <p className="text-[12px] text-muted-foreground">
          Satır içi (eski) form bloklarından {legacyTotal} gönderim var —{" "}
          <Link href="/admin/forms/inbox" className="underline">
            gelen kutusunda
          </Link>{" "}
          görünür.
        </p>
      )}
    </div>
  );
}
