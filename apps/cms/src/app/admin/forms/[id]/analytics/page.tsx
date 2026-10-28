import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { analyzeSubmissions, type FieldInsight } from "@nexpress/core";
import { getFormDefinitionRepository, getFormSubmissionRepository, getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { Bars, card, Columns, Stat } from "./charts";

export const dynamic = "force-dynamic";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Saat diliminin UTC'ye göre dakika farkı (yaz saati dahil, şu an için). */
function tzOffsetMinutes(timeZone: string, at: Date): number {
  try {
    const local = new Date(at.toLocaleString("en-US", { timeZone }));
    const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
    return Math.round((local.getTime() - utc.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

function FieldCard({ f }: { f: FieldInsight }) {
  return (
    <section className={card}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="truncate text-[13px] font-semibold">{f.label}</h3>
        <span className="shrink-0 text-[11px] text-[#8C9099]">{f.answered} yanıt · %{Math.round(f.fillRate * 100)} dolu</span>
      </div>
      <div className="mt-3 space-y-3">
        {f.nps !== undefined && <p className="text-[12px]"><span className="text-[22px] font-semibold">{f.nps}</span> NPS · ortalama {f.average}</p>}
        {f.nps === undefined && f.average !== undefined && <p className="text-[12px]"><span className="text-[22px] font-semibold">{f.average}</span> ortalama · {f.min}–{f.max}</p>}
        {f.distribution && <Bars data={f.type === "rating" || f.type === "scale" ? f.distribution : f.distribution} total={f.answered} />}
        {f.topDomains && f.topDomains.length > 0 && <Bars data={f.topDomains} total={f.answered} />}
        {f.topWords && f.topWords.length > 0 && (
          <p className="flex flex-wrap gap-1.5">{f.topWords.map((w) => <span key={w.word} className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-[11px] dark:bg-[#1C1E24]">{w.word} <span className="text-[#8C9099]">{w.count}</span></span>)}</p>
        )}
        {f.avgLength !== undefined && <p className="text-[11px] text-[#8C9099]">Ortalama uzunluk: {f.avgLength} karakter</p>}
      </div>
    </section>
  );
}

export default async function FormAnalyticsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ days?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const [form, site] = await Promise.all([getFormDefinitionRepository(me.siteId).get(id), getScopedRepository(me.siteId).getSite()]);
  if (!form) notFound();
  const now = new Date();
  const since = now.getTime() - days * 86_400_000;
  const all = await getFormSubmissionRepository(me.siteId).listForAnalytics(id, 5000);
  const subs = all.filter((s) => s.createdAt.getTime() >= since);
  const a = analyzeSubmissions(form.spec.fields, subs, { days, now, tzOffsetMin: tzOffsetMinutes(site?.settings.general.timezone ?? "Europe/Istanbul", now) });
  const accepted = a.total - (a.byStatus.spam ?? 0);

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <Link href={`/admin/forms/${id}`} className="text-[11px] text-[#8C9099] hover:underline">← {form.name}</Link>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Form analizi</h1>
          <p className="text-[12px] text-[#8C9099]">Gönderim içeriğinden çıkarılan özet. Yalnızca gönderimler sayılır; görüntülenme izlenmez (sayfalarda istemci JavaScript'i yoktur).</p>
        </div>
        <div className="flex items-center gap-2">
          {me.role === "admin" && <a href={`/api/admin/forms/export?form=${id}`} className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}><Download className="h-3.5 w-3.5" /> CSV</a>}
          <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:bg-[#1C1E24]">
            {[7, 30, 90].map((d) => <Link key={d} role="tab" aria-selected={d === days} href={`/admin/forms/${id}/analytics?days=${d}`} className={`rounded px-3 py-1 ${d === days ? "bg-white shadow-sm dark:bg-[#2A2D35]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>{d} gün</Link>)}
          </div>
        </div>
      </div>

      {a.total === 0 ? (
        <div className={`${card} py-14 text-center text-[12px] text-[#8C9099]`}>Son {days} günde bu forma gönderim yok.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={`Gönderim (${days} gün)`} value={accepted} hint={`${a.total} kayıt, spam hariç ${accepted}`} />
            <Stat label="Spam oranı" value={`%${Math.round(a.spamRate * 100)}`} hint={`${a.byStatus.spam ?? 0} spam`} />
            <Stat label="Yeni (okunmamış)" value={a.byStatus.new ?? 0} />
            <Stat label="Son gönderim" value={a.last ? a.last.toLocaleDateString("tr-TR") : "—"} />
          </div>
          <section className={card}><h2 className="mb-3 text-[13px] font-semibold">Günlük gönderim</h2><Columns data={a.daily.map((d) => ({ label: d.day, count: d.count }))} label="Günlük gönderim" /></section>
          <div className="grid gap-3 lg:grid-cols-3">
            <section className={card}><h2 className="mb-3 text-[13px] font-semibold">Haftanın günü</h2><Columns data={a.weekday.map((count, i) => ({ label: DAYS[i]!, count }))} label="Haftanın gününe göre" /></section>
            <section className={card}><h2 className="mb-3 text-[13px] font-semibold">Günün saati</h2><Columns data={a.hour.map((count, i) => ({ label: `${String(i).padStart(2, "0")}:00`, count }))} label="Saate göre" /></section>
            <section className={card}><h2 className="mb-3 text-[13px] font-semibold">Hangi sayfalardan</h2>{a.topPages.length ? <Bars data={a.topPages} total={accepted} /> : <p className="text-[12px] text-[#8C9099]">—</p>}</section>
          </div>
          <h2 className="pt-2 text-[13px] font-semibold">Alan içgörüleri</h2>
          <div className="grid gap-3 lg:grid-cols-2">{a.fields.map((f) => <FieldCard key={f.name} f={f} />)}</div>
        </>
      )}
    </div>
  );
}
