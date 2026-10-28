import React from "react";
import Link from "next/link";
import { Languages } from "lucide-react";
import { getScopedRepository } from "@nexpress/database";
import type { TranslationState } from "@nexpress/core";
import { requireUser } from "@/lib/auth/session";
import { CreateTranslationButton } from "./create-button";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const STATE_LABEL: Record<TranslationState, string> = { none: "Yok", draft: "Taslak", published: "Yayında", stale: "Kaynak değişti" };
const STATE_STYLE: Record<TranslationState, string> = {
  none: "bg-[#F4F5F7] dark:bg-[#1C1E24] text-[#5F6570] dark:text-[#8C9099]",
  draft: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  published: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  stale: "bg-red-500/15 text-red-700 dark:text-red-300",
};
const nameOf = (code: string) => {
  try {
    return new Intl.DisplayNames(["tr"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

export default async function AdminTranslationsPage({ searchParams }: { searchParams: Promise<{ only?: string }> }) {
  const me = await requireUser();
  const onlyMissing = (await searchParams).only !== "all";
  const m = await getScopedRepository(me.siteId).translationMatrix();
  const targets = m.locales.filter((l) => l !== m.defaultLocale);

  if (targets.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Çeviriler</h1>
        <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-14 text-center`}>
          <Languages className="mx-auto h-8 w-8 text-[#C9CDD4]" />
          <p className="mt-3 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">Site tek dilli</p>
          <p className="mx-auto mt-1 max-w-[52ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            İkinci bir dil eklemek için <Link href="/admin/settings" className="text-[#1D5ED8] dark:text-[#7AA7FF] underline">Ayarlar › Site dilleri</Link> bölümünü kullanın. Sonra eksik çeviriler burada listelenir.
          </p>
        </div>
      </div>
    );
  }

  const rows = onlyMissing ? m.rows.filter((r) => targets.some((l) => r.cells[l]!.state !== "published")) : m.rows;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Çeviriler</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Her içeriğin her dildeki durumu. Kaynak dil: {nameOf(m.defaultLocale)}.</p>
        </div>
        <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-0.5 text-[12px] font-medium">
          {[
            ["missing", "Eksik / dikkat", "/admin/translations"],
            ["all", "Tümü", "/admin/translations?only=all"],
          ].map(([id, label, href]) => (
            <Link key={id} role="tab" aria-selected={(id === "missing") === onlyMissing} href={href!} className={`rounded px-3 py-1 ${(id === "missing") === onlyMissing ? "bg-white dark:bg-[#2A2D35] shadow-sm text-[#14151A] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {targets.flatMap((l) => {
          const t = m.totals[l]!;
          return [
            { label: `${nameOf(l)} · yok`, value: t.none, tone: t.none > 0 ? "text-red-600" : "" },
            { label: `${nameOf(l)} · taslak`, value: t.draft, tone: "" },
            { label: `${nameOf(l)} · kaynak değişti`, value: t.stale, tone: t.stale > 0 ? "text-red-600" : "" },
            { label: `${nameOf(l)} · yayında`, value: t.published, tone: "text-emerald-800 dark:text-emerald-300" },
          ];
        }).map((s) => (
          <div key={s.label} className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-3.5 py-2.5`}>
            <dt className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{s.label}</dt>
            <dd className={`text-[20px] font-semibold tabular-nums ${s.tone || "text-[#14151A] dark:text-[#F3F4F6]"}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className={`overflow-x-auto rounded-lg border ${border} bg-white dark:bg-[#15171C]`} tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className={`border-b ${border} bg-[#FBFBFB] dark:bg-[#121317] text-[11px] text-[#5F6570] dark:text-[#8C9099]`}>
              <th className="px-3.5 py-2 font-medium">İçerik</th>
              <th className="px-3 py-2 font-medium">{nameOf(m.defaultLocale)} (kaynak)</th>
              {targets.map((l) => (
                <th key={l} className="px-3 py-2 font-medium">{nameOf(l)}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${border.replace("border-", "divide-")}`}>
            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + targets.length} className="px-4 py-10 text-center text-[#5F6570] dark:text-[#8C9099]">Tüm içerikler çevrilmiş ve yayında.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.contentId}>
                <td className="px-3.5 py-2.5">
                  <Link href={`/admin/contents?id=${encodeURIComponent(r.contentId)}`} className="font-medium text-[#14151A] dark:text-[#F3F4F6] hover:underline">{r.title}</Link>
                  <div className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{r.type}</div>
                </td>
                <td className="px-3 py-2.5"><span className={`rounded px-1.5 py-px text-[10px] font-semibold ${STATE_STYLE.published}`}>{STATE_LABEL.published}</span></td>
                {targets.map((l) => {
                  const c = r.cells[l]!;
                  return (
                    <td key={l} className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${STATE_STYLE[c.state]}`}>{STATE_LABEL[c.state]}</span>
                        {c.state === "none" ? (
                          <CreateTranslationButton contentId={r.contentId} from={m.defaultLocale} to={l} />
                        ) : (
                          <Link href={`/admin/contents?id=${encodeURIComponent(r.contentId)}&locale=${l}`} className="text-[11px] text-[#1D5ED8] dark:text-[#7AA7FF] hover:underline">Düzenle</Link>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
