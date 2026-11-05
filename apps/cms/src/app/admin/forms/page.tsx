import React from "react";
import Link from "next/link";
import { FileText, Inbox, Mail, Plus } from "lucide-react";
import { getFormDefinitionRepository, getFormSubmissionRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { FormRowActions } from "./form-row-actions";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const btn = `inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`;
const STATUS: Record<string, [string, string]> = { active: ["Aktif", "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"], paused: ["Duraklatıldı", "bg-amber-500/10 text-amber-800 dark:text-amber-300"], archived: ["Arşiv", "bg-[#F4F5F7] text-[#5C5F66] dark:bg-[#1C1E24]"] };

export default async function AdminFormsPage() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const subs = getFormSubmissionRepository(me.siteId);
  const [forms, summary, counts] = await Promise.all([getFormDefinitionRepository(me.siteId).list({ includeArchived: true }), subs.summaryByForm(), subs.counts()]);
  const known = new Set(forms.map((f) => f.id));
  const legacy = Object.entries(summary).filter(([id]) => !known.has(id));
  const legacyTotal = legacy.reduce((n, [, s]) => n + s.total, 0);

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Formlar</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Sürükle-bırak kurucuyla form oluşturun, sayfalara Form bloğuyla ekleyin; gönderimleri, e-posta bildirimlerini ve analizleri buradan izleyin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/forms/inbox" className={btn}><Inbox className="h-3.5 w-3.5" /> Gelen kutusu{counts.new > 0 ? ` (${counts.new})` : ""}</Link>
          {isAdmin && <Link href="/admin/forms/email" className={btn}><Mail className="h-3.5 w-3.5" /> E-posta ayarları</Link>}
          <Link href="/admin/forms/new" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Yeni form</Link>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className={`rounded-lg border ${border} bg-white px-6 py-14 text-center dark:bg-[#15171C]`}>
          <FileText className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">Henüz form yok</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">İletişim, teklif, destek, anket gibi hazır şablonlardan başlayabilir veya boş formdan kurabilirsiniz.</p>
          <Link href="/admin/forms/new" className="mt-4 inline-flex h-8 items-center rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white">İlk formu oluştur</Link>
        </div>
      ) : (
        <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {forms.map((f) => {
            const s = summary[f.id];
            const [label, cls] = STATUS[f.status]!;
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[12px]">
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={`/admin/forms/${f.id}`} className="block truncate text-[13px] font-medium text-[#14151A] hover:underline dark:text-[#F3F4F6]">{f.name}</Link>
                  <p className="text-[#5F6570] dark:text-[#8C9099]">{f.spec.fields.filter((x) => x.type !== "heading" && x.type !== "paragraph" && x.type !== "divider").length} alan · {f.notify.enabled || f.notify.webhook.enabled ? "bildirim açık" : "bildirim kapalı"}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
                <dl className="flex gap-5 text-[#5C5F66] dark:text-[#9CA3AF]">
                  <div><dt className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Toplam</dt><dd className="font-medium">{s?.total ?? 0}</dd></div>
                  <div><dt className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Yeni</dt><dd className="font-medium">{s?.new ?? 0}</dd></div>
                  <div><dt className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Son 30 gün</dt><dd className="font-medium">{s?.last30 ?? 0}</dd></div>
                </dl>
                <FormRowActions id={f.id} status={f.status} isAdmin={isAdmin} />
              </li>
            );
          })}
        </ul>
      )}
      {legacyTotal > 0 && (
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Satır içi (eski) form bloklarından {legacyTotal} gönderim var — <Link href="/admin/forms/inbox" className="underline">gelen kutusunda</Link> görünür. Yeni formları kurucuyla oluşturup bloğa bağlamanız önerilir.</p>
      )}
    </div>
  );
}
